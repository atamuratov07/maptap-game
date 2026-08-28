#!/usr/bin/env bash
set -euo pipefail

DOMAINS=("georally.world" "www.georally.world")
PRIMARY_DOMAIN="${DOMAINS[0]}"
RSA_KEY_SIZE=4096
DATA_PATH="./data/certbot"

EMAIL="${1:-${CERTBOT_EMAIL:-}}"
if [ -z "$EMAIL" ] && [ -f .env ]; then
    EMAIL=$(grep -E '^CERTBOT_EMAIL=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'")
fi
if [ -z "$EMAIL" ]; then
    read -p "Enter email address for Let's Encrypt notices: " EMAIL
fi

STAGING=0
for arg in "$@"; do
    if [ "$arg" = "--staging" ]; then
        STAGING=1
    fi
done

if [ -d "$DATA_PATH/conf/live/$PRIMARY_DOMAIN" ]; then
    read -p "Existing certificate found for $PRIMARY_DOMAIN. Overwrite? (y/N) " decision
    if [ "$decision" != "y" ] && [ "$decision" != "Y" ]; then
        echo "Aborted."
        exit 0
    fi
fi

echo "### Creating a temporary self-signed certificate so nginx can start ..."
mkdir -p "$DATA_PATH/conf/live/$PRIMARY_DOMAIN"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$RSA_KEY_SIZE -days 1 \
    -keyout '/etc/letsencrypt/live/$PRIMARY_DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$PRIMARY_DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "### Starting nginx ..."
docker compose up -d nginx

echo "### Deleting the temporary certificate ..."
docker compose run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$PRIMARY_DOMAIN \
         /etc/letsencrypt/archive/$PRIMARY_DOMAIN \
         /etc/letsencrypt/renewal/$PRIMARY_DOMAIN.conf" certbot

echo "### Requesting the real certificate from Let's Encrypt ..."

DOMAIN_ARGS=""
for domain in "${DOMAINS[@]}"; do
    DOMAIN_ARGS="$DOMAIN_ARGS -d $domain"
done

STAGING_ARG=""
if [ "$STAGING" != "0" ]; then
    STAGING_ARG="--staging"
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $EMAIL \
    $DOMAIN_ARGS \
    --rsa-key-size $RSA_KEY_SIZE \
    --agree-tos \
    --no-eff-email" certbot

echo "### Reloading nginx with the real certificate ..."
docker compose exec nginx nginx -s reload

echo "### SUCCESS: https://$PRIMARY_DOMAIN is now live with a valid SSL certificate."
