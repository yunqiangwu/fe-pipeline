#!/usr/bin/env bash

export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 #macos/linux
# set PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=1 #windows

set -e # 报错不继续执行
yarn
yarn build


export CICD_EXECUTION_SEQUENCE=${BUILD_NUMBER:-1}

docker build . -t  harbor.hft.jajabjbj.top:30088/hft/fe-pipeline:${CICD_EXECUTION_SEQUENCE}
docker push harbor.hft.jajabjbj.top:30088/hft/fe-pipeline:${CICD_EXECUTION_SEQUENCE}

envsubst '${CICD_EXECUTION_SEQUENCE}' < deployment.yaml > _deployment.yaml

kubectl --context huawei apply -f _deployment.yaml
