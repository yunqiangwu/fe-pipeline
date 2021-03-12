#!/usr/bin/env bash


cd extensions/fe-pipeline-extensions

mkdir -p ../../fe-pipeline-home/data/vscode-extensions/

vsce package --out ../../fe-pipeline-home/data/vscode-extensions/

cd ../../
