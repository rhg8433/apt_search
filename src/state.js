// 이미 알림을 보낸 공고를 기록해 중복 알림을 막는다.
// 키: LH:<panId>, SH:<seq>  (SH는 분양/임대 교차 게시 때문에 게시판 구분을 넣지 않는다)

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname } from 'node:path'

export function keyOf(item) {
  if (item.site === 'LH') return `LH:${item.panId}`
  if (item.site === 'SH') return `SH:${item.seq}`
  throw new Error(`알 수 없는 site: ${item.site}`)
}

export function loadState(filePath) {
  if (!existsSync(filePath)) return new Set()
  const raw = readFileSync(filePath, 'utf-8').trim()
  if (!raw) return new Set()
  const data = JSON.parse(raw)
  return new Set(Array.isArray(data) ? data : [])
}

export function saveState(filePath, seenSet) {
  mkdirSync(dirname(filePath), { recursive: true })
  const sorted = [...seenSet].sort()
  writeFileSync(filePath, JSON.stringify(sorted, null, 2) + '\n', 'utf-8')
}
