#!/bin/bash

# Rollback script for Raidzone
# Usage: ./rollback.sh [frontend|admin] [production|staging]

TYPE=$1
ENV=$2

if [[ -z "$TYPE" || -z "$ENV" ]]; then
    echo "Usage: ./rollback.sh [frontend|admin] [production|staging]"
    exit 1
fi

BASE_PATH="/var/www"
if [[ "$ENV" == "staging" ]]; then
    BASE_PATH="/var/www/staging"
fi

RELEASES_DIR="$BASE_PATH/$TYPE/releases"
CURRENT_LINK="$BASE_PATH/$TYPE/current"

if [[ ! -d "$RELEASES_DIR" ]]; then
    echo "Error: Releases directory $RELEASES_DIR not found."
    exit 1
fi

echo "Available releases for $TYPE ($ENV):"
ls -1 -t "$RELEASES_DIR" | head -n 10

echo ""
echo "Enter the release ID to rollback to:"
read RELEASE_ID

if [[ -z "$RELEASE_ID" ]]; then
    echo "Operation cancelled."
    exit 0
fi

if [[ ! -d "$RELEASES_DIR/$RELEASE_ID" ]]; then
    echo "Error: Release $RELEASE_ID not found in $RELEASES_DIR"
    exit 1
fi

echo "Switching $TYPE to $RELEASE_ID..."
ln -sfn "$RELEASES_DIR/$RELEASE_ID" "$CURRENT_LINK"

echo "Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "Rollback to $RELEASE_ID complete!"
