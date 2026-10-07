// SH인터넷청약시스템 게시판 목록 페이지(list.do) HTML 파서

function decodeEntities(str) {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&amp;/g, '&')
}

function stripTags(html) {
  return decodeEntities(html.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
}

// SH 목록 HTML(한 페이지) -> 게시글 객체 배열
// 각 게시글: { site: 'SH', board, multiItmSeq, seq, title, dept, postedAt }
export function parseShList(html, source) {
  const tbodyStart = html.indexOf('<tbody')
  if (tbodyStart === -1) return []
  const body = html.slice(tbodyStart)
  const rowMatches = body.match(/<tr>[\s\S]*?<\/tr>/g) || []

  const items = []
  for (const row of rowMatches) {
    const seqMatch = row.match(/getDetailView\('(\d+)'\)/)
    if (!seqMatch) continue
    const seq = seqMatch[1]

    const anchorMatch = row.match(/<a[^>]*onclick="javascript:getDetailView[\s\S]*?<\/a>/)
    if (!anchorMatch) continue
    // 'NEW' 뱃지 span 등을 제거하고 남는 텍스트가 제목이다
    const title = stripTags(anchorMatch[0].replace(/<span[^>]*>NEW<\/span>/, ''))

    const deptMatch = row.match(/<td>\s*([\s\S]*?)\s*<\/td>\s*<!--\s*부서명\s*-->/)
    const dept = deptMatch ? stripTags(deptMatch[1]) : ''

    const dateMatch = row.match(/(\d{4}-\d{2}-\d{2})/)
    const postedAt = dateMatch ? dateMatch[1] : ''

    items.push({
      site: 'SH',
      board: source.board,
      multiItmSeq: source.multiItmSeq,
      seq,
      title,
      dept,
      postedAt
    })
  }

  return items
}
