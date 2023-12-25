#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
set -e

TS_NODE_PROJECT=./tsconfig.json \
  npx node \
    -r ts-node/register \
    ./tests/one-controller/gen.ts
