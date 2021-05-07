import { HttpException, Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import fetch from 'node-fetch';
import * as crypto from "crypto";
import { Client1_13, ApiRoot } from 'kubernetes-client';
import * as os from 'os';
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
import { JwtService } from '@nestjs/jwt';

const extract = require('extract-zip');

@Injectable()
export class WorkspaceService {


  private kubeClient = new Client1_13({});
  private ns: string = '';
  private imagePullSecretsName: string = '';
  private image: string = '';
  private managerHost: string = 'fe-pipeline-manager'; // fe-pipeline-2acec-manager

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
      this.managerHost = os.networkInterfaces()['eth0'][0]['address'];
    } catch (e) { }
    try {
      const filePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
      if (existsSync(filePath)) {
        this.ns = readFileSync(filePath).toString();
        (async () => {
          try{
            const kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods(os.hostname()).get({});
            if(kubePodRes) {
              if(kubePodRes?.body?.spec?.imagePullSecrets[0]?.name) {
                this.imagePullSecretsName = kubePodRes.body.spec.imagePullSecrets[0].name;
                this.image = kubePodRes.body.spec.containers[0].image;
              }
            }
          }catch(e) {
            console.error(e);
          }
        })();
      }
      if(!this.ns) {
        this.ns = 'fe-pipeline';
      }
    } catch (e) { }
  }

  async createTempWorkspace(wsData: Workspace): Promise<Workspace> {

    wsData.isTemp = true;
    wsData.image = wsData.image || 'vscode';
    if (wsData.gitpodConfig) {
      wsData.gitpodConfig = typeof wsData.gitpodConfig === 'string' ? wsData.gitpodConfig : JSON.stringify(wsData.gitpodConfig);
    } else {
      wsData.gitpodConfig = null;
    }
    if (wsData.envJsonData) {
      wsData.envJsonData = typeof wsData.envJsonData === 'string' ? wsData.envJsonData : JSON.stringify(wsData.envJsonData);
    } else {
      wsData.envJsonData = null;
    }

    if (wsData.isZipUrl === undefined) {
      wsData.isZipUrl = wsData.gitUrl.includes('.zip');
    }

    const example = new Workspace();

    example.gitUrl = wsData.gitUrl;
    example.isTemp = true;
    example.destroy = false;
    example.image = wsData.image;
    example.userId = wsData.userId;
    if (wsData.name) {
      example.name = wsData.name;
    } else {
      wsData.name = wsData.name || `ws-pod-temp-` + Date.now();
    }

    let ws = await this.workspaceRepository.findOne(example);

    if (!ws) {
      ws = await this.workspaceRepository.save(wsData);
    } else {
      if ((wsData.gitpodConfig && ws.gitpodConfig !== wsData.gitpodConfig) || (wsData.envJsonData && ws.envJsonData !== wsData.envJsonData) || wsData.image !== ws.image) {
        if (ws.state === 'opening' || ws.state === 'pending') {
          this.closeWs(ws.id, true);
        }
        ws = {
          ...ws,
          ...wsData,
          state: 'created',
          podObject: null,
        } as Workspace;
        ws = await this.workspaceRepository.save(ws);
      }
    }

    setTimeout(async () => {
      const shouldDeleteTempWsList = await this.workspaceRepository.createQueryBuilder('workspace')
      .where("workspace.isTemp = 1")
      .andWhere("workspace.startTimestamp is not NULL")
      .andWhere("workspace.destroy != 1")
      .andWhere("workspace.id != :wsId", { wsId: ws.id })
      .andWhere("workspace.userId = :userId", { userId: wsData.userId })
      .orderBy("workspace.startTimestamp", "DESC")
      .skip(1)
      // .limit(100)
      .getMany();
      shouldDeleteTempWsList.forEach((item) => {
        console.log(`deleting ${ item.name } (${item.id})`);
        this.deleteById(item.id);
      });
      // console.log(shouldDeleteTempWsList);
    }, 100);

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
    if (ws.destroy) {
      throw new HttpException(`ws is deleting`, 404);;
    }
    return ws;
  }

  async query(args, user: User): Promise<Workspace[]> {
    if(!user) {
      return [];
    }
    // const wsList = await this.workspaceRepository.find(args);
    const wsList = await this.workspaceRepository.createQueryBuilder('workspace')
      // .where("workspace.id = :id", { id: 18 })
      // .where("workspace.userId = :userId", { userId: user.userId })
      .where("workspace.startTimestamp is not NULL")
      .andWhere("workspace.isTemp = 1")
      .orderBy({
        // "workspace.startTimestamp": "DESC",
        "workspace.startTimestamp": "ASC",
      })
      .getSql();
      // .skip(2)
      // .getMany();

    console.log(wsList);

    return [];

    // return wsList.map(item => { return { ...item, podObject: null } });
  }

  async getRedirectToWsInfo(workspaceId: number, currentUser?: User): Promise<any> {
    let ws = await this.workspaceRepository.findOne(workspaceId);
    // console.log(workspaceId, ws);
    let podObj;
    if (ws && ws.podObject) {
      podObj = JSON.parse(ws.podObject);
    } else {
      if (!ws) {
        throw new HttpException(`ws: ${workspaceId} is not found`, 404);;
      }
      if(ws.state === 'saved') {
        await this.openWs(ws.id, currentUser);
        await new Promise(resolve => {
          setTimeout(() => resolve(null), 3000);
        });
        let res = {} as any;
        try {
          res = await this.isAlive(workspaceId);
        } catch (e) {
          console.error(e);
          // throw e;
        }
        ws = await this.workspaceRepository.findOne(workspaceId);
      }
      const podName = await this.getPodName(ws);
      const kubePodRes: any = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});
      podObj = kubePodRes.body;
      if (ws && podObj) {
        ws.podObject = JSON.stringify(podObj);
        await this.workspaceRepository.save(ws);
      }
    }

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
        for (const envObj of container.env) {
          if (envObj.name === 'PASSWORD') {
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
        { method: 'get', headers: { Host: wsHost }, timeout: 3000 } // 
      ).then(
        r => {
          if (r.status >= 200 && r.status < 500) {
            return ({ status: r.status, wsHost, password });
          } else {
            return Promise.reject({ status: r.status, wsHost })
          }
        },
        (err) => {
          // console.log(err);
          if (err.response && err.response.status >= 400 && err.response.status < 500) {
            console.log(err.response.data);
            const hashKey = crypto.createHash("sha256").update(password).digest("hex");
            return Promise.resolve({ status: err.response.status, wsHost, password: hashKey });
          } else {
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

  async getPodName(ws: Workspace) {
    return `ws-pod-${ws.id}-${ws.currentPodId || 1}`;
  }

  async getWsDirName(ws: Workspace) {
    return `ws-pod-${ws.id}`;
  }

  async openWs(workspaceId: number, currentUser?: User): Promise<any> {

    if (!workspaceId) {
      throw new Error(`not workspaceId: ${workspaceId}`);
    }

    let ws = await this.workspaceRepository.findOne(workspaceId);

    if (!ws) {
      throw new Error(`not find ws: ${ws}, wsId: ${workspaceId}`);
    }

    if (ws.destroy) {
      throw new Error(`not find ws: ${ws}, wsId: ${workspaceId}`);
    }

    let podName = await this.getPodName(ws);
    const wsDirName = await this.getWsDirName(ws);

    if (ws.state === 'opening' || ws.state === 'pending') {
      try {
        const kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});
        const lastState = ws.state;
        const type = kubePodRes.body.status.phase === 'Running' ? 'created' : 'creating';
        if (type === 'created') {
          ws.state = 'opening';
        }
        if (lastState !== ws.state) {
          ws.podObject = JSON.stringify(kubePodRes.body);
          await this.workspaceRepository.save(ws);
        }
        globalSubject.next(
          {
            wsId: workspaceId,
            data: {
              type,
              pod: kubePodRes.body,
              workspaceId,
            },
          }
        );
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
      let projectDirname = '';
      let gitpodConfig = ws.gitpodConfig ? JSON.parse(ws.gitpodConfig) : null;
      const contextToDir = await this.getWsdir(ws);

      if(ws.gitUrl !== 'none') {
        if (ws.gitUrl) {
          if (!isURL(ws.gitUrl)) {
            throw new Error(`${ws.gitUrl} is not correct url!`);
          }
          const existContextDir = existsSync(contextToDir);
          if (ws.state !== "saved" || !existContextDir) {
            if (existContextDir) {
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
              if (ta) {
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
              } catch (e) {
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
              } catch (e) {
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
                console.log(`clone dir ${cloneUrl} to ${contextToDir}`);
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
                  // await promisify(exec)(`cd ${contextToDir} \n git clone ${cloneUrl}`);

                  let _stdout = '', _stderr = '';

                  const res: any = await new Promise((resolve, reject) => {
                    const p = exec(`git clone ${cloneUrl}`, { cwd: contextToDir, shell: 'bash' }, (err, stdout, stderr) => {
                      if(err) {
                        reject(err);
                        return;
                      }
                      _stdout = stdout;
                      _stderr = stderr;
                      resolve({
                        stdout, stderr,
                      });
                    });
                    p.stdout?.on('data', (chunk) => {
                      _stdout  += chunk.toString();
                    });
                    p.stderr?.on('data', (chunk) => {
                      _stderr  += chunk.toString();
                    });
                    // p.stdout?.on('end', (chunk) => {
                    // 	_stdout  += chunk.toString();
                    // });
                  });

                  // globalSubject.next(
                  //   {
                  //     wsId: workspaceId,
                  //     data: {
                  //       type: 'clone',
                  //       message: _stdout,
                  //       workspaceId,
                  //     },
                  //   }
                  // );

                } catch (e) {
                  console.error(e);
                  throw new HttpException(`当前账号 ${ta.threeAccountUsername} 无访问 ${ws.gitUrl} 的权限!`, 403);
                }
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
              if (dirOrFileName.startsWith('.')) {
                return false;
              }
              let stat = lstatSync(join(contextToDir, dirOrFileName))
              if (stat.isDirectory() === true) {
                return true;
              }
            });
          }
        }
  
        if (existsSync(contextToDir)) {
          projectDirname = ((await promisify(readdir)(contextToDir)) as string[]).find(dirOrFileName => {
            if (dirOrFileName.startsWith('.')) {
              return false;
            }
            let stat = lstatSync(join(contextToDir, dirOrFileName))
            if (stat.isDirectory() === true) {
              return true;
            }
          });
  
          if (projectDirname) {
            const gitpodYamlPath = join(contextToDir, projectDirname, '.gitpod.yml');
            if (projectDirname && existsSync(gitpodYamlPath)) {
              const gitpodYmlContent = readFileSync(gitpodYamlPath).toString();
              gitpodConfig = yaml.parse(gitpodYmlContent);
            }
          }
        }
        if (!projectDirname) {
          if (ws.envJsonData) {
            console.log(ws.envJsonData);
            const obj = JSON.parse(ws.envJsonData)
            projectDirname = obj.PROJECT_DIR_NAME;
          }
          if (!projectDirname) {
            projectDirname = 'project';
          }
          const projectDir = join(contextToDir, projectDirname);
          mkdirpSync(projectDir)
        }
      }

      const envObj = ws.envJsonData ? JSON.parse(ws.envJsonData) : null;

      const FE_PIPELINE_WORK_DIR = ((envObj && envObj.FE_PIPELINE_WORK_DIR) ? envObj.FE_PIPELINE_WORK_DIR : join(`/workspace`, projectDirname || 'project') ).replace(/\\/g, '/');

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

        ws.password = (Math.random().toString(16).substr(2).concat((+new Date().getTime()).toString(16)).concat(Math.random().toString(16).substr(2, 8))).padEnd(32, '0').substr(0, 32).replace(/([\w]{8})([\w]{4})([\w]{4})([\w]{4})([\w]{12})/, '$1$2$3$4$5');
        if (!ws.currentPodId) {
          ws.currentPodId = 1;
        } else {
          ws.currentPodId = ws.currentPodId + 1;
        }
        ws.startTimestamp = new Date().getTime();

        podName = await this.getPodName(ws);

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
                "ws-id": `${workspaceId}`,
              },
            },
            "spec": {
              automountServiceAccountToken: false,
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
                      name: 'FE_PIPELINE_AUTO_CLOSE',
                      value: 'enable',
                    },
                    {
                      name: 'FE_PIPELINE_WS_ID',
                      value: `${ws.id}`,
                    },
                    {
                      name: 'FE_PIPELINE_PASSWORD',
                      value: ws.password,
                    },
                    {
                      name: 'FE_PIPELINE_MANAGE_API_HOST',
                      value: `http://${this.managerHost}:${3000}`,
                    },
                    {
                      name: 'FE_PIPELINE_WORK_DIR',
                      value: FE_PIPELINE_WORK_DIR,
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
                  // ...(ws.isTemp ? [] : [`--home //${Config.singleInstance().get('hostname')}${Config.singleInstance().get('fe-path')}app/workspaces`]), 
                  args: [`--port=${webPort}`, "--auth=password", FE_PIPELINE_WORK_DIR],
                  // command: [ "python3", "-m", "http.server", "3000" ],
                  volumeMounts: [
                    ...(ws.gitUrl === 'none' ? [] : [
                      {
                        mountPath: '/workspace',
                        subPath: wsDirName,
                        name: vol.name
                      },
                    ]),
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
                  ],
                  "livenessProbe": {
                    "initialDelaySeconds": 20,
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
          if (gitpodConfig) {
            if (gitpodConfig.tasks) {
              container.env.push({
                name: 'GITPOD_TASKS',
                value: JSON.stringify(gitpodConfig.tasks),
              });
            }
            if (gitpodConfig.ports) {
              container.env.push({
                name: 'GITPOD_PORTS',
                value: JSON.stringify(gitpodConfig.ports),
              });
            }
          }
          if (currentUser) {
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
          if(ws.imagePullSecretsName) {
            (resultConfig as any).spec.imagePullSecretsName = [{
              name: ws.imagePullSecretsName,
            }]
          }

          const imageName = Config.singleInstance().get(`ideImages.${ws.image}`);
          if(imageName) {
            container.image = imageName;
            if(this.imagePullSecretsName && this.image && container.image.split('/')[0] === this.image.split('/')[0] ) {
              (resultConfig.spec as any).imagePullSecrets = [
                {
                  name: this.imagePullSecretsName,
                },
              ]
            }
          } else {
            if (ws.image === 'theia-full') {
              container.image = 'registry.cn-hangzhou.aliyuncs.com/gitpod/theia-ide:2';
            } else if (ws.image === 'vscode') {
              container.image = 'registry.cn-hangzhou.aliyuncs.com/gitpod/code-server:2';
              // container.args.push('--disable-update-check');
            } else if (ws.image) {
              container.image = ws.image;
            }
          }
          
          if (ws.envJsonData) {
            const env = JSON.parse(ws.envJsonData);
            for (const key in env) {
              const envName = key.toLocaleUpperCase();
              const existEnvObj = container.env.find(item => item.name === envName);
              if (existEnvObj) {
                existEnvObj.value = env[key];
              } else {
                container.env.push({
                  name: envName,
                  value: env[key],
                });
              }
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
        const kubePodResStream = await this.kubeClient.api.v1.watch.namespace(this.ns).pod(podName).getObjectStream();
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
                ws.podIp = pod.status.podIP;
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
          ws.podIp = kubePodRes.body.status.podIP;
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

    // console.log(`imagePullSecretsName: ${this.imagePullSecretsName}`);
    
    return await this.workspaceRepository.find({ userId, destroy: false });
  }

  async save(workspaces: Workspace[], currentUser: User): Promise<Workspace[]> {

    const currentNumber = await this.workspaceRepository.createQueryBuilder('workspace')
      .where("workspace.userId = :userId", { userId: currentUser.userId })
      .andWhere("(workspace.isTemp != 1 or workspace.isTemp is NULL)")
      .andWhere("workspace.destroy != 1")
      // .andWhere("workspace.state != 'saved'")
      .getCount();

      console.log(`当前工作空间的数量: ${currentNumber}`);

    if(currentNumber >= 5) {
      throw new Error(`您当前已经有 5 个持久化工作空间,每个用户最多同时存在 5 个工作空间,如果您想继续创建,需要先释放掉其他的工作空间`);
    }
    
    return await this.workspaceRepository.save([workspaces[0]]);
  }

  async delete(workspace: Workspace) {
    return await this.workspaceRepository.delete(workspace);
  }

  async getWsdir(ws: Workspace) {
    const wsDir = join(getAppHomeDir(), `data/${await this.getWsDirName(ws)}`);
    return wsDir;
  }

  async deletePod(podName: string) {
    let res: any;

    try {
      const pod = this.kubeClient.api.v1.namespace(this.ns).pod(podName);
      await pod.get({});
      res = await pod.delete({ force: true, gracePeriod: 0 });
      let count = 0;
      while (count++ < 100) {
        await pod.get({});
        await new Promise(resolve => {
          setTimeout(() => resolve(null), 2000);
        });
      }
    } catch (e) {
      throw e;
    }

    return res;
  }

  async deleteById(workspaceId: number) {
    const ws = await this.workspaceRepository.findOne(workspaceId);
    if (ws.state === 'deleting') {
      // await this.workspaceRepository.delete(workspaceId);
      return { workspaceId };
    }

    ws.state = 'deleting';
    ws.destroy = true;

    await this.workspaceRepository.save(ws);

    setTimeout(() => {
      this.realDeleteWs(ws);
    }, 0)

    return { workspaceId };

  }

  async realDeleteWs(ws){

    const podName = await this.getPodName(ws);
    try {
      await this.deletePod(podName);
    } catch (e) {
      console.error(e);
    }

    if(ws.gitUrl !== 'none') {
      try {
        const wsDir = await this.getWsdir(ws);
        if (existsSync(wsDir)) {
          await emptyDir(wsDir);
          await rmdir(wsDir);
        }
      } catch (e) {
        console.error(e);
      }
    }
    await this.workspaceRepository.delete(ws.id);

  }

  async closeWs(workspaceId: number, isEmptyData?: boolean) {

    const ws = await this.workspaceRepository.findOne(workspaceId);
    if (!ws) {
      throw new Error(`ws ${workspaceId} is not exist!`);
    }
    if ((ws).state !== "opening") {
      throw new Error(`ws ${workspaceId} state ${ws.state} is not correct!`);
    }
    ws.state = 'saving';
    ws.startTimestamp = 0;
    ws.podObject = null;
    await this.workspaceRepository.save(ws);
    const podName = await this.getPodName(ws);
    try {
      await this.deletePod(podName);
    } catch (e) {
      console.error(e);
    }
    ws.state = 'saved';
    ws.podObject = null;
    ws.podIp = null;
    await this.workspaceRepository.save(ws);

    if (isEmptyData) {
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
