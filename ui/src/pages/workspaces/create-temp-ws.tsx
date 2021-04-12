import * as querystring from 'querystring';
import io, { Socket } from 'socket.io-client';
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

(window as any).axios = axios;

// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

const iframeStyle: CSSProperties = {
 border: 'none',
 height: "100%",
 width: "100%",
};

interface WsLoadingPageReactParams {
  id: string;
}

const getPodUrl = async (wsId: string | number) => {
  const res = await axios.get(`workspace/redirect-ws-url/${wsId}?method=post&access_token=${getToken()}`, {});
  console.log('res.data.domain', res.data.domain);
  return res.data.domain;
  // const theGetPodUrlApi = `${axios.defaults.baseURL}workspace/redirect-ws-url/${wsId}?method=post&access_token=${getToken()}`;

  // const theGetPodUrlApi = `${axios.defaults.baseURL}workspace/redirect-ws-url/${wsId}?access_token=${getToken()}`;

  // return theGetPodUrlApi;


}

const WsPod: React.FC<RouteComponentProps<WsLoadingPageReactParams>>  = (props) => {

  const [state, setState] = useState('loading');
  const [podUrl, setPodUrl] = useState<string| null>(null);
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
      // await awaitPodAvailable(ws.id);

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

      const wsRes = await axios.get(`/workspace/${ws.id}`);
      setWsObj(wsRes.data);
    } finally {
      _ws.unsubscribe();
    }
  }, []);

  useAsync( async () => {

    if(!wsObj) {
      return;
    }

    try{
      await openWs(wsObj);
      const podUrlObjRes = await getPodUrl(wsObj.id);

      setPodUrl(podUrlObjRes);
      setState((state) => {
        if(state !== 'loaded') {
          window.top.postMessage({
            type: 'loaded',
            _isReturnFromVscode: true,
          }, '*');
        }
        return 'loaded';
      });
    }catch(e) {
      setState(e.message)
      console.error(e);
    }

  }, [wsObj]);

  useEffect( () => {

    if(window.top === window) {
      return;
    }

    if(!podUrl) {
      return;
    }

    let closeWss: any = null;
    let socket: Socket | null = null;

    const onMessage = async (e: any) => {
      if(!e.data || !e.data.type){
        return;
      }
      if(e.data._isReturnFromVscode){
        return;
      }

      const { type, content } = e.data;

      if(type === 'command') {

        console.log(`执行命令: ${content}`);

        let wssUrl;

        if(process.env.NODE_ENV === 'development') {
          wssUrl = 'ws://127.0.0.1:23010';
        }  else {
          wssUrl = `${location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${podUrl.replace(/https?\:\/\//, '').split('/')[0].replace('23000-','23010-')}/`;
        }

        if(!socket) {
          socket = io(wssUrl, {path: '/api', extraHeaders: { password: wsObj.password }});
        }

        closeWss = () => {
          if(!socket) {
            return;
          }
          socket.disconnect();
          socket.close();
          socket = null;
          closeWss = null;
        };

        const _randNum = (Math.random().toString(16).substr(2).concat((+new Date().getTime()).toString(16)).concat(Math.random().toString(16).substr(2,8))).padEnd(32, '0').substr(0,32).replace(/([\w]{8})([\w]{4})([\w]{4})([\w]{4})([\w]{12})/, '$1-$2-$3-$4-$5');

        let timeId: any = setTimeout(() => {
          if(socket) {
            closeWss();
            window.top.postMessage({
              ...e.data,
              _isReturnFromVscode: true,
              failed: true,
              content: 'timeout',
            }, '*');
          }
        }, 30000);

        socket.on("message", (data) => {
          if(data._randNum!== _randNum ) {
            return;
          }
          clearTimeout(timeId);
          timeId = null;
          // console.log('receive message:',data); // prints { x: "42", EIO: "4", transport: "polling" }
          window.top.postMessage({
            ...e.data,
            ...data,
            _isReturnFromVscode: true,
          }, '*');
          closeWss();
        });

        socket.send({
          ...e.data,
          _randNum,
        });

      }
    };

    window.addEventListener('message', onMessage);

    return () => {
      if(closeWss) {
        closeWss();
      }
      window.removeEventListener('message', onMessage);
    };

  }, [podUrl]);

  if(state==='error') {
    return <div>{state}</div>
  }

  if(state === 'loading') {
    return <div>loading...</div>
  }

  if(state === 'loaded' && podUrl) {
    return <iframe allow="clipboard-read; clipboard-write" sandbox="allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-forms" style={iframeStyle} src={podUrl.startsWith('http') ? podUrl : `${window.location.protocol}//${podUrl}`} />;
  }

  if(state === 'readme') {
    return <GitRepoList />;
  }

  return (
    <div>{state}</div>
  );

}

export default WsPod;
