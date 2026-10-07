// LH청약플러스 목록 페이지(selectWrtancList.do) HTML 파서

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

// LH 목록 HTML(한 페이지) -> 공고 객체 배열
// 각 공고: { site: 'LH', board, panId, ccrCnntSysDsCd, uppAisTpCd, aisTpCd, title, region, postedAt, deadline, status }
export function parseLhList(html, source) {
  const tbodyStart = html.indexOf('<tbody')
  if (tbodyStart === -1) return []
  const body = html.slice(tbodyStart)
  const rowMatches = body.match(/<tr>[\s\S]*?<\/tr>/g) || []

  const items = []
  for (const row of rowMatches) {
    const anchorTagMatch = row.match(/<a[^>]*class="wrtancInfoBtn"[^>]*>/)
    if (!anchorTagMatch) continue
    const anchorTag = anchorTagMatch[0]

    // data-id 속성은 순서가 바뀔 수 있으니 속성명 기준으로 각각 추출한다
    const getAttr = (name) => {
      const m = anchorTag.match(new RegExp(`data-id${name}="([^"]*)"`))
      return m ? m[1] : ''
    }

    const panId = getAttr(1)
    const ccrCnntSysDsCd = getAttr(2)
    const uppAisTpCd = getAttr(3)
    const aisTpCd = getAttr(4)
    if (!panId) continue

    const spanMatch = row.match(/<span>([\s\S]*?)<\/span>/)
    if (!spanMatch) continue
    // <em class="day">1일전</em> 같은 뱃지는 제목에서 제거한다
    const titleHtml = spanMatch[1].replace(/<em[^>]*>[\s\S]*?<\/em>/g, '')
    const title = stripTags(titleHtml)

    const regionMatch = row.match(/class="mVw cate col2">([\s\S]*?)<\/td>/)
    const region = regionMatch ? stripTags(regionMatch[1]) : ''

    const dateMatches = row.match(/<td>(\d{4}\.\d{2}\.\d{2})<\/td>/g) || []
    const dates = dateMatches.map((d) => d.replace(/<\/?td>/g, ''))
    const postedAt = dates[0] || ''
    const deadline = dates[1] || ''

    const statusMatch = row.match(/class="mVw stt[^"]*">([\s\S]*?)<\/td>/)
    const status = statusMatch ? stripTags(statusMatch[1]) : ''

    items.push({
      site: 'LH',
      board: source.board,
      panId,
      ccrCnntSysDsCd,
      uppAisTpCd,
      aisTpCd,
      title,
      region,
      postedAt,
      deadline,
      status
    })
  }

  return items
}
