$programId = "Cr4ZyqvML9tS5HeAFXLTKfBxJKixQStL8dGFmfbUx585"
$soFile = "target/deploy/system_match_offer.so"
$maxRetries = 20
$retryCount = 0
$success = $false

Write-Host "Starting aggressive deployment of $soFile to $programId on Devnet..."

while (-not $success -and $retryCount -lt $maxRetries) {
    $retryCount++
    Write-Host "`nAttempt $retryCount of $maxRetries..."
    
    # Close any stale buffers that might have been left behind by previous failed attempts
    Write-Host "Cleaning up stale buffers..."
    $buffers = solana program show --buffers --url devnet | Select-String -Pattern "9BeBqNy15zt5mq112RrR35GaHNoqkPNFe1brhtEocdpU"
    foreach ($buffer in $buffers) {
        $bufferId = ($buffer -split '\s+')[0]
        if ($bufferId -match "^[1-9A-HJ-NP-Za-km-z]{32,44}$") {
            Write-Host "Closing buffer: $bufferId"
            solana program close $bufferId --url devnet
        }
    }

    Write-Host "Deploying..."
    # The solana program deploy command acts as an upgrade if the program exists
    $process = Start-Process -FilePath "solana" -ArgumentList "program deploy $soFile --url devnet --program-id $programId --use-rpc --max-sign-attempts 1000 --with-compute-unit-price 5000000" -Wait -NoNewWindow -PassThru

    if ($process.ExitCode -eq 0) {
        $success = $true
        Write-Host "`nDeployment SUCCESSFUL!" -ForegroundColor Green
    } else {
        Write-Host "`nDeployment failed (likely rate-limited). Retrying in 3 seconds..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
    }
}

if (-not $success) {
    Write-Host "`nDeployment failed after $maxRetries attempts." -ForegroundColor Red
}
