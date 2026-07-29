#!/bin/sh
# The prototype references ./assets/**; every one of those files is a copy of a
# repo original (verified byte-identical 2026-07-29), so we symlink rather than
# duplicate 27MB into git. Run from this directory before serving.
#
# 2026-07-29 (phase A): the old version wrote link targets one "../" short, so
# every symlink dangled and the prototype rendered with 404 art. It also only
# covered home/games/phinny. This version resolves each referenced path by
# BASENAME against public/ (plus a small alias table for the handful of names
# the prototype shortened), and links with a target relative to the repo root
# that is correct from assets/<group>/.
set -e
cd "$(dirname "$0")"

ROOT=../../../..         # from assets/<group>/ back to the repo root
mkdir -p assets/home assets/games assets/books assets/stories assets/hollow \
         assets/pals assets/companions assets/phinny assets/brand

# Prototype name -> repo path, for references whose basename was shortened.
alias_for() {
  case "$1" in
    phinny/celebrating.png)  echo public/images/learn-games/phinny-celebrating.png ;;
    phinny/cheering.webp)    echo public/images/learn-games/phinny-cheering.webp ;;
    phinny/thinking.webp)    echo public/images/learn-games/phinny-thinking.webp ;;
    phinny/waving.webp)      echo public/images/learn-games/phinny-waving.webp ;;
    hollow/interior.webp)    echo public/images/hollow/hollow-interior.webp ;;
    *) echo "" ;;
  esac
}

linked=0
missing=""
# Every assets/** reference the two prototype HTML files make.
refs=$(grep -oh 'assets/[a-z]*/[A-Za-z0-9._-]*' ./*.dc.html | sed 's|^assets/||' | sort -u)
for ref in $refs; do
  group=${ref%%/*}
  name=${ref#*/}
  src=$(alias_for "$ref")
  [ -n "$src" ] || src=$(find ../../public -name "$name" -type f 2>/dev/null | head -1 | sed 's|^\.\./\.\./||')
  if [ -n "$src" ] && [ -e "../../$src" ]; then
    ln -sf "$ROOT/$src" "assets/$group/$name"
    linked=$((linked + 1))
  else
    missing="$missing $ref"
  fi
done

echo "Symlinked $linked asset(s)."
if [ -n "$missing" ]; then
  echo "No repo original found by basename for:"
  for m in $missing; do echo "  $m"; done
  echo "(Book covers live under public/guided-reading/series/*/book-*/cover.webp and"
  echo " story-quest art under public/images/story-quests/<world>/ — both are named"
  echo " differently from the prototype, so wire them per-title when building those"
  echo " screens rather than guessing a basename here.)"
fi
