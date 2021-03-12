#!/bin/bash
set -e

if [ -d "/app/fe-pipeline-home/vscode-extensions" ]; then
  mkdir -p /app/fe-pipeline-home/data/vscode-extensions
  cp /app/fe-pipeline-home/theia-extensions/* /app/fe-pipeline-home/data/vscode-extensions/
fi

if [ -d "/app/fe-pipeline-home/theia-extensions" ]; then
  mkdir -p /app/fe-pipeline-home/data/theia-extensions/
  cp /app/fe-pipeline-home/theia-extensions/* /app/fe-pipeline-home/data/theia-extensions/
fi

exec "$@"
