import React, { useEffect, useState, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, interval, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Card, Icon } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
import { IWorkspaces } from './types';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';


const gridStyle = {
  width: '33.33%',
  textAlign: 'left' as any,
};

const cardBodyStyle = {
  minHeight: '72vh',
};

const wrapCardStyle = { width: '100%'};

const ModalContent = ({ modal }: any) => {

  const formDS = React.useMemo(() => {
    const type: FieldType = 'string' as FieldType;
    const ds = new DataSet({
      autoCreate: true,
      fields: [
        {
          name: 'name',
          type,
          label: '工作空间名称',
          required: true,
        },
        {
          name: 'gitUrl',
          type,
          label: 'Git仓库地址',
          required: true,
        },
        {
          name: 'environment',
          type,
          defaultValue: 'k8s',
          label: '工作空间类型',
          required: false,
        },
      ]
    });
    return ds;
  }, []);

  modal.handleOk(async () => {
    if (await formDS.validate()) {
      try{
        const data = formDS.toData()[0]
        const res = await axios.post('/workspace', [data]);
        notification.success({
          message: '创建成功',
          description: JSON.stringify(res.data,null,2),
        });
        return true;
      }catch(e) {
        console.error(e);
        notification.error({
          message: '创建失败',
          description: e.message,
        });
        return false;
      }
    }
    return false;
  });
  modal.handleCancel(() => {
    console.log('do Cancel');
    modal.close();
  });

  return (
    <div>
      <Form dataSet={formDS}>
        <TextField name="name" />
        <TextField name="gitUrl" />
      </Form>
    </div>
  );
};

const getPodWsUrl = (podObj: any) => {
  const podIp = podObj.status.podIP;
  return `http://3000-${podIp}.ws.${location.host}`;
}

const WSCardGrid = ({ ws, onChange }: {ws: IWorkspaces, onChange: Function  }) => {

  const [delWsRes, delWs] = useAsyncFn(async (ws: IWorkspaces) => {
    await (new Promise(resolve=> setTimeout(resolve, 1000)));
    try{
      const res = await axios.delete(`/workspace/${ws.id}`,  { showError: true } as any);
      notification.success({
        message: '删除成功',
        description: '',
      });
      if(onChange) {
        await onChange();
      }
      return true;
    }catch(e) {}
  }, []);

  const [openMessage, setOpenMessage] = useState<string>('');

  const [openWsRes, openWs] = useAsyncFn(async (ws: IWorkspaces) => {

    let podJsonObject: any = null;

    if(ws.podObject) {
      podJsonObject = JSON.parse(ws.podObject);
      const openUrl = getPodWsUrl(podJsonObject);
      window.open(openUrl);
      return;
    }

    // setOpenMessage('\"正在创建 pod ...\"');
    // await (new Promise(resolve=> setTimeout(resolve, 1000)));
    try{

      let wsUrl;
      if (process.env.NODE_ENV === 'development') {
        wsUrl = 'ws://localhost:3000/';
      } else {
        wsUrl = `${location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${location.host}/`;
      }
      const _ws = webSocket(wsUrl);

      _ws.next(
        {
          event: 'open-ws-status',
          data: `${ws.id}`,
        }
      );

      // 5秒后发出值
      const timer$ = timer(40000);

      let isTimeout = false;
      timer$.subscribe(() => {
        isTimeout = true;
      });

      // 当5秒后 timer 发出值时， source 则完成
      const example = _ws.pipe(takeUntil(timer$));
      
      example.subscribe((r: any) => {
        setOpenMessage( (state) => {
          podJsonObject = r.data.pod;
          return JSON.stringify(r.data.pod);
        } );
        if(r.data.type === 'created')  {
          _ws.unsubscribe();
        }
      });

      const res = await axios.post(`/workspace/open-ws/${ws.id}`, {}, { showError: true } as any);
      await example.toPromise();
      if(isTimeout) {
        notification.error({
          message: '操作超时',
          description: '',
        });
        return;
      } else {
      }

      const openUrl = getPodWsUrl(podJsonObject);
      window.open(openUrl);

      if(onChange) {
        await onChange();
      }
      
      setOpenMessage('');
    } finally {
    }
  }, []);

  const showOpenMessage = useCallback((msg) => {
    Modal.info({
      style: {
        width: 1000,
      },
      children: (
        <pre>
          {msg}
        </pre>
      ),
    });
  }, []);

  return (
    <Card.Grid className={styles['ws-card']} style={gridStyle}>
      <div className={styles['ws-card-inner']}>
        <div>
        {ws.name} {ws.state && <span>( {ws.state} )</span>}
        </div>
        <div>
        Git: {ws.gitUrl}
        </div>
        <div className={styles['ws-card-btn-wrap']}>
          <Button onClick={() => {return openWs(ws)}} color={'primary' as any}>打开</Button>
          {/* { openMessage && <Button onClick={() => {return showOpenMessage(openMessage)}} color={'yellow' as any}>日志</Button> } */}
          <Button onClick={() => {return delWs(ws)}} color={'red' as any}>删除</Button>
        </div>
        { openMessage && <div className={styles['ws-card-log-area']} onClick={() => {return showOpenMessage(openMessage)}}>
          <Spin><pre>{openMessage && JSON.parse(openMessage).status.phase}</pre></Spin>
          <span className={styles['ws-card-log-area-show-more-btn']} >查看更多...</span>
        </div> }
      </div>
    </Card.Grid>
  );
}

const WorkSpaces: React.FC<any> = () => {
  const [state, fetch] = useAsyncFn(async ():Promise<IWorkspaces[]> => {
    const response = await axios.get('/workspace');
    return response.data as IWorkspaces[];
  }, []);

  const newWs = useCallback(() => {
    Modal.open({
      title: '创建工作空间',
      children: <ModalContent />,
      okText: '确定',
      onClose: () => {
        fetch();
      }
      // okProps: { disabled: true },
    });
  }, []);

  useEffect(() => {
    fetch();
  }, []);

  return (
      <Card
        bordered={false}
        loading={state.loading}
        title={<h1 className={styles.title}>工作空间</h1>}
        extra={<Button onClick={fetch} >刷新</Button>}
        style={wrapCardStyle}
        actions={state.error && [<Alert type="error" message={JSON.stringify(state.error.message, null, 2)} />]}
        bodyStyle={cardBodyStyle}
      >
        {state.value && state.value.map(ws => {
          return (<WSCardGrid key={`k_${ws.id}`} onChange={fetch} ws ={ws} />);
        })}
        <Card.Grid key="add-new-ws-card" className={`${styles['add-new-ws-card']} ${styles['ws-card']}`} style={gridStyle}>
          <div onClick={newWs}>
            <Icon type="add_box-o" title="abc" /> 
            <span className={styles['inner-text']}>创建工作空间</span>
          </div>
        </Card.Grid>
        {/* <pre>{JSON.stringify(state.value, null, 2)}</pre> */}
      </Card>
  );
}

export default WorkSpaces;
