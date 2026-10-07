// 감시 대상 / 필터 / 채널 설정
// 이 파일만 고치면 감시 범위를 바꿀 수 있다.

import { fileURLToPath } from 'node:url'

export const sources = [
  {
    site: 'LH',
    board: 'sale', // mi=1027 은 분양주택 계열 목록
    mi: '1027',
    listUrl: 'https://apply.lh.or.kr/lhapply/apply/wt/wrtanc/selectWrtancList.do?mi=1027',
    // 아래 지역 중 하나에 해당해야 알림 대상
    regions: ['서울특별시', '인천광역시', '경기도'],
    // 정규화(공백 제거) 제목에 하나라도 포함되면 매칭 ('입주자모집'은 '입주자모집공고'를 포함한다)
    titleIncludes: ['입주자모집']
    // LH 임대 계열까지 넓히려면 { ...위와 동일, board: 'rent', mi: '1026', listUrl: '...mi=1026' } 를 추가
  },
  {
    site: 'SH',
    board: 'sale',
    multiItmSeq: '0',
    listUrl: 'https://www.i-sh.co.kr/app/lay2/program/S48T1581C1617/www/brd/m_244/list.do',
    viewUrl: 'https://www.i-sh.co.kr/app/lay2/program/S48T1581C1617/www/brd/m_244/view.do',
    titleIncludes: ['입주자모집공고']
  },
  {
    site: 'SH',
    board: 'rent',
    multiItmSeq: '2',
    listUrl: 'https://www.i-sh.co.kr/app/lay2/program/S48T1581C563/www/brd/m_247/list.do?multi_itm_seq=2',
    viewUrl: 'https://www.i-sh.co.kr/app/lay2/program/S48T1581C563/www/brd/m_247/view.do',
    titleIncludes: ['입주자모집공고']
  }
]

// 매칭됐더라도 정규화 제목에 이 키워드가 하나라도 포함되면 알림에서 제외한다.
// 기본은 빈 배열(= 전부 알림). 당첨자 발표/최종 공지 등을 걸러내고 싶으면 값을 추가한다.
export const excludeKeywords = []

export const confirmPageBaseUrl = process.env.CONFIRM_PAGE_BASE_URL
  || 'https://rhg8433.github.io/apt_search/confirm.html'

export const telegram = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || ''
}

export const paths = {
  // GitHub Actions 는 이 파일을 커밋해서 상태를 리포지토리에 보관한다.
  sharedStateFile: fileURLToPath(new URL('../state/seen.json', import.meta.url)),
  // 로컬 Windows watcher 는 커밋되지 않는 별도 파일을 쓴다(동시 운영 시 중복 방지 범위를 분리).
  localStateFile: fileURLToPath(new URL('../.local/seen.json', import.meta.url))
}

export const http = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
  timeoutMs: 15000,
  retries: 2,
  retryDelayMs: 1500
}
