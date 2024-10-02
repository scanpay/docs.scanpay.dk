TARG=docs.scanpay.dev

LOCAL=node_modules/.bin
SASS:=$(shell test -x $(LOCAL)/sass && echo $(LOCAL)/)sass --style=compressed
MINIFY:=$(shell test -x $(LOCAL)/html-minifier && echo $(LOCAL)/)html-minifier --collapse-whitespace --remove-comments
ESBUILD=esbuild --bundle --minify

HOST=127.0.0.1
PORT=35729

SRC:=$(shell find src/ -type f)
OBJ=$(patsubst src/%,obj/%,$(SRC))

TEMPLATE=src/template.html

JS=docs.js
CSS=docs.css
ASSETS=$(JS) $(CSS) $(patsubst src/assets/%,%,$(filter src/assets/%,$(SRC)))

OBJ+=$(addprefix obj/dest/,$(ASSETS))

DEPFILES=$(patsubst src/%,obj/mk/%.d,$(filter src/%.html src/%.ts,$(SRC)))
DEPTEMPLATE=$(patsubst src/%,obj/mk/%.d,$(TEMPLATE))
DEPDIRS=$(patsubst src/docs/%,obj/mk/%.mk,$(wildcard src/docs/*))
MKDIRS=$(sort obj/mk $(dir $(DEPFILES)))

all:

$(DEPDIRS): tools/makedep.awk | obj/mk
$(DEPFILES): tools/replace.awk $(filter src/include/%,$(SRC)) | $(MKDIRS)

obj/mk/%.mk: src/docs/%/*.html src/docs/*/index.html
	@echo "DEP     $*/"
	@./tools/makedep.awk -d obj/dest src/docs/*/index.html -- src/docs/$*/*.html | sed -r 's!(^obj/[^:]*: )src/!\1obj/!g' >$@

obj/mk/%.d: src/%
	@echo "DEP     $<"
	@./tools/replace.awk -M -i src/include $< | sed -r 's!(^| )src/!\1obj/!g' >$@

$(DEPTEMPLATE): $(TEMPLATE)
	@echo "DEP     $<"
	@./tools/replace.awk -M -i src/include $< | sed -r 's! src/! obj/!g;s!^[^:]*:!$$(DESTHTML):!' >$@

YEAR:=$(shell date +%Y)
TIME:=$(shell date +%s)
REPLACE=./tools/replace.awk -I $(dir $@) -i obj/include -o $@
BUILD=t=$(TIME) year=$(YEAR) $(REPLACE) $(TEMPLATE)
HTML=
include $(DEPDIRS)
DESTHTML=$(addprefix obj/dest/,$(HTML))
include $(DEPFILES)

OBJ+=$(DESTHTML)
MIN=$(addprefix obj/$(TARG)/,$(HTML) $(ASSETS))

OBJDIRS=$(sort $(dir $(OBJ)))
MINDIRS=$(sort $(dir $(MIN)))

all: $(MIN)

$(OBJ): | $(OBJDIRS)
$(MIN): | $(MINDIRS)
$(DESTHTML): $(TEMPLATE) tools/replace.awk tools/makedep.awk

$(MKDIRS) $(OBJDIRS) $(MINDIRS):
	@mkdir -p $@

COPY=cp -f $< $@

obj/%: src/%
	@$(COPY)

obj/dest/%: obj/assets/%
	@$(COPY)

obj/%.json: src/%.json tools/highlight-json.awk
	@echo "HILIGHT $*.json"
	@./tools/highlight-json.awk $< >$@

obj/%.html: src/%.html tools/replace.awk
	@echo "REPLACE $*.html"
	@$(REPLACE) $<

obj/%.ts: src/%.ts tools/replace.awk
	@echo "REPLACE $*.ts"
	@$(REPLACE) $<

obj/dest/$(JS): $(filter obj/%.ts,$(OBJ))
	@echo "ESBUILD docs.ts"
	@$(ESBUILD) --outfile=$@ obj/js/docs.ts

obj/dest/$(CSS): $(filter obj/%.scss,$(OBJ))
	@echo "SASS    docs.scss"
	@$(SASS) obj/css/docs.scss $@

obj/$(TARG)/%.html: obj/dest/%.html
	@echo "MINIFY  $*.html"
	@$(MINIFY) -o $@ $<

obj/$(TARG)/%: obj/dest/%
	@echo "COPY    $*"
	@$(COPY)

$(TARG).tar.gz: $(MIN)
	tar czf $@ -C obj $(TARG)

tar: $(TARG).tar.gz

watch:
	@inotifywait -mre close_write src/ tools/ | while read -r ln; do $(MAKE) --no-print-directory; done

serve: $(MIN)
	@python -m http.server -b $(HOST) -d obj/$(TARG) $(PORT)

livereload: $(MIN)
	@livereload --host $(HOST) -p $(PORT) obj/$(TARG)

clean:
	rm -rf obj/

.PHONY: all tar watch serve livereload clean
