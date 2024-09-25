#!/usr/bin/awk -E
function usage()
{
    print "usage: replace [-M] [-i path] [-o out] [file]" > "/dev/stderr"
    exit 1
}

BEGIN {
    outf="/dev/stdout"
    for (i=1; i<ARGC; i++) {
        switch (ARGV[i]) {
        case "-M":
            mflag=1
            break
        case "-I":
            if (i++==ARGC-1)
                usage()
            ibefore[++nbefore]=ARGV[i]
            break
        case "-i":
            if (i++==ARGC-1)
                usage()
            iafter[++nafter]=ARGV[i]
            break
        case "-o":
            if (i++==ARGC-1)
                usage()
            outf=ARGV[i]
            break
        case "--":
            i++;
        default:
            skipfiles=i-1
            i=ARGC
            break;
        }
    }
    for (i=1; i<=nbefore; i++)
        paths[++npath]=ibefore[i]
    selfpath=++npath
    for (i=1; i<=nafter; i++)
        paths[++npath]=iafter[i]
    for (i=1; i<=npath; i++) {
        gsub(/\/+/, "/", paths[i])
        if (substr(paths[i], length(paths[i])) != "/")
            paths[i]=paths[i] "/"
    }
}
BEGINFILE {
    if (skipfiles-->0)
        nextfile
    deps=""
}
{
    parse($0, FILENAME=="-"?"<stdin>":FILENAME, NR)
}
ENDFILE {
    if (mflag && deps!="")
        print FILENAME ":" deps
}

function parse(ln, fname, fline)
{
    while (1) {
        if ((inc=index(ln, "{% include \""))>0) {
            incend=index(substr(ln, inc), "\" %}")
            if (incend==0)
                inc=0
        }
        if ((rep=index(ln, "{{"))>0) {
            repend=index(substr(ln, rep), "}}")
            if (repend==0)
                rep=0
        }
        if (inc>0 && rep>0) {
            if (inc<rep)
                rep=0
            else
                inc=0
        }
        if (inc>0) {
            to=inc
            end=incend
            intro=12
            outtro=4
        } else if (rep>0) {
            to=rep
            end=repend
            intro=2
            outtro=2
        } else
            break;
        end+=to-1
        if (!mflag)
            printf "%s", substr(ln, 1, to-1) > outf
        f=substr(ln, to+intro, (end-1)-(to-1)-intro)
        ln=substr(ln, end+outtro)
        if (inc>0) {
            paths[selfpath]=fname
            gsub(/\/[^\/]+$/, "/", paths[selfpath])
            if (paths[selfpath]==fname)
                paths[selfpath]=""
            for (i=0; i<=npath; i++) {
                pf=paths[i] f
                if ((r=getline nest < pf)>=0)
                    break;
            }
            if (mflag)
                deps=deps " " pf
            else for (; r>0; r=getline nest < pf)
                print nest > outf
            if (r < 0) {
                print fname ":" fline ": include " f ": " ERRNO > "/dev/stderr"
                exit 1
            }
            close(pf)
        } else if (!mflag) {
            gsub(/^\s+|\s+$/, "", f)
            if (!(f in ENVIRON)) {
                print fname ":" fline ": '" f "' is not set" > "/dev/stderr"
                exit 1
            }
            printf "%s", ENVIRON[f] > outf
        }
    }
    if (!mflag)
        print ln > outf
}
