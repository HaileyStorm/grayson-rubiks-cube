$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$dist = Join-Path $root "dist"
$release = Join-Path $root "release"
$packageRoot = Join-Path $release "cherry-cube"
$zipPath = Join-Path $release "cherry-cube-static.zip"

if (-not (Test-Path -LiteralPath $dist)) {
  throw "dist folder not found. Run npm run build first."
}

if (Test-Path -LiteralPath $packageRoot) {
  Remove-Item -LiteralPath $packageRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null
Copy-Item -Path (Join-Path $dist "*") -Destination $packageRoot -Recurse -Force

@"
Cherry Cube portable static build

Windows: double-click start-cherry-cube.cmd.

Other options:
- npx serve .
- python -m http.server 8080

Source repository:
https://github.com/HaileyStorm/grayson-rubiks-cube
"@ | Set-Content -LiteralPath (Join-Path $packageRoot "README-DISTRIBUTION.txt") -Encoding UTF8

@"
@echo off
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-cherry-cube.ps1"
"@ | Set-Content -LiteralPath (Join-Path $packageRoot "start-cherry-cube.cmd") -Encoding ASCII

@'
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 8765
$listener = $null

while ($port -lt 8800) {
  try {
    $candidate = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Parse("127.0.0.1"), $port)
    $candidate.Start()
    $listener = $candidate
    break
  } catch {
    $port++
  }
}

if ($null -eq $listener) {
  throw "Could not find a free local port between 8765 and 8799."
}

$contentTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".js" = "text/javascript; charset=utf-8"
  ".css" = "text/css; charset=utf-8"
  ".txt" = "text/plain; charset=utf-8"
  ".json" = "application/json; charset=utf-8"
  ".png" = "image/png"
  ".jpg" = "image/jpeg"
  ".jpeg" = "image/jpeg"
  ".svg" = "image/svg+xml"
  ".ico" = "image/x-icon"
}

$url = "http://127.0.0.1:$port/"
Write-Host "Cherry Cube is running at $url"
Write-Host "Close this window or press Ctrl+C to stop."
if ($env:CHERRY_CUBE_NO_OPEN -ne "1") {
  Start-Process $url
}

while ($true) {
  $client = $listener.AcceptTcpClient()
  try {
    $stream = $client.GetStream()
    $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
    $requestLine = $reader.ReadLine()
    while (($line = $reader.ReadLine()) -ne $null -and $line -ne "") {}

    $target = "index.html"
    if ($requestLine -match "^[A-Z]+\s+([^\s]+)") {
      $path = [Uri]::UnescapeDataString($Matches[1].Split("?")[0]).TrimStart("/")
      if ($path -and $path -ne "/") { $target = $path }
    }

    $fullPath = [System.IO.Path]::GetFullPath((Join-Path $root $target))
    if (-not $fullPath.StartsWith([System.IO.Path]::GetFullPath($root))) {
      throw "Invalid path."
    }
    if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
      $fullPath = Join-Path $root "index.html"
    }

    $bytes = [System.IO.File]::ReadAllBytes($fullPath)
    $ext = [System.IO.Path]::GetExtension($fullPath).ToLowerInvariant()
    $type = if ($contentTypes.ContainsKey($ext)) { $contentTypes[$ext] } else { "application/octet-stream" }
    $header = "HTTP/1.1 200 OK`r`nContent-Type: $type`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($bytes, 0, $bytes.Length)
  } catch {
    $message = [System.Text.Encoding]::UTF8.GetBytes("Not found")
    $header = "HTTP/1.1 404 Not Found`r`nContent-Length: $($message.Length)`r`nConnection: close`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($header)
    $stream.Write($headerBytes, 0, $headerBytes.Length)
    $stream.Write($message, 0, $message.Length)
  } finally {
    $client.Close()
  }
}
'@ | Set-Content -LiteralPath (Join-Path $packageRoot "start-cherry-cube.ps1") -Encoding UTF8

if (Test-Path -LiteralPath $zipPath) {
  Remove-Item -LiteralPath $zipPath -Force
}

Compress-Archive -LiteralPath $packageRoot -DestinationPath $zipPath -Force
Write-Host "Created $zipPath"
