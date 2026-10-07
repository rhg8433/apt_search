# Windows 네이티브 토스트 알림을 띄운다 (외부 모듈 불필요).
# 토스트를 클릭하면 $Launch URL이 기본 브라우저로 열린다 (activationType="protocol").

param(
  [Parameter(Mandatory = $true)][string]$Title,
  [Parameter(Mandatory = $true)][string]$Body,
  [Parameter(Mandatory = $true)][string]$Launch
)

$ErrorActionPreference = 'Stop'

function Escape-Xml([string]$text) {
  $text = $text -replace '&', '&amp;'
  $text = $text -replace '<', '&lt;'
  $text = $text -replace '>', '&gt;'
  $text = $text -replace '"', '&quot;'
  $text = $text -replace "'", '&apos;'
  return $text
}

[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] > $null
[Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom, ContentType = WindowsRuntime] > $null

$safeTitle = Escape-Xml $Title
$safeBody = Escape-Xml $Body
$safeLaunch = Escape-Xml $Launch

$toastXmlText = @"
<toast activationType="protocol" launch="$safeLaunch">
  <visual>
    <binding template="ToastGeneric">
      <text>$safeTitle</text>
      <text>$safeBody</text>
    </binding>
  </visual>
</toast>
"@

$xml = [Windows.Data.Xml.Dom.XmlDocument]::new()
$xml.LoadXml($toastXmlText)
$toast = [Windows.UI.Notifications.ToastNotification]::new($xml)

# 별도 설치 없이 PowerShell 자체의 AppUserModelID를 빌려 쓴다(널리 쓰이는 방식).
$appId = '{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}\WindowsPowerShell\v1.0\powershell.exe'
$notifier = [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier($appId)
$notifier.Show($toast)
