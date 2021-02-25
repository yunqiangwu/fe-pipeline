import React, { useEffect, useState, useCallback } from 'react';
import { useAsyncFn } from 'react-use';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { from, Observable, Subject, timer } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Spin, Alert, Card, Icon } from 'choerodon-ui';
import { Modal, Button, notification, Form, TextField, DataSet, Select } from 'choerodon-ui/pro';
import axios from '@/utils/axios.config';
import styles from './index.less';
import { IWorkspaces } from './types';
import { FieldType } from 'choerodon-ui/pro/lib/data-set/enum';
import { ifError } from 'assert';


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
          name: 'image',
          type,
          defaultValue: 'vscode',
          // defaultValue: 'theia-full',
          label: '镜像运行环境',
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
        <Select name="image" >
          <Select.Option value="vscode">VS Code</Select.Option>
          <Select.Option value="theia-full">Theia IDE</Select.Option>
        </Select>
      </Form>
    </div>
  );
};

const getPodWsUrl = async (podObj: any) => {

  const podIp = podObj.status.podIP.replace(/\./g, '-');
  let webUiPort = 3000;

  for(const container of podObj.spec.containers ) {
    if(container.name ===  'web') {
      for(const portObj of container.ports) {
        if(portObj.name === 'web') {
          webUiPort = portObj.containerPort;
          break;
        }
      }
      break;
    }
  }

  let host = location.host;
  if (process.env.NODE_ENV === 'development') {
    host = 'localhost:3000';
  } 

  // 等待容器激活
  let isSuccess  = false;
  let errorCount = 0;

  try {
    while(isSuccess === false) {
      let errObj = null;
      let res: any = null;
      try{
        const wsId = podObj.metadata.labels['ws-id'] || podObj.metadata.name.replace(/^(.*)-(\d+)$/, '$2');
        res = await axios.get(`/workspace/ws-is-alive/${wsId}`);
      }catch(err) {
        errObj = err;
      }
      if(res && res.status >= 200 && res.status < 400) {
        isSuccess = true
      } else {
        errorCount++;
        isSuccess = false;
        await new Promise((resolve) => { setTimeout(() => resolve(null), 500)});
      }
      if(errorCount >=4 ) {
        throw errObj;
      }
    }
  } catch(e)  {
    console.error(e);
    return;
  }

  return `http://${webUiPort}-${podIp}.ws.${host}`;
}

const windowOpen = async (wsUrl: any) => {

  // await new Promise((resolve) => { setTimeout(() => resolve(null), 500)});
  const a = document.createElement('a');
  a.href = wsUrl;
  a.target = '_blank';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
  }, 0);
}

const WSCardGrid = ({ ws, onChange }: {ws: IWorkspaces, onChange: Function  }) => {

  const [delWsRes, delWs] = useAsyncFn(async (ws: IWorkspaces) => {
    // await (new Promise(resolve=> setTimeout(resolve, 1000)));
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
      const openUrl = await getPodWsUrl(podJsonObject);
      await windowOpen(openUrl);
      return;
    }

    // setOpenMessage('\"正在创建 pod ...\"');
    // await (new Promise(resolve=> setTimeout(resolve, 1000)));
    let _ws: any;
    try{

      let wsUrl;
      if (process.env.NODE_ENV === 'development') {
        wsUrl = 'ws://localhost:3000/';
      } else {
        wsUrl = `${location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${location.host}/`;
      }
      _ws = webSocket(wsUrl);

      _ws.next(
        {
          event: 'open-ws-status',
          data: `${ws.id}`,
        }
      );

      // 5秒后发出值
      const timer$ = timer(400000);
      const break$ = new Subject<any>();

      let isTimeout = false;
      timer$.subscribe(() => {
        isTimeout = true;
        break$.complete();
      });

      // 当5秒后 timer 发出值时， source 则完成
      const example = _ws.pipe(takeUntil(timer$));
      
      example.subscribe((r: any) => {
        setOpenMessage( (state) => {
          podJsonObject = r.data.pod;
          return JSON.stringify(r.data.pod);
        } );
        if(r.data.type === 'created')  {
          break$.complete();
        }
      });

      const res = await axios.post(`/workspace/open-ws/${ws.id}`, {}, { showError: true } as any);

      await break$.toPromise();

      if(isTimeout) {
        notification.error({
          message: '操作超时',
          description: '',
        });
        return;
      } else {
      }

      const openUrl = await getPodWsUrl(podJsonObject);
      await windowOpen(openUrl);

      if(onChange) {
        await onChange();
      }
      
      setOpenMessage('');
    } finally {
      _ws.unsubscribe();
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
          <div style={{ height: '100%' }} onClick={newWs}>
            <Icon type="add_box-o" title="创建工作空间" /> 
            <span className={styles['inner-text']}>创建工作空间</span>
          </div>
        </Card.Grid>
        {/* <pre>{JSON.stringify(state.value, null, 2)}</pre> */}
      </Card>
  );
}

export default WorkSpaces;
