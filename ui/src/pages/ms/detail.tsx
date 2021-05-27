import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Icon, Card, Tag } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet, Select, Table, DatePicker } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
import { getToken, hash } from '@/utils/token';
import { createSpaces, refreshSpacesCache } from './services/repos';
import { AxiosRequestConfig } from 'axios';
import { ColumnProps } from 'choerodon-ui/pro/lib/table/Column';
import { ColumnLock } from 'choerodon-ui/pro/lib/table/enum';
import { Link, useParams } from 'react-router-dom';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';

const createSpacesVersionAlias = async ({ id }: any) => {
  console.log(id);
};

const deleteSpacesVersionAlias = async ({ id }: any) => {
  console.log(id);
};

const deleteSpacesVersion = async ({ id }: any) => {
  console.log(id);
};

export const SpaceDetail: React.FC<any> = () => {

  const { id } = useParams<any>();

  const spaceDs = React.useMemo(() => {

    const spaceVersionDs = new DataSet({    
      autoQuery: false,
      paging: false,
      fields: [
        {
          name: 'id',
          label: 'ID',
        },
        {
          name: 'name',
          label: '版本号',
        },
        {
          name: 'createdAt',
          label: '创建时间',
          type: 'dateTime' as FieldType,
        },
      ],
    });

    const spaceVersionAliasDs = new DataSet({    
      autoQuery: false,
      paging: false,
      fields: [
        {
          name: 'id',
          label: 'ID',
        },
        {
          name: 'name',
          label: '别名名称',
        },
      ],
    });

    return new DataSet({
      children: {
        spaceVersions: spaceVersionDs,
        spaceVersionAlias: spaceVersionAliasDs,
      },
      primaryKey: 'id',
      autoQuery: false,
      selection: false,
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
          format: "YYYY-MM-DD HH:mm:ss", 
        },
        // {
        //   name: 'http_url_to_repo',
        //   label: 'git',
        // },
      ],
      // queryFields: [
      //   {
      //     name: 'searchString',
      //     label: '搜索',
      //   },
      // ],
      dataKey: '_rows',
      // totalKey: 'x-total',
      transport: {
        read: ({ params, data }) => {
          const config: AxiosRequestConfig = {
            method: 'GET',
            url: `/space/get-space/${id}`,
            params: {
              // orderBy: 'asc',
              //search:hzero
              // owned: true,
              // take: params.pagesize || 10,
              // skip: ((params.page || 1) - 1) * (params.pagesize || 10),
              // membership: true,
              // //starred:true
              // simple: true,
              // ...data,
            },
            transformResponse: ((data, headers) => {
              return {
                _rows: [typeof data === 'string' ? JSON.parse(data) : data],
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
  }, [id]);

  const refresh = useCallback(() => {
    return (async () => {
      await spaceDs.query()
    })();
  }, [id]);

  useEffect(() => {
    refresh();
  }, [id])

  const columns = useMemo<ColumnProps[]>(() => {
    return [
      // { name: 'id', width: 100, },
      { name: 'id', width: 40, },
      { name: 'createdAt', width: 200, },
      // {name: 'name', width: 200, },
      {
        name: 'name',
        // renderer: ({ record, value }) => {
        //   return <Link to={`/app/ms/detail/${record?.get('id')}`} >{value}</Link>;
        // }
      },
      {
        header: '版本别名',
        renderer: ({ record, value }) => {
          const spaceVersionAlias = record?.get('spaceVersionAlias');
          if(!spaceVersionAlias) {
            return null;
          }
          return spaceVersionAlias.map((item: any) => (<Tag>{item.name}</Tag>));
        }
      },
      {
        header: '访问',
        command: ({record}) => {
          return [
            <a target="_blank" href={`${location.protocol}//${record.get('spaceId')}--${record.get('name')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`} >访问</a>,
          ]
        },
        width: 80,
        lock: 'right' as ColumnLock,
      },
      {
        header: '操作',
        command: ({record}) => {
          return [
            <Button>上传文件夹</Button>,
          ]
        },
        width: 200,
        lock: 'right' as ColumnLock,
      }
    ];
  }, []);

  const aliasColumns = useMemo<ColumnProps[]>(() => {
    return [
      // { name: 'id', width: 100, },
      { name: 'id', width: 40, },
      // {name: 'name', width: 200, },
      {
        name: 'name',
        // width: 200
        // renderer: ({ record, value }) => {
        //   return <Link to={`/app/ms/detail/${record?.get('id')}`} >{value}</Link>;
        // }
      },
      {
        header: '指向版本',
        width: 200,
        renderer: ({ record }) => {
          return record?.get('version')?.name;
        }
      },
      {
        header: '访问',
        command: ({record}) => {
          return [
            <a target="_blank" href={`${location.protocol}//${record.get('spaceId')}--${record.get('name')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`} >访问</a>,
          ]
        },
        width: 80,
        lock: 'right' as ColumnLock,
      },
      {
        header: '操作',
        command: ({record}) => {
          return [
            <Button>修改指向版本</Button>,
          ]
        },
        width: 200,
        lock: 'right' as ColumnLock,
      }
    ];
  }, []);

  const handleRefreshRedisCache = useCallback(() => {
    return (async () => {
      const data = await refreshSpacesCache(id);
      notification.success({
        message: '操作成功',
        description: `成功刷新 ${data.data.data} 个 alias 缓存`
      })
    })();
  }, [id])

  return (
    <PageHeaderWrapper title="空间详情">
      <Card title="空间信息" extra={[
        <Button onClick={refresh}>刷新页面</Button>,
        <Button target="_blank" onClick={handleRefreshRedisCache} >刷新别名缓存</Button>
      ]}>
        <Form columns={2} dataSet={spaceDs}>
          <TextField pristine name="name" />
          <DatePicker pristine name="createdAt" />
        </Form>
      </Card>
      <Card title="版本别名管理列表">
        <Table buttons={[
          <Button icon="add" onClick={() => createSpacesVersionAlias({ id })} >添加别名</Button>,
          <Button icon="remove" onClick={() => deleteSpacesVersionAlias({ id })} >删除别名</Button>
        ]}  columns={aliasColumns} dataSet={spaceDs.children.spaceVersionAlias} />
      </Card>
      <Card title="版本列表">
        <Table buttons={[<Button icon="add" onClick={() => createSpaces({ id })} >发布新版本</Button>,
        <Button icon="remove" onClick={() => deleteSpacesVersion({ id })} >删除版本</Button>
      ]} columns={columns} dataSet={spaceDs.children.spaceVersions} />
      </Card>
    </PageHeaderWrapper>
  );
};


export default SpaceDetail;
