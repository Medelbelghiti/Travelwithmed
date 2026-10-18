# extract-docx.ps1 - READ ONLY against the content folder.
# Writes structured JSON to tmp/import/*.json. Never touches the source files.
param(
  [string]$Source = "C:\Users\pc\Desktop\ProJ\BLOGGING + PRINT ON DEMAND\Traval Bloggs",
  [string]$Out = "tmp\import"
)
Add-Type -AssemblyName System.IO.Compression.FileSystem
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
New-Item -ItemType Directory -Force -Path $Out | Out-Null

function Get-DocxParagraphs([string]$Path) {
  $zip = [System.IO.Compression.ZipFile]::OpenRead($Path)
  try {
    $entry = $zip.Entries | Where-Object { $_.FullName -eq "word/document.xml" }
    if (-not $entry) { return @() }
    $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
    $xml = $reader.ReadToEnd(); $reader.Close()
  } finally { $zip.Dispose() }

  $paras = @()
  foreach ($m in [regex]::Matches($xml, '<w:p\b[^>]*>[\s\S]*?</w:p>')) {
    $style = [regex]::Match($m.Value, '<w:pStyle w:val="([^"]+)"').Groups[1].Value
    $txt = ([regex]::Matches($m.Value, '<w:t[^>]*>([^<]*)</w:t>') |
            ForEach-Object { $_.Groups[1].Value }) -join ""
    $txt = [System.Net.WebUtility]::HtmlDecode($txt)
    if ($txt.Trim() -ne "") {
      $paras += [pscustomobject]@{ style = $style; text = $txt.Trim() }
    }
  }
  return $paras
}

$docs = Get-ChildItem -LiteralPath $Source -Recurse -Filter "*.docx"
$report = @()
$i = 0
foreach ($d in $docs) {
  $i++
  $paras = Get-DocxParagraphs $d.FullName
  $words = ((($paras | ForEach-Object { $_.text }) -join " ") -split '\s+' |
            Where-Object { $_ -ne '' }).Count
  $headings = ($paras | Where-Object { $_.style -like "Heading*" }).Count
  $rel = $d.FullName.Substring($Source.Length).TrimStart('\')
  $base = "doc$($i.ToString('00'))"
  $obj = [pscustomobject]@{
    id          = $base
    source      = $rel
    file        = $d.Name
    dir         = $d.Directory.FullName
    wordCount   = $words
    headingCount= $headings
    paragraphs  = $paras
  }
  $obj | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $Out "$base.json") -Encoding UTF8
  $report += [pscustomobject]@{
    id = $base; words = $words; heads = $headings; file = $d.Name
  }
}
$report | Format-Table -AutoSize
$report | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $Out "_manifest.json") -Encoding UTF8
Write-Output "OK - $($docs.Count) docx extraits vers $Out"
