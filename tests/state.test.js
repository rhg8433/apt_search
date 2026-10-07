import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { keyOf, loadState, saveState } from '../src/state.js'

test('keyOf: LH는 panId, SH는 seq로 키를 만든다', () => {
  assert.equal(keyOf({ site: 'LH', panId: '0000061183' }), 'LH:0000061183')
  assert.equal(keyOf({ site: 'SH', seq: '311005', board: 'sale' }), 'SH:311005')
  assert.equal(keyOf({ site: 'SH', seq: '311005', board: 'rent' }), 'SH:311005')
})

test('state: 존재하지 않는 파일은 빈 Set을 반환한다', () => {
  const dir = mkdtempSync(join(tmpdir(), 'apt-search-'))
  const file = join(dir, 'seen.json')
  try {
    const state = loadState(file)
    assert.equal(state.size, 0)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('state: 저장 후 다시 불러오면 동일한 내용이다', () => {
  const dir = mkdtempSync(join(tmpdir(), 'apt-search-'))
  const file = join(dir, 'nested', 'seen.json')
  try {
    saveState(file, new Set(['LH:1', 'SH:2']))
    const loaded = loadState(file)
    assert.deepEqual([...loaded].sort(), ['LH:1', 'SH:2'])
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
