#!/bin/bash
set -e

if [ -d "/app/fe-pipeline-home/vscode-extensions" ]; then
  mkdir -p /app/fe-pipeline-home/data/vscode-extensions
  cp /app/fe-pipeline-home/vscode-extensions/* /app/fe-pipeline-home/data/vscode-extensions/
fi

if [ -d "/app/fe-pipeline-home/theia-plugin" ]; then
  mkdir -p /app/fe-pipeline-home/data/theia-plugin/
  cp /app/fe-pipeline-home/theia-plugin/* /app/fe-pipeline-home/data/theia-plugin/
fi

exec "$@"
