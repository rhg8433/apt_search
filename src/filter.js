// 공고 매칭 규칙
// 제목의 공백을 모두 제거해 비교하므로
// '입주자 모집 공고' / '입주자 모집공고' / '입주자모집공고' 변형을 한 규칙으로 처리한다.

import { excludeKeywords } from './config.js'

function normalize(text) {
  return (text || '').replace(/\s+/g, '')
}

export function matchesFilter(item, source) {
  const normalizedTitle = normalize(item.title)

  const titleOk = source.titleIncludes.some((keyword) =>
    normalizedTitle.includes(normalize(keyword))
  )
  if (!titleOk) return false

  if (source.regions && source.regions.length > 0) {
    if (!source.regions.includes(item.region)) return false
  }

  const excluded = excludeKeywords.some((keyword) =>
    normalizedTitle.includes(normalize(keyword))
  )
  if (excluded) return false

  return true
}
