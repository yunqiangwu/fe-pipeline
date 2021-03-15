#!/bin/bash
set -e

if [ -d "/app/fe-pipeline-home/vscode-extensions" ]; then
  rm -rf /app/fe-pipeline-home/data/vscode-extensions
  mkdir -p /app/fe-pipeline-home/data/vscode-extensions
  cp /app/fe-pipeline-home/vscode-extensions/* /app/fe-pipeline-home/data/vscode-extensions/
fi

if [ -d "/app/fe-pipeline-home/theia-plugin" ]; then
  rm -rf /app/fe-pipeline-home/data/theia-plugin/
  mkdir -p /app/fe-pipeline-home/data/theia-plugin/
  cp /app/fe-pipeline-home/theia-plugin/* /app/fe-pipeline-home/data/theia-plugin/
fi

# if [ -d "/app/fe-pipeline-home/theia" -a ! -d "/app/fe-pipeline-home/data/theia"  ]; then
#   rm -rf /app/fe-pipeline-home/data/theia/
#   mkdir -p /app/fe-pipeline-home/data/theia/
#   cp -r /app/fe-pipeline-home/theia/* /app/fe-pipeline-home/data/theia/
# fi

exec "$@"
