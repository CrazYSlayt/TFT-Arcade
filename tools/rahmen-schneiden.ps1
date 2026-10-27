# TFT Arcade – schneidet die vier Buden-Rahmen (2×2 Raster mit Transparenz: violett, rot / türkis, gold) einzeln aus
# und misst Fenster und Namensleiste aus. Ergebnis: tools/cache/rahmen/<farbe>.png + Maße in der Konsole.
# Danach wandelt tools/rahmen-webp.js die PNGs in WebP um (siehe README).
# Aufruf: powershell -File tools/rahmen-schneiden.ps1 [-Datei buden-rahmen-2.png] [-Trenn 610]
#   -Trenn = Trennlinie zwischen oberer und unterer Reihe (Sternspitzen/Dachspitzen dürfen nicht abgeschnitten werden)
param([string]$Datei = 'buden-rahmen-2.png', [int]$Trenn = 610)
$root = Split-Path $PSScriptRoot -Parent
$src = "$root\quellen\rahmen\$Datei"
$out = "$root\tools\cache\rahmen"
Remove-Item "$out\*.png" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $out | Out-Null

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices;
public static class Rahmen {
  static byte[] px; static int stride, W, H;
  public static void Load(Bitmap b) {
    W = b.Width; H = b.Height;
    var d = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadOnly, PixelFormat.Format32bppArgb);
    stride = d.Stride; px = new byte[stride * H]; Marshal.Copy(d.Scan0, px, 0, px.Length); b.UnlockBits(d);
  }
  public static int A(int x, int y) { return px[y * stride + x * 4 + 3]; }
  // umschließendes Rechteck aller deckenden Pixel (Alpha >= t) im Bereich
  public static int[] Box(int x0, int y0, int x1, int y1, int t) {
    x1 = Math.Min(x1, W); y1 = Math.Min(y1, H);
    int l = x1, r = x0, o = y1, u = y0;
    for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) if (A(x, y) >= t) { if (x < l) l = x; if (x > r) r = x; if (y < o) o = y; if (y > u) u = y; }
    return new int[] { l, o, r, u };
  }
  // Wechsel zwischen durchsichtig und deckend entlang einer Linie
  public static string Row(int y, int x0, int x1) { var s = ""; bool last = false; for (int x = x0; x < x1; x++) { bool on = A(x, y) >= 128; if (on != last) { s += (on ? " +" : " -") + (x - x0); last = on; } } return s; }
  public static string Col(int x, int y0, int y1) { var s = ""; bool last = false; for (int y = y0; y < y1; y++) { bool on = A(x, y) >= 128; if (on != last) { s += (on ? " +" : " -") + (y - y0); last = on; } } return s; }
}
'@

$img = [System.Drawing.Bitmap]::FromFile($src)
[Rahmen]::Load($img)
$hw = [int]($img.Width / 2)
$split = $Trenn
$cells = @(
  @{ name = 'violett'; x = 0;   y = 0;      h = $split }, @{ name = 'rot';  x = $hw; y = 0;      h = $split },
  @{ name = 'tuerkis'; x = 0;   y = $split; h = $img.Height - $split }, @{ name = 'gold'; x = $hw; y = $split; h = $img.Height - $split }
)
foreach ($c in $cells) {
  $b = [Rahmen]::Box($c.x, $c.y, $c.x + $hw, $c.y + $c.h, 40)
  $w = $b[2] - $b[0] + 1; $h = $b[3] - $b[1] + 1
  $crop = $img.Clone((New-Object System.Drawing.Rectangle $b[0], $b[1], $w, $h), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $crop.Save("$out\$($c.name).png", [System.Drawing.Imaging.ImageFormat]::Png); $crop.Dispose()
  "$($c.name): ${w}x${h} (ab $($b[0]),$($b[1]))"
  # Linien durch Fenstermitte (waagerecht) und Bildmitte (senkrecht)
  foreach ($p in .5, .6, .85) { "  Zeile $($p*100)%:  " + [Rahmen]::Row($b[1] + [int]($h * $p), $b[0], $b[2] + 1) }
  foreach ($p in .5, .3, .15) { "  Spalte $($p*100)%: " + [Rahmen]::Col($b[0] + [int]($w * $p), $b[1], $b[3] + 1) }
}
$img.Dispose()
