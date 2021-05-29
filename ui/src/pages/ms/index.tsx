import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { copy } from 'iclipboard';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Card, Icon } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet, Select, Table } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
import { getToken, hash } from '@/utils/token';
import { createSpaces, deleteSpaces } from './services/repos';
import { AxiosRequestConfig } from 'axios';
import { ColumnProps } from 'choerodon-ui/pro/lib/table/Column';
import { ColumnLock } from 'choerodon-ui/pro/lib/table/enum';
import { Link } from 'react-router-dom';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import moment from 'moment';

export const SpaceList: React.FC<any> = () => {

  const repoDs = React.useMemo(() => {
    return new DataSet({
      primaryKey: 'id',
      autoQuery: true,
      paging: false,
      // selection: false,
      fields: [
        {
          name: 'id',
          label: 'ID',
        },
        {
          name: 'name',
          label: '项目名称',
        },
        {
          name: 'createdAt',
          label: '创建时间',
          type: 'dateTime' as FieldType,
        },
      ],
      queryFields: [
        {
          name: 'searchString',
          label: '搜索',
        },
      ],
      dataKey: '_rows',
      totalKey: 'x-total',
      transport: {
        read: ({ params, data }) => {
          const config: AxiosRequestConfig = {
            method: 'GET',
            url: `/space/query`,
            params: {
              orderBy: 'asc',
              //search:hzero
              // owned: true,
              // take: params.pagesize || 10,
              // skip: ((params.page || 1) - 1) * (params.pagesize || 10),
              // membership: true,
              // //starred:true
              // simple: true,
              ...data,
            },
            transformResponse: ((data, headers) => {
              return {
                _rows: typeof data === 'string' ? JSON.parse(data) : data,
                // 'x-page': headers['x-page'] || 0,
                // 'x-per-page': headers['x-per-page'] || 10,
                // 'x-total': headers['x-total'] || 0,
              };
            }),
          };
          return config;
        },
      },
    });
  }, []);

  // const selectSpace = useCallback(() => {
  // }, []);

  const deleteSpacesUI = async ({id}: any) => {
    try {
      const res = await deleteSpaces({
        id,
      });
      notification.success({
        message: '删除成功',
        description: '',
      });
      repoDs.query();
      return res;
    } catch (e) {
      notification.error({
        message: e.message,
        description: '',
      })
      return false;
    }
  };

  const columns = useMemo<ColumnProps[]>(() => {
    return [
      // { name: 'id', width: 100, },
      { name: 'id', width: 50, },
      // {name: 'name', width: 200, },
      { name: 'createdAt', width: 200, },

      {
        name: 'name',
        renderer: ({ record, value }) => {
          return <Link to={`/app/ms/detail/${record?.get('id')}`} >{value}</Link>;
        }
      },
      {
        header: '最新版本号',
        renderer: ({ record }) => {
          return record?.get('spaceVersions')?.get(0)?.name;
        },
        width: 100
      },
      {
        header: '最新发布时间',
        renderer: ({ record }) => {
          const timeString = record?.get('spaceVersions')?.get(0)?.createdAt;
          return timeString && moment(timeString).format('YYYY-MM-DD HH:mm');
        },
        width: 150
      },
      {
        header: 'latest 版本',
        renderer: ({ record }) => {
          return record?.get('spaceVersionAlias')?.get(0)?.version?.name;
        },
        width: 100
      },
      {
        header: '访问',
        command: ({ record }) => {
          return [
            <a target="_blank" href={`${location.protocol}//${record.get('id')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`} >访问</a>,
          ]
        },
        width: 80,
        lock: 'right' as ColumnLock,
      },
      {
        header: '操作',
        command: ({ record }) => {
          return [
            <Button icon="select" onClick={() => {
              const url = `${location.protocol}//${record.get('id')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`;
              if (copy(url)) {
                notification.success({
                  message: '复制成功',
                  description: '',
                });
              } else {
                notification.warning({
                  message: '复制失败',
                  description: '',
                });
              }
            }} >复制访问链接</Button>,
            <Button icon="select" onClick={() => {
              // return createSpaces({ existSpaceId: record.get('id') });
            }} >发布新版本</Button>,
            <Button icon="delete" onClick={() => {
              return deleteSpacesUI({ id: record.get('id') });
            }} >删除</Button>
          ]
        },
        width: 320,
        lock: 'right' as ColumnLock,
      }
    ];
  }, []);


  const createSpacesUI = async ({
    existSpaceId,
  }: any = {}) => {

    const CreateSpace: React.FC<any> = ({ modal }) => {
      const createSpaceDs = React.useMemo(() => {
        return new DataSet({
          primaryKey: 'id',
          autoCreate: true,
          paging: false,
          // selection: false,
          fields: [
            {
              name: 'name',
              label: '空间名称',
              required: true,
            },
          ],
        });
      }, []);

      useEffect(() => {
        modal.handleOk(async () => {

          if ((await createSpaceDs.validate()) === false) {
            return false;
          }

          try {
            const res = await createSpaces({
              body: createSpaceDs.records[0].toJSONData(),
            });
            notification.success({
              message: '创建成功',
              description: '',
            });
            repoDs.query();
            return res;
          } catch (e) {
            notification.error({
              message: e.message,
              description: '',
            })
            return false;
          }

        });
      }, []);

      return (
        <Form columns={2} dataSet={createSpaceDs}>
          <TextField name="name" />
        </Form>
      )
    };

    Modal.open({
      title: '创建新空间',
      children: <CreateSpace />,
      okText: '确定',
      // okProps: { disabled: true },
    });

  };


  return (
    <PageHeaderWrapper>
      <Table buttons={[<Button icon="add" onClick={createSpacesUI} >创建新的空间</Button>,
      // <Button icon="add" onClick={deleteSpaces} >删除空间</Button>,
      <Button icon="add" >选配空间创建新的项目</Button>
      ]} columns={columns} dataSet={repoDs} />
    </PageHeaderWrapper>
  );

};

export default SpaceList;
