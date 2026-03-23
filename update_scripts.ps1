$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace 'js/script.js(\?v=[0-9\.]+)*', 'js/script.js?v=1.0.1'
    Set-Content -Path $file.FullName -Value $newContent -Encoding UTF8
}
