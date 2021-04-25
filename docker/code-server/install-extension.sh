#!/usr/bin/env bash

if [ -d "/workspace/extension" ]; then

for EXTENSIONS_FILE in /workspace/extension/*.vsix; do
  echo --install-extension $EXTENSIONS_FILE
  /usr/bin/code-server --extensions-dir=/usr/lib/code-server/lib/vscode/extensions --install-extension $EXTENSIONS_FILE
done

rm -rf /workspace/extension

fi