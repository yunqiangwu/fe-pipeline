import * as querystring from 'querystring';
import io, { Socket } from 'socket.io-client';
import { RouteComponentProps } from 'react-router-dom';
import { useAsync, useAsyncFn, useLocation } from 'react-use';
import { GitRepoList } from './components/git-repo-list';
import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
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
import { useVscode } from './hooks';
import { getToken, hash } from '@/utils/token';
import "./demo.less";

function App() {
  const [result, setResult] = useState(false);
  const [commandStr, setCommandStr] = useState('pwd');

  const {
    editor,
    loading,
    controls,
    iframeRef
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
