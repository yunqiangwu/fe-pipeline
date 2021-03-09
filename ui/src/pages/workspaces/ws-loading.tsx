import axios from '@/utils/axios.config';
import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { RouteComponentProps } from 'react-router-dom';
import { useAsync, useLocation } from 'react-use';
// import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

interface WsLoadingPageReactParams {
  id: string;
}

const WsPod: React.FC<RouteComponentProps<WsLoadingPageReactParams>>  = (props) => {

  const [state, setState] = useState('');

  useAsync(async () =>  {

    const wsId = props.match.params.id;
    if(!wsId) {
      return;
    }
    try{
      const res = await axios.get(`/workspace/${wsId}`, {} as any);
      setState(JSON.stringify(res.data, null, 2));
    }catch(e) {
      console.error(e);
    }
  }, []);

  return (
    <div>
      <pre>
        {state}
      </pre>
    </div>
  )
}

export default WsPod;
