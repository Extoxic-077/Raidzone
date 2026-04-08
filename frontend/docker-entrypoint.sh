#!/bin/sh
set -e

# Inject API_URL into config.js at container start
# The placeholder __API_URL__ is replaced with the value of $API_URL
API_URL="${API_URL:-http://localhost:8080}"
sed -i "s|__API_URL__|${API_URL}|g" /usr/share/nginx/html/js/config.js

# Replace the PORT placeholder in nginx.conf and start nginx
export PORT="${PORT:-8080}"
envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

exec nginx -g "daemon off;"
