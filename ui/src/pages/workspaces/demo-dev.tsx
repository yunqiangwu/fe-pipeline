import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useVscode } from './hooks';
import "./demo.less";

function App() {
  const [result, setResult] = useState(false);
  const [commandStr, setCommandStr] = useState('pwd');

  const {
    editor,
    loading,
    controls,
    // iframeRef
  } = useVscode();

  const sendCommand = useCallback(() => {
    return controls.executeShell(commandStr).then((res: any) => {
      setResult(res.content);
    }).catch( (e) => {
      console.error(e);
      if(e.content) {
        setResult(e.content);
      }
    });
  }, [commandStr])

  return (
    <div className="App">
      {editor}
      <input value={commandStr} onChange={e => setCommandStr(e.target.value)} />
      <button onClick={sendCommand}>
        发送命令
      </button>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}


export default App;
