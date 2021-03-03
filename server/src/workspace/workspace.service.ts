import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Client1_13, ApiRoot } from 'kubernetes-client';
import { Workspace } from './workspace.entity';
import { globalSubject } from '../events/events.utils';
import { emptyDir, existsSync, readFileSync, rmdir } from 'fs-extra';
import { Config, getAppHomeDir } from 'src/config/config';
import { join } from 'path';

@Injectable()
export class WorkspaceService {
  async isAlive(workspaceId: number): Promise<any> {
    const podName = `ws-pod-${workspaceId}`;
    let kubePodRes: any = null;

    kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});

    let podObj = kubePodRes.body;
    let podIp = podObj.status.podIP;
    let webUiPort: any = 3000;

    for (const container of podObj.spec.containers) {
      if (container.name === 'web') {
        for (const portObj of container.ports) {
          if (portObj.name === 'web') {
            webUiPort = portObj.containerPort;
            break;
          }
        }
        break;
      }
    }
    let realIP  = podIp;
    let realPort = webUiPort;
    if (process.env.PROXY_BACKEND_HOST) {
      realIP = process.env.PROXY_BACKEND_HOST;
    }
    if (process.env.PROXY_BACKEND_PORT) {
      realPort = process.env.PROXY_BACKEND_PORT;
    }
    try {
      return await axios(
        { url: `http://${realIP}:${realPort}`, headers: { host: `${webUiPort}-${podIp.replace(/\./g,'-')}.ws.${Config.singleInstance().get('hostname')}` }, timeout: 500 } // 
      ).then(
        r => {
          return ({ status: r.status });
        }
      );
    }catch(r) {
      throw new Error(JSON.stringify({ config: r.config, status: r.status, message: r.message  }));
    }
    
  }
  async openWs(workspaceId: number): Promise<any> {

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
      }
    }

    if (ws.state !== 'created' && ws.state !== 'error' && ws.state) {
      throw new Error(`error ws  state: ${ws.state}, wsId: ${workspaceId}`);
    }

    try {

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

        await this.workspaceRepository.save(ws);

        const vol: any = {
          name: 'ws-volume',
        };
        const pvcName = Config.singleInstance().get('existingClaimForWs');
        if(pvcName && typeof pvcName === 'string') {
          vol.persistentVolumeClaim = {
            claimName: pvcName
          };
        } else {
          vol.emptyDir = {};
        }

        // docker run -e PASSWORD=password -p 8080:8080 -it --rm --name vscode codercom/code-server:latest

        const podConfig = (() => {
          let resultConfig = {
            "apiVersion": "v1",
            "kind": "Pod",
            "metadata": {
              "name": podName,
              "labels": {
                "fe-pipeline": "ws",
                "app": "fe-pipeline",
                "ws-podName": "ws-podName",
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
                    privileged: true
                  },
                  "ports": [
                    {
                      "name": "web",
                      "containerPort": 3000,
                      "protocol": "TCP"
                    }
                  ],
                  "env": [
                    {
                      name: 'FE_PIPELINE_GIT_URL',
                      value: ws.gitUrl,
                    }
                  ],
                  // command: [ "node", "/home/theia/src-gen/backend/main.js", "--hostname=0.0.0.0" ],
                  args: ["--port=3000", "--auth=none", "/home/coder/project"],
                  // command: [ "python3", "-m", "http.server", "3000" ],
                  volumeMounts: [
                    {
                      mountPath: '/home/coder/project',
                      subPath: podName,
                      name: vol.name
                    },
                  ],
                  "livenessProbe": {
                    "initialDelaySeconds": 30,
                    "failureThreshold": 1000,
                    "periodSeconds": 20,
                    "httpGet": {
                      "path": "/",
                      "port": 3000
                    }
                  },
                  "readinessProbe": {
                    "httpGet": {
                      "path": "/",
                      "port": 3000
                    }
                  }
                }
              ]
            }
          };

          if (ws.image === 'vscode') {
            const container = resultConfig.spec.containers[0];
            container.image = 'registry.cn-hangzhou.aliyuncs.com/gitpod/code-server:latest'; // "nginx",
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
      ws = await this.workspaceRepository.findOne(workspaceId);
      ws.state = 'error';
      ws.errorMsg = e.message;
      await this.workspaceRepository.save(ws);
      throw e;
    }

    return {
      data: workspaceId,
    };
  }

  private kubeClient: ApiRoot;
  private ns: string;

  constructor(
    @InjectRepository(Workspace)
    private readonly workspaceRepository: Repository<Workspace>,
  ) {
    this.kubeClient = new Client1_13({});
    this.ns = 'fe-pipeline'; // /var/run/secrets/kubernetes.io/serviceaccount/namespace

    try {
      const filePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
      if (existsSync(filePath)) {
        this.ns = readFileSync(filePath).toString();
      }
    } catch (e) { }
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


  async deleteById(workspaceId: number) {
    try {
      const podName = `ws-pod-${workspaceId}`;
      await this.kubeClient.api.v1.namespace(this.ns).pods(podName).delete({});
    } catch (e) {
      console.error(e);
    }
    const podName = `ws-pod-${workspaceId}`;
    const wsDir = join(getAppHomeDir(), `data/${podName}`);
    try{
      if(existsSync(wsDir)) {
        await emptyDir(wsDir);
        await rmdir(wsDir);
      }
    }catch(e){
      console.error(e);
    }
    await this.workspaceRepository.delete(workspaceId);
    return { workspaceId };
  }
}
