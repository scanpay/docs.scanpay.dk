#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <raw_fonts_dir>"
    exit 1
fi
RAW_FONTS_DIR="$1"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT="$DIR/../src/assets/font"

# Fonts to subset: Lato, Bitter
fonts=(L400 L400i L700 L700i B700 H400 H400i H700 H700i)

join() {
    local IFS="$1"
    shift
    echo "$*"
}

regular=(
    20          # space
    21-2F       # !#"$%&'()*+,-./
    30-39       # 0-9
    3A-3B       # :;
    3D          # =
    3F          # ?
    41-5A       # A-Z
    5B 5D       # []
    5F          # _
    61-7A       # a-z
    40          # @
    BB          # »
    A9          # ©
    2013        # – (tankestreg)
    2022        # • (bullet <li>)
)

headings=(
    20          # space
    21          # !
    28-29       # ()
    2C-2F       # ,-./
    30-39       # 0-9
    3A 3F       # :?
    41-5A       # A-Z
    61-7A       # a-z
    2022        # • (bullet <li>)
)

b700=(
    20          # space
    41-5A       # A-Z
    61-7A       # a-z
    30-39       # 0-9
)

echo "Building fonts in: $PWD"

for f in ${fonts[@]}; do
    path="$RAW_FONTS_DIR/$f.ttf"
    if [ ! -f "$path" ]; then
        echo "File does not exist: $path"
        exit 1
    fi

    b="${f##*/}"
    b="${b%.ttf}"
    printf '\033[0;36m%s \033[0m\n' "$b"

    if [[ $b =~ 700 ]]; then
        subset=$(join , "${headings[@]}")
        pyftsubset "$path" --unicodes="$subset" \
            --layout-features="kern liga" \
            --output-file="$OUTPUT/$b.ttf"
    else
        subset=$(join , "${regular[@]}")
        pyftsubset "$path" --unicodes="$subset" \
            --layout-features="kern liga" \
            --output-file="$OUTPUT/$b.ttf"
    fi

    woff2_compress "$OUTPUT/$b.ttf"
    rm -f "$OUTPUT/$b.ttf"
done
