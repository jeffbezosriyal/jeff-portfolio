#!/usr/bin/env bash
# Downloads the images from the Figma design into public/assets.
# The Figma asset links expire ~7 days after they were generated, so run this soon.
# If they have expired, export the images from Figma by hand using the same filenames.
set -e
cd "$(dirname "$0")/../public/assets"
P="https://www.figma.com/api/mcp/asset/e9575674-1fad-4a66-bf8a-9473b06b50f7"
get() { curl -fsSL "$P/$1" -o "$2" && echo "ok  $2" || echo "FAIL $2"; }
get 3d229.png me.png
get a50e1.svg me-ring.svg
get 8c6c7.png esab.png
get 251bb.png exp-acm.png
get 864c9.png exp-zuuce.png
get 08842.png exp-intern.png
get 4c9a8.png exp-lead.png
