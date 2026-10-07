// keyOf 기준으로 중복 항목을 제거한다.
// SH는 분양/임대 게시판에 같은 글이 교차 게시될 수 있어 이 작업이 필요하다.

import { keyOf } from './state.js'

export function dedupeByKey(items) {
  const result = []
  const seenKeys = new Set()
  for (const item of items) {
    const key = keyOf(item)
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    result.push(item)
  }
  return result
}
