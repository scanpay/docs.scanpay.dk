#!/bin/bash
set -e

if [ -z "$1" ]; then
    echo "Usage: $0 <raw_fonts_dir>"
    exit 1
fi

RAW_FONTS_DIR="$1"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$DIR/../src"
DEST="$DIR/../obj/dest"

create_font() {
    local path="$SRC/assets/font/$1"
    pyftsubset "$RAW_FONTS_DIR/$1.ttf" --text="$2" --layout-features="kern liga" --output-file="$path.ttf"
    woff2_compress "$path.ttf"
    rm -f "$path.ttf"
}

declare -A headings
declare -A italics
declare -A regular
declare -A code

for file in $(find "$SRC" -type d -name "code" -prune -o -type f -name "*.html" -print); do
    # Extract chars in all headings <h1> to <h4>
    text=$(sed -n 's/.*<h[1-4][^>]*>\(.*\)<\/h[1-4]>.*/\1/p' "$file")
    for (( i=0; i<${#text}; i++ )); do
        headings[${text:i:1}]=1
    done

    # Extract chars in all italic text
    text=$(sed -n 's/.*<i>\(.*\)<\/i>.*/\1/p' "$file")
    for (( i=0; i<${#text}; i++ )); do
        italics[${text:i:1}]=1
    done
done

for file in $(find "$DEST" -type f -name "*.html" -print); do
    # Read the file content and remove everything before the </head> tag
    html=$(awk '/<\/head>/ {found=1; next} found' "$file")

    # Find all code blocks
    codetags=$(echo "$html" | sed -n 's/.*<code[^>]*>\(.*\)<\/code>.*/\1/p')
    for (( i=0; i<${#codetags}; i++ )); do
        code[${codetags:i:1}]=1
    done

    # Get each individual char in the file
    text=$(grep -o . <<< "$html" | sort -u | paste -sd, -)
    for (( i=0; i<${#text}; i++ )); do
        regular[${text:i:1}]=1
    done
done

# Turn headings into a string
headings=$(printf "%s," "${!headings[@]}")
italics=$(printf "%s," "${!italics[@]}")
regular=$(printf "%s," "${!regular[@]}")
code=$(printf "%s," "${!code[@]}")


# Create fonts
create_font "B700" "$headings"
create_font "L400i" "$italics"
create_font "L700i" "$italics"
create_font "L400" "$regular"
create_font "L700" "$regular"
create_font "H400" "$code"
create_font "H400i" "$code"
create_font "H700" "$code"
create_font "H700i" "$code"
