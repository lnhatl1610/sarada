#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/../../../.." && pwd)
OPENAPI_FILE="$REPO_ROOT/api/openapi.yaml"

mkdir -p "$REPO_ROOT/admin/src/types" "$REPO_ROOT/storefront/src/types"
npx --yes openapi-typescript "$OPENAPI_FILE" -o "$REPO_ROOT/admin/src/types/api.d.ts"
npx --yes openapi-typescript "$OPENAPI_FILE" -o "$REPO_ROOT/storefront/src/types/api.d.ts"
