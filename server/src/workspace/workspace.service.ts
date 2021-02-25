import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client1_13, ApiRoot } from 'kubernetes-client';
import { Workspace } from './workspace.entity';
import { globalSubject } from '../events/events.utils';
import { existsSync, readFileSync } from 'fs-extra';

@Injectable()
export class WorkspaceService {
  async isAlive(workspaceId: number): Promise<any> {
    const podName = `ws-pod-${workspaceId}`;
    let kubePodRes: any = null;
    kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});
    
    const podObj = kubePodRes.body;
    const podIp = podObj.status.podIP;
    let webUiPort = 3000;
  
    for(const container of podObj.spec.containers ) {
      if(container.name ===  'web') {
        for(const portObj of container.ports) {
          if(portObj.name === 'web') {
            webUiPort = portObj.containerPort;
            break;
          }
        }
        break;
      }
    }
    
    return `http://${podIp}:${webUiPort}`;
  }
  async openWs(workspaceId: number): Promise<any> {

    if(!workspaceId) {
      throw new Error(`not workspaceId: ${workspaceId}`);
    }

    let ws = await this.workspaceRepository.findOne(workspaceId);

    if(!ws) {
      throw new Error(`not find ws: ${ws}, wsId: ${workspaceId}`);
    }

    if(ws.state === 'pending') {
      return {
        data: workspaceId,
      };
    }

    if(ws.state === 'opening') {
      return {
        data: workspaceId,
      };
    }

    if(ws.state !== 'created' && ws.state !== 'error' && ws.state) {
      throw new Error(`error ws  state: ${ws.state}, wsId: ${workspaceId}`);
    }

    try{

      const podName = `ws-pod-${workspaceId}`;
      let kubePodRes: any = null;
      
      try{
        kubePodRes = await this.kubeClient.api.v1.namespace(this.ns).pods(podName).get({});
      } catch(errByGet){
        if(errByGet.statusCode === 404) {
          kubePodRes = null;
        } else {
          throw errByGet;
        }
      }

      if(!kubePodRes || (kubePodRes.statusCode > 299 && kubePodRes.statusCode < 200) ) {

        ws.state = 'pending';

        await this.workspaceRepository.save(ws);

        // docker run -e PASSWORD=password -p 8080:8080 -it --rm --name vscode codercom/code-server:latest
        
        const podConfig = (() => {
          if(ws.image === 'vscode') {
            return {
              "apiVersion": "v1",
              "kind": "Pod",
              "metadata": {
                "name": podName,
                "labels": {
                  "ws-podName": "ws-podName",
                  "ws-pod": podName,
                  "ws-id": workspaceId,
                },
              },
              "spec": {
                volumes: [
                  {
                    name: 'ws-volume',
                    emptyDir: {},
                  },
                ],
                "containers": [
                  {
                    volumeMounts: [
                      {
                        mountPath: '/home/coder/project',
                        name: 'ws-volume'
                      },
                    ],
                    "name": "web",
                    "image":  'registry.cn-hangzhou.aliyuncs.com/gitpod/code-server:latest',// "nginx",
                    "securityContext": {
                      privileged: true
                    },
                    "env": [{
                      name: 'PASSWORD',
                      value: '',
                    }],
                    args: ["--port", "3000", "--auth", "none", "/home/coder/project"],
                    "ports": [
                      {
                        "name": "web",
                        "containerPort": 3000,
                        "protocol": "TCP"
                      }
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
          }

          return {
            "apiVersion": "v1",
            "kind": "Pod",
            "metadata": {
              "name": podName,
              "labels": {
                "ws-podName": "ws-podName",
                "ws-pod": podName,
                "ws-id": workspaceId,
              },
            },
            "spec": {
              volumes: [
                {
                  name: 'ws-volume',
                  emptyDir: {},
                },
              ],
              "containers": [
                {
                  "name": "web",
                  "image":  'registry.cn-hangzhou.aliyuncs.com/gitpod/theia-app:dev-hand',// "nginx",
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
                  volumeMounts: [
                    {
                      mountPath: '/home/project',
                      name: 'ws-volume'
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
          const type =  pod.status.phase === 'Running' ? 'created' : 'creating';
          if(type === 'created') {
            try{
              kubePodResStream.destroy();
              (async () => {
                ws = await this.workspaceRepository.findOne(workspaceId);
                ws.state = 'opening';
                ws.podObject = JSON.stringify(pod);
                await this.workspaceRepository.save(ws);
              })();
            }catch(e) {
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
        if(ws.state !== 'opening') {
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

    } catch(e) {
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


    this.ns = 'default'; // /var/run/secrets/kubernetes.io/serviceaccount/namespace

    try{
      const filePath = '/var/run/secrets/kubernetes.io/serviceaccount/namespace';
      if(existsSync(filePath)) {
        this.ns = readFileSync(filePath).toString();
      } 
    }catch(e){}
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
    try{
      const podName = `ws-pod-${workspaceId}`;
      await this.kubeClient.api.v1.namespace(this.ns).pods(podName).delete({});
    } catch (e) {
      console.error(e);
    }
    return await this.workspaceRepository.delete(workspaceId);
  }
}
