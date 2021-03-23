import { HttpException, Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fetch from 'node-fetch';
import * as crypto from "crypto";
import { Client1_13, ApiRoot } from 'kubernetes-client';
import { Workspace } from './workspace.entity';
import { globalSubject } from '../events/events.utils';
import { emptyDir, emptyDirSync, existsSync, fstat, mkdirpSync, readdir, readFileSync, rmdir } from 'fs-extra';
import { Config, getAppHomeDir } from 'src/config/config';
import { User } from '../users/users.entity';
import { join } from 'path';
import * as yaml from 'yaml';
import { UsersService } from 'src/users/users.service';
import { ContextParser } from './utils/context-parser';
import { exec } from 'child_process';
import { promisify } from 'util';
import { URL } from "url";
import { unlinkSync, lstatSync } from 'fs';
import { isURL } from 'class-validator';
import { isString } from 'lodash';
import { JwtService } from '@nestjs/jwt';

const extract = require('extract-zip');

@Injectable()
export class WorkspaceService {

  private kubeClient = new Client1_13({});
  private ns: string = 'fe-pipeline';

  @Inject(UsersService)
  private readonly usersService: UsersService;

  @Inject(ContextParser)
  private readonly contextParser: ContextParser;

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
    public readonly jwtService: JwtService,
  ) {
    try {
      const filePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
      if (existsSync(filePath)) {
        this.ns = readFileSync(filePath).toString();
      }
    } catch (e) { }
  }

  async createTempWorkspace(wsData: Workspace): Promise<Workspace> {

    // wsData.name = wsData.name || `ws-pod-temp-` + Date.now();
    wsData.isTemp = true;
    wsData.image = wsData.image || 'vscode';
    if(wsData.gitpodConfig) {
      wsData.gitpodConfig = isString(wsData.gitpodConfig) ? wsData.gitpodConfig: JSON.stringify(wsData.gitpodConfig);
    } else {
      wsData.gitpodConfig = null;
    }

    if (wsData.isZipUrl === undefined) {
      wsData.isZipUrl = wsData.gitUrl.includes('.zip');
    }

    const example = new Workspace();

    example.gitUrl = wsData.gitUrl;
    example.isTemp = true;
    example.image = wsData.image;
    example.userId = wsData.userId;
    if(wsData.name) {
      example.name = wsData.name;
    } else {
      wsData.name = wsData.name || `ws-pod-temp-` + Date.now();
    }

    let ws = await this.workspaceRepository.findOne(example);

    if (!ws) {
      // throw new HttpException(`ws: ${example} is not found`, 404);
      ws = await this.workspaceRepository.save(wsData);
    } else {
      if(ws.gitpodConfig !== wsData.gitpodConfig || wsData.image !== ws.image) {
        if (ws.state === 'opening' || ws.state === 'pending') {
          if((wsData.gitpodConfig && ws.gitpodConfig !== wsData.gitpodConfig) || (wsData.envJsonData && ws.envJsonData !== wsData.envJsonData)) {
            await this.closeWs(ws.id, true);
          }
        }
        ws = {
          ...ws,
          ...wsData,
          state: 'created',
        } as Workspace;
        await this.workspaceRepository.save(ws);
      }
    }
    return ws;
  }

  async findById(workspaceId: number, currentUser?: User): Promise<Workspace> {
    const ws = await this.workspaceRepository.findOne(workspaceId);

    if (!ws) {
      throw new HttpException(`ws: ${workspaceId} is not found`, 404);;
    }

    if (!currentUser || +currentUser.userId !== ws.userId) {
      throw new HttpException(`ws: ${ws.id} is not get`, 403);;
    }
    return ws;
  }

  async getRedirectToWsInfo(workspaceId: number): Promise<any>{
    const ws = await this.workspaceRepository.findOne(workspaceId);
    // console.log(workspaceId, ws);
    let podObj;
    if(ws && ws.podObject) {
      podObj =  JSON.parse(ws.podObject);
    } else {
      throw new Error(`not find ws: ${ws}, wsId: ${workspaceId}`);
    }
    // } else {
    //   const podName = `ws-pod-${workspaceId}`;
    //   const kubePodRes: any = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});
    //   podObj = kubePodRes.body;
    // }

    let podIp = podObj.status.podIP;
    let webUiPort: any = 3000;
    let password = '';

    for (const container of podObj.spec.containers) {
      if (container.name === 'web') {
        for (const portObj of container.ports) {
          if (portObj.name === 'web') {
            webUiPort = portObj.containerPort;
            break;
          }
        }
        for(const envObj of container.env) {
          if(envObj.name === 'PASSWORD') {
            password = envObj.value;
            break;
          }
        }
        break;
      }
    }
    let realIP = podIp;
    let realPort = webUiPort;
    if (process.env.PROXY_BACKEND_HOST) {
      realIP = process.env.PROXY_BACKEND_HOST;
    }
    if (process.env.PROXY_BACKEND_PORT) {
      realPort = process.env.PROXY_BACKEND_PORT;
    }
    const wsHost = `${webUiPort}-${podIp.replace(/\./g, '-')}.ws.${Config.singleInstance().get('hostname').replace(/:\d+$/, '')}`.trim();
    const hashKey = crypto.createHash("sha256").update(password).digest("hex");
    return {
      wsHost, password: hashKey, realIP, realPort
    };
  }

  async isAlive(workspaceId: number): Promise<any> {
    
    try {
      const { wsHost, password, realIP, realPort } = await this.getRedirectToWsInfo(workspaceId);
      return await fetch(`http://${realIP}:${realPort}`,
        { method: 'get', headers: { Host: wsHost}, timeout: 3000 } // 
      ).then(
        r => {
          if(r.status >= 200 && r.status < 500) {
            return ({ status: r.status, wsHost, password });
          } else {
            return Promise.reject({ status: r.status, wsHost })
          }
        },
        (err) => {
          // console.log(err);
          if(err.response && err.response.status >= 400 && err.response.status < 500) {
            console.log(err.response.data);
            const hashKey = crypto.createHash("sha256").update(password).digest("hex");
            return Promise.resolve({ status: err.response.status, wsHost, password: hashKey });
          } else  {
            return Promise.reject(err);
          }
        }
      );
    } catch (r) {
      console.log(r);
      // return {};
      throw new Error(JSON.stringify({ status: r.status, message: r.message }));
    }
  }

  async openWs(workspaceId: number, currentUser?: User): Promise<any> {

    if (!workspaceId) {
      throw new Error(`not workspaceId: ${workspaceId}`);
    }

    let ws = await this.workspaceRepository.findOne(workspaceId);

    if (!ws) {
      throw new Error(`not find ws: ${ws}, wsId: ${workspaceId}`);
    }

    if (ws.state === 'pending') {
      return {
        data: workspaceId,
      };
    }

    const podName = `ws-pod-${workspaceId}`;

    if (ws.state === 'opening') {
      try {
        const kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});
        if (!ws.podObject) {
          ws.podObject = JSON.stringify(kubePodRes.body);
          await this.workspaceRepository.save(ws);
        }
        return {
          data: workspaceId,
          podObject: kubePodRes.body, // JSON.stringify(kubePodRes.body),
        };
      } catch (e) {
        ws.state = "error"
        ws.errorMsg = e.message;
        await this.workspaceRepository.save(ws);
        throw e;
      }
    }

    if (ws.state !== 'saved' && ws.state !== 'created' && ws.state !== 'error' && ws.state) {
      throw new Error(`error ws  state: ${ws.state}, wsId: ${workspaceId}`);
    }

    try {
      let projectDirname  = '';
      let gitpodConfig = ws.gitpodConfig ? JSON.parse(ws.gitpodConfig) : null;
      const contextToDir = this.getWsdir(podName);

      if(ws.gitUrl  &&  ws.gitUrl !== 'none') {
        if(!isURL(ws.gitUrl)) {
          throw new Error(`${ws.gitUrl} is not correct url!`);
        }
        const existContextDir = existsSync(contextToDir);
        if(ws.state !== "saved" || !existContextDir) {
          if(existContextDir) {
            emptyDirSync(contextToDir);
          } else {
            mkdirpSync(contextToDir)
          }
          if (ws.isZipUrl) {
            const zipUrl = ws.gitUrl;
  
            let token = '';
  
            const url = new URL(zipUrl);
  
            const ta = await this.usersService.threeAccountRepository.findOne({
              authHost: url.host,
              user: {
                userId: ws.userId,
              }
            });
            if(ta) {
              token = ta.accessToken;
            }
  
            globalSubject.next(
              {
                wsId: workspaceId,
                data: {
                  type: 'download-zip-file',
                  message: `正在下载代码... ${zipUrl}`,
                  workspaceId,
                },
              }
            );
            const tempFileName = `/tmp/ws-pod-download-zip-${ws.id}.zip`
            try {
              await promisify(exec)(`curl --location --request GET ${token ? `--header 'Authorization: Bearer ${token}'` : ''} -o ${tempFileName} '${zipUrl}'`);
            }catch(e) {
              console.error(e);
              throw new HttpException(`下载文件 ${zipUrl} 失败!`, 403);
            }
            globalSubject.next(
              {
                wsId: workspaceId,
                data: {
                  type: 'unzip',
                  message: `正在解压代码... ${zipUrl}`,
                  workspaceId,
                },
              }
            );
            try {
              await extract(tempFileName, { dir: contextToDir });
              unlinkSync(tempFileName);
              // await promisify(exec)(`unzip -O ${tempFileName}  ${zipUrl}`);
            }catch(e) {
              console.error(e);
              throw new HttpException(`解压文件失败 ${zipUrl} 失败!`, 403);
            }
          } else {
            const repoObj = await this.contextParser.parseURL(ws.gitUrl);
            const ta = await this.usersService.threeAccountRepository.findOne({
              authHost: repoObj.host,
              user: {
                userId: ws.userId,
              }
            });
    
            const config = Config.singleInstance();
            if (ta) {
              const cloneUrl = `${repoObj.protocol}//oauth2:${ta.accessToken}@${repoObj.host}/${repoObj.owner}/${repoObj.repoName}.git`;
              try {
                globalSubject.next(
                  {
                    wsId: workspaceId,
                    data: {
                      type: 'clone',
                      message: '正在克隆代码...',
                      workspaceId,
                    },
                  }
                );
                await promisify(exec)(`cd ${contextToDir} \n git clone ${cloneUrl}`);
              }catch(e) {
                console.error(e);
                throw new HttpException(`当前账号 ${ta.threeAccountUsername} 无访问 ${ws.gitUrl} 的权限!`, 403);
              }
              console.log(`clone dir ${cloneUrl}`);
            } else {
              const err = new HttpException({
                message: '需要获取 git 权限',
                // autoAuthClientId: 'Github'
              }, 401);
              const authProviders = config.get('authProviders');
              const authItem = authProviders.find(item => item.host === repoObj.host);
              (err as any).autoAuthClientId = authItem.id || 'Github';
              throw err;
            }
            // if(1===1) { // todo 存工作空间文件 
            //   const err = new HttpException({
            //     message: '需要获取 git 权限',
            //     // autoAuthClientId: 'Github'
            //   }, 401);
            //   (err as any).autoAuthClientId = 'Github';
            //   throw err;
            // }
          }
          projectDirname = ((await promisify(readdir)(contextToDir)) as string[]).find(dirOrFileName => {
            if(dirOrFileName.startsWith('.')) {
              return false;
            }
            let stat = lstatSync(join(contextToDir, dirOrFileName))
            if (stat.isDirectory() === true) { 
              return true;
            }
          });
        }
      }

      if(existsSync(contextToDir)) {
        projectDirname = ((await promisify(readdir)(contextToDir)) as string[]).find(dirOrFileName => {
          if(dirOrFileName.startsWith('.')) {
            return false;
          }
          let stat = lstatSync(join(contextToDir, dirOrFileName))
          if (stat.isDirectory() === true) { 
            return true;
          }
        });
  
        if(projectDirname) {
          const gitpodYamlPath = join(contextToDir, projectDirname, '.gitpod.yml');
          if(projectDirname && existsSync(gitpodYamlPath)) {
            const gitpodYmlContent  = readFileSync(gitpodYamlPath).toString();
            gitpodConfig = yaml.parse(gitpodYmlContent);
          }
        }
      }

      // throw new HttpException(`${ws.gitUrl}`, 404);

      let kubePodRes: any = null;

      try {
        kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});
      } catch (errByGet) {
        if (errByGet.statusCode === 404) {
          kubePodRes = null;
        } else {
          throw errByGet;
        }
      }

      if (!kubePodRes || (kubePodRes.statusCode > 299 && kubePodRes.statusCode < 200)) {

        ws.state = 'pending';

        ws.password = (Math.random().toString(16).substr(2).concat((+new Date().getTime()).toString(16)).concat(Math.random().toString(16).substr(2,8))).padEnd(32, '0').substr(0,32).replace(/([\w]{8})([\w]{4})([\w]{4})([\w]{4})([\w]{12})/, '$1$2$3$4$5');

        await this.workspaceRepository.save(ws);

        const vol: any = {
          name: 'ws-volume',
        };
        const pvcName = Config.singleInstance().get('existingClaimForWs');
        if (pvcName && typeof pvcName === 'string') {
          vol.persistentVolumeClaim = {
            claimName: pvcName
          };
        } else {
          vol.emptyDir = {};
        }

        const webPort = ws.webPort || 23000;

        // docker run -e PASSWORD=password -p 8080:8080 -it --rm --name vscode codercom/code-server:latest

        const podConfig = await (async () => {
          let resultConfig = {
            "apiVersion": "v1",
            "kind": "Pod",
            "metadata": {
              "name": podName,
              "labels": {
                "fe-pipeline": "ws",
                "app": "fe-pipeline",
                "ws-pod": podName,
                "ws-id": workspaceId,
              },
            },
            "spec": {
              volumes: [
                vol,
              ],
              "containers": [
                {
                  "name": "web",
                  "image": 'registry.cn-hangzhou.aliyuncs.com/gitpod/theia-app:dev-hand',// "nginx",
                  "securityContext": {
                    privileged: !ws.isTemp
                  },
                  "ports": [
                    {
                      "name": "web",
                      "containerPort": webPort,
                      "protocol": "TCP"
                    }
                  ],
                  "env": [
                    {
                      name: 'PASSWORD',
                      value: ws.password,
                    },
                    {
                      name: 'FE_PIPELINE_WORK_DIR',
                      value: join(`/workspace`, projectDirname),
                    },
                    {
                      name: 'FE_PIPELINE_GIT_URL',
                      value: ws.gitUrl,
                    },
                    {
                      name: 'THEIA_CONFIG_DIR',
                      value: '/workspace/.user-code-data-dir',
                    },
                  ],
                  // command: [ "node", "/home/theia/src-gen/backend/main.js", "--hostname=0.0.0.0" ],
                  // `--enable-proposed-api=fe-pipeline.fe-pipeline-extensions`,
                  args: [ `--user-data-dir=/workspace/.user-code-data-dir` , ...(ws.isTemp ? [] : [`--home=//${Config.singleInstance().get('hostname')}${Config.singleInstance().get('fe-path')}app/workspaces`]), `--port=${webPort}`, "--auth=password", `/workspace/${projectDirname}`],
                  // command: [ "python3", "-m", "http.server", "3000" ],
                  volumeMounts: [
                    {
                      mountPath: '/workspace',
                      subPath: podName,
                      name: vol.name
                    },
                    {
                      mountPath: '/fe-pipeline-app/vscode-extensions',
                      subPath: 'vscode-extensions',
                      name: vol.name
                    },
                    {
                      mountPath: '/fe-pipeline-app/theia-plugin',
                      subPath: 'theia-plugin',
                      name: vol.name
                    },
                    // {
                    //   mountPath: '/home/theia/.theia/extensions/vscode-fe-pipeline-extension',
                    //   subPath: 'fe-pipeline-extension/vscode-extensions/vscode-fe-pipeline-extension',
                    //   name: vol.name
                    // },
                    // {
                    //   mountPath: '/fe-pipeline-app/theia-extensions/theia-fe-pipeline-extension',
                    //   subPath: 'fe-pipeline-extension/theia-extensions/theia-fe-pipeline-extension',
                    //   name: vol.name
                    // },
                  ],
                  "livenessProbe": {
                    "initialDelaySeconds": 30,
                    "failureThreshold": 1000,
                    "periodSeconds": 20,
                    "httpGet": {
                      "path": "/",
                      "port": webPort
                    }
                  },
                  "readinessProbe": {
                    "httpGet": {
                      "path": "/",
                      "port": webPort
                    }
                  }
                }
              ]
            }
          };
          const container = resultConfig.spec.containers[0];
          if(gitpodConfig) {
            if(gitpodConfig.tasks) {
              container.env.push({
                name: 'GITPOD_TASKS',
                value: JSON.stringify(gitpodConfig.tasks),
              });
            }
            if(gitpodConfig.ports) {
              container.env.push({
                name: 'GITPOD_PORTS',
                value: JSON.stringify(gitpodConfig.ports),
              });
            }
          }
          if(currentUser) {
            const token = this.jwtService.sign({ username: currentUser.username, sub: currentUser.userId, userId: currentUser.userId });
            // const user = await this.usersService.findOne(currentUser.username);
            container.env.push({
              name: 'FE_PIPELINE_TOKEN',
              value: token,
            });
            container.env.push({
              name: 'GIT_USER',
              value: currentUser.username,
            });
            container.env.push({
              name: 'GIT_EMAIL',
              value: currentUser.email,
            });
          }
          if (ws.image === 'theia-full') {
            // container.image = 'registry.cn-hangzhou.aliyuncs.com/gitpod/theia-app:dev-hand';
            container.image = 'registry.cn-hangzhou.aliyuncs.com/gitpod/theia-ide:2';
            // const theiaHome = this.getWsdir('theia');
            // if(existsSync(theiaHome)) {
            //   container.env.push({
            //     name: 'THEIA_HOME',
            //     value: `/fe-pipeline-app/theia`,
            //   });
            //   container.volumeMounts.push(
            //     {
            //       mountPath: '/fe-pipeline-app/theia',
            //       subPath: 'theia',
            //       name: vol.name
            //     },
            //   );
            // }
          } else if (ws.image === 'vscode') {
            // container.image = 'registry.cn-hangzhou.aliyuncs.com/gitpod/code-server:dev-hand';
            container.image = 'registry.cn-hangzhou.aliyuncs.com/gitpod/code-server:2';
          } else if (ws.image) {
            container.image = ws.image;
          }
          if (ws.envJsonData) {
            const env = JSON.parse(ws.envJsonData);
            for (const key in env) {
              container.env.push({
                name: key.toLocaleUpperCase(),
                value: env[key],
              });
            }
          }
          return resultConfig;
        })();

        kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods.post({
          body: podConfig
        });

        globalSubject.next(
          {
            wsId: workspaceId,
            data: {
              type: 'creating',
              pod: kubePodRes.body,
              workspaceId,
            },
          }
        );

        // @ts-ignore
        const kubePodResStream = await this.kubeClient.api.v1.watch.namespace(this.ns).pods(podName).getObjectStream();
        // const jsonStream = new JSONStream();
        // kubePodResStream.pipe(jsonStream);
        kubePodResStream.on('data', object => {
          const pod = object.object;
          const type = pod.status.phase === 'Running' ? 'created' : 'creating';
          if (type === 'created') {
            try {
              kubePodResStream.destroy();
              (async () => {
                ws = await this.workspaceRepository.findOne(workspaceId);
                ws.state = 'opening';
                ws.podObject = JSON.stringify(pod);
                await this.workspaceRepository.save(ws);
              })();
            } catch (e) {
              console.error(e);
            }
          }
          globalSubject.next(
            {
              wsId: workspaceId,
              data: {
                type,
                pod,
                workspaceId,
              },
            }
          );
        })
      } else {
        // @ts-ignore
        if (ws.state !== 'opening') {
          ws = await this.workspaceRepository.findOne(workspaceId);
          ws.state = 'opening';
          ws.podObject = JSON.stringify(kubePodRes.body);
          await this.workspaceRepository.save(ws);
        }
        globalSubject.next(
          {
            wsId: workspaceId,
            data: {
              type: 'created',
              pod: kubePodRes.body,
              workspaceId,
            },
          }
        );
      }

    } catch (e) {
      ws = ws || await this.workspaceRepository.findOne(workspaceId);
      ws.state = 'error';
      ws.errorMsg = e.message;
      await this.workspaceRepository.save(ws);
      throw e;
    }

    return {
      data: workspaceId,
    };
  }


  async findNodes(options?: any): Promise<any[]> {
    return await this.kubeClient.api.v1.nodes.get(options);
  }

  async findAll(): Promise<Workspace[]> {
    return await this.workspaceRepository.find();
  }

  async findAllByCurrentUser(userId: number): Promise<Workspace[]> {
    return await this.workspaceRepository.find({ userId });
  }

  async save(workspaces: Workspace[]): Promise<Workspace[]> {
    return await this.workspaceRepository.save(workspaces);
  }

  async delete(workspace: Workspace) {
    return await this.workspaceRepository.delete(workspace);
  }

  getWsdir(podName: string) {
    const wsDir = join(getAppHomeDir(), `data/${podName}`);
    return wsDir;
  }

  async deletePod(podName: string) {
    let res: any;
    try{
      res = await promisify(exec)(`kubectl -n ${this.ns} delete po ${podName} --force`);
    } catch(e) {
      console.error(e);
      try{
        res = await this.kubeClient.api.v1.namespace(this.ns).pod(podName).delete({ force: true, gracePeriod: 0 });
      } catch(e2) {
        console.error(e2);
      }
    }
    return res;
  }

  async deleteById(workspaceId: number) {
    const ws = await this.workspaceRepository.findOne(workspaceId);
    ws.state = 'deleting';
    await this.workspaceRepository.save(ws);
    const podName = `ws-pod-${workspaceId}`;
    try {
      await this.deletePod(podName);
    } catch (e) {
      console.error(e);
    }
    try {
      const wsDir = this.getWsdir(podName);
      if (existsSync(wsDir)) {
        await emptyDir(wsDir);
        await rmdir(wsDir);
      }
    } catch (e) {
      console.error(e);
    }
    await this.workspaceRepository.delete(workspaceId);
    return { workspaceId };
  }

  async closeWs(workspaceId: number, isEmptyData?: boolean) {
    const ws = await this.workspaceRepository.findOne(workspaceId);
    if(!ws)  {
      throw new Error(`ws ${workspaceId} is not exist!`);
    }
    if((ws).state !== "opening") {
      throw new Error(`ws ${workspaceId} state ${ws.state} is not correct!`);
    }
    ws.state = 'saved';
    ws.podObject = null;
    await this.workspaceRepository.save(ws);
    const podName = `ws-pod-${workspaceId}`;
    try {
      await this.deletePod(podName);
    } catch (e) {
      console.error(e);
    }
    ws.state = 'saved';
    ws.podObject = null;
    await this.workspaceRepository.save(ws);

    if(isEmptyData) {
      const wsDir = join(getAppHomeDir(), `data/${podName}`);
      try {
        if (existsSync(wsDir)) {
          await emptyDir(wsDir);
          await rmdir(wsDir);
        }
      } catch (e) {
        console.error(e);
      }
    }
    return { workspaceId };
  }
}
