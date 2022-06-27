#!/usr/bin/env bash


export WS_PWD_SCRIPT_SCRIPT=$(cd "$(dirname "$0")";pwd)
export WS_PWD_SCRIPT=$(cd "$(dirname "$WS_PWD_SCRIPT_SCRIPT")";pwd)

echo WS_PWD_SCRIPT: $WS_PWD_SCRIPT

envsubst < ${WS_PWD_SCRIPT_SCRIPT}/dev-fe-pipeline.yaml | kubectl -n fe-pipeline apply -f - # -o yaml --dry-run=client

# sleep 10

kubectl -n fe-pipeline exec -ti deploy/dev-fe-pipeline-deployment -- bash

# kubectl -n fe-pipeline exec -ti deploy/fe-pipeline -- bash

docker run --privileged --name=rancher-server -d --restart=unless-stopped -p 32080:80 -v /d/private/opt/rancher:/var/lib/rancher -p 32443:443 rancher/rancher

# docker build . -t registry.cn-hangzhou.aliyuncs.com/jajabjbj/fe-pipeline:1.16.0 && docker push registry.cn-hangzhou.aliyuncs.com/jajabjbj/fe-pipeline:1.16.0

# helm -n fe-pipeline upgrade --install --create-namespace fe-pipeline ./charts/fe-pipeline --set service.enabled=true --set hostname=fe-pipeline.localhost --set ingress.enabled=true --set persistence.enabled=true --set persistence.existingClaim=fe-pipeline-pvc 
# helm -n fe-pipeline upgrade --install --create-namespace fe-pipeline ./charts/fe-pipeline --values ./test/values.yaml

# kubectl -n fe-pipeline apply -f test/test-nginx/proxy-deployment.yaml

# kubectl -n fe-pipeline exec -ti deploy/fe-pipeline-proxy -- nginx -s reload

# docker run -e GIT_USER=3 -e GIT_EMAIL=a@q.c -p 8080:8080 -v `pwd`/dist:/workspace --rm -ti --name xxx -p 23000:23000 registry.cn-hangzhou.aliyuncs.com/jajabjbj/theia-ide:2 --port=23000 --auth=none

# sudo kubectl -n nginx-ingress port-forward deploy/nginx-ingress-nginx-ingress 80:80

# kubectl -n fe-pipeline exec -ti deploy/fe-pipeline -- bash

# docker run -d --name minio -p 9000:9000 minio/minio server /data

# helm -n fe-pipeline template --create-namespace fe-pipeline ./charts/fe-pipeline --values ./test/values.yaml > deployChart.yaml