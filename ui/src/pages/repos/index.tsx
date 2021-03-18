import React, { useEffect, useState, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { PageHeaderWrapper } from '@ant-design/pro-layout';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Card, Icon } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet, Select } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
// import { IWorkspaces } from './types';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import { ifError } from 'assert';
import { getToken, hash } from '@/utils/token';

interface IWorkspaces {

};


export const Repos: React.FC<any> = () => {

  const [state, fetch] = useAsyncFn(async ():Promise<IWorkspaces[]> => {
    const response = await axios.get('/repos');
    return response.data as IWorkspaces[];
  }, []);

  useEffect(() => {
    fetch();
  }, []);

  return (
    <PageHeaderWrapper>
      <div>aad</div>
      <pre>{
        state.value && JSON.stringify(state.value)
        }</pre>
    </PageHeaderWrapper>
  );
};


export default Repos;
