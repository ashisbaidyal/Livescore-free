param(
  [string]$BaseUrl = "https://livescorefree.online",
  [string]$OutputPath = "sitemap.xml"
)

$ErrorActionPreference = "Stop"

function Normalize-Path([string]$path) {
  if ([string]::IsNullOrWhiteSpace($path) -or $path -eq "/") {
    return ""
  }
  if (-not $path.StartsWith("/")) {
    return "/" + $path
  }
  return $path
}

function Build-Loc([string]$base, [string]$path) {
  $normalized = Normalize-Path $path
  if ([string]::IsNullOrWhiteSpace($normalized)) {
    return $base
  }
  return $base.TrimEnd("/") + $normalized
}

function New-UrlEntry([string]$loc, [string]$lastmod, [string]$changefreq, [string]$priority) {
  return @"
  <url>
    <loc>$loc</loc>
    <lastmod>$lastmod</lastmod>
    <changefreq>$changefreq</changefreq>
    <priority>$priority</priority>
  </url>
"@.TrimEnd()
}

$today = (Get-Date).ToString("yyyy-MM-dd")

$staticMtime = (Get-ChildItem -Path "index.html","app.js","styles.css" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1).LastWriteTime
$staticDate = if ($staticMtime) { $staticMtime.ToString("yyyy-MM-dd") } else { $today }

$coreRoutes = @(
  @{ path = "/"; changefreq = "daily"; priority = "1.0"; lastmod = $today },
  @{ path = "/home"; changefreq = "daily"; priority = "1.0"; lastmod = $today },
  @{ path = "/live"; changefreq = "hourly"; priority = "1.0"; lastmod = $today },
  @{ path = "/upcoming"; changefreq = "daily"; priority = "0.9"; lastmod = $today },
  @{ path = "/trending"; changefreq = "hourly"; priority = "0.9"; lastmod = $today },
  @{ path = "/results"; changefreq = "daily"; priority = "0.8"; lastmod = $today },
  @{ path = "/history"; changefreq = "weekly"; priority = "0.7"; lastmod = $today },
  @{ path = "/top-leagues"; changefreq = "weekly"; priority = "0.8"; lastmod = $today }
)

$sports = @("football", "cricket", "basketball", "tennis", "nfl", "hockey", "baseball", "rugby", "mma", "f1")
$leagues = @("eng.1", "esp.1", "uefa.champions", "ita.1", "ger.1", "fra.1", "ned.1", "cricket", "nba", "ncaamb", "tennis", "nfl", "nhl", "mlb", "rugby", "mma", "f1")
$leagueSections = @("live", "upcoming", "results", "history", "teams", "players", "schedule")

$sportRoutes = foreach ($sport in $sports) {
  @{ path = "/sport/$sport"; changefreq = "daily"; priority = "0.7"; lastmod = $today }
}

$leagueRoutes = foreach ($league in $leagues) {
  @{ path = "/league/$league"; changefreq = "daily"; priority = "0.7"; lastmod = $today }
}

$leagueSectionRoutes = foreach ($league in $leagues) {
  foreach ($section in $leagueSections) {
    $freq = if ($section -in @("live","upcoming","results")) { "daily" } else { "weekly" }
    @{ path = "/league/$league/$section"; changefreq = $freq; priority = "0.6"; lastmod = $today }
  }
}

$communityRoutes = @(
  @{ path = "/donate"; changefreq = "monthly"; priority = "0.5"; lastmod = $staticDate },
  @{ path = "/advertise"; changefreq = "monthly"; priority = "0.5"; lastmod = $staticDate },
  @{ path = "/feedback"; changefreq = "yearly"; priority = "0.3"; lastmod = $staticDate },
  @{ path = "/about"; changefreq = "yearly"; priority = "0.5"; lastmod = $staticDate },
  @{ path = "/contact"; changefreq = "yearly"; priority = "0.3"; lastmod = $staticDate }
)

$legalRoutes = @(
  @{ path = "/privacy-policy"; changefreq = "yearly"; priority = "0.3"; lastmod = $staticDate },
  @{ path = "/terms-of-service"; changefreq = "yearly"; priority = "0.3"; lastmod = $staticDate },
  @{ path = "/data-sources"; changefreq = "yearly"; priority = "0.3"; lastmod = $staticDate },
  @{ path = "/dmca-policy"; changefreq = "yearly"; priority = "0.3"; lastmod = $staticDate }
)

$allEntries = @()
$allEntries += $coreRoutes
$allEntries += $sportRoutes
$allEntries += $leagueRoutes
$allEntries += $leagueSectionRoutes
$allEntries += $communityRoutes
$allEntries += $legalRoutes

$seen = [System.Collections.Generic.HashSet[string]]::new()
$xmlEntries = @()
foreach ($entry in $allEntries) {
  $loc = Build-Loc $BaseUrl $entry.path
  if (-not $seen.Add($loc)) {
    continue
  }
  $xmlEntries += (New-UrlEntry $loc $entry.lastmod $entry.changefreq $entry.priority)
}

$sitemap = @"
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
$($xmlEntries -join "`n")
</urlset>
"@

Set-Content -Path $OutputPath -Value $sitemap -Encoding UTF8
Write-Host "Sitemap written to $OutputPath"
