# Deploys origin/main to a12.uz. The first run asks for the server password once to
# authorise this PC's SSH key; later runs (and Claude) deploy without a password.
$ErrorActionPreference = 'Stop'
$server = 'root@169.58.135.28'
$key = Join-Path $env:USERPROFILE '.ssh\id_ed25519.pub'

ssh -o BatchMode=yes -o ConnectTimeout=8 $server exit 2>$null
if ($LASTEXITCODE -ne 0) {
  if (-not (Test-Path $key)) { throw "No SSH key at $key. Run: ssh-keygen -t ed25519" }
  Write-Host 'Authorising this PC on the server (enter the server password once)...'
  Get-Content $key | ssh $server 'mkdir -p ~/.ssh && chmod 700 ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys'
  if ($LASTEXITCODE -ne 0) { throw 'Could not add the SSH key.' }
}

ssh $server @'
set -e
cd /opt/webpul
if [ ! -d .git ]; then echo "/opt/webpul is not a git checkout; ask Claude to upload the code instead."; exit 2; fi
git pull --ff-only origin main
cd deploy
docker compose build
docker compose up -d
docker compose ps
'@
if ($LASTEXITCODE -ne 0) { throw "Deploy failed (exit $LASTEXITCODE)." }

foreach ($url in 'https://a12.uz/business', 'https://a12.uz/widget/latest/a12.js') {
  $code = (Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 20).StatusCode
  Write-Host "$code $url"
}
Write-Host 'Done.'
