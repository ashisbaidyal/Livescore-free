param(
  [string]$Message = "Update LiveScoreFree"
)

$ErrorActionPreference = "Stop"

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Run this script inside the LiveScoreFree git repository."
}

git add -A
git diff --cached --quiet
if ($LASTEXITCODE -eq 0) {
  Write-Host "No staged changes to publish."
  exit 0
}

git commit -m $Message
git push
