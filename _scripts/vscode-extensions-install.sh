#!/usr/bin/env bash


cd extensions/fe-pipeline-extensions

mkdir -p ../../fe-pipeline-home/data/vscode-extensions/

vsce package --out ../../fe-pipeline-home/data/vscode-extensions/

# mkdir -p ../../fe-pipeline-home/data/theia-plugin/

# vsce package --out ../../fe-pipeline-home/data/theia-plugin/

cd ../../
