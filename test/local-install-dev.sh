#!/usr/bin/env bash

# docker build . -t registry.cn-hangzhou.aliyuncs.com/gitpod/fe-pipeline:1.16.0 --no-cache

# kubectl get po -l fe-pipeline=ws-manager -o jsonpath="{.items[0].spec.imagePullSecrets[0].name}"

envsubst <./test/pvc-for-win.yaml | kubectl -n fe-pipeline apply -f -

helm -n fe-pipeline upgrade --install --create-namespace fe-pipeline ./charts/fe-pipeline --values ./test/values.yaml
