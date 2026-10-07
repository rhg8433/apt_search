import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { parseLhList } from '../src/parse-lh.js'
import { parseShList } from '../src/parse-sh.js'
import { matchesFilter } from '../src/filter.js'
import { sources } from '../src/config.js'

function fixture(name) {
  const path = fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url))
  return readFileSync(path, 'utf-8')
}

const lhSource = sources.find((s) => s.site === 'LH')
const shSaleSource = sources.find((s) => s.site === 'SH' && s.board === 'sale')
const shRentSource = sources.find((s) => s.site === 'SH' && s.board === 'rent')

test('LH 목록 파서: 15건의 공고를 추출한다', () => {
  const html = fixture('lh-list.html')
  const items = parseLhList(html, lhSource)
  assert.equal(items.length, 15)
  for (const item of items) {
    assert.equal(item.site, 'LH')
    assert.ok(item.panId, 'panId가 있어야 한다')
    assert.ok(item.title.length > 0, '제목이 있어야 한다')
    assert.ok(item.region.length > 0, '지역이 있어야 한다')
  }
})

test('LH 목록 파서: 필터 조건(지역+제목)과 결합하면 4건이 매칭된다', () => {
  const html = fixture('lh-list.html')
  const items = parseLhList(html, lhSource)
  const matched = items.filter((item) => matchesFilter(item, lhSource))
  assert.equal(matched.length, 4)
  const titles = matched.map((m) => m.title)
  assert.ok(titles.some((t) => t.includes('인천가정2')))
  assert.ok(titles.some((t) => t.includes('인천계양')))
  assert.ok(titles.some((t) => t.includes('수원당수')))
})

test('SH 분양 목록 파서: 10건을 추출하고 2건이 매칭된다', () => {
  const html = fixture('sh-sale-list.html')
  const items = parseShList(html, shSaleSource)
  assert.equal(items.length, 10)
  for (const item of items) {
    assert.equal(item.site, 'SH')
    assert.ok(item.seq, 'seq가 있어야 한다')
    assert.ok(item.title.length > 0, '제목이 있어야 한다')
  }
  const matched = items.filter((item) => matchesFilter(item, shSaleSource))
  assert.equal(matched.length, 2)
})

test('SH 임대 목록 파서: 10건을 추출하고 5건이 매칭된다', () => {
  const html = fixture('sh-rent-list.html')
  const items = parseShList(html, shRentSource)
  assert.equal(items.length, 10)
  const matched = items.filter((item) => matchesFilter(item, shRentSource))
  assert.equal(matched.length, 5)
})

test('SH 분양/임대 교차 게시 글은 동일 seq를 가진다 (중복 알림 방지 전제)', () => {
  const saleItems = parseShList(fixture('sh-sale-list.html'), shSaleSource)
  const rentItems = parseShList(fixture('sh-rent-list.html'), shRentSource)
  const saleSeqs = new Set(saleItems.map((i) => i.seq))
  const rentSeqs = new Set(rentItems.map((i) => i.seq))
  const overlap = [...saleSeqs].filter((seq) => rentSeqs.has(seq))
  assert.ok(overlap.length > 0, '교차 게시가 실제로 존재해야 이 테스트가 의미가 있다')
})
