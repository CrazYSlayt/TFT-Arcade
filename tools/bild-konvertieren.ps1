# TFT Arcade – rechnet Champion-Bilder auf 960x480 JPG um (aufgerufen von tools/champions.js).
# mode 'wide': großes Splash-Bild (2:1) verkleinern
# mode 'tile': quadratische Kachel mittig auf einen verschwommenen, abgedunkelten Hintergrund aus derselben Kachel setzen
param([string]$JobFile)
Add-Type -AssemblyName System.Drawing
$jobs = Get-Content $JobFile -Raw -Encoding UTF8 | ConvertFrom-Json
$codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$params = New-Object System.Drawing.Imaging.EncoderParameters 1
$params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), ([long]80)
$W = 960; $H = 480

foreach ($j in $jobs) {
  $src = [System.Drawing.Image]::FromFile($j.src)
  $out = New-Object System.Drawing.Bitmap $W, $H
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.SmoothingMode = 'HighQuality'
  if ($j.mode -eq 'wide') {
    # auf 2:1 zuschneiden (falls nötig) und verkleinern
    $sh = [math]::Min($src.Height, [math]::Floor($src.Width / 2)); $sw = $sh * 2
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $W, $H), [math]::Floor(($src.Width - $sw) / 2), 0, $sw, $sh, [System.Drawing.GraphicsUnit]::Pixel)
  } else {
    # Hintergrund: stark verkleinert und wieder vergrößert = weichgezeichnet, dann abgedunkelt
    $small = New-Object System.Drawing.Bitmap 24, 12
    $gs = [System.Drawing.Graphics]::FromImage($small); $gs.InterpolationMode = 'HighQualityBicubic'
    $gs.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, 24, 12), 0, [math]::Floor($src.Height / 4), $src.Width, [math]::Floor($src.Height / 2), [System.Drawing.GraphicsUnit]::Pixel); $gs.Dispose()
    $g.DrawImage($small, (New-Object System.Drawing.Rectangle -40, -20, ($W + 80), ($H + 40)))
    $small.Dispose()
    $shade = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(110, 10, 4, 20))
    $g.FillRectangle($shade, 0, 0, $W, $H); $shade.Dispose()
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle (($W - $H) / 2), 0, $H, $H))
  }
  $g.Dispose()
  $out.Save($j.out, $codec, $params)
  $out.Dispose(); $src.Dispose()
}
Write-Host "  $($jobs.Count) Bilder umgerechnet"
