Param(
  [Parameter(Mandatory=$false)] [string]$PrivateKey = "",
  [Parameter(Mandatory=$false)] [string]$PrivateKeyPath = "src-tauri/secret.key",
  [Parameter(Mandatory=$false)] [string]$KeyPassword = "",
  [Parameter(Mandatory=$false)] [string]$ReleaseNotes = "",
  [Parameter(Mandatory=$false)] [string]$InstallerPath = "",
  [Parameter(Mandatory=$false)] [string]$DownloadBaseUrl = ""
)

function Fail($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

Push-Location "$PSScriptRoot/../.." | Out-Null

try {
  $privateKeyValue = $null
  if ($PrivateKey -and $PrivateKey.Trim().Length -gt 0) {
    $privateKeyValue = $PrivateKey.Trim()
  } elseif (Test-Path $PrivateKeyPath) {
    $privateKeyValue = (Get-Content -Raw -Encoding UTF8 $PrivateKeyPath).Trim()
  } else {
    Fail "Private key not found. Provide -PrivateKey (base64) or a valid -PrivateKeyPath."
  }

  if (-not $InstallerPath) {
    $installer = Get-ChildItem "src-tauri/target/release/bundle/nsis" -Recurse -Filter "*_x64-setup.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if (-not $installer) { Fail "Installer not found under src-tauri/target/release/bundle/nsis" }
    $InstallerPath = $installer.FullName
  }

  $tauriConf = Get-Content "src-tauri/tauri.conf.json" -Raw | ConvertFrom-Json
  $appVersion = $tauriConf.version
  if (-not $appVersion) { Fail "Could not read version from src-tauri/tauri.conf.json" }

  if (-not $DownloadBaseUrl) {
    $DownloadBaseUrl = "https://github.com/andiricum2/Faltas-Cebanc/releases/download/v$appVersion"
  }

  $env:TAURI_PRIVATE_KEY = $privateKeyValue
  if ($KeyPassword) { $env:TAURI_KEY_PASSWORD = $KeyPassword } else { $env:TAURI_KEY_PASSWORD = $null }

  $signOutput = npx --yes @tauri-apps/cli signer sign "$InstallerPath" 2>&1
  if ($LASTEXITCODE -ne 0) { Fail "Signing failed: $signOutput" }

  $signOutput = $signOutput.Trim()
  if (-not $signOutput) { Fail "Empty signature output" }

  $signature = $null
  $match = [regex]::Match($signOutput, 'Public signature:\s*([A-Za-z0-9+/=]+)')
  if ($match.Success) {
    $signature = $match.Groups[1].Value
  } else {
    $tokens = $signOutput -split "\s+" | Where-Object { $_ -match '^[A-Za-z0-9+/=]+$' }
    if ($tokens.Length -gt 0) { $signature = $tokens[-1] }
  }

  if (-not $signature) { Fail "Could not extract base64 signature from signer output" }

  $installerName = [System.IO.Path]::GetFileName($InstallerPath)
  $encodedName = [System.Uri]::EscapeDataString($installerName)
  $downloadUrl = "$DownloadBaseUrl/$encodedName"

  if (-not $ReleaseNotes) { $ReleaseNotes = "Release $appVersion" }
  $pubDate = [DateTime]::UtcNow.ToString('yyyy-MM-ddTHH:mm:ssZ')

  $obj = [ordered]@{
    version = $appVersion
    notes = $ReleaseNotes
    pub_date = $pubDate
    platforms = @{ 'windows-x86_64' = @{ signature = $signature; url = $downloadUrl } }
  }
  $json = $obj | ConvertTo-Json -Depth 5
  $outPath = "src-tauri/latest.json"
  $json | Set-Content -Encoding UTF8 -NoNewline $outPath
  Write-Host "latest.json generated: $outPath"

  exit 0
}
catch {
  Fail $_
}
finally {
  Pop-Location | Out-Null
}


