import React, { FC, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import styles from './style.less';

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
        {`${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}?gitUrl=https://code.choerodon.com.cn/13485/test-gitpod&image=registry.cn-hangzhou.aliyuncs.com/gitpod/code-server:2`}
      </textarea>
      <p>iframe:</p>
      <textarea cols={180} rows={2}>
        {`<iframe src="${window.location.protocol}//${window.location.host}${(window as any).routerBase || '/'}?gitUrl=https://code.choerodon.com.cn/13485/test-gitpod"  height=\"500\" width=\"500\" />`}
      </textarea>
      <div>
        <h3>参数解释:</h3>
        <table className={styles['var-table']} >
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
              <td>克隆地址, git 克隆地址(也可以写一个 zip 压缩包下载地址, 当值为 none 时, 表示不需要 clone 或者 下载) </td>
              <td></td>
              <td>是</td>
            </tr>
            <tr>
              <td>image</td>
              <td>镜像地址, 可以参考: <a href="https://github.com/yunqiangwu/theia-apps/blob/master/theia-full-docker/Dockerfile" target="_blank">构建镜像配置文件</a> 构建镜像</td>
              <td>vscode</td>
              <td></td>
            </tr>
            <tr>
              <td>webPort</td>
              <td> 默认的在线 web ide 端 port</td>
              <td>23000</td>
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
              <td>envJsonData</td>
              <td>环境变量配置对象, encodeURIComponent(JSON.stringify(envObj)) 之后的字符串, 值示例: {`'{"ENV_NAME_1": "value1"}'`}, <br/>特殊境变量名: FE_PIPELINE_WORK_DIR: 设置工作目录 </td>
              <td></td>
              <td></td>
            </tr>
            <tr>
              <td>gitpodConfig &nbsp;&nbsp;&nbsp; </td>
              <td>.gitpod.yml 配置对象, encodeURIComponent(JSON.stringify(envObj)) 之后的对象, 值示例: {`'{"tasks": [{ "init": "yarn install", "command": "yarn start" }]}'`} </td>
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
