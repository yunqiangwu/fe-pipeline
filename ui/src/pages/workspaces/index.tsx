import React, { useEffect, useState, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { notification, Spin, Button, Alert } from 'choerodon-ui';
import axios from '@/utils/axios.config';
import styles from './index.less';

const WorkSpaces : React.FC<any> = () => {
  const [state, fetch] = useAsyncFn(async () => {
    const response = await axios.get('/photo');
    return response.data;
  }, []);

  useEffect(() => {
    fetch();
  }, []);

  return (
    <div>
      <h1 className={styles.title}>WorkSpaces index</h1>
      <br />
      <Button onClick={fetch} >Refresh</Button>
      { state.error && <Alert type="error" message={JSON.stringify(state.error.message, null, 2)} /> }
      <br />
      <Spin spinning={state.loading}>
        <pre>{JSON.stringify(state.value, null, 2)}</pre>
      </Spin>
    </div>
  );
}

export default WorkSpaces;
