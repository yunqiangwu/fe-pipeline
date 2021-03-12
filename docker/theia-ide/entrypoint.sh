#!/bin/bash

set -eu

if [ -d "/fe-pipeline-app/theia-plugin" ]; then
#   cd /home/theia
  for EXTENSIONS_FILE in /fe-pipeline-app/theia-extensions/*.theia; do
    echo --install-plugin $EXTENSIONS_FILE

    # CUR_DIR_NAME=`basename $EXTENSIONS_FILE`
    # CUR_DIR_NAME=`node -e "console.log('$CUR_DIR_NAME'.replace(/\.theia$/, ''))"`
    # mkdir ./node_modules/$CUR_DIR_NAME
    # tar -zxvf $EXTENSIONS_FILE -C ./node_modules/$CUR_DIR_NAME --strip-components=1

    # cd ./node_modules/$CUR_DIR_NAME && yarn install --production
    # cd ../../

    # node -e "(()  =>  { const data = require('./package.json'); data.dependencies['$CUR_DIR_NAME']=(require('$CUR_DIR_NAME/package.json').version.trim()); console.log(JSON.stringify(data, null, 2)) })()" > package.json
    # yarn add $EXTENSIONS_FILE
  done
fi

exec node /home/theia/src-gen/backend/main.js --plugins=local-dir:/fe-pipeline-app/theia-plugin /home/project --hostname=0.0.0.0 $@

# dumb-init /usr/bin/code-server "$@"
