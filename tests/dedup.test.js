import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dedupeByKey } from '../src/dedup.js'

test('SH 분양/임대 교차 게시 글은 동일 seq 키로 한 건만 남는다', () => {
  const items = [
    { site: 'SH', board: 'sale', seq: '311005', title: 'A' },
    { site: 'SH', board: 'rent', seq: '311005', title: 'A' },
    { site: 'SH', board: 'sale', seq: '310950', title: 'B' }
  ]
  const result = dedupeByKey(items)
  assert.equal(result.length, 2)
  assert.deepEqual(result.map((i) => i.seq), ['311005', '310950'])
})

test('LH는 panId가 다르면 중복 제거되지 않는다', () => {
  const items = [
    { site: 'LH', panId: '0000061183', title: 'A' },
    { site: 'LH', panId: '0000061179', title: 'B' }
  ]
  assert.equal(dedupeByKey(items).length, 2)
})
