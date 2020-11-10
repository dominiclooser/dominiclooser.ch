---
wikidata_id: Q1123462
props:
   -  P178
resources:
   -  link: http://pmrb.free.fr/contextref.pdf
      label: Reference Manual
   -  link: http://tug.ctan.org/info/context-top-ten/cmds.pdf
      label: Macros Top Ten
   -  link: https://tex.stackexchange.com/questions/448812/the-definitive-guide-to-context-mkiv-documentation
      label: Documentation Overview
---
command (=macro)

command = setup([]) + scope({})

macro package = collection of macros

```
\definesomething
\setupsomething
```

# Setup
```
\setuppapersize
\setuplayout
\setuppagenumbering
\setuphead[which][textstyle=]
```
# Base Structure
```
\starttext
   \completecontent (\placecontent)
   \startfrontmatter
   \endfrondmatter
   \startbodymatter
   \endbodymatter
\endtext

\chapter (\title)
\section (\subject)
\subsection (\subsubject)
```

# Typography
```
\definefontfamily[mainface][rm][TeX Gyre Pagella]
\definefontfamily[mainface][ss][TeX Gyre Heros]
\definefontfamily[mainface][mm][TeX Gyre Pagella Math]
\setupbodyfont[mainface, 12pt]

\em
\italic
```
