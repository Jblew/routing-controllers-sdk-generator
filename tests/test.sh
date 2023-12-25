#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "${DIR}"
set -e

echo "Building SDK generator..."
(cd ../sdk-generator && npm run build)

echo "Generating code..."
TS_NODE_PROJECT=./tsconfig.json \
  npx node \
    -r ts-node/register \
    ./tests/one-controller/gen.ts

echo "Type checking generated code and type-expects..."
npx tsc --noEmit
echo "Done."
