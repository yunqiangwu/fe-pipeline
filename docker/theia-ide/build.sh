#!/usr/bin/env bash
# set -euo pipefail

main() {
  # cd "$(dirname "$0")/../.."
  export VERSION=2
  cd docker/theia-ide
  docker build -t "registry.cn-hangzhou.aliyuncs.com/gitpod/theia-ide:$VERSION" -f ./Dockerfile .
  cd ../../
}

main "$@"
