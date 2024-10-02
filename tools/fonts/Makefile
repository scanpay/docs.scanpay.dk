TARG=L400 L400i L700 L700i B700 H400 H400i H700 H700i
DIR=../../src/assets/font

all: $(TARG)

clean:
	rm -f *.ttf *.woff2

L400.ttf: Lato-Regular.ttf regular.txt
L400i.ttf: Lato-Italic.ttf regular.txt
L700.ttf: Lato-Bold.ttf heading.txt
L700i.ttf: Lato-BoldItalic.ttf heading.txt
B700.ttf: Bitter.ttf heading.txt
H400.ttf: Hack-Regular.ttf regular.txt
H400i.ttf: Hack-Italic.ttf regular.txt
H700.ttf: Hack-Bold.ttf heading.txt
H700i.ttf: Hack-BoldItalic.ttf heading.txt

$(addsuffix .ttf,$(TARG)):
	pyftsubset $(filter %.ttf,$^) --unicodes="`cat $(filter-out %.ttf,$^) | sed -r 's/^ +//;s/ *(#.*)?$$//;s/ +/,/g' | tr '\n' , | sed -r 's/,+$$//'`" --layout-features="kern liga" --output-file=$@

%.woff2: %.ttf
	woff2_compress $<

$(DIR)/%.woff2: %.woff2
	cp -f $< $@

$(TARG): %: $(DIR)/%.woff2

Lato-%.ttf:
	curl -Lfo $@ https://github.com/google/fonts/raw/refs/heads/main/ofl/lato/$@

Bitter.ttf:
	curl -Lfo $@ https://github.com/google/fonts/raw/refs/heads/main/ofl/bitter/Bitter%5Bwght%5D.ttf

Hack-%.ttf:
	curl -Lfo $@ https://github.com/source-foundry/Hack/raw/refs/heads/master/build/ttf/$@

.PHONY: $(TARG)
