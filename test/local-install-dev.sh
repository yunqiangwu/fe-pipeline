#!/usr/bin/env bash

# docker build . -t registry.cn-hangzhou.aliyuncs.com/gitpod/fe-pipeline:1.16.0 --no-cache



helm -n fe-pipeline upgrade --install --create-namespace fe-pipeline ./charts/fe-pipeline --values ./test/values.yaml
