#!/usr/bin/env bash


cd theia-extensions/theia-fe-pipeline-extensions

mkdir -p ../../fe-pipeline-home/data/theia-extensions/

npm pack && mv ./theia-fe-pipeline-extensions-*.tgz ../../fe-pipeline-home/data/theia-extensions/

cd ../../
