#!/usr/bin/env bash
# set -euo pipefail

main() {

  # cp -r extensions/theia-fe-pipeline-extensions/theia-fe-pipeline-extensions ./docker/theia-ide/

  # cd "$(dirname "$0")/../.."
  export VERSION=2
  cd docker/theia-ide
  docker build -t "registry.cn-hangzhou.aliyuncs.com/gitpod/theia-ide:$VERSION" -f ./Dockerfile .
  cd ../../


}

main "$@"
