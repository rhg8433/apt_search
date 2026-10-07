// 텔레그램 봇으로 신규 공고 알림 전송 (제목 아래 '공고 열기' 인라인 버튼)

import { telegram } from './config.js'
import { buildConfirmUrl } from './link.js'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function formatMessage(item, detectedAt) {
  const sourceLabel = item.site === 'LH'
    ? `LH청약플러스 · ${item.region}`
    : `SH인터넷청약시스템 · ${item.board === 'sale' ? '분양' : '임대'}`

  const lines = [`🏠 새 청약 공고 (${sourceLabel})`, item.title]

  const metaParts = []
  if (item.postedAt) metaParts.push(`게시일 ${item.postedAt}`)
  if (item.deadline) metaParts.push(`마감 ${item.deadline}`)
  if (item.status) metaParts.push(item.status)
  if (metaParts.length > 0) lines.push(metaParts.join(' · '))

  lines.push(`감지 ${detectedAt}`)

  return lines.join('\n')
}

async function sendOne(item) {
  if (!telegram.botToken || !telegram.chatId) {
    throw new Error('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID 가 설정되지 않았습니다.')
  }

  const detectedAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  const text = formatMessage(item, detectedAt)
  const confirmUrl = buildConfirmUrl(item)

  const payload = {
    chat_id: telegram.chatId,
    text,
    reply_markup: {
      inline_keyboard: [[{ text: '공고 열기', url: confirmUrl }]]
    }
  }

  const res = await fetch(`https://api.telegram.org/bot${telegram.botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`텔레그램 전송 실패: HTTP ${res.status} - ${body}`)
  }
}

// rate limit 회피를 위해 건당 1초 간격으로 순차 전송한다.
export async function notifyTelegram(items) {
  for (const item of items) {
    await sendOne(item)
    await sleep(1000)
  }
}
