param(
  [string]$SourceRoot = "E:\giangnamg.github.io\notion_pages\Private & Shared\WEB SECURITY\PortSwigger",
  [string]$WorkspaceRoot = "E:\giangnamg.github.io",
  [string]$PostsRoot = "E:\giangnamg.github.io\_posts",
  [string]$AssetsRoot = "E:\giangnamg.github.io\assets\img\portswigger"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Remove-Diacritics {
  param([string]$Value)

  $normalized = $Value.Normalize([Text.NormalizationForm]::FormD)
  $builder = New-Object System.Text.StringBuilder

  foreach ($char in $normalized.ToCharArray()) {
    $category = [Globalization.CharUnicodeInfo]::GetUnicodeCategory($char)
    if ($category -ne [Globalization.UnicodeCategory]::NonSpacingMark) {
      [void]$builder.Append($char)
    }
  }

  return $builder.ToString().Replace("đ", "d").Replace("Đ", "D")
}

function Convert-ToSlug {
  param([string]$Value)

  $normalized = Remove-Diacritics -Value $Value
  $normalized = $normalized.ToLowerInvariant()
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

  $regex = [regex]'!\[(?<alt>[^\]]*)\]\((?<target>[^\r\n]+)\)'

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

      return "![{0}]({1})" -f $alt, $siteUrl
    })
}

function Convert-DocumentLinks {
  param(
    [string]$Content,
    [string]$SourceFile,
    [hashtable]$PathMap
  )

  $sourceDir = Split-Path -Parent $SourceFile
  $regex = [regex]'(?<!!)\[(?<text>[^\]]+)\]\((?<target>[^\r\n]+)\)'

  return $regex.Replace($Content, {
      param($match)

      $target = $match.Groups["target"].Value
      if ($target -match "^https://") {
        return $match.Value
      }

      $text = $match.Groups["text"].Value

      if ($target -match "^http://") {
        return ('`' + $text + '`')
      }

      if ($target.StartsWith("/")) {
        return $match.Value
      }

      $decodedTarget = [System.Uri]::UnescapeDataString($target)
      $targetPath = [System.IO.Path]::GetFullPath((Join-Path $sourceDir $decodedTarget))

      if ($PathMap.ContainsKey($targetPath)) {
        return "[{0}]({1})" -f $text, $PathMap[$targetPath]
      }

      return $text
    })
}

function Escape-HtmlOutsideCodeFences {
  param([string]$Content)

  $lines = $Content -split "`r?`n"
  $insideCodeFence = $false

  for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^\s*```') {
      $insideCodeFence = -not $insideCodeFence
      continue
    }

    if (-not $insideCodeFence) {
      $lines[$i] = $lines[$i].Replace("<", "&lt;").Replace(">", "&gt;")
    }
  }

  return ($lines -join "`n")
}

function Remove-ResidualLocalLinkLines {
  param([string]$Content)

  $lines = $Content -split "`r?`n"
  for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match '^\[(?<text>.+)\]\((?<target>[^\r\n]+\.(?:md|csv))\)$') {
      $lines[$i] = $Matches["text"]
    }
  }

  return ($lines -join "`n")
}

function Get-TitleFromFile {
  param([string]$Path)

  $titleLine = Get-Content -LiteralPath $Path -TotalCount 1
  if ($titleLine -notmatch "^#\s+(?<title>.+?)\s*$") {
    throw "Could not find title heading in $Path"
  }

  return $Matches["title"].Trim()
}

function Get-AllPageCandidates {
  param([string]$RootPath)

  $files = Get-ChildItem -LiteralPath $RootPath -Recurse -File -Filter "*.md"
  $rows = foreach ($file in $files) {
    $title = Get-TitleFromFile -Path $file.FullName
    [PSCustomObject]@{
      Title = $title
      Length = (Get-Item -LiteralPath $file.FullName).Length
      Path = $file.FullName
    }
  }

  foreach ($group in ($rows | Group-Object Title)) {
    $group.Group |
      Sort-Object -Property @{ Expression = "Length"; Descending = $true }, @{ Expression = "Path"; Descending = $false } |
      Select-Object -First 1
  }
}

function Get-TopicFromFile {
  param(
    [string]$FilePath,
    [string]$RootPath,
    [string]$Title
  )

  $fullRoot = [System.IO.Path]::GetFullPath($RootPath)
  $fullAbsolute = [System.IO.Path]::GetFullPath($FilePath)
  $relativePath = $fullAbsolute.Substring($fullRoot.Length).TrimStart('\', '/')
  $segments = @($relativePath -split "[\\/]" | Where-Object { $_ -ne "" })

  if ($segments.Count -ge 2) {
    return $segments[0]
  }

  return $Title
}

function Test-IsLabPage {
  param(
    [string]$Title,
    [string]$FilePath
  )

  return $Title -match "^Lab\b" -or $FilePath -match "\\LAB($|\\)" -or $FilePath -match "\\Lab "
}

$pageCandidates = Get-AllPageCandidates -RootPath $SourceRoot | Sort-Object Path
$postDate = "2026-04-08"
$imported = @()
$selectedPages = @()

$generatedPosts = Get-ChildItem -LiteralPath $PostsRoot -File -Filter "*.md" | Where-Object {
  Select-String -LiteralPath $_.FullName -Pattern "^source_collection:\s+notion_portswigger$" -Quiet
}

foreach ($post in $generatedPosts) {
  Remove-Item -LiteralPath $post.FullName -Force
}

if (Test-Path $AssetsRoot) {
  Remove-Item -LiteralPath $AssetsRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $AssetsRoot -Force | Out-Null

$reservedSlugs = @{}
$existingPosts = Get-ChildItem -LiteralPath $PostsRoot -File
foreach ($post in $existingPosts) {
  $content = Get-Content -LiteralPath $post.FullName -TotalCount 20
  if ($content -contains "source_collection: notion_portswigger") {
    continue
  }

  $baseName = [System.IO.Path]::GetFileNameWithoutExtension($post.Name)
  $slug = $baseName -replace '^\d{4}-\d{2}-\d{2}-', ''
  $reservedSlugs[$slug] = $true
}

foreach ($page in $pageCandidates) {
  $title = $page.Title
  $slug = Convert-ToSlug -Value $title
  $topic = Get-TopicFromFile -FilePath $page.Path -RootPath $SourceRoot -Title $title

  if ($reservedSlugs.ContainsKey($slug)) {
    continue
  }

  $selectedPages += [PSCustomObject]@{
    Title = $title
    Slug = $slug
    Topic = $topic
    Path = $page.Path
    SiteUrl = "/posts/$slug/"
  }
}

$pathMap = @{}
foreach ($page in $selectedPages) {
  $pathMap[[System.IO.Path]::GetFullPath($page.Path)] = $page.SiteUrl
}

foreach ($page in $selectedPages) {
  $rawContent = Get-Content -LiteralPath $page.Path -Raw
  $title = $page.Title
  $topic = $page.Topic

  $body = $rawContent
  # Strip only the document title heading, keep all nested headings from the Notion export.
  $body = ([regex]::new("(?m)^#\s+.+?\r?\n+")).Replace($body, "", 1)
  $body = [regex]::Replace($body, "(?im)^(Created|Status|Tags):.*(?:\r?\n)?", "")
  $body = $body.Trim()

  $slug = $page.Slug
  $body = Convert-ImageLinks -Content $body -SourceFile $page.Path -RootPath $WorkspaceRoot -AssetsPath $AssetsRoot -PostSlug $slug
  $body = Convert-DocumentLinks -Content $body -SourceFile $page.Path -PathMap $pathMap
  $body = Remove-ResidualLocalLinkLines -Content $body
  $body = Escape-HtmlOutsideCodeFences -Content $body

  if ([string]::IsNullOrWhiteSpace($body)) {
    $body = "Imported from Notion. This page does not have content yet."
  }

  $tags = @("portswigger", (Convert-ToSlug -Value $topic))
  if (Test-IsLabPage -Title $title -FilePath $page.Path) {
    $tags += "labs"
  }

  $uniqueTags = $tags | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique
  $postPath = Join-Path $PostsRoot "$postDate-$slug.md"

  $frontMatterLines = @(
    "---"
    "layout: post"
    "title: ""$($title.Replace('"', '\"'))"""
    "render_with_liquid: false"
    "categories:"
    "  - Web Security"
    "tags:"
  )

  foreach ($tag in $uniqueTags) {
    $frontMatterLines += "  - $tag"
  }

  $frontMatterLines += @(
    "source_collection: notion_portswigger"
    "---"
    ""
  )

  $frontMatter = $frontMatterLines -join "`n"
  $output = $frontMatter + $body + "`n"
  [System.IO.File]::WriteAllText($postPath, $output, [System.Text.UTF8Encoding]::new($false))

  $imported += [PSCustomObject]@{
    Title = $title
    Topic = $topic
    PostPath = $postPath
  }
}

$imported | Sort-Object PostPath | Format-Table -AutoSize
