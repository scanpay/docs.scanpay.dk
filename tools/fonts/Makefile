TARG=L400 L400i L700 L700i B700 H400 H400i H700 H700i

all: $(TARG)

L400.ttf: Lato-Regular.ttf
L400i.ttf: Lato-Italic.ttf
L700.ttf: Lato-Bold.ttf
L700i.ttf: Lato-BoldItalic.ttf
B700.ttf: Bitter.ttf
H400.ttf: Hack-Regular.ttf
H400i.ttf: Hack-Italic.ttf
H700.ttf: Hack-Bold.ttf
H700i.ttf: Hack-BoldItalic.ttf

Lato-%.ttf:
	curl -Lfo $@ https://github.com/google/fonts/raw/refs/heads/main/ofl/lato/$@

Bitter.ttf:
	curl -Lfo $@ https://github.com/google/fonts/raw/refs/heads/main/ofl/bitter/Bitter%5Bwght%5D.ttf

Hack-%.ttf:
	curl -Lfo $@ https://github.com/source-foundry/Hack/raw/refs/heads/master/build/ttf/$@

DST=../../src/assets/font
SRC=../../src
CHARSET=charset.txt
DEPS!=find $(SRC) -type f ! -iname '*.woff2' ! -iname '*.ttf'

$(CHARSET): $(DEPS)
	grep -rhI . $(SRC) | fold -cw1 | sort | uniq | tr -d '\n' | iconv -c -f utf8 -t utf32be | xxd -p -c4 | tr '\n' ',' | sed -r 's/^0*//;s/,0*/,/g;s/$$/20-7e/' >$@

$(TARG:%=%.ttf): $(CHARSET)
	pyftsubset $(^:$(CHARSET)=) --unicodes-file=$(CHARSET) --layout-features="kern liga" --output-file=$@

%.woff2: %.ttf
	woff2_compress $<

$(DST)/%.woff2: %.woff2
	cp -f $< $@

$(TARG): %: $(DST)/%.woff2

clean:
	rm -f *.ttf *.woff2 $(CHARSET)

.PHONY: $(TARG) all clean
.DELETE_ON_ERROR: $(CHARSET)
