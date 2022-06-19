# fe-pipeline

前端部署系统.

## 在线演示

- [http://fe-pipeline.open-front.hand-china.com/](http://fe-pipeline.open-front.hand-china.com/)

<img width="1918" alt="image" src="https://user-images.githubusercontent.com/26475774/174489382-0dbabbf1-7a80-4b3b-a97c-d1b76c6ea6e2.png">
<img width="1910" alt="image" src="https://user-images.githubusercontent.com/26475774/174489388-b9752718-f974-488f-bc5b-98e5e9f7196b.png">
<img width="1916" alt="image" src="https://user-images.githubusercontent.com/26475774/174489396-d0c6003d-6e95-4933-b5ba-b4854a754356.png">



## 安装

```bash

git clone https://github.com/yunqiangwu/fe-pipeline.git

cd fe-pipeline

helm -n fe-pipeline upgrade --install --create-namespace fe-pipeline ./charts/fe-pipeline \
  --set hostname=fe-pipeline.localhost \
  --set service.enabled=true \
  --set ingress.enabled=true \
  --set persistence.enabled=true \
  --set persistence.existingClaim=fe-pipeline-pvc # 需要提前创建 pvc

```


## 配置

### fe-pipeline 参数

| Parameter                          | Description                                                                           | Default             |
| ---------------------------------- | ------------------------------------------------------------------------------------- | ------------------- |
| hostname                    | 主域名                                                      | `fe-pipeline.localhost`              |
| service.enabled             | 启用svc                                             | `false`              |
| ingress.enabled             | 启用 ingress                                                      | `false`              |
| persistence.enabled         | 数据持久化                                                      | `false`              |
| persistence.existingClaim   | pvc 数据卷                                                      |               |
| authProviders   | 第三方账号登录                                                      |               |

默认配置

```yaml
hostname: fe-pipeline.localhost
service.enabled: true
ingress.enabled: true
persistence.enabled: true
persistence.existingClaim: fe-pipeline-pvc

authProviders:
  - id: "GitLab"
    host: "code.choerodon.com.cn"
    protocol: "https"
    type: "GitLab"
    oauth:
      args:
        response_type: code
        scope: 'read_user api'
      clientId: "b5a73be21b138bc526c7ac4eba9f1fb8774cd9b81e6620f4f9e390614f1522fa"
      clientSecret: "a050c67bbbc87b54c273ea172a1816461e0bb7157b69559d4412eb8432d5847a"
      callBackUrl: "/oauth/authorize"
      settingsUrl: "https://code.choerodon.com.cn/profile/applications"

  - id: "Github"
    host: "github.com"
    protocol: "https"
    type: "GitHub"
    oauth:
      args:
        scope: user:email
      clientId: "c7eab48221991b2c7063"
      clientSecret: "5da37a39dc724dadc372924755f573ad746c1970"
      callBackUrl: "/login/oauth/authorize"
      settingsUrl: "https://github.com/settings/connections/applications/4f5afda4c1420c3e0dd4"

  - id: "Choerodon"
    host: "api.choerodon.com.cn"
    protocol: "https"
    type: "Choerodon"
    oauth:
      args:
        response_type: token
      clientId: "localhost"
      callBackUrl: "/oauth/oauth/authorize"

  - id: "open-hand"
    host: "gateway.open.hand-china.com"
    protocol: "https"
    type: "open-hand"
    oauth:
      args:
        response_type: token
      clientId: "hsop-app"
      callBackUrl: "/oauth/oauth/authorize"

  - id: corallium-uat
    host: 192.168.17.180:8080
    protocol: http
    type: open-hand
    oauth:
      args:
        response_type: token
      clientId: localhost
      callBackUrl: /oauth/oauth/authorize

```
