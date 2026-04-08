param(
  [string]$SourceRoot = "E:\giangnamg.github.io\notion_pages\Private & Shared\WEB SECURITY\PortSwigger",
  [string]$WorkspaceRoot = "E:\giangnamg.github.io",
  [string]$PostsRoot = "E:\giangnamg.github.io\_posts",
  [string]$AssetsRoot = "E:\giangnamg.github.io\assets\img\portswigger-labs"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Convert-ToSlug {
  param([string]$Value)

  $normalized = $Value.ToLowerInvariant()
  $normalized = [regex]::Replace($normalized, "[^a-z0-9]+", "-")
  $normalized = $normalized.Trim("-")

  if ([string]::IsNullOrWhiteSpace($normalized)) {
    return "post"
  }

  return $normalized
}

function Convert-ToSiteUrl {
  param(
    [string]$AbsolutePath,
    [string]$RootPath
  )

  $fullRoot = [System.IO.Path]::GetFullPath($RootPath)
  $fullAbsolute = [System.IO.Path]::GetFullPath($AbsolutePath)

  if (-not $fullAbsolute.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Path '$fullAbsolute' is outside root '$fullRoot'"
  }

  $relativePath = $fullAbsolute.Substring($fullRoot.Length).TrimStart('\', '/')
  $segments = $relativePath -split "[\\/]" | Where-Object { $_ -ne "" }
  $encodedSegments = foreach ($segment in $segments) {
    [System.Uri]::EscapeDataString($segment)
  }

  return "/" + ($encodedSegments -join "/")
}

function Convert-ImageLinks {
  param(
    [string]$Content,
    [string]$SourceFile,
    [string]$RootPath,
    [string]$AssetsPath,
    [string]$PostSlug
  )

  $sourceDir = Split-Path -Parent $SourceFile
  $postAssetsDir = Join-Path $AssetsPath $PostSlug
  if (-not (Test-Path $postAssetsDir)) {
    New-Item -ItemType Directory -Path $postAssetsDir -Force | Out-Null
  }

  $regex = [regex]'!\[(?<alt>[^\]]*)\]\((?<target>[^)]+)\)'

  return $regex.Replace($Content, {
      param($match)

      $target = $match.Groups["target"].Value
      if ($target -match "^(?:https?:)?//") {
        return $match.Value
      }

      $decodedTarget = [System.Uri]::UnescapeDataString($target)
      $assetPath = [System.IO.Path]::GetFullPath((Join-Path $sourceDir $decodedTarget))
      $assetName = Split-Path -Leaf $assetPath
      $copiedAssetPath = Join-Path $postAssetsDir $assetName
      Copy-Item -LiteralPath $assetPath -Destination $copiedAssetPath -Force
      $siteUrl = Convert-ToSiteUrl -AbsolutePath $copiedAssetPath -RootPath $RootPath
      $alt = $match.Groups["alt"].Value

      return "![{0}]({{ '{1}' | relative_url }})" -f $alt, $siteUrl
    })
}

function Get-LabFiles {
  param([string]$RootPath)

  $files = Get-ChildItem -LiteralPath $RootPath -Recurse -File -Filter "*.md"

  return $files | Where-Object {
    $firstLine = Get-Content -LiteralPath $_.FullName -TotalCount 1
    $firstLine -match "^#\s+Lab\b" -or $_.DirectoryName -match "\\LAB($|\\)" -or $_.DirectoryName -match "\\Lab "
  } | Sort-Object FullName
}

$labFiles = Get-LabFiles -RootPath $SourceRoot
$postDate = "2026-04-08"
$imported = @()

if (Test-Path $AssetsRoot) {
  Remove-Item -LiteralPath $AssetsRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $AssetsRoot -Force | Out-Null

foreach ($file in $labFiles) {
  $rawContent = Get-Content -LiteralPath $file.FullName -Raw
  $titleMatch = [regex]::Match($rawContent, "(?m)^#\s+(?<title>.+?)\s*$")
  if (-not $titleMatch.Success) {
    throw "Could not find title heading in $($file.FullName)"
  }

  $title = $titleMatch.Groups["title"].Value.Trim()
  $topic = Split-Path -Leaf (Split-Path -Parent (Split-Path -Parent $file.FullName))

  if ($topic -eq "PortSwigger") {
    $topic = Split-Path -Leaf (Split-Path -Parent $file.FullName)
  }

  $body = $rawContent
  $body = [regex]::Replace($body, "(?m)^#\s+.+?\r?\n+", "", 1)
  $body = [regex]::Replace($body, "(?im)^(Created|Status):.*(?:\r?\n)?", "")
  $body = $body.Trim()
  if ([string]::IsNullOrWhiteSpace($body)) {
    $body = "Imported from Notion. This lab page does not have solution content yet."
  }
  $slug = Convert-ToSlug -Value $title
  $body = Convert-ImageLinks -Content $body -SourceFile $file.FullName -RootPath $WorkspaceRoot -AssetsPath $AssetsRoot -PostSlug $slug
  $postPath = Join-Path $PostsRoot "$postDate-$slug.md"

  $frontMatter = @(
    "---"
    "layout: post"
    "title: ""$($title.Replace('"', '\"'))"""
    "categories:"
    "  - PortSwigger"
    "tags:"
    "  - portswigger"
    "  - labs"
    "  - $(Convert-ToSlug -Value $topic)"
    "---"
    ""
  ) -join "`n"

  $output = $frontMatter + $body + "`n"
  [System.IO.File]::WriteAllText($postPath, $output, [System.Text.UTF8Encoding]::new($false))

  $imported += [PSCustomObject]@{
    Title = $title
    Topic = $topic
    PostPath = $postPath
  }
}

$imported | Sort-Object PostPath | Format-Table -AutoSize
