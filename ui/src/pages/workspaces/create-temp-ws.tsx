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
import { getToken, hash } from '@/utils/token';

// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

const iframeStyle: CSSProperties = {
 border: 'none',
 height: "100%",
 width: "100%",
};

interface WsLoadingPageReactParams {
  id: string;
}

const WsPod: React.FC<RouteComponentProps<WsLoadingPageReactParams>>  = (props) => {

  const [state, setState] = useState('loading');
  // const [podUrl, setPodUrl] = useState<string>('loading...');
  const [wsObj, setWsObj] = useState<any>(null);

  const createTemp = useAsync(async () =>  {

    const queryObj = querystring.parse(props.location.search.substring(1));
    // delete queryObj.clientToken;
    // delete queryObj.clientId;
    // let wsId = queryObj.wsId;

    // setToken todo

    if(queryObj.gitUrl) {
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

    const awaitPodAvailable = async (wsId: string) => {
         // 等待容器激活
         let isSuccess  = false;
         let errorCount = 0;

         try {
           while(isSuccess === false) {
             let errObj = null;
             let res: any = null;
             try{
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
             if(errorCount >=10 ) {
               throw errObj;
             }
           }
         } catch(e)  {
           console.error(e);
           // return;
         }
    };

    if(ws.state ===  'opening' &&  ws.podObject) {
      await awaitPodAvailable(ws.id);
      setState('loaded');
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
          if(r.data.message) {
            return r.data.message;
          }
          return 'loading...';
        } );
        if(r.data.type === 'created')  {
          break$.complete();
        }
      });

      const res = await axios.post(`/workspace/open-ws/${ws.id}`, {}, { showError: true } as any);

      if(res.data.podObject) {
        break$.complete();
      }

      await break$.toPromise();

      if(isTimeout) {
        notification.error({
          message: '操作超时',
          description: '',
        });
        return;
      } else {
      }
      await awaitPodAvailable(ws.id);
      setState('loaded');
    } finally {
      _ws.unsubscribe();
    }
  }, []);

  useEffect( () => {

    if(!wsObj) {
      return;
    }

    try{
      openWs(wsObj);
    }catch(e) {
      setState(e.message)
      console.error(e);
    }

  }, [wsObj]);

  useEffect( () => {

    if(window.top === window) {
      return;
    }

    const onMessage = (e: any) => {
      if(!e.data || !e.data.type){
        return;
      }
      if(e.data._isReturnFromVscode){
        return;
      }

      const { type, content } = e.data;

      if(type === 'command') {

        console.log(`执行命令: ${content}`);
        window.top.postMessage({
          ...e.data,
          _isReturnFromVscode: true,
          content: `执行命令: ${content}`,
        }, '*');
      }
    };

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
    };

  }, []);

  if(state==='error') {
    return <div>{state}</div>
  }

  if(state === 'loading') {
    return <div>loading...</div>
  }

  if(state === 'loaded' && wsObj) {
    return <iframe style={iframeStyle} src={`${axios.defaults.baseURL}workspace/redirect-ws-url/${wsObj.id}?access_token=${getToken()}`} />;
  }

  if(state === 'readme') {
    return <GitRepoList />;
  }

  return (
    <div>{state}</div>
  );

}

export default WsPod;
