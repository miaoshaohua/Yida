# ==============================================================================
# Yida Startup Script - YiJianQiDongYiDaXiangMu
# ==============================================================================
# ShiYongFangFa:
#   1. Double-click this script to run
#   2. Or run in PowerShell: .\Yida_startup.ps1
#
# GongNeng:
#   - Auto detect and handle port conflicts (backend 3000, frontend 5173)
#   - Start both frontend and backend services simultaneously
#   - Open default browser after all services are ready
#
# ZhuYiShiXiang:
#   - First run: ensure npm install has been done in both frontend and backend
#   - Backend needs .env file configured (see .env.example)
#   - If ports are occupied, script will try to close the occupying processes
# ==============================================================================

Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass -Force

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$BackendDir  = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"

$BackendPort = 3000
$FrontendPort = 5173

$FrontendUrl = "http://localhost:$FrontendPort"

Write-Host ""
Write-Host "  ==================================================" -ForegroundColor Magenta
Write-Host "        Yida AI Virtual Try-On - Auto Start" -ForegroundColor Magenta
Write-Host "  ==================================================" -ForegroundColor Magenta
Write-Host ""

# Step 1: Check directories
Write-Host "[INFO] Checking project directories..." -ForegroundColor Cyan
if (-not (Test-Path $BackendDir)) {
    Write-Host "[ERROR] Backend dir not found: $BackendDir" -ForegroundColor Red
    exit 1
}
if (-not (Test-Path $FrontendDir)) {
    Write-Host "[ERROR] Frontend dir not found: $FrontendDir" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Directories OK" -ForegroundColor Green

# Step 2: Check and close ports if occupied
function Close-Port($port) {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            $procInfo = Get-Process -Id $procId -ErrorAction SilentlyContinue
            if ($procInfo) {
                $procName = $procInfo.ProcessName
            } else {
                $procName = "unknown"
            }
            Write-Host "[WARN] Port $port occupied by $procName (PID: $procId)" -ForegroundColor Yellow
            try {
                Stop-Process -Id $procId -Force -ErrorAction Stop
                Write-Host "[SUCCESS] Closed $procName (PID: $procId)" -ForegroundColor Green
            } catch {
                Write-Host "[ERROR] Cannot close $procName (PID: $procId), please close manually" -ForegroundColor Red
                return $false
            }
        }
        Start-Sleep -Milliseconds 500
    }
    return $true
}

Write-Host "[INFO] Checking port availability..." -ForegroundColor Cyan
$portOk1 = Close-Port $BackendPort
$portOk2 = Close-Port $FrontendPort

if (-not $portOk1 -or -not $portOk2) {
    Write-Host "[ERROR] Port conflict unresolved, please close manually" -ForegroundColor Red
    exit 1
}
Write-Host "[SUCCESS] Ports available" -ForegroundColor Green

# Step 3: Copy .env if not exists
$BackendEnv = Join-Path $BackendDir ".env"
$BackendEnvExample = Join-Path $BackendDir ".env.example"
if (-not (Test-Path $BackendEnv) -and (Test-Path $BackendEnvExample)) {
    Write-Host "[WARN] .env not found, copying from .env.example..." -ForegroundColor Yellow
    Copy-Item $BackendEnvExample $BackendEnv
    Write-Host "[SUCCESS] Created default .env file" -ForegroundColor Green
}

# Step 4: Start backend
Write-Host ""
Write-Host "[INFO] Starting backend service (NestJS)..." -ForegroundColor Cyan

$BackendCmd = "cd '$BackendDir'; Write-Host 'Starting backend...'; npm run start:dev"
$BackendProcess = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", $BackendCmd `
    -PassThru `
    -WindowStyle Normal

Write-Host "[SUCCESS] Backend started (PID: $($BackendProcess.Id))" -ForegroundColor Green

# Step 5: Start frontend
Write-Host ""
Write-Host "[INFO] Starting frontend service (Vite + React)..." -ForegroundColor Cyan

$FrontendCmd = "cd '$FrontendDir'; Write-Host 'Starting frontend...'; npm run dev"
$FrontendProcess = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", $FrontendCmd `
    -PassThru `
    -WindowStyle Normal

Write-Host "[SUCCESS] Frontend started (PID: $($FrontendProcess.Id))" -ForegroundColor Green

# Check if a port is listening using TcpClient
function Test-PortListening($port, $timeoutMs = 2000) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $result = $tcp.BeginConnect("localhost", $port, $null, $null)
        $wait = $result.AsyncWaitHandle.WaitOne($timeoutMs, $false)
        if ($wait) {
            $tcp.EndConnect($result)
            $tcp.Close()
            return $true
        }
        $tcp.Close()
        return $false
    } catch {
        return $false
    }
}

# Step 6: Wait for backend
Write-Host ""
Write-Host "[INFO] Waiting for backend to be ready..." -ForegroundColor Cyan
$BackendReady = $false
$MaxRetries = 60
$RetryCount = 0

while ($RetryCount -lt $MaxRetries -and -not $BackendReady) {
    if (Test-PortListening $BackendPort) {
        $BackendReady = $true
    } else {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $RetryCount++
    }
}

if ($BackendReady) {
    Write-Host ""
    Write-Host "[SUCCESS] Backend ready on port $BackendPort" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Backend startup timeout, check backend console" -ForegroundColor Red
}

# Step 7: Wait for frontend
Write-Host "[INFO] Waiting for frontend to be ready..." -ForegroundColor Cyan
$FrontendReady = $false
$RetryCount = 0

while ($RetryCount -lt $MaxRetries -and -not $FrontendReady) {
    if (Test-PortListening $FrontendPort) {
        $FrontendReady = $true
    } else {
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 1
        $RetryCount++
    }
}

if ($FrontendReady) {
    Write-Host ""
    Write-Host "[SUCCESS] Frontend ready on port $FrontendPort" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Frontend startup timeout, check frontend console" -ForegroundColor Red
}

# Step 8: Open browser
if ($FrontendReady) {
    Write-Host ""
    Write-Host "[INFO] Opening default browser..." -ForegroundColor Cyan
    Start-Process $FrontendUrl
    Write-Host "[SUCCESS] Browser opened: $FrontendUrl" -ForegroundColor Green
}

# Done
Write-Host ""
Write-Host "  ==================================================" -ForegroundColor Green
Write-Host "        All services started successfully!" -ForegroundColor Green
Write-Host "  ==================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend: $FrontendUrl" -ForegroundColor White
Write-Host "  Backend:  http://localhost:$BackendPort" -ForegroundColor White
Write-Host "  API Docs: http://localhost:$BackendPort/api/docs" -ForegroundColor White
Write-Host ""
Write-Host "  To stop: Close the PowerShell windows" -ForegroundColor Yellow
Write-Host ""
