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
#PLANTUML=curl -o $@ "https://img.plantuml.biz/plantuml/svg/~h`xxd -c0 -p < $<`" \#
# ^ this web service is not very reliable...

%.svg: %.puml
	$(PLANTUML) $<

.PHONY: all
