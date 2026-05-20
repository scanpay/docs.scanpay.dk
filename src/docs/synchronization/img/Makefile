TEX=$(wildcard *.tex)
SVG=$(TEX:.tex=.svg)

all: $(SVG)

%.dvi: %.tex
	latex $<
	rm -f $*.aux $*.log

%.svg: %.dvi
	dvisvgm -n -d2 -Oall --zoom=-1 $<

.PHONY: all
