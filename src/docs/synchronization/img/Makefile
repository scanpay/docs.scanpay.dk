TEX=$(wildcard *.tex)
PUML=$(wildcard *.puml)
SVG=$(TEX:.tex=.svg) $(PUML:.puml=.svg)

all: $(SVG)

%.dvi: %.tex
	latex $<
	rm -f $*.aux $*.log

%.svg: %.dvi
	dvisvgm -n -d2 -Oall --zoom=-1 $<

PLANTUML=plantuml -tsvg -overwrite
#PLANTUML=curl -o $@ "https://www.plantuml.com/plantuml/svg/~h`xxd -c0 -p < $<`" \#
# ^ this web service works exceedingly poorly and will often time out in cloudflare

%.svg: %.puml
	$(PLANTUML) $<

.PHONY: all
