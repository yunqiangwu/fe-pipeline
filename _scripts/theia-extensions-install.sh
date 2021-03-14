#!/usr/bin/env bash


cd theia-plugin/theia-fe-pipeline-plugin

mkdir -p ../../fe-pipeline-home/data/theia-extensions/

npm run build && mv ./*.theia ../../fe-pipeline-home/data/theia-plugin

cd ../../
