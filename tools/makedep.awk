#!/usr/bin/awk -E
BEGIN {
    i=1
    if (ARGC>1 && ARGV[i]=="-d") {
        if (ARGC<3) {
            print "usage: makedep [-d prefix] [sections...] -- [pages...]" > "/dev/stderr"
            exit 1
        }
        i++
        prefix=ARGV[i++]
        gsub(/\/+/, "/", prefix)
        prefix=prefix "/"
        gsub(/\/+$/, "/", prefix)
    }
    want["title"]=want["description"]=want["link"]=1
    for (; i<ARGC; i++) {
        f=ARGV[i]
        if (f=="--") {
            ns=asort(sections, sections, "ordercmp")
            inpages=1
            continue
        }
        incomment=0
        delete v
        while ((r = getline ln < f) > 0) {
            if (!incomment) {
                if (ln=="<!--")
                    incomment=1
                continue
            }
            if (ln=="-->")
                break
            colon=index(ln, ":")
            if (colon==0)
                continue
            cmd=substr(ln, 1, colon-1)
            arg=substr(ln, colon+1)
            gsub(/^\s+|\s+$/, "", cmd)
            gsub(/^\s+|\s+$/, "", arg)
            v[cmd]=arg
        }
        if (r<0) {
            print f ": " ERRNO > "/dev/stderr"
            exit 1
        }
        close(f)
        if (v["url"]=="") {
            print f ": error: missing url" > "/dev/stderr"
            exit 1
        }
        if (match(v["order"], /^[0-9]+$/)==0) {
            print f ": error: " (v["order"]==""?"missing":"invalid") " order" > "/dev/stderr"
            exit 1
        }
        v["path"]=f
        v["url"]="/" v["url"] "/"
        gsub(/\/+/, "/", v["url"])

        if (inpages) {
            for (w in want)
                if (v[w]=="")
                    print f ": warning: missing " w > "/dev/stderr"

            n++
            for (a in v)
                pages[n][a]=v[a]
            pages[n][0]["d"]=substr(v["url"], 2) "index.html"
            pages[n][0]["ord"]=v["order"]+0
            for (j=1; j<=ns; j++) {
                if (f!=sections[j]["path"])
                    continue
                subsection=j
                pages[n][0]["ord"]=-2147483648
                break
            }
        } else {
            ns++
            for (a in v)
                sections[ns][a]=v[a]
            sections[ns][0]["ord"]=v["order"]+0
        }
    }
    if (!inpages)
        ns=asort(sections, sections, "ordercmp")
    n=asort(pages, pages, "ordercmp")

    # breadcrumbs
    for (i=1; i<=n; i++) {
        bcp=bc=""
        bca[nbc=1]=1
        if (i!=1)
            bca[++nbc]=i
        for (j=1; j<=nbc; j++)
            bc=bc (bc==""?"":",") "{\"@type\":\"ListItem\",\"position\":" j ",\"name\":" jsescape(pages[bca[j]]["link"]) ",\"item\":" jsescape("https://docs.scanpay.dev" pages[bca[j]]["url"]) "}"
        if (subsection>0 && pages[i]["path"]!=sections[subsection]["path"])
            bcp="<span class=\"header--nav--raquo\">»</span> <a href=\"" sections[subsection]["url"] "\">" sections[subsection]["link"] "</a>"

        pages[i]["BreadcrumbList"]="[" bc "]"
        pages[i]["BreadcrumbParent"]=bcp
    }

    # sidebar
    for (i=1; i<=n; i++) {
        menu=""
        for (j=1; j<=ns; j++) {
            active=j==subsection?" active":""
            apiicon=match(sections[j]["title"], /API$/)!=0?" <span class=\"nav--ul--li--a--label\">API</span>":""
            menu=menu "<li class=\"nav--ul--li\">"
            menu=menu "<a class=\"nav--ul--li--a" active "\" href=\"" sections[j]["url"] "\">" sections[j]["link"] apiicon "</a>"
            if (j==subsection) {
                menu=menu "<ol class=\"nav--ul--li--ol\">"
                for (k=1; k<=n; k++) {
                    name=k==1?"Introduction":pages[k]["link"]
                    url=pages[k]["url"]
                    active=k==i?" nav--ul--li--ol--li--active":""
                    menu=menu "<li class=\"nav--ul--li--ol--li" active "\">"
                    menu=menu "<a class=\"nav--ul--li--ol--li--a\" href=\"" url "\">" name "</a>"
                    menu=menu "</li>"
                }
                menu=menu "</ol>"
            }
            menu=menu "</li>"
        }
        pages[i]["sidebar"]=menu
    }

    # dependencies and build rules
    for (i=1; i<=n; i++) {
        printf "%s: %s", prefix pages[i][0]["d"], pages[i]["path"]
        for (j=1; j<=n; j++)
            if (j!=i)
                printf " %s", pages[j]["path"]
        for (j=1; j<=ns; j++)
            if (j!=subsection)
                printf " %s", sections[j]["path"]
        printf "\n\t@echo \"BUILD   %s\"\n\t@set -e; env -i ", pages[i][0]["d"]
        for (j in pages[i])
            if (j!=0)
                printf "%s=%s ", j, makeescape(pages[i][j])
        printf "content=\"`cat $<`\" $(BUILD)\n\n"
    }
    for (i=1; i<=n; i++)
        printf "%s%s%s", i==1?"HTML+=":" ", pages[i][0]["d"], i==n?"\n":""
}

function ordercmp(i1, v1, i2, v2)
{
    return v1[0]["ord"]-v2[0]["ord"]
}

function jsescape(s)
{
    gsub(/\\/, "\\\\", s)
    gsub(/"/, "\\\"", s)
    return "\"" s "\""
}

function makeescape(s)
{
    gsub(/'/, "'\"'\"'", s)
    return "'" s "'"
}
