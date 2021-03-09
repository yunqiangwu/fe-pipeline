import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

export const GitRepoList: FC = () => {

  const [state, setState] = useState('');

  const ws = useMemo(() => {

    let wsUrl;
    if (process.env.API_WEBSOCKET) {
      wsUrl = process.env.API_WEBSOCKET;
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
    <div style={{ margin: '20px auto', width: '80%'}}>
      <br/>
      <Link to="/app/workspaces">工作空间管理</Link>
      <br/>
      <br/>
      <p
        onClick={() => {
          ws.next(
            {
              event: 'events',
              data: 'test',
            }
          );
        }}
      >
        使用方法:
      </p>
      <p>url:</p>
      <textarea cols={180} rows={2}>
        {`${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}?gitUrl=https://github.com/ant-design/ant-design-pro/`}
      </textarea>
      <p>iframe:</p>
      <textarea cols={180} rows={2}>
        {`<iframe src="${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}?gitUrl=https://github.com/ant-design/ant-design-pro/"  height=\"500\" width=\"500\" />`}
      </textarea>
      <div>
        <h3>参数解释:</h3>
        <table style={{ border: '1px solid gray'}} >
          <thead>
            <tr>
              <th>  参数名称  </th>
              <th>  参数介绍  </th>
              <th>  默认值  </th>
              <th>  是否必填  </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>gitUrl</td>
              <td>克隆地址, git 克隆地址, 和 zipUrl 两个参数其中一个必填 </td>
              <td></td>
              <td>是</td>
            </tr>
            <tr>
              <td>zipUrl</td>
              <td>zip地址, 支持通过 zip 包创建工作空间, 和 gitUrl 两个参数其中一个必填 </td>
              <td></td>
              <td>是</td>
            </tr>
            <tr>
              <td>image</td>
              <td>镜像地址, 可以参考: <a href="https://github.com/yunqiangwu/theia-apps/blob/master/theia-full-docker/Dockerfile" target="_blank">构建镜像配置文件</a> 构建镜像</td>
              <td>theia-full</td>
              <td></td>
            </tr>
            <tr>
              <td>clientId</td>
              <td> 提供自动登录和认证配置, token 来源, 可选值: open-hand \  Choerodon \ GitHub GitLab  </td>
              <td>open-hand</td>
              <td></td>
            </tr>
            <tr>
              <td>clientToken</td>
              <td> 客户端 token, 比如 zipUrl 访问时需要 token , 可以设置这个值, 在请求时 , 会自动加上这个 token </td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>ENV_XXX</td>
              <td>ENV_ 开头的变量会直接输入到 创建的 pod 环境变量内</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div>
        {state}
      </div>
    </div>
  )
}
