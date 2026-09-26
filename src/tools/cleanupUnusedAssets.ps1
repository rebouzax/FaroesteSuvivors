param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$assetRoot = [IO.Path]::GetFullPath((Join-Path $projectRoot 'src/assets')) + [IO.Path]::DirectorySeparatorChar
$manifest = Get-Content -LiteralPath (Join-Path $projectRoot 'art-generation-manifest.json') -Raw | ConvertFrom-Json
$removals = @()
foreach ($asset in $manifest.assets) {
    $target = [IO.Path]::GetFullPath((Join-Path $projectRoot $asset.destination))
    if (!(Test-Path -LiteralPath $target)) { continue }
    if (!$target.StartsWith($assetRoot, [StringComparison]::OrdinalIgnoreCase)) { throw "Outside assets: $target" }
    $webp = [IO.Path]::ChangeExtension($target, '.webp')
    if (!(Test-Path -LiteralPath $webp) -or !(Test-Path -LiteralPath $asset.source)) { throw "Missing replacement or original: $target" }
    $hash = (Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash
    if ($hash -ne (Get-FileHash -LiteralPath $asset.source -Algorithm SHA256).Hash) { throw "Source differs: $target" }
    $removals += [PSCustomObject]@{ path=$target; bytes=(Get-Item -LiteralPath $target).Length; sha256=$hash; recovery=$asset.source }
}
foreach ($name in @('bat.wav','desert-western.wav','menu-western.wav','one-bullet-left.mp3','the-outlaws-last-prayer.mp3','vultures-circle-the-bone.mp3')) {
    $relative = "src/assets/audio/$name"
    $target = [IO.Path]::GetFullPath((Join-Path $projectRoot $relative))
    if (!(Test-Path -LiteralPath $target)) { continue }
    if (!$target.StartsWith($assetRoot, [StringComparison]::OrdinalIgnoreCase)) { throw "Outside assets: $target" }
    $original = & git -C $projectRoot rev-parse "HEAD:$relative"
    if ($LASTEXITCODE -ne 0) { throw "No Git recovery for $relative" }
    $current = & git -C $projectRoot hash-object -- $relative
    if ($LASTEXITCODE -ne 0 -or $current -ne $original) { throw "Modified audio: $relative" }
    $removals += [PSCustomObject]@{ path=$target; bytes=(Get-Item -LiteralPath $target).Length; sha256=(Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash; recovery="Git blob $original" }
}
foreach ($item in $removals) {
    $references = & rg -l -F --glob '*.js' --glob '*.mjs' --glob '*.css' --glob '*.html' --glob '*.py' -- ([IO.Path]::GetFileName($item.path)) (Join-Path $projectRoot 'src')
    if ($LASTEXITCODE -eq 0) { throw "Still referenced: $($item.path) in $references" }
    if ($LASTEXITCODE -gt 1) { throw 'Reference scan failed' }
}
$removals | Select-Object path,bytes,recovery | Format-Table -AutoSize
Write-Output "Bytes to reclaim: $(($removals | Measure-Object -Property bytes -Sum).Sum)"
if ($Apply -and $removals.Count -gt 0) {
    $removals | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $projectRoot 'asset-cleanup-receipt.json') -Encoding utf8
    foreach ($item in $removals) { Remove-Item -LiteralPath $item.path }
}
