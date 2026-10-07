// .env.local (저장소에 커밋되지 않음) 이 있으면 KEY=VALUE 줄을 process.env에 채워 넣는다.
// GitHub Actions에서는 Secrets가 이미 process.env로 들어오므로 파일이 없어도 그냥 무시된다.
// check.js 맨 앞에서 이 모듈을 가장 먼저 import해야 한다
// (ESM은 같은 파일 안의 import들을 소스 순서대로 평가하므로,
//  이 모듈이 먼저 평가돼야 이후 config.js가 process.env를 읽을 때 값이 채워져 있다).

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const envFilePath = fileURLToPath(new URL('../.env.local', import.meta.url))

if (existsSync(envFilePath)) {
  const lines = readFileSync(envFilePath, 'utf-8').split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const idx = trimmed.indexOf('=')
    if (idx === -1) continue

    const key = trimmed.slice(0, idx).trim()
    let value = trimmed.slice(idx + 1).trim()

    const isDoubleQuoted = value.startsWith('"') && value.endsWith('"')
    const isSingleQuoted = value.startsWith('\'') && value.endsWith('\'')
    if (isDoubleQuoted || isSingleQuoted) {
      value = value.slice(1, -1)
    }

    // 실제 환경변수(CI secrets 등)가 이미 있으면 그 값을 우선한다.
    if (!(key in process.env)) {
      process.env[key] = value
    }
  }
}
