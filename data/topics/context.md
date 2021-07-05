---
wikidata_id: Q1123462
props:
   -  P178
resources:
   -  link: https://www.pragma-ade.nl/general/manuals/ma-cb-en.pdf
      label: ConTeXt Mark IV – an excursion
   -  link: http://pmrb.free.fr/contextref.pdf
      label: Reference Manual (2013)
   -  link: http://tug.ctan.org/info/context-top-ten/cmds.pdf
      label: Macros Top Ten
   -  link: https://tex.stackexchange.com/questions/448812/the-definitive-guide-to-context-mkiv-documentation
      label: Documentation Overview
---
## Commands

A *command* begins with Backslash (\). A command in ConTeX 
is the same as a macro in TeX. A *macro package* is a collection
of macros/commands. 

command = setup([]) + scope({})

Example: 
```\define[1]\mpThree{The ID3 Tag of the MP3 file is: #1}```


## Setup
```
\setuppapersize
\setuplayout
\setuppagenumbering
\setupindenting[no/yes, small/medium]
\setuphead[which][textstyle=]
```

## Structure
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

## Fonts
```
\definefontfamily[mainface][rm][TeX Gyre Pagella]
\definefontfamily[mainface][ss][TeX Gyre Heros]
\definefontfamily[mainface][mm][TeX Gyre Pagella Math]
\setupbodyfont[mainface, 12pt]

\em{}
\italic{}
\bold{}
```
To switch typeface, use `\switchtobodyfont`.

## Size
```
\tfa
\tfb
...
```

## Alignment
To center, use `\midaligned{}` or `\startalignment[middle]` and `\stopalignment`.

