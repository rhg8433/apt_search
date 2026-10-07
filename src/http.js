// 공통 fetch 래퍼: User-Agent 고정, 타임아웃, 재시도

import { http as httpConfig } from './config.js'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchOnce(url, options, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...options, signal: controller.signal })
    const body = await res.text()
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${url}`)
    }
    return body
  } finally {
    clearTimeout(timer)
  }
}

// GET 요청. 실패 시 설정된 횟수만큼 재시도한다.
export async function fetchText(url, extraHeaders = {}) {
  const options = {
    method: 'GET',
    headers: {
      'User-Agent': httpConfig.userAgent,
      Accept: 'text/html,application/xhtml+xml',
      ...extraHeaders
    }
  }

  let lastError
  for (let attempt = 0; attempt <= httpConfig.retries; attempt += 1) {
    try {
      return await fetchOnce(url, options, httpConfig.timeoutMs)
    } catch (err) {
      lastError = err
      if (attempt < httpConfig.retries) {
        await sleep(httpConfig.retryDelayMs)
      }
    }
  }
  throw lastError
}

// SH 상세 진입용 POST (Referer/쿠키 없이도 동작함을 조사로 확인함)
export async function postForm(url, formData) {
  const body = new URLSearchParams(formData).toString()
  const options = {
    method: 'POST',
    headers: {
      'User-Agent': httpConfig.userAgent,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'text/html,application/xhtml+xml'
    },
    body
  }

  let lastError
  for (let attempt = 0; attempt <= httpConfig.retries; attempt += 1) {
    try {
      return await fetchOnce(url, options, httpConfig.timeoutMs)
    } catch (err) {
      lastError = err
      if (attempt < httpConfig.retries) {
        await sleep(httpConfig.retryDelayMs)
      }
    }
  }
  throw lastError
}
