// Windows 네이티브 토스트 알림 (scripts/show-toast.ps1 호출)

import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { buildConfirmUrl } from './link.js'

const scriptPath = fileURLToPath(new URL('../scripts/show-toast.ps1', import.meta.url))

function formatTitle(item) {
  if (item.site === 'LH') return `🏠 새 청약 공고 (LH청약플러스 · ${item.region})`
  return `🏠 새 청약 공고 (SH인터넷청약시스템 · ${item.board === 'sale' ? '분양' : '임대'})`
}

function formatBody(item) {
  const metaParts = []
  if (item.postedAt) metaParts.push(`게시일 ${item.postedAt}`)
  if (item.deadline) metaParts.push(`마감 ${item.deadline}`)
  return [item.title, metaParts.join(' · ')].filter(Boolean).join('\n')
}

function showOne(item) {
  return new Promise((resolve, reject) => {
    const title = formatTitle(item)
    const body = formatBody(item)
    const launch = buildConfirmUrl(item)

    execFile(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath, '-Title', title, '-Body', body, '-Launch', launch],
      { windowsHide: true },
      (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`토스트 표시 실패: ${err.message}\n${stderr}`))
          return
        }
        resolve()
      }
    )
  })
}

export async function notifyToast(items) {
  for (const item of items) {
    await showOne(item)
  }
}
