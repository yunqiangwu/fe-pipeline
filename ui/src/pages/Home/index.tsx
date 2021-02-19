import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

const WsPod: FC = (props) => {

  const [state, setState] = useState('');

  const ws = useMemo(() => {
    console.log((props as any).match.params);

    let wsUrl;
    if (process.env.NODE_ENV === 'development') {
      wsUrl = 'ws://localhost:3000/';
    } else {
      wsUrl = `${location.protocol.startsWith('https') ? 'wss:' : 'ws:'}//${location.host}/`;
    }

    const ws = webSocket(wsUrl);
    return ws;
  }, []);

  useEffect(() => {
    ws.subscribe(res => {
      setState(JSON.stringify(res));
    });
    return () => {
      ws.unsubscribe();
    }
  }, [ws, setState]);

  return (
    <div onClick={() => {
      ws.next(
        {
          event: 'events',
          data: 'test',
        }
      );
    }}>
      ws - pod
      <div>
        {state}
      </div>
    </div>
  )
}

export default WsPod;