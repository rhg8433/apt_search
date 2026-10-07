// 알림에 붙일 확인 페이지(docs/confirm.html) URL 생성
// 실제 목적지 URL은 confirm.html 안의 화이트리스트가 조립하므로,
// 여기서는 src/board/seq/제목/게시일 같은 "의도"만 쿼리로 넘긴다 (open redirect 방지).

import { confirmPageBaseUrl } from './config.js'

export function buildConfirmUrl(item) {
  const params = new URLSearchParams()

  if (item.site === 'LH') {
    params.set('src', 'LH')
    params.set('t', item.title)
    params.set('d', item.postedAt)
  } else if (item.site === 'SH') {
    params.set('src', 'SH')
    params.set('b', item.board) // 'sale' | 'rent'
    params.set('seq', item.seq)
    params.set('t', item.title)
    params.set('d', item.postedAt)
  } else {
    throw new Error(`알 수 없는 site: ${item.site}`)
  }

  return `${confirmPageBaseUrl}?${params.toString()}`
}
