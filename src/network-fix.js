// 일부 네트워크(예: IPv6 주소는 광고하지만 실제 라우팅은 안 되는 환경)에서
// Node의 Happy Eyeballs(autoSelectFamily)가 IPv6 시도에서 응답 없이 멈춰
// fetch 전체가 ETIMEDOUT 나는 문제가 있다 (curl은 되는데 Node fetch만 실패하는 전형적 증상).
// IPv4를 우선/단독으로 쓰도록 강제해 이 문제를 피한다.
//
// check.js 맨 앞에서 가장 먼저 import해야 한다 (fetch를 호출하기 전에 적용돼야 하므로).

import net from 'node:net'
import dns from 'node:dns'

net.setDefaultAutoSelectFamily(false)
dns.setDefaultResultOrder('ipv4first')
