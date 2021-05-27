import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAsync, useAsyncFn } from 'react-use';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Card, Icon } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet, Select, Table } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
import { getToken, hash } from '@/utils/token';
import { GitLabAPIInfoRes, fetchGitLabAPIInfo } from './services/repos';
import { AxiosRequestConfig } from 'axios';
import { ColumnProps } from 'choerodon-ui/pro/lib/table/Column';
import { ColumnLock } from 'choerodon-ui/pro/lib/table/enum';

export const Repos: React.FC<any> = () => {

  // const [state, fetch] = useAsyncFn(fetchGitLabRepos, []);

  const [authConfig, setAuthConfig] = useState<null | GitLabAPIInfoRes>(null);
  const [error, setError] = useState<null | Error>(null);

  useAsync(async () => {
    const _authConfig = await fetchGitLabAPIInfo();
    setAuthConfig(_authConfig);
    return () => {};
  }, []);

  const repoDs = React.useMemo(() => {
    if (!authConfig) {
      return null;
    }
    return new DataSet({
      primaryKey: 'id',
      autoQuery: true,
      selection: false,
      fields: [
        {
          name: 'id',
          label: 'Id',
        },
        {
          name: 'name_with_namespace',
          label: '项目名称',
        },
        {
          name: 'http_url_to_repo',
          label: 'git',
        },
      ],
      queryFields: [
        {
          name: 'search',
          label: '搜索',
          type: 'string' as any,
        },
      ],
      dataKey: '_rows',
      totalKey: 'x-total',
      transport: {
        read: ({ params, data }) => {
          const config: AxiosRequestConfig = {
            method: 'GET',
            url: `${authConfig.protocol}://${authConfig.host}/api/v4/projects`,
            params: {
              order_by: 'last_activity_at',
              //search:hzero
              owned: true,
              per_page: params.pagesize || 10,
              page: params.page || 10,
              membership: true,
              //starred:true
              simple: true,
              ...data,
            },
            transformResponse: ((data, headers) => {
              return {
                _rows: typeof data === 'string' ? JSON.parse(data) : data,
                'x-page': headers['x-page'],
                'x-per-page': headers['x-per-page'],
                'x-total': headers['x-total'],
              };
            }),
            headers: {
              'Authorization': `Bearer ${authConfig.accessToken}`,
            }
          };
          return config;
        },
      },
    });
  }, [authConfig]);

  const columns = useMemo<ColumnProps[]>(() => {
    return [
      // { name: 'id', width: 100, },
      { name: 'name_with_namespace', width: 400, },
      // {name: 'name', width: 200, },
      {
        name: 'http_url_to_repo',
        renderer: ({ value }) => {
          return <a target="_blank" href={value as string} >{value}</a>
        }
      },
      // {
      //   title: '操作',
      //   command: ({record}) => {
      //     const url = record.get('http_url_to_repo');
      //     return [
      //       <a target="_blank" href={`${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}?gitUrl=${url}`} >创建工作空间</a>,
      //     ]
      //   },
      //   width: 200,
      //   lock: 'right' as ColumnLock,
      // }
    ];
  }, []);

  if (error) {
    if ((error as any).autoAuthClientId) {
      return (
        <div>
          <div>当前账号未关联 {(error as any).autoAuthClientId} 账号</div>
          <div>请先点击左上角的用户信息关联 {(error as any).autoAuthClientId} 账号,再刷新页面 </div>
        </div>
      );
    }
    return <div>{error.message}</div>
  }

  if (!repoDs) {
    return (
      <div>empty data</div>
    );
  }

  return (
    <PageHeaderWrapper>
      <Table columns={columns} dataSet={repoDs} />
    </PageHeaderWrapper>
  );

};


export default Repos;
