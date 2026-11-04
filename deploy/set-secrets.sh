#!/bin/sh
# Sets the Eskiz SMS login and the admin phone in deploy/.env, restarts the app and checks Eskiz.
# Run on the server: ssh -t root@169.58.135.28 sh /opt/webpul/deploy/set-secrets.sh
set -eu
cd "$(dirname "$0")"
ENV_FILE=.env

printf 'Eskiz login (email): '
read -r EMAIL
printf 'Eskiz yashirin kalit (ekranda ko‘rinmaydi): '
stty -echo
read -r SECRET
stty echo
echo
printf 'Admin telefon raqami (+998901234567): '
read -r PHONE
PHONE=$(printf '%s' "$PHONE" | tr -d ' -')

case "$PHONE" in
  +998[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]) ;;
  *) echo "Telefon +998XXXXXXXXX ko‘rinishida bo‘lsin."; exit 1 ;;
esac
if [ -z "$EMAIL" ] || [ -z "$SECRET" ]; then
  echo "Email va kalit bo‘sh bo‘lmasin."
  exit 1
fi

echo "Eskiz tekshirilmoqda..."
if ! curl -fsS -F "email=$EMAIL" -F "password=$SECRET" https://notify.eskiz.uz/api/auth/login | grep -q '"token"'; then
  echo "Eskiz login yoki kalit noto‘g‘ri. .env o‘zgartirilmadi."
  exit 1
fi

cp "$ENV_FILE" "$ENV_FILE.bak-$(date +%Y%m%d%H%M%S)"
for key in ESKIZ_EMAIL ESKIZ_PASSWORD ADMIN_PHONES; do
  sed -i "/^$key=/d" "$ENV_FILE"
done
printf 'ESKIZ_EMAIL=%s\nESKIZ_PASSWORD=%s\nADMIN_PHONES=%s\n' "$EMAIL" "$SECRET" "$PHONE" >> "$ENV_FILE"
chmod 600 "$ENV_FILE"

docker compose up -d --force-recreate adm
echo "Tayyor: SMS yoqildi, $PHONE admin. https://a12.uz/login orqali kiring."
