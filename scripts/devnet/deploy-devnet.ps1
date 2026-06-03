param (
    [string]$ProgramName,
    [string]$ProgramId,
    [string]$KeypairPath
)

if (-not $ProgramName -or -not $ProgramId) {
    Write-Host "Usage: .\scripts\devnet\deploy-devnet.ps1 -ProgramName <name> -ProgramId <id> [-KeypairPath <path>]" -ForegroundColor Red
    exit 1
}

$soFile = "target/deploy/$($ProgramName).so"
if (-not (Test-Path $soFile)) {
    Write-Host "Error: Build artifact not found at $soFile" -ForegroundColor Red
    exit 1
}

$maxRetries = 20
$retryCount = 0
$success = $false

Write-Host "Starting deployment of $soFile to $ProgramId on Devnet..."

# Get current wallet to check for buffers
$walletPubkey = solana address

while (-not $success -and $retryCount -lt $maxRetries) {
    $retryCount++
    Write-Host "`nAttempt $retryCount of $maxRetries..."
    
    # Close any stale buffers that might have been left behind by previous failed attempts
    Write-Host "Cleaning up stale buffers for $walletPubkey..."
    $buffers = solana program show --buffers --url devnet | Select-String -Pattern $walletPubkey
    foreach ($buffer in $buffers) {
        $bufferId = ($buffer -split '\s+')[0]
        if ($bufferId -match "^[1-9A-HJ-NP-Za-km-z]{32,44}$") {
            Write-Host "Closing buffer: $bufferId"
            solana program close $bufferId --url devnet
        }
    }

    Write-Host "Deploying $ProgramName..."
    
    $deployArgs = @("program", "deploy", $soFile, "--url", "devnet", "--use-rpc", "--max-sign-attempts", "1000", "--with-compute-unit-price", "5000000")
    if ($KeypairPath) {
        $deployArgs += @("--program-id", $KeypairPath)
    } else {
        $deployArgs += @("--program-id", $ProgramId)
    }

    $process = Start-Process -FilePath "solana" -ArgumentList $deployArgs -Wait -NoNewWindow -PassThru

    if ($process.ExitCode -eq 0) {
        $success = $true
        Write-Host "`nDeployment of $ProgramName SUCCESSFUL!" -ForegroundColor Green
    } else {
        Write-Host "`nDeployment of $ProgramName failed. Retrying in 5 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
    }
}

if (-not $success) {
    Write-Host "`nDeployment of $ProgramName failed after $maxRetries attempts." -ForegroundColor Red
    exit 1
}
