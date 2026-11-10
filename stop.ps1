# VisionForge AI Studio - PowerShell Stop Script
$Host.UI.RawUI.WindowTitle = "VisionForge AI Studio - Stop Services"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  Stopping VisionForge Services..." -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""

$backendPort = if ($env:VF_PORT) { [int]$env:VF_PORT } else { 8000 }
$ports = @($backendPort, 5173)
$killedAny = $false

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        foreach ($conn in $connections) {
            $pidToKill = $conn.OwningProcess
            if ($pidToKill -gt 0) {
                Write-Host " [*] 正在停止 Port $port (PID: $pidToKill)..." -ForegroundColor Yellow
                Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
                $killedAny = $true
            }
        }
    } catch {
        # Fallback to netstat if Get-NetTCPConnection fails
        $netstatOut = netstat -aon | findstr ":$port" | findstr "LISTENING"
        if ($netstatOut) {
            $parts = $netstatOut -split '\s+'
            $pidToKill = $parts[-1]
            if ($pidToKill) {
                Write-Host " [*] 正在停止 Port $port (PID: $pidToKill)..." -ForegroundColor Yellow
                taskkill /F /T /PID $pidToKill 2>&1 | Out-Null
                $killedAny = $true
            }
        }
    }
}

Write-Host ""
if ($killedAny) {
    Write-Host " [OK] VisionForge 服務已成功全數停止。" -ForegroundColor Green
} else {
    Write-Host " [*] 目前沒有正在運行的 VisionForge 服務。" -ForegroundColor Gray
}
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Read-Host "按 Enter 鍵關閉..."
