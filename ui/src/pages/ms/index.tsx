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
import { createSpaces, refreshSpacesCache } from './services/repos';
import { AxiosRequestConfig } from 'axios';
import { ColumnProps } from 'choerodon-ui/pro/lib/table/Column';
import { ColumnLock } from 'choerodon-ui/pro/lib/table/enum';
import { Link } from 'react-router-dom';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import moment from 'moment';

const deleteSpaces = async (params?: any) => {
  console.log(params);
}

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

  const selectSpace = useCallback(() => {
  }, []);

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
        width: 200
      },
      {
        header: '最新发布时间',
        renderer: ({ record }) => {
          const timeString = record?.get('spaceVersions')?.get(0)?.createdAt;
          return timeString && moment(timeString).format('YYYY-MM-DD HH:mm');
        },
        width: 200
      },
      {
        header: 'latest 版本',
        renderer: ({ record }) => {
          return record?.get('spaceVersionAlias')?.get(0)?.version?.name;
        },
        width: 200
      },
      {
        header: '访问',
        command: ({record}) => {
          return [
            <a target="_blank" href={`${location.protocol}//${record.get('id')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`} >访问</a>,
          ]
        },
        width: 80,
        lock: 'right' as ColumnLock,
      },
      {
        header: '操作',
        command: ({record}) => {
          return [
            <Button icon="select" onClick={() => {
              const url = `${location.protocol}//${record.get('id')}.${process.env.NODE_ENV === 'development' ? 'minio.fe-pipeline.localhost' : location.host}`;
              if(copy(url)) {
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
              return createSpaces({ existSpaceId: record.get('id') });
            }} >发布新版本</Button>
          ]
        },
        width: 250,
        lock: 'right' as ColumnLock,
      }
    ];
  }, []);

  return (
    <PageHeaderWrapper>
      <Table buttons={[<Button icon="add" onClick={createSpaces} >创建新的空间</Button>,
      <Button icon="add" onClick={deleteSpaces} >删除空间</Button>,
      <Button icon="add" >选配空间创建新的项目</Button>
    ]} columns={columns} dataSet={repoDs} />
    </PageHeaderWrapper>
  );

};


export default SpaceList;
