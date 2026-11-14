#!/usr/bin/env bash
# Verifica el contrato JSON Schema de POST /api/v1/productos y el script de compatibilidad.
# Uso: bash scripts/verificar-contrato.sh [URL_BASE]   (por defecto http://localhost:3000)
set -u
BASE="${1:-http://localhost:3000}"
BASE="${BASE%/}"
API="$BASE/api/v1/productos"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
ESQ="$RAIZ/src/productos/schemas"
TABLA=""
FALLOS=0
TOTAL=0
CREADOS=""

registrar() { # resultado caso esperado obtenido
  TOTAL=$((TOTAL + 1))
  [ "$1" = PASS ] || FALLOS=$((FALLOS + 1))
  TABLA+=$(printf '%-5s | %-38s | %-24s | %s' "$1" "$2" "$3" "$4")$'\n'
  printf '[%s] %s -> %s\n' "$1" "$2" "$4"
}

# Lee un campo con node (sin depender de jq).
campo() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s);const v=$1;console.log(v===undefined?'':v)}catch{console.log('')}})"; }

echo "=== verificar-contrato.sh contra $BASE - $(date '+%Y-%m-%d %H:%M:%S %z') ==="
codigo=$(curl -s -o /dev/null -w '%{http_code}' --max-time 120 "$BASE/api/v1/health")
[ "$codigo" = 200 ] && r=PASS || r=FAIL
registrar $r "GET /api/v1/health" "200" "$codigo"

probar400() { # caso cuerpo keyword
  local salida cod cuerpo kw
  salida=$(curl -s -w $'\n%{http_code}' --max-time 60 -X POST "$API" -H 'Content-Type: application/json' -d "$2")
  cod=$(printf '%s' "$salida" | tail -n1)
  cuerpo=$(printf '%s' "$salida" | sed '$d')
  kw=$(printf '%s' "$cuerpo" | campo "o.errores && o.errores[0].keyword")
  echo "       cuerpo: $cuerpo"
  [ "$cod" = 400 ] && [ "$kw" = "$3" ] && r=PASS || r=FAIL
  registrar $r "$1" "400 / $3" "$cod / $kw"
}
probar400 "POST sin precio" '{"nombre":"Auriculares"}' required
probar400 "POST con campo stock" '{"nombre":"Auriculares","precio":10,"stock":5}' additionalProperties
probar400 "POST con precio negativo" '{"nombre":"Auriculares","precio":-1}' minimum
probar400 "POST con categoria invalida" '{"nombre":"Pelota","precio":5,"categoria":"juguetes"}' enum

probar201() { # caso cuerpo
  local salida cod cuerpo loc id
  salida=$(curl -s -i --max-time 60 -X POST "$API" -H 'Content-Type: application/json' -d "$2" | tr -d '\r')
  cod=$(printf '%s' "$salida" | head -n1 | awk '{print $2}')
  loc=$(printf '%s' "$salida" | grep -i '^location:' | awk '{print $2}')
  cuerpo=$(printf '%s' "$salida" | tail -n1)
  id=$(printf '%s' "$cuerpo" | campo "o.id")
  [ -n "$id" ] && CREADOS="$CREADOS $id"
  echo "       cuerpo: $cuerpo"
  [ "$cod" = 201 ] && [[ "$loc" =~ ^/api/v1/productos/[0-9]+$ ]] && r=PASS || r=FAIL
  registrar $r "$1" "201 + Location" "$cod $loc"
}
probar201 "POST formato v1 (sin categoria)" '{"nombre":"Verificacion v1","precio":10}'
probar201 'POST con categoria "electronica"' '{"nombre":"Verificacion v2","precio":899.99,"categoria":"electronica"}'

compat() { # caso a b esperado
  local c
  c=$(node "$RAIZ/check-compatibility.js" "$ESQ/$2" "$ESQ/$3" | campo "o.compatible")
  [ "$c" = "$4" ] && r=PASS || r=FAIL
  registrar $r "$1" "compatible: $4" "compatible: $c"
}
compat "check-compatibility v1 -> v2" producto.schema.json producto.schema.v2.json true
compat "check-compatibility v2 -> v3-breaking" producto.schema.v2.json producto.schema.v3-breaking.json false

for id in $CREADOS; do curl -s -o /dev/null -X DELETE "$API/$id"; done
[ -n "$CREADOS" ] && echo "Limpieza: borrados los productos de prueba$CREADOS"

echo
printf '%-5s | %-38s | %-24s | %s\n' Res Caso Esperado Obtenido
printf '%s' "$TABLA"
echo "Resumen: PASS $((TOTAL - FALLOS))/$TOTAL"
[ "$FALLOS" -eq 0 ]
