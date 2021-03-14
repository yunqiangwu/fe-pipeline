#!/usr/bin/env bash
# set -euo pipefail

main() {

  cd extensions/theia-fe-pipeline-extensions/theia-fe-pipeline-extensions
  rm -rf theia-fe-pipeline-extensions*.tgz
  yarn pack
  cp theia-fe-pipeline-extensions*.tgz ../../../docker/theia-ide/theia-fe-pipeline-extensions.tgz
  cd ../../../

  # cd "$(dirname "$0")/../.."
  export VERSION=2
  cd docker/theia-ide
  docker build -t "registry.cn-hangzhou.aliyuncs.com/gitpod/theia-ide:$VERSION" -f ./Dockerfile .
  cd ../../
}

main "$@"
