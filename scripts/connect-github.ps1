param(
  [Parameter(Mandatory = $true)]
  [string]$RepoUrl
)

$ErrorActionPreference = "Stop"

git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
  throw "Run this script inside the LiveScoreFree git repository."
}

$originExists = $false
try {
  git remote get-url origin *> $null
  $originExists = $true
} catch {
  $originExists = $false
}

if ($originExists) {
  git remote set-url origin $RepoUrl
} else {
  git remote add origin $RepoUrl
}

git branch -M main

Write-Host ""
Write-Host "GitHub remote is ready:"
git remote -v
Write-Host ""
Write-Host "Next step:"
Write-Host "  git push -u origin main"
Write-Host ""
Write-Host "Git Credential Manager will open the GitHub sign-in flow on the first HTTPS push."
