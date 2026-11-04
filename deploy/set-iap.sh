#!/bin/bash
# Stores the App Store / Google Play keys that let the server confirm in-app purchases.
# First copy the key files to the server, e.g. from your computer:
#   scp google-play.json AuthKey_XXXX.p8 root@169.58.135.28:/root/
# then run:  ssh -t root@169.58.135.28 bash /opt/webpul/deploy/set-iap.sh
set -euo pipefail
cd "$(dirname "$0")"
ENV_FILE=.env

read -r -p 'Google Play service account JSON fayli [/root/google-play.json] (o‘tkazib yuborish: -): ' GOOGLE_FILE
GOOGLE_FILE=${GOOGLE_FILE:-/root/google-play.json}
read -r -p 'Apple .p8 kalit fayli (o‘tkazib yuborish: -): ' APPLE_FILE
APPLE_FILE=${APPLE_FILE:--}

declare -A NEW=()
if [ "$GOOGLE_FILE" != "-" ]; then
  [ -f "$GOOGLE_FILE" ] || { echo "Fayl topilmadi: $GOOGLE_FILE"; exit 1; }
  grep -q '"client_email"' "$GOOGLE_FILE" && grep -q '"private_key"' "$GOOGLE_FILE" || { echo "Bu service account JSON emas."; exit 1; }
  NEW[GOOGLE_PLAY_SERVICE_ACCOUNT]=$(base64 -w0 "$GOOGLE_FILE")
fi
if [ "$APPLE_FILE" != "-" ]; then
  [ -f "$APPLE_FILE" ] || { echo "Fayl topilmadi: $APPLE_FILE"; exit 1; }
  grep -q 'BEGIN PRIVATE KEY' "$APPLE_FILE" || { echo "Bu .p8 kalit emas."; exit 1; }
  read -r -p 'Apple Key ID (10 belgi): ' KEY_ID
  read -r -p 'Apple Issuer ID (UUID): ' ISSUER_ID
  [[ "$KEY_ID" =~ ^[A-Z0-9]{10}$ ]] || { echo "Key ID noto‘g‘ri."; exit 1; }
  [[ "$ISSUER_ID" =~ ^[0-9a-f-]{36}$ ]] || { echo "Issuer ID noto‘g‘ri."; exit 1; }
  NEW[APPLE_IAP_PRIVATE_KEY]=$(base64 -w0 "$APPLE_FILE")
  NEW[APPLE_IAP_KEY_ID]=$KEY_ID
  NEW[APPLE_IAP_ISSUER_ID]=$ISSUER_ID
fi
[ ${#NEW[@]} -gt 0 ] || { echo "Hech narsa o‘zgarmadi."; exit 0; }

cp "$ENV_FILE" "$ENV_FILE.bak-$(date +%Y%m%d%H%M%S)"
for key in "${!NEW[@]}"; do
  sed -i "/^$key=/d" "$ENV_FILE"
  printf '%s=%s\n' "$key" "${NEW[$key]}" >> "$ENV_FILE"
done
chmod 600 "$ENV_FILE"
docker compose up -d --force-recreate adm
echo "Tayyor. Kalit fayllarini serverdan o‘chirib qo‘ying: rm $GOOGLE_FILE $APPLE_FILE"
