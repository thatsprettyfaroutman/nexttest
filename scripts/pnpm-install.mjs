#!/usr/bin/env zx

import "zx/globals"

const PID_FILE = "./__pnpm-install.pid"

try {
  await $`cat ${PID_FILE}`.quiet()
  await $`rm ${PID_FILE}`.quiet()
  process.exit(0)
} catch (error) {}

await $`touch ${PID_FILE}`.quiet()
await $`pnpm install`
