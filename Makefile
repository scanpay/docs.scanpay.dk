TARG=docs.scanpay.dev

LOCAL=./node_modules/.bin
SASS:=$(shell test -x $(LOCAL)/sass && echo $(LOCAL)/)sass
SASSFLAGS=--style=compressed
MINIFY:=$(shell test -x $(LOCAL)/html-minifier && echo $(LOCAL)/)html-minifier
MINIFYFLAGS=--collapse-whitespace --remove-comments
TSC:=$(shell test -x $(LOCAL)/esbuild && echo $(LOCAL)/)esbuild
TSCFLAGS=--bundle --minify --log-level=warning
BROTLI=brotli -knZfw 0
GZIP=zopfli -i100

HOST=127.0.0.1
PORT=35729

-include config.mak

SRC:=$(shell find src/ -type f)
OBJ=$(patsubst src/%,obj/%,$(SRC))

TEMPLATE=src/template.html

JS=docs.js
CSS=docs.css
ASSETS=$(JS) $(CSS) $(patsubst src/assets/%,%,$(filter src/assets/%,$(SRC)))
SITEMAP=sitemap.xml

OBJ+=obj/dest $(addprefix obj/dest/,$(ASSETS))

DEPFILES=$(patsubst src/%,obj/mk/%.d,$(filter src/%.md src/%.html src/%.ts,$(SRC)))
DEPTEMPLATE=$(patsubst src/%,obj/mk/%.d,$(TEMPLATE))
DEPDIRS=$(patsubst src/docs/%,obj/mk/%.mk,$(wildcard src/docs/*))
MKDIRS=$(sort obj/mk $(dir $(DEPFILES)))

all:

$(DEPDIRS): tools/makedep.awk | obj/mk
$(DEPFILES): tools/replace.awk $(filter src/include/%,$(SRC)) | $(MKDIRS)

obj/mk/%.mk: src/docs/%/*.md src/docs/*/index.md
	@echo "DEP     $*/"
	@./tools/makedep.awk -d obj/dest src/docs/*/index.md -- src/docs/$*/*.md | sed -r 's!(^obj/[^:]*: )src/!\1obj/!g' >$@

obj/mk/%.d: src/%
	@echo "DEP     $<"
	@./tools/replace.awk -M -i src/include $< | sed -r 's!(^| )src/!\1obj/!g' >$@

$(DEPTEMPLATE): $(TEMPLATE)
	@echo "DEP     $<"
	@./tools/replace.awk -M -i src/include $< | sed -r 's! src/! obj/!g;s!^[^:]*:!$$(DESTHTML):!' >$@

YEAR:=$(shell date +%Y)
TIME:=$(shell date +%s)
REPLACE=t=$(TIME) ./tools/replace.awk -I $(dir $@) -i obj/include -o $@
MARKDOWN=./tools/markdown2.py -x header-ids,tables,markdown-in-html,fenced-code-blocks,strike
BUILD=year=$(YEAR) $(REPLACE) $(TEMPLATE)
HTML=
include $(DEPDIRS)
DESTHTML=$(addprefix obj/dest/,$(HTML))
include $(DEPFILES)

OBJ+=$(DESTHTML)
MIN=$(addprefix obj/$(TARG)/,$(HTML) $(ASSETS))
ZIPSRC=$(filter %.html %.css %.js %.svg %.xml,$(MIN) obj/$(TARG)/$(SITEMAP))
ZIP=$(addsuffix .br,$(ZIPSRC)) $(addsuffix .gz,$(ZIPSRC))

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

obj/assets/%.svg: src/assets/%.svg
	@$(COPY) # avoid inlining optimizations

obj/%.svg: src/%.svg
	@echo "INLINE  $*.svg"
	@sed -r '/<svg/ s![ \t]+(xmlns(:xlink)?|version)=["'"'"'][^"'"'"']*["'"'"']!!g;s!<\?xml.*\?>!!g' $< >$@

obj/%.json: src/%.json tools/highlight-json.awk
	@echo "HILIGHT $*.json"
	@./tools/highlight-json.awk $< >$@

obj/%.md: src/%.md tools/markdown2.py tools/replace.awk
	@echo "MD      $*.md"
	@$(MARKDOWN) $< | $(REPLACE)

obj/%.html: src/%.html tools/replace.awk
	@echo "REPLACE $*.html"
	@$(REPLACE) $<

obj/%.ts: src/%.ts tools/replace.awk
	@echo "REPLACE $*.ts"
	@$(REPLACE) $<

obj/%.scss: src/%.scss tools/replace.awk
	@echo "REPLACE $*.scss"
	@$(REPLACE) $<

obj/dest/$(JS): $(filter obj/%.ts,$(OBJ))
	@echo "TSC     docs.ts"
	@$(TSC) $(TSCFLAGS) obj/js/docs.ts >$@

obj/dest/$(CSS): $(filter obj/%.scss,$(OBJ))
	@echo "SASS    docs.scss"
	@$(SASS) $(SASSFLAGS) obj/css/docs.scss >$@

obj/dest/$(SITEMAP): $(filter src/docs/% src/include/%,$(SRC)) tools/replace.awk tools/makedep.awk | $(OBJDIRS)
	@echo "SITEMAP */*.md"
	@{ \
	echo '<?xml version="1.0" encoding="UTF-8"?>'; \
	echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'; \
	for p in src/docs/*/*.md; do \
		d=$$p; \
		deps=$$p; \
		while test -n "$$d"; do \
			nd=""; \
			for x in $$d; do \
				case $$x in *.md|*.html) nd="$$nd `./tools/replace.awk -M -i src/include "$$x" | cut -d: -f2-`"; esac; \
			done; \
			d=$$nd; \
			deps="$$deps $$nd"; \
		done; \
		echo "<url><loc>https://$(TARG)/`./tools/makedep.awk -- $$p | sed -r 's/index.html:.*$$//;1q'`</loc><lastmod>`git log --pretty=format:%cd -n 1 --date=iso-strict $$deps`</lastmod></url>"; \
	done | sort; \
	echo '</urlset>'; \
	} >$@

obj/$(TARG)/%.svg: obj/dest/%.svg
	@echo "MINIFY  $*.svg"
	@sed -r 's!^[ \t]*!!;s![ \t]*$$!!' $< | tr '\n' ' ' | sed -r 's!>[ \t]*<!><!g;s![ \t]*$$!!' | tr -d '\n' >$@

obj/$(TARG)/%.html: obj/dest/%.html
	@echo "MINIFY  $*.html"
	@$(MINIFY) $(MINIFYFLAGS) $< >$@

obj/$(TARG)/%.br: obj/$(TARG)/%
	@echo "BR      $*"
	@$(BROTLI) $<

obj/$(TARG)/%.gz: obj/$(TARG)/%
	@echo "GZ      $*"
	@$(GZIP) $<

obj/$(TARG)/%: obj/dest/%
	@echo "COPY    $*"
	@$(COPY)

$(TARG).tar: $(TARG).tar($(MIN) $(ZIP) obj/$(TARG)/$(SITEMAP))

$(TARG).tar(%): % obj/dest/$(SITEMAP)
	@echo "TAR     $(patsubst obj/$(TARG)/%,%,$<)"
	@fname='$(patsubst obj/$(TARG)/%,%,$(patsubst %/index.html,%/,$(patsubst %$(filter .br .gz,$(suffix $<)),%,$<)))'; \
	 mtime=`grep -F "<loc>https://$(TARG)/$$fname</loc>" obj/dest/$(SITEMAP) | sed -r 's!^.*<lastmod>([^<]*)</lastmod>.*$$!\1!'`; \
	 mtime=$${mtime:-`git log --pretty=format:%cd -n 1 --date=iso-strict "src/assets/$$fname" 2>/dev/null`}; \
	 flock -Fx $@ tar -rf $@ -C obj --mode=644 --owner=0 --group=0 $${mtime:+--mtime=$$mtime} $(patsubst obj/%,%,$<)

fonts:
	$(MAKE) -C tools/fonts

tar: $(TARG).tar

watch:
	@inotifywait -mre close_write src/ tools/ | while read -r ln; do $(MAKE) --no-print-directory; done

serve: $(MIN)
	@python -m http.server -b $(HOST) -d obj/$(TARG) $(PORT)

livereload: $(MIN)
	@livereload --host $(HOST) -p $(PORT) obj/$(TARG)

clean:
	rm -rf obj/ *.tar

.PHONY: all fonts tar watch serve livereload clean
.SECONDARY: $(ZIP) obj/$(TARG)/$(SITEMAP)
