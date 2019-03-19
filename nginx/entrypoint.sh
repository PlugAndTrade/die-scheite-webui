#!/usr/bin/env ash

export DOLLAR="$"

envsubst '${DIESCHEITE_API}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec "$@"
