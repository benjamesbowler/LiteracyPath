#!/bin/sh
# The prototype references ./assets/**; every one of those 66 files is a copy of a
# repo original (verified byte-identical 2026-07-29), so we symlink rather than
# duplicate 27MB into git. Run from this directory before serving.
set -e
cd "$(dirname "$0")"
R=../../public/images
mkdir -p assets/home assets/games assets/books assets/stories assets/hollow assets/pals assets/companions assets/phinny assets/brand
for f in "$R"/home-sage/*.webp; do ln -sf "../$R/home-sage/$(basename "$f")" "assets/home/$(basename "$f")"; done
for f in "$R"/learn-games/*.webp "$R"/learn-games/*.png; do [ -e "$f" ] && ln -sf "../$R/learn-games/$(basename "$f")" "assets/games/$(basename "$f")"; done
ln -sf "../$R/learn-games/phinny-celebrating.png" assets/phinny/celebrating.png
ln -sf "../$R/learn-games/phinny-cheering.webp"   assets/phinny/cheering.webp
ln -sf "../$R/learn-games/phinny-thinking.webp"   assets/phinny/thinking.webp
echo "Symlinked. Remaining gaps (books/stories/hollow/pals/companions/brand) map by basename:"
echo "  find ../../public/images -name '<basename>'"
