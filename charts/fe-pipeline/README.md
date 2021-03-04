# fe-pipeline

在线 vscode 服务.

## 在线演示

- [http://fe-pipeline.open-front.hand-china.com/](http://fe-pipeline.open-front.hand-china.com/)

## 安装

```bash

git clone https://github.com/yunqiangwu/fe-pipeline.git

cd fe-pipeline

helm -n fe-pipeline upgrade --install --create-namespace fe-pipeline ./charts/fe-pipeline \
  --set hostname=fe-pipeline.localhost \
  --set service.enabled=true \
  --set ingress.enabled=true \
  --set persistence.enabled=true \
  --set persistence.existingClaim=fe-pipeline-pvc

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

默认配置

```yaml
hostname: fe-pipeline.localhost
service.enabled: true
ingress.enabled: true
persistence.enabled: true
persistence.existingClaim: fe-pipeline-pvc
```
