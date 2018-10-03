#!/bin/bash

LAMBDA_DIR="lambdas"
PROJECT_ROOT="github.com/ojkelly/linnet"
BIN_OUT_DIR="lib/lambdas/bin"
ZIP_DIR="lib/lambdas/zip"
export GOOS=linux
export GOARCH=amd64

echo "Creating ${BIN_OUT_DIR}"
rm -rf ${BIN_OUT_DIR}
mkdir -p ${BIN_OUT_DIR}

echo "Creating ${ZIP_DIR}"
rm -rf ${ZIP_DIR}
mkdir -p ${ZIP_DIR}

echo "Building Lambdas"
for dir in $LAMBDA_DIR/*; do
  lambda=$(basename ${dir})
    if [ -d "${dir}" ] && [ "${lambda}" != "util" ]; then
      echo "- Lambda [${lambda}]: Compiling"
      # Make a dir for our go app
      mkdir -p ${BIN_OUT_DIR}/${lambda}/
      # Build the go app for lambda
      echo "${PROJECT_ROOT}/${LAMBDA_DIR}/${lambda}"
      go build  -o ${BIN_OUT_DIR}/${lambda}/main \
        ${PROJECT_ROOT}/${LAMBDA_DIR}/${lambda}
      # Zip up the lambda
      echo "- Lambda [${lambda}]: Compressing"

      zip -j ${ZIP_DIR}/${lambda}.zip ${BIN_OUT_DIR}/${lambda}/main

      echo "- Lamdba [${lambda}]: Done"
    fi
done

echo "Done"