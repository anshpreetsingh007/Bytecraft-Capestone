param (
    [Parameter(Mandatory=$true)]
    [string]$AcrName
)

$registryUrl = "$AcrName.azurecr.io"

# List of all your local docker-compose services
$services = @(
    "nextjs",
    "ai-chatbot-service",
    "estimate-service",
    "inventory-service",
    "auth-service",
    "notification-service",
    "report-service",
    "submission-service"
)

# Project prefix docker-compose uses by default
$projectPrefix = "bytecraft-capestone"

Write-Host "Logging into ACR: $AcrName..." -ForegroundColor Cyan
az acr login --name $AcrName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to login to ACR. Please make sure you are logged in to Azure (az login) and the ACR name is correct."
    exit 1
}

foreach ($service in $services) {
    $localImage = "${projectPrefix}-${service}:latest"
    $remoteImage = "${registryUrl}/${projectPrefix}-${service}:latest"

    Write-Host "`nTagging $localImage -> $remoteImage" -ForegroundColor Yellow
    docker tag $localImage $remoteImage

    Write-Host "Pushing $remoteImage to ACR..." -ForegroundColor Yellow
    docker push $remoteImage
}

Write-Host "`nAll images have been successfully pushed to $AcrName!" -ForegroundColor Green
