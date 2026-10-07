# Windows 작업 스케줄러에 30분 간격 로컬 감시 작업을 등록한다.
# PC가 켜져 있고 로그인돼 있을 때만 실행되며, 알림은 Windows 토스트로 띄운다.
#
# 사용법 (PowerShell, 일반 권한으로 충분):
#   cd apt_search
#   .\scripts\register-task.ps1
#
# 제거하려면:
#   Unregister-ScheduledTask -TaskName 'AptSearchWatch' -Confirm:$false

param(
  [int]$IntervalMinutes = 30
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$checkScript = Join-Path $projectRoot 'src\check.js'
$stateFile = Join-Path $projectRoot '.local\seen.json'
$taskName = 'AptSearchWatch'

if (-not (Test-Path $checkScript)) {
  throw "check.js를 찾을 수 없습니다: $checkScript"
}

# 사내망 인증서 폐기 검사 이슈 우회(NODE_OPTIONS)를 cmd.exe 경유로 설정해 실행한다.
$nodeArgs = "`"$checkScript`" --channel=toast --state=`"$stateFile`""
$cmdArgument = "/c set NODE_OPTIONS=--use-system-ca&& node $nodeArgs"

$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument $cmdArgument -WorkingDirectory $projectRoot

$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) `
  -RepetitionInterval (New-TimeSpan -Minutes $IntervalMinutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)

$settings = New-ScheduledTaskSettingsSet `
  -StartWhenAvailable `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -ExecutionTimeLimit (New-TimeSpan -Minutes 5)

# 토스트 알림은 로그인한 사용자 세션에서만 띄울 수 있다.
$principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -LogonType Interactive -RunLevel Limited

Register-ScheduledTask -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Principal $principal `
  -Description 'LH/SH 청약 공고 감시 (로컬 Windows 토스트 알림)' `
  -Force

Write-Host "작업 '$taskName'을 등록했습니다 ($IntervalMinutes 분 간격)."
Write-Host "지금 한 번 실행해 확인하려면: Start-ScheduledTask -TaskName '$taskName'"
