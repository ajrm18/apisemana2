# Verifica el contrato JSON Schema de POST /api/v1/productos y el script de compatibilidad.
# Uso:
#   .\scripts\verificar-contrato.ps1                                        # local
#   .\scripts\verificar-contrato.ps1 -BaseUrl https://apisemana2.onrender.com
param(
  [string]$BaseUrl = 'http://localhost:3000'
)

$ErrorActionPreference = 'Stop'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$BaseUrl = $BaseUrl.TrimEnd('/')
$api = "$BaseUrl/api/v1/productos"
$raiz = Split-Path -Parent $PSScriptRoot
$resultados = New-Object System.Collections.Generic.List[object]
$creados = New-Object System.Collections.Generic.List[int]

function Invocar([string]$Metodo, [string]$Url, [string]$Cuerpo) {
  $params = @{ Uri = $Url; Method = $Metodo; UseBasicParsing = $true; TimeoutSec = 120 }
  if ($Cuerpo) {
    $params.Body = [Text.Encoding]::UTF8.GetBytes($Cuerpo)
    $params.ContentType = 'application/json; charset=utf-8'
  }
  try {
    $r = Invoke-WebRequest @params
    return @{ Codigo = [int]$r.StatusCode; Cuerpo = $r.Content; Location = $r.Headers['Location'] }
  } catch {
    $resp = $_.Exception.Response
    if (-not $resp) { throw }
    # PowerShell 5.1 deja el cuerpo del error en ErrorDetails; PowerShell 7 tambien.
    $cuerpo = $null
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
      $cuerpo = $_.ErrorDetails.Message
    } else {
      try {
        $lector = New-Object IO.StreamReader($resp.GetResponseStream())
        $cuerpo = $lector.ReadToEnd()
      } catch { $cuerpo = '' }
    }
    return @{ Codigo = [int]$resp.StatusCode; Cuerpo = $cuerpo; Location = $null }
  }
}

function Registrar([string]$Caso, [string]$Esperado, [string]$Obtenido, [bool]$Ok, [string]$Detalle) {
  $resultados.Add([pscustomobject]@{
    Resultado = $(if ($Ok) { 'PASS' } else { 'FAIL' })
    Caso      = $Caso
    Esperado  = $Esperado
    Obtenido  = $Obtenido
  })
  Write-Host ("[{0}] {1}" -f $(if ($Ok) { 'PASS' } else { 'FAIL' }), $Caso)
  Write-Host ("       -> HTTP {0}  {1}" -f $Obtenido, $Detalle)
}

Write-Host "=== verificar-contrato.ps1 contra $BaseUrl - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz') ==="
Write-Host "Despertando el servicio (Render gratis puede tardar ~1 min en el arranque en frio)..."
$salud = Invocar 'GET' "$BaseUrl/api/v1/health" $null
Registrar 'GET /api/v1/health' '200' "$($salud.Codigo)" ($salud.Codigo -eq 200) $salud.Cuerpo

$casos400 = @(
  @{ Caso = 'POST sin precio';            Cuerpo = '{"nombre":"Auriculares"}';                          Keyword = 'required' },
  @{ Caso = 'POST con campo stock';       Cuerpo = '{"nombre":"Auriculares","precio":10,"stock":5}';    Keyword = 'additionalProperties' },
  @{ Caso = 'POST con precio negativo';   Cuerpo = '{"nombre":"Auriculares","precio":-1}';              Keyword = 'minimum' },
  @{ Caso = 'POST con categoria invalida'; Cuerpo = '{"nombre":"Pelota","precio":5,"categoria":"juguetes"}'; Keyword = 'enum' }
)
foreach ($c in $casos400) {
  $r = Invocar 'POST' $api $c.Cuerpo
  $kw = $null
  try { $kw = (($r.Cuerpo | ConvertFrom-Json).errores | Select-Object -First 1).keyword } catch {}
  $ok = ($r.Codigo -eq 400) -and ($kw -eq $c.Keyword)
  Registrar $c.Caso "400 / $($c.Keyword)" "$($r.Codigo) / $kw" $ok $r.Cuerpo
}

$casos201 = @(
  @{ Caso = 'POST formato v1 (sin categoria)';   Cuerpo = '{"nombre":"Verificacion v1","precio":10}' },
  @{ Caso = 'POST con categoria "electronica"';  Cuerpo = '{"nombre":"Verificacion v2","precio":899.99,"categoria":"electronica"}' }
)
foreach ($c in $casos201) {
  $r = Invocar 'POST' $api $c.Cuerpo
  $ok = ($r.Codigo -eq 201) -and ($r.Location -match '^/api/v1/productos/\d+$')
  if ($r.Codigo -eq 201) { $creados.Add([int](($r.Cuerpo | ConvertFrom-Json).id)) }
  Registrar $c.Caso '201 + Location' "$($r.Codigo) $($r.Location)" $ok $r.Cuerpo
}

$esquemas = Join-Path $raiz 'src\productos\schemas'
$script = Join-Path $raiz 'check-compatibility.js'
$pares = @(
  @{ Caso = 'check-compatibility v1 -> v2';          A = 'producto.schema.json';    B = 'producto.schema.v2.json';          Esperado = $true },
  @{ Caso = 'check-compatibility v2 -> v3-breaking'; A = 'producto.schema.v2.json'; B = 'producto.schema.v3-breaking.json'; Esperado = $false }
)
foreach ($p in $pares) {
  $salida = (& node $script (Join-Path $esquemas $p.A) (Join-Path $esquemas $p.B)) -join "`n"
  $res = $salida | ConvertFrom-Json
  $ok = ($res.compatible -eq $p.Esperado)
  Registrar $p.Caso "compatible: $($p.Esperado.ToString().ToLower())" "compatible: $($res.compatible.ToString().ToLower())" $ok (($res.problemas) -join '; ')
}

# Limpieza: borra los productos creados por la verificacion.
foreach ($id in $creados) { $null = Invocar 'DELETE' "$api/$id" $null }
if ($creados.Count -gt 0) { Write-Host "Limpieza: borrados los productos de prueba $($creados -join ', ')" }

Write-Host ''
$resultados | Format-Table -AutoSize | Out-String -Width 200 | Write-Host
$fallos = @($resultados | Where-Object { $_.Resultado -eq 'FAIL' }).Count
$total = $resultados.Count
Write-Host ("Resumen: PASS {0}/{1}" -f ($total - $fallos), $total)
if ($fallos -gt 0) { exit 1 }
