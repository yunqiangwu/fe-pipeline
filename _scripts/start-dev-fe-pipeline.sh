#!/usr/bin/env bash


export WS_PWD_SCRIPT_SCRIPT=$(cd "$(dirname "$0")";pwd)
export WS_PWD_SCRIPT=$(cd "$(dirname "$WS_PWD_SCRIPT_SCRIPT")";pwd)

echo WS_PWD_SCRIPT: $WS_PWD_SCRIPT

envsubst < ${WS_PWD_SCRIPT_SCRIPT}/dev-fe-pipeline.yaml | kubectl -n fe-pipeline apply -f - # -o yaml --dry-run=client

# sleep 10

kubectl -n fe-pipeline exec -ti deploy/dev-fe-pipeline-deployment -- bash


# docker build . -t registry.cn-hangzhou.aliyuncs.com/gitpod/fe-pipeline:1.16.0 && docker push registry.cn-hangzhou.aliyuncs.com/gitpod/fe-pipeline:1.16.0

# helm -n fe-pipeline upgrade --install --create-namespace fe-pipeline . --set service.enabled=true --set ingress.enabled=true