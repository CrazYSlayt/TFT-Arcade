# TFT Arcade – schneidet die unteren Ecken des Kirmes-Bilds aus (Pinguin links, Geschenke rechts) und lässt die Ränder
# zur Bildmitte und nach oben weich auslaufen (PNG mit Transparenz). Die Startseite legt sie unten links/rechts über das große Bild,
# das bei breiten Bildschirmen unten abgeschnitten wird.  Aufruf: powershell -File tools/bild-ecken.ps1
$root = Split-Path $PSScriptRoot -Parent
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("$root\quellen\arcade-hintergrund-original.png")

function Ecke([int]$x, [int]$y, [int]$w, [int]$h, [string]$seite, [string]$ziel) {
  $b = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($b)
  $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), $x, $y, $w, $h, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  # Deckkraft: oben 0 → nach 40 % der Höhe voll; zur Bildmitte hin (35 % der Breite) auslaufend; ganz unten leicht ausgeblendet
  $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
  $data = $b.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite, $b.PixelFormat)
  $bytes = New-Object byte[] ($data.Stride * $h)
  [System.Runtime.InteropServices.Marshal]::Copy($data.Scan0, $bytes, 0, $bytes.Length)
  for ($py = 0; $py -lt $h; $py++) {
    # 1.0 statt 1: sonst nimmt [math]::Min die Ganzzahl-Variante und rundet den Verlauf weg
    $top = [math]::Min(1.0, $py / ($h * 0.4)); $bottom = [math]::Min(1.0, ($h - $py) / ($h * 0.08))
    for ($px = 0; $px -lt $w; $px++) {
      $inner = if ($seite -eq 'links') { ($w - $px) / ($w * 0.35) } else { $px / ($w * 0.35) }
      $a = [math]::Min(1.0, $inner) * $top * $bottom
      $a = $a * $a * (3 - 2 * $a)   # weicher Verlauf
      $i = $py * $data.Stride + $px * 4 + 3
      $bytes[$i] = [byte]([math]::Round($bytes[$i] * $a))
    }
  }
  [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $data.Scan0, $bytes.Length)
  $b.UnlockBits($data)
  $b.Save($ziel, [System.Drawing.Imaging.ImageFormat]::Png)
  $b.Dispose()
}

Ecke 0 760 400 250 'links' "$root\public\assets\img\ecke-links.png"
Ecke 1196 760 340 250 'rechts' "$root\public\assets\img\ecke-rechts.png"
$src.Dispose()
Write-Host "Ecken gespeichert: public/assets/img/ecke-links.png, ecke-rechts.png"
