# TFT Arcade – schneidet die zehn Charaktere (2 Reihen × 5, freigestellt) aus quellen/avatare/charaktere.png einzeln aus.
# Der Schleier aus fast durchsichtigen Pixeln rund um die Figuren (Alpha unter -Schwelle) wird entfernt, darüber bleibt die
# Kante weich (Alpha wird von -Schwelle bis -Voll auf 0–255 gestreckt). Jede Figur landet zentriert, unten bündig auf einer
# quadratischen Fläche: tools/cache/avatare/<id>.png (-Groesse × -Groesse). Danach: node tools/rahmen-webp.js <Groesse> <Groesse> avatare
# Reihenfolge der Namen = Reihenfolge im Bild (oben links nach unten rechts), muss zu src/config/avatare.js passen.
param([int]$Schwelle = 48, [int]$Voll = 140, [int]$Groesse = 256)
$root = Split-Path $PSScriptRoot -Parent
$src = "$root\quellen\avatare\charaktere.png"
$out = "$root\tools\cache\avatare"
$ids = 'kronenpinguin', 'flatterbaer', 'schuerfi', 'puschel', 'schnabeltier', 'wolkenschaf', 'federritter', 'runengolem', 'greifling', 'zottelbock'
Remove-Item "$out\*.png" -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $out | Out-Null

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @'
using System; using System.Drawing; using System.Drawing.Imaging; using System.Runtime.InteropServices; using System.Collections.Generic;
public static class Figuren {
  static byte[] px; static int stride, W, H;
  // Schleier entfernen und Alpha strecken, Ergebnis direkt im Bild
  public static void Clean(Bitmap b, int t, int full) {
    W = b.Width; H = b.Height;
    var d = b.LockBits(new Rectangle(0, 0, W, H), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    stride = d.Stride; px = new byte[stride * H]; Marshal.Copy(d.Scan0, px, 0, px.Length);
    for (int i = 3; i < px.Length; i += 4) {
      int a = px[i];
      px[i] = (byte)(a < t ? 0 : a >= full ? 255 : (a - t) * 255 / (full - t));
      if (px[i] == 0) { px[i - 1] = 0; px[i - 2] = 0; px[i - 3] = 0; }
    }
    Marshal.Copy(px, 0, d.Scan0, px.Length); b.UnlockBits(d);
  }
  static int A(int x, int y) { return px[y * stride + x * 4 + 3]; }
  // Lücken: zusammenhängende Bereiche ohne deckende Pixel entlang einer Achse; liefert die Abschnitte mit Inhalt
  public static List<int[]> Spans(bool alongX, int a0, int a1, int b0, int b1, int minGap) {
    var res = new List<int[]>(); int start = -1, gap = 0;
    for (int a = a0; a < a1; a++) {
      bool any = false;
      for (int c = b0; c < b1 && !any; c++) any = (alongX ? A(a, c) : A(c, a)) > 0;
      if (any) { if (start < 0) start = a; gap = 0; }
      else if (start >= 0 && ++gap >= minGap) { res.Add(new[] { start, a - gap }); start = -1; gap = 0; }
    }
    if (start >= 0) res.Add(new[] { start, a1 - 1 - gap });
    return res;
  }
  public static int[] Box(int x0, int y0, int x1, int y1) {
    int l = x1, r = x0, o = y1, u = y0;
    for (int y = y0; y < y1; y++) for (int x = x0; x < x1; x++) if (A(x, y) > 0) { if (x < l) l = x; if (x > r) r = x; if (y < o) o = y; if (y > u) u = y; }
    return new[] { l, o, r, u };
  }
}
'@

$img = [System.Drawing.Bitmap]::FromFile($src)
[Figuren]::Clean($img, $Schwelle, $Voll)
# Reihen über waagerechte Lücken, darin Figuren über senkrechte Lücken (kleine Splitter < 40 px werden ignoriert)
$rows = [Figuren]::Spans($false, 0, $img.Height, 0, $img.Width, 6) | Where-Object { $_[1] - $_[0] -gt 100 }
$n = 0
foreach ($r in $rows) {
  $cols = [Figuren]::Spans($true, 0, $img.Width, $r[0], $r[1] + 1, 6) | Where-Object { $_[1] - $_[0] -gt 40 }
  foreach ($c in $cols) {
    $b = [Figuren]::Box($c[0], $r[0], $c[1] + 1, $r[1] + 1)
    $w = $b[2] - $b[0] + 1; $h = $b[3] - $b[1] + 1
    $id = if ($n -lt $ids.Count) { $ids[$n] } else { "figur-$n" }
    # auf quadratische Fläche: 4 % Rand, unten bündig, waagerecht mittig
    $pad = [int]($Groesse * .04); $s = [Math]::Min(($Groesse - 2 * $pad) / $w, ($Groesse - $pad) / $h)
    $dw = [int]($w * $s); $dh = [int]($h * $s)
    $sq = New-Object System.Drawing.Bitmap $Groesse, $Groesse, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($sq)
    $g.InterpolationMode = 'HighQualityBicubic'; $g.PixelOffsetMode = 'HighQuality'; $g.CompositingQuality = 'HighQuality'
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle ([int](($Groesse - $dw) / 2)), ($Groesse - $dh), $dw, $dh), (New-Object System.Drawing.Rectangle $b[0], $b[1], $w, $h), 'Pixel')
    $g.Dispose()
    $sq.Save("$out\$id.png", [System.Drawing.Imaging.ImageFormat]::Png); $sq.Dispose()
    "$id`: ${w}x${h} ab $($b[0]),$($b[1])"
    $n++
  }
}
$img.Dispose()
if ($n -ne $ids.Count) { Write-Warning "$n Figuren gefunden, erwartet $($ids.Count): -Schwelle anpassen" }
