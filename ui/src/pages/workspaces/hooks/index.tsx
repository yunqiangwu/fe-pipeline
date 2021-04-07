import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";


type UseVscodeConfig = {

  apiHost?: string;

  podConfig?: {
    tasks?: {
      init?: string;
      command?: string;
    }[];
    ports?: {
      init?: string;
      command?: string;
    }[]
  };

  gitUrl?: string;

  image?: string;

};

export const useVscode = (config?: UseVscodeConfig) => {

  const {

    apiHost,
    podConfig,
    gitUrl,
    image,

  } = config || {};

  // const [result, setResult] = useState(false);
  // const [commandStr, setCommandStr] = useState('pwd');
  const [loading, setLoading] = useState(false);
  const vscodeEditorUrl = useMemo(() => {
    const _podConfig = podConfig || {
      tasks: [
        {
          command: 'python3 -m http.server 8000',
        },
      ],
      ports: [
        {
          port: 8000,
        }
      ],
    };
    const _gitUrl = gitUrl || 'none'; // https://code.choerodon.com.cn/13485/test-gitpod
    const _image = image || 'vscode';
    // const gitUrl = 'https://code.choerodon.com.cn/13485/test-gitpod'; // https://code.choerodon.com.cn/13485/test-gitpod
    const query = `gitUrl=${_gitUrl}&gitpodConfig=${encodeURIComponent(JSON.stringify(_podConfig))}&image=${_image}`;
    // return `http://fe-pipeline.localhost/fed/?${query}`;
    // return `https://fe-pipeline.jajabjbj.top/fed/?${query}`;
    return `${apiHost || `http://${window.location.host}${(window as any).routerBase || '/'}`}?${query}`;
  }, [apiHost]);

  const iframeRef = useRef<any>(null);
  const promiseMap = useMemo(() => new Map(), []);

  useEffect(() => {

    setLoading(true);

    const onMessage = (e: any) => {
      if (!e.data || !e.data.type) {
        return;
      }
      if(!e.data._isReturnFromVscode){
        return;
      }

      const { type,  _key, status } = e.data;

      if (type === 'command') {
        console.log(e.data);
        const promiseHandle = promiseMap.get(_key);
        if(!promiseHandle) {
          return;
        }

        const [ resolve, reject ] = promiseHandle;

        promiseMap.delete(_key);

        if(status === 'success') {
          resolve(e.data);
        } else {
          reject(e.data);
        }

      };
      if (type === 'loaded') {
        console.log(e.data);
        setLoading(false);
      };
    }

    window.top.addEventListener('message', onMessage);

    return () => {

      window.top.removeEventListener('message', onMessage);

    };

  }, []);

  const sendCommand = useCallback((commandStr: string) => {

    if(!commandStr) {
      return;
    }

    if (iframeRef.current) {

      const _randNum = (Math.random().toString(16).substr(2).concat((+new Date().getTime()).toString(16)).concat(Math.random().toString(16).substr(2,8))).padEnd(32, '0').substr(0,32).replace(/([\w]{8})([\w]{4})([\w]{4})([\w]{4})([\w]{12})/, '$1-$2-$3-$4-$5');

      iframeRef?.current?.contentWindow?.postMessage({
        type: 'command',
        content: commandStr,
        _key: _randNum,
      }, '*');

      return _randNum;
    }

  }, [iframeRef, iframeRef.current]);


  const controls = useMemo(() => {

    const executeShell = async (command: string) => {
      const runId = sendCommand(command);

      if(!runId) {
        return;
      }

      let _resolve, _reject;
      const retPromise = new Promise((resolve, reject) => {
        _resolve = resolve;
        _reject = reject;
      });

      promiseMap.set(runId, [
        _resolve, _reject
      ]);

      return retPromise;
    };

    return {
      executeShell,
    }
  }, [sendCommand]);

  return {
    editor: <iframe allow="clipboard-read; clipboard-write" sandbox="allow-top-navigation allow-popups-to-escape-sandbox allow-popups allow-same-origin allow-scripts allow-forms" ref={iframeRef} style={{ width: 900, height: 500 }} src={vscodeEditorUrl} frameBorder="1"></iframe>,
    loading,
    controls,
    iframeRef
  };


}
