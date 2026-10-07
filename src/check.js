#!/usr/bin/env node
// 진입점: 목록 fetch → 파싱 → 필터 → 신규 판별 → 알림 → 상태 저장
//
// 사용법:
//   node src/check.js                     목록 조회 → 신규 공고 알림(텔레그램)
//   node src/check.js --channel=toast      알림을 Windows 토스트로
//   node src/check.js --dry-run            알림/상태 저장 없이 매칭 결과만 출력
//   node src/check.js --seed               현재 목록을 전부 '이미 봄'으로 기록(알림 없음)
//   node src/check.js --test-notify        최신 매칭 공고 1건으로 실제 알림 전송 테스트
//   node src/check.js --state=<path>       상태 파일 경로 지정(기본: config.paths.sharedStateFile)

import './network-fix.js'
import './load-env.js'
import { sources, paths } from './config.js'
import { fetchText } from './http.js'
import { parseLhList } from './parse-lh.js'
import { parseShList } from './parse-sh.js'
import { matchesFilter } from './filter.js'
import { keyOf, loadState, saveState } from './state.js'
import { dedupeByKey } from './dedup.js'
import { notifyTelegram } from './notify-telegram.js'
import { notifyToast } from './notify-toast.js'

function parseArgs(argv) {
  const args = { channel: 'telegram', dryRun: false, seed: false, testNotify: false, stateFile: null }
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--seed') args.seed = true
    else if (arg === '--test-notify') args.testNotify = true
    else if (arg.startsWith('--channel=')) args.channel = arg.split('=')[1]
    else if (arg.startsWith('--state=')) args.stateFile = arg.split('=')[1]
  }
  return args
}

async function fetchAndParseSource(source) {
  const html = await fetchText(source.listUrl)
  const items = source.site === 'LH' ? parseLhList(html, source) : parseShList(html, source)
  if (items.length === 0) {
    console.warn(`[경고] ${source.site}/${source.board} 목록에서 0건 파싱됨 — 사이트 구조가 바뀌었을 수 있습니다.`)
  }
  return items
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const stateFile = args.stateFile || paths.sharedStateFile

  const allItems = []
  for (const source of sources) {
    const items = await fetchAndParseSource(source)
    allItems.push(...items)
  }

  const matched = allItems.filter((item) => {
    const source = sources.find((s) => s.site === item.site && s.board === item.board)
    return matchesFilter(item, source)
  })

  console.log(`[정보] 전체 ${allItems.length}건 중 필터 매칭 ${matched.length}건`)

  // SH는 분양/임대 게시판에 같은 글이 교차 게시될 수 있어 matched 안에 동일 키가 중복될 수 있다.
  // 알림/상태 기록 전에 먼저 키 기준으로 중복을 제거한다.
  const dedupedMatched = dedupeByKey(matched)

  const seen = loadState(stateFile)

  if (args.seed) {
    for (const item of dedupedMatched) seen.add(keyOf(item))
    saveState(stateFile, seen)
    console.log(`[완료] ${dedupedMatched.length}건을 '이미 봄'으로 기록했습니다. 알림은 보내지 않았습니다.`)
    return
  }

  let newItems = dedupedMatched.filter((item) => !seen.has(keyOf(item)))

  if (args.testNotify) {
    const target = newItems[0] || dedupedMatched[0]
    if (!target) {
      console.log('[정보] 테스트로 보낼 공고가 없습니다(필터 매칭 0건).')
      return
    }
    newItems = [target]
    console.log(`[테스트] "${target.title}" 1건으로 알림을 전송합니다.`)
  }

  if (newItems.length === 0) {
    console.log('[정보] 신규 공고가 없습니다.')
    return
  }

  for (const item of newItems) {
    console.log(`  - [${item.site}/${item.board}] ${item.title}`)
  }

  if (args.dryRun) {
    console.log('[드라이런] 알림/상태 저장을 건너뜁니다.')
    return
  }

  if (args.channel === 'toast') {
    await notifyToast(newItems)
  } else {
    await notifyTelegram(newItems)
  }

  if (!args.testNotify) {
    for (const item of newItems) seen.add(keyOf(item))
    saveState(stateFile, seen)
  }

  console.log(`[완료] ${newItems.length}건 알림 전송${args.testNotify ? ' (테스트 — 상태 저장 안 함)' : ''}`)
}

main().catch((err) => {
  console.error('[오류]', err)
  process.exitCode = 1
})
