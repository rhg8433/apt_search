# apt_search

LH청약플러스 / SH인터넷청약시스템(분양·임대)에 조건에 맞는 새 입주자모집공고가 올라오면
**텔레그램(모바일·PC 공용)** 과 **Windows 토스트(로컬 PC)** 로 알려준다.
알림을 탭하면 "이 공고로 이동하시겠습니까?" 확인 페이지를 거쳐 실제 공고로 이동한다.

## 감시 조건

| 사이트 | 조건 |
|---|---|
| LH청약플러스 (분양계열, `mi=1027`) | 지역이 서울특별시/인천광역시/경기도 **그리고** 제목에 '입주자모집' 포함 |
| SH 분양 | 제목에 '입주자 모집 공고'(공백 변형 무관) 포함 |
| SH 임대 | 제목에 '입주자 모집 공고'(공백 변형 무관) 포함 |

범위를 바꾸려면 `src/config.js`의 `sources` 배열만 고치면 된다.

## 동작 방식 요약

- 30분마다 세 목록 페이지를 가져와 파싱하고, 조건에 맞는 공고 중 **아직 알림을 보내지 않은 것**만 골라 알린다.
- 이미 본 공고는 `state/seen.json`(GitHub Actions가 자동 커밋) / `.local/seen.json`(로컬 전용, 커밋 안 됨)에 키 단위로 기록한다.
- 실행 두 곳(클라우드 + 로컬)이 상태 파일을 따로 쓰므로, PC가 켜져 있으면 텔레그램과 토스트를 각각 한 번씩 받는다. 의도된 동작이다.
- **LH 상세 페이지는 외부에서 직접 열 수 없다.** LH 공고 알림은 목록 페이지로 이동시킨다 (상세는 NetFunnel 대기열 토큰이 필요해 외부 요청으로는 항상 오류 페이지가 뜨는 것을 확인했다). SH는 상세 글이 바로 열린다.

## 처음 설정하기

### 0. 사전 준비

```bash
cd apt_search
npm test            # 파서/필터/상태 단위 테스트 (의존성 설치 없이 바로 실행됨)
```

사내망에서 인증서 폐기 검사 오류(`CRYPT_E_NO_REVOCATION_CHECK`)가 나면, 실제 사이트에 접속하는 명령 앞에 아래를 붙인다.

```bash
# bash
NODE_OPTIONS=--use-system-ca node src/check.js --dry-run
```

```powershell
# PowerShell
$env:NODE_OPTIONS = '--use-system-ca'
node src/check.js --dry-run
```

`--dry-run`은 알림도, 상태 저장도 하지 않고 현재 매칭되는 공고 목록만 출력한다. 먼저 이걸로 필터가 기대한 건수를 내는지 확인한다.

> IPv6은 광고하지만 실제로는 라우팅이 안 되는 네트워크(일부 사내망·모바일 테더링 등)에서는 Node의 `fetch`가 IPv6 시도에서 멈춰 타임아웃이 나는 경우가 있다(`curl`은 되는데 Node만 실패하는 전형적 증상). `src/network-fix.js`가 `check.js` 실행 시 자동으로 IPv4 우선으로 전환하므로 보통은 신경 쓸 필요가 없다.

### 1. 텔레그램 봇 만들기

1. 텔레그램에서 `@BotFather`에게 `/newbot` 전송 → 봇 이름 설정 → **봇 토큰**을 받는다.
2. 만든 봇과 1:1 대화를 열고 아무 메시지나 보낸다.
3. 브라우저로 `https://api.telegram.org/bot<봇토큰>/getUpdates`에 접속해 응답의 `result[0].message.chat.id` 값을 확인한다 → **chat id**.

### 2. 로컬 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local`을 열어 `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`를 채운다. `CONFIRM_PAGE_BASE_URL`은 3번에서 GitHub Pages 주소가 나온 뒤 채운다. `.env.local`은 `.gitignore`에 있어 커밋되지 않는다.

### 3. GitHub 저장소 만들고 Pages 켜기

apt_search는 claude-workspace와 무관한 **별도의 public 저장소**로 둔다 (공고 제목 등 공개 사이트 정보만 담기지만, GitHub Pages가 공개 저장소를 전제로 하므로 기존 작업공간과 분리하는 편이 안전하다).

```bash
cd apt_search
git init
git add .
git commit -m "init: LH/SH 청약 공고 알림"
# GitHub에서 새 public 저장소(예: apt_search)를 만든 뒤
git remote add origin https://github.com/<github-username>/apt_search.git
git branch -M main
git push -u origin main
```

GitHub 저장소 설정 → **Pages** → Source를 `main` 브랜치 / `/docs` 폴더로 지정한다. 몇 분 뒤 아래 주소가 열린다.

```
https://<github-username>.github.io/apt_search/confirm.html
```

이 주소를 `.env.local`의 `CONFIRM_PAGE_BASE_URL`에 넣고, `src/config.js`의 `confirmPageBaseUrl` 기본값도 같이 바꿔둔다(기본값은 환경변수가 없을 때만 쓰이는 안전망이다).

### 4. GitHub Actions 비밀값 등록 (클라우드 감시용)

저장소 설정 → **Settings → Secrets and variables → Actions** 에서 등록:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `CONFIRM_PAGE_BASE_URL` (3번 주소)

저장소에는 `permissions: contents: write`가 필요한데 `.github/workflows/watch.yml`에 이미 설정돼 있다. 조직 정책으로 기본 `GITHUB_TOKEN`의 쓰기 권한이 막혀 있다면, 저장소 Settings → Actions → General → Workflow permissions를 "Read and write"로 바꾼다.

### 5. 상태 초기화 (알림 폭탄 방지, 반드시 1회)

```bash
NODE_OPTIONS=--use-system-ca node src/check.js --seed
```

현재 올라와 있는 공고를 전부 '이미 봄'으로 기록한다. 이 단계 없이 바로 돌리면 기존 공고 수십 건이 한꺼번에 알림으로 날아온다.

변경된 `state/seen.json`을 커밋·푸시해야 클라우드 쪽 상태와 맞는다.

```bash
git add state/seen.json
git commit -m "상태 초기화"
git push
```

### 6. 텔레그램 알림 테스트 (1건만)

```bash
NODE_OPTIONS=--use-system-ca node src/check.js --test-notify
```

매칭된 공고 중 1건으로 실제 메시지를 보낸다(상태는 저장하지 않으므로 반복 테스트 가능). 텔레그램에서 메시지와 "공고 열기" 버튼을 확인하고, 버튼을 눌러 확인 페이지 → 실제 공고까지 이동되는지 끝까지 확인한다.

### 7. GitHub Actions 동작 확인

저장소 → **Actions → 청약 공고 감시 → Run workflow** 로 수동 실행해 로그를 확인한다. 정상이면 이후 `cron: '*/30 * * * *'`에 따라 30분마다 자동 실행된다.

### 8. Windows 로컬 감시 등록 (선택, PC가 켜져 있을 때 토스트 알림)

```powershell
cd apt_search
.\scripts\register-task.ps1
```

작업 스케줄러에 `AptSearchWatch` 작업이 30분 간격으로 등록된다(로그인 세션에서만 동작, 토스트 특성상 당연하다). 바로 한 번 실행해 토스트가 뜨는지 확인하려면:

```powershell
Start-ScheduledTask -TaskName 'AptSearchWatch'
```

제거:

```powershell
Unregister-ScheduledTask -TaskName 'AptSearchWatch' -Confirm:$false
```

## 명령어 모음

```bash
npm test                                  # 단위 테스트 (고정 HTML 픽스처 기반)
node src/check.js --dry-run               # 매칭 결과만 출력 (알림/저장 없음)
node src/check.js --seed                  # 현재 목록을 전부 '이미 봄'으로 기록
node src/check.js --test-notify           # 매칭 공고 1건으로 실제 알림 발송 테스트
node src/check.js                         # 신규 공고 텔레그램 알림 (기본)
node src/check.js --channel=toast         # 신규 공고 Windows 토스트 알림
node src/check.js --state=.local/seen.json --channel=toast   # register-task.ps1과 동일한 조합
```

## 알고 있는 한계

- **LH 알림은 상세가 아니라 목록 페이지로 이동한다.** `selectWrtancInfo.do`가 NetFunnel 대기열 토큰을 요구해 외부에서 GET/POST 모두 "오류알림"이 뜨는 것을 확인했다. 알림에 제목이 들어 있으니 목록에서 바로 찾을 수 있다.
- 사이트 HTML 구조가 바뀌면 파서가 조용히 0건을 반환할 수 있다. `check.js`는 소스별로 파싱 결과가 0건이면 경고를 출력한다 — Actions 로그에 이 경고가 보이면 `src/parse-lh.js` / `src/parse-sh.js`를 실제 HTML에 맞춰 손봐야 한다.
- GitHub Actions의 `schedule` cron은 플랫폼 혼잡 시 지연될 수 있어 실제 간격이 30분보다 벌어질 수 있다.
- SH 분양/임대 게시판에 같은 글이 교차 게시되는 경우가 있어, seq 기준으로 한 번만 알린다(어느 게시판에서 먼저 잡히든 상관없다).
