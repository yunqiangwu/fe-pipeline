import * as querystring from 'querystring';
import { RouteComponentProps } from 'react-router-dom';
import { useAsync, useAsyncFn, useLocation } from 'react-use';
import { GitRepoList } from './components/git-repo-list';
import React, { useEffect, useState, useCallback, CSSProperties } from 'react';
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

// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

const iframeStyle: CSSProperties = {
 border: 'none',
 height: "100%",
 width: "100%",
};

const getPodWsUrl = async (podObj: any) => {

  if(!podObj) {
    return;
  }

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
    host = location.hostname;
  }

  return `http://${webUiPort}-${podIp}.ws.${host}/#/home/coder/project`;
}

interface WsLoadingPageReactParams {
  id: string;
}

const WsPod: React.FC<RouteComponentProps<WsLoadingPageReactParams>>  = (props) => {

  const [state, setState] = useState('loading');
  const [podUrl, setPodUrl] = useState<string>('loading...');
  const [wsObj, setWsObj] = useState<null | number>(null);

  const createTemp = useAsync(async () =>  {

    const queryObj = querystring.parse(props.location.search.substring(1));
    // delete queryObj.clientToken;
    // delete queryObj.clientId;
    // let wsId = queryObj.wsId;

    // setToken todo

    if(queryObj.gitUrl || queryObj.zipUrl) {
      try{
        const res = await axios.post(`/workspace/workspace-temp`, {
          ...queryObj,
        }, { fetchTokenFromUrlParam: true, showError: true } as any);
        if(res.data.ws) {
          setWsObj(res.data.ws);
          // setState(JSON.stringify(res.data.ws, null, 2));
          return;
        } else {
          throw res;
        }
      }catch(e) {
        setState(e.message || '创建失败');
        console.error(e);
        return;
      }
    } else {
      setState('readme');
    }

  }, [props.location.search]);

  const [openWsRes, openWs] = useAsyncFn(async (ws: any) => {

    const awaitPodAvailable = async (podObj: any) => {
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
               await new Promise((resolve) => { setTimeout(() => resolve(null), 1500)});
             }
             if(errorCount >=4 ) {
               throw errObj;
             }
           }
         } catch(e)  {
           console.error(e);
           // return;
         }
    };

    let podJsonObject: any = null;

    if(ws.state &&  ws.podObject) {
      podJsonObject = JSON.parse(ws.podObject);
      await awaitPodAvailable(podJsonObject);
      const openUrl = await getPodWsUrl(podJsonObject);
      setState('loaded');
      setPodUrl(openUrl || '');
      return;
    }

    // setOpenMessage('\"正在创建 pod ...\"');
    // await (new Promise(resolve=> setTimeout(resolve, 1000)));
    let _ws: any;
    try{

      let wsUrl;
      if (process.env.API_WEBSOCKET) {
        wsUrl = process.env.API_WEBSOCKET;
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
      const timer$ = timer(4000000);
      const break$ = new Subject<any>();

      let isTimeout = false;
      timer$.subscribe(() => {
        isTimeout = true;
        break$.complete();
      });

      // 当5秒后 timer 发出值时， source 则完成
      const example = _ws.pipe(takeUntil(timer$));

      example.subscribe((r: any) => {
        setState( (state) => {
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
      await awaitPodAvailable(podJsonObject);
      const openUrl = await getPodWsUrl(podJsonObject);
      setState('loaded');
      setPodUrl(openUrl || '');
    } finally {
      _ws.unsubscribe();
    }
  }, []);

  useEffect( () => {

    if(!wsObj) {
      return;
    //   const timeId = setTimeout(() => {
    //     setState('readme');
    //   }, 200);
    //   return () => clearTimeout(timeId);
    }

    try{
      // const res = await axios.get(`/workspace/${wsId}`, { fetchTokenFromUrlParam: true, } as any);
      // setState(JSON.stringify(res.data, null, 2));
      openWs(wsObj);

    }catch(e) {
      setState(e.message)
      console.error(e);
    }

  }, [wsObj]);

  if(state==='error') {
    return <div>{state}</div>
  }

  if(state === 'loading') {
    return <div>loading...</div>
  }

  if(state === 'loaded' && podUrl) {
    return <iframe style={iframeStyle} src={podUrl} />;
  }

  if(state === 'readme') {
    return <GitRepoList />;
  }

  return (
    <div>{state}</div>
  );

}

export default WsPod;
