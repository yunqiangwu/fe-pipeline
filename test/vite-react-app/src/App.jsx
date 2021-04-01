import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

function App() {
  // const [show, setShow] = useState(false);
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
      };
    }

    window.addEventListener('message', onMessage);

    return () => {
      window.removeEventListener('message', onMessage);
    };

  }, []);

  const sendCommand = useCallback(() => {

    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({
        type: 'command',
        content: 'ls -la',
        key: '33',
      }, '*');
    }

  }, [iframeRef, iframeRef.current]);

  return (
    <div className="App">
      <button onClick={sendCommand}>
        发送命令
      </button>
      <iframe ref={iframeRef} style={{ width: 1000, height: 800 }} src={vscodeEditorUrl} sandbox="allow-top-navigation allow-popups	allow-same-origin allow-scripts allow-forms" frameBorder="0"></iframe>
    </div>
  );
}

export default App;
