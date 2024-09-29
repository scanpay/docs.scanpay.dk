#!/bin/bash
set -e
shopt -s nullglob

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )/.." >/dev/null 2>&1 && pwd )"
cd "$DIR"

SERVER='go4-test'
ENDPOINT='/var/www/docs-test.scanpay.dev/'
SRC="$DIR/src"
DEST="$DIR/obj/docs.scanpay.dev"

read -p "Production? (y/N): " production
if [[ $production =~ [yY] ]]; then
    ENDPOINT='/var/www/docs.scanpay.dev/'
fi; echo

compress() {
    echo -n "compressing $1..."
    zopfli --i100 "$1"
    brotli --best -w 0 -o "$1.br" "$1"
    touch -r "$1" -c "$1".{br,gz}
    [[ $(stat -c%s "$1.gz") -ge $(stat -c%s "$1.br") ]] || rm "$1.br"
    printf '\033[0;32mOK\033[0m\n'
}

if [[ -n "$(git status --porcelain 2>&1)" ]]; then
    printf '\033[0;31mWARNING: Uncommitted changes\033[0m\n' >&2
    read -p 'Do you want to continue? [y/N]: ' res
    [[ "$res" == y ]] || exit 0
fi

git fetch
if [[ "$(git rev-parse main)" != "$(git rev-parse origin/main)" ]]; then
    printf '\033[0;31mWARNING: Not synced to upstream\033[0m\n' >&2
    read -r -p 'Do you want to continue? (y/N): ' res
    [[ "$res" == y ]] || exit 0
fi

# Steal modification time from git
echo "Stealing modification times from git"
find $SRC -type f | while read f; do
    t=$(git log --pretty=format:%cd -n 1 --date=format:%Y%m%d%H%M.%S "$f")
    [[ -n "$t" ]] && touch -t "$t" "$f"
    [[ -z "$t" ]] && echo "detected non-commited file $f"
    : # this line fixes early loop exits
done

make clean
make

# Compress JS, HTML, CSS and XML
find "$DEST/" -name '*.js' -o -name '*.html' -o -name '*.css' -o -name '*.xml' | while read f; do
    compress "$f"
done

# Compress SVG's
find -L "$DEST/" -iname '*.svg' | while read f; do
    sed 's/^[ \t]*//;s/[ \t]*$//' < "$f" | tr '\n' ' ' | sed 's/>[ \t]*</></g;s/[ \t]*$//' | tr -d '\n' > "$f.tmp" || exit 1
    touch -r "$f" "$f.tmp" && mv "$f.tmp" "$f"
    compress "$f"
done

read -p "Push to $SERVER:$ENDPOINT (y/N): " res
[[ "$res" =~ [yY] ]] || exit 0

rsync -rtOcvp --chmod=ug=rw,o=r,Dugo+x,Dg+s --delete-after --progress -e ssh "$DEST/" "$SERVER:$ENDPOINT"
