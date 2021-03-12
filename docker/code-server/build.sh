#!/usr/bin/env bash
# set -euo pipefail

main() {
  # cd "$(dirname "$0")/../.."
  export VERSION=2
  cd docker/code-server
  docker build -t "registry.cn-hangzhou.aliyuncs.com/gitpod/code-server:$VERSION" -f ./Dockerfile .
  cd ../../
}

main "$@"
