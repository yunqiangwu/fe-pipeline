#!/bin/bash

set -eu

if [ x"$GIT_USER" != "x" ]; then
  git config --global user.name "$GIT_USER"
fi

if [ x"$GIT_EMAIL" != "x" ]; then
  git config --global user.email "$GIT_EMAIL"
fi

if [ ! -d "/workspace/.user-code-data-dir" ]; then
  sudo chown -R theia:theia /workspace
fi

# sudo chown -R theia:theia /workspace

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

# if [ -d "/fe-pipeline-app/theia" ]; then
#   if [ -d "/home/theia/src-gen" ]; then
#     if [ x"$THEIA_HOME" = "x" ]; then
#       rm -rf /home/theia/lib /home/theia/src-gen /home/theia/node_modules /home/theia/plugins
#       cp -r /fe-pipeline-app/theia/* /home/theia/
#     fi
#   fi
# fi

# if [ x"$THEIA_HOME" != "x" ]; then
#   cd $THEIA_HOME
# fi

# exec node /home/theia/src-gen/backend/main.js --plugins=local-dir:/fe-pipeline-app/theia-plugin /home/project --hostname=0.0.0.0 $@

dumb-init node /home/theia/src-gen/backend/main.js --user-data-dir=/workspace/.user-code-data-dir --plugins=local-dir:/fe-pipeline-app/theia-plugin --hostname=0.0.0.0 $@
