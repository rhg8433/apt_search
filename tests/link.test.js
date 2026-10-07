import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildConfirmUrl } from '../src/link.js'

test('buildConfirmUrl: LH는 src/t/d만 담는다 (목적지 URL은 넘기지 않음)', () => {
  const url = buildConfirmUrl({
    site: 'LH',
    title: '인천가정2 B2블록 공공분양 잔여세대 추가 입주자모집공고',
    postedAt: '2026.09.23'
  })
  const parsed = new URL(url)
  assert.equal(parsed.searchParams.get('src'), 'LH')
  assert.equal(parsed.searchParams.get('t'), '인천가정2 B2블록 공공분양 잔여세대 추가 입주자모집공고')
  assert.equal(parsed.searchParams.has('url'), false)
})

test('buildConfirmUrl: SH는 src/b/seq/t/d를 담는다', () => {
  const url = buildConfirmUrl({
    site: 'SH',
    board: 'rent',
    seq: '311005',
    title: '입주자 모집 공고',
    postedAt: '2026-10-02'
  })
  const parsed = new URL(url)
  assert.equal(parsed.searchParams.get('src'), 'SH')
  assert.equal(parsed.searchParams.get('b'), 'rent')
  assert.equal(parsed.searchParams.get('seq'), '311005')
})
