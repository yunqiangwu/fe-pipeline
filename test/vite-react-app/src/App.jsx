import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  const [result, setResult] = useState(false);
  const [commandStr, setCommandStr] = useState('pwd');
  // const [editorParams, setEditorParams] = useState({});
  const vscodeEditorUrl = useMemo(() => {
    const podConfig = {
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
    const gitUrl = 'none'; // https://code.choerodon.com.cn/13485/test-gitpod
    // const gitUrl = 'https://code.choerodon.com.cn/13485/test-gitpod'; // https://code.choerodon.com.cn/13485/test-gitpod
    const query = `gitUrl=${gitUrl}&gitpodConfig=${encodeURIComponent(JSON.stringify(podConfig))}&image=vscode`;
    return `http://fe-pipeline.localhost:8000/?${query}`;
    // return `http://fe-pipeline.localhost/fed/?${query}`;
    // return `https://fe-pipeline.jajabjbj.top/fed/?${query}`;
  }, []);

  const iframeRef = useRef(null);

  useEffect(() => {

    const onMessage = (e) => {
      if (!e.data || !e.data.type) {
        return;
      }
      if(!e.data._isReturnFromVscode){
        return;
      }

      const { type } = e.data;

      if (type === 'command') {
        console.log(e.data);
        setResult(e.data.content)
      };
    }

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
    };

  }, []);

  const sendCommand = useCallback(() => {

    if(!commandStr) {
      return;
    }

    if (iframeRef.current) {

      const _randNum = (Math.random().toString(16).substr(2).concat((+new Date().getTime()).toString(16)).concat(Math.random().toString(16).substr(2,8))).padEnd(32, '0').substr(0,32).replace(/([\w]{8})([\w]{4})([\w]{4})([\w]{4})([\w]{12})/, '$1-$2-$3-$4-$5');

      iframeRef.current.contentWindow.postMessage({
        type: 'command',
        content: commandStr,
        _key: _randNum,
      }, '*');
    }

  }, [iframeRef, iframeRef.current, commandStr]);

  return (
    <div className="App">
      <iframe ref={iframeRef} style={{ width: 900, height: 500 }} src={vscodeEditorUrl} allow="clipboard-write" sandbox="allow-top-navigation allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-forms" frameBorder="1"></iframe>
      <input value={commandStr} onChange={e => setCommandStr(e.target.value)} />
      <button onClick={sendCommand}>
        发送命令
      </button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}

export default App;
