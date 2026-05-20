#!/usr/bin/awk -f
BEGIN {
    FS=""
    nstk=1
    stk[1]=0
}
{
    inspan=""
    for (i=1; i<=NF; i++) {
        switch ($i) {
        case "<": $i="&lt;"; break
        case ">": $i="&gt;"; break
        case "&": $i="&amp;"; break
        case "'": $i="&#39;"; break
        case "\"":
            $i="&quot;"
            if (inesc)
                inesc=0
            else if (instr) {
                printf "%s", $i
                unhighlight()
                instr=0
                continue
            } else {
                highlight(inarg?"string":"attr")
                instr=1
            }
            break
        case "{":
        case "[":
            if (!instr) {
                unhighlight()
                stk[++nstk]=inarg=($i!="{")
            }
            break
        case ":":
        case ",":
            if (!instr) {
                unhighlight()
                if (!stk[nstk])
                    inarg=($i==":")
            }
            break
        case "]":
        case "}":
            if (!instr) {
                unhighlight()
                inarg=stk[--nstk];
                if (nstk<1)
                    nstk=1
            }
            break
        case /[0-9A-Za-z]/:
            if (!instr && inarg)
                highlight(typeof($i)=="strnum"?"number":"keyword")
            break
        case " ": case "\t":
            if (!instr)
                unhighlight()
            break
        }
        printf "%s", $i
    }
    printf "%s\n", unhighlight()
}

function highlight(class)
{
    if (inspan==class)
        return
    printf "%s<span class=\"hljs-%s\">", inspan!=""?"</span>":"", class
    inspan=class
}

function unhighlight()
{
    if (inspan=="")
        return
    printf "</span>"
    inspan=""
}
