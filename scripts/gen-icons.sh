#!/usr/bin/env bash
# Drop the EZManage screenshot (or any 1024x1024 PNG) as app-icon.png in the
# project root, then run this script to generate all Tauri icon sizes.
set -e

if [ ! -f "app-icon.png" ]; then
  echo "Error: app-icon.png not found in project root."
  echo "Save the 1024x1024 PNG there first, then re-run."
  exit 1
fi

npx tauri icon app-icon.png
echo "Icons written to src-tauri/icons/"
