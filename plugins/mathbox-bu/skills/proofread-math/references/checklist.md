# Mathematical LaTeX proofreading checklist

## Prose and typography

- spelling, grammar, agreement, articles, prepositions, referents, and parallel
  structure;
- punctuation, capitalization, hyphenation, duplicated or omitted words;
- grammatical integration and punctuation of displays;
- terminology consistency and clear local transitions;
- awkward phrasing only when a meaning-preserving local correction is clear.

Preserve the author's English variant and individual style.

## LaTeX

- balanced braces and delimiters;
- matching environments and valid nesting;
- correct math mode, alignment markers, line breaks, and delimiter sizing;
- labels, references, equation references, citations, and duplicate keys;
- theorem/equation names and local custom macros;
- package-specific syntax only when the preamble or project resolves it.

Do not convert between equivalent commands, environments, delimiter forms, or
line layouts merely for taste.

## APA 7 statistical reporting and citations

Apply when the project uses APA 7 (the default for this edition) and only as
formatting; never change a reported value.

- statistical symbols that are Latin letters are italicized (*M*, *SD*, *t*,
  *F*, *p*, *r*, *N*, *n*); Greek letters are not;
- test statistics give degrees of freedom and the statistic, for example
  *t*(28) = 2.14, *p* = .041;
- exact *p* values to two or three decimals, with *p* < .001 for smaller
  values; no leading zero for quantities that cannot exceed 1 (*p*, *r*,
  correlations, proportions reported as such);
- effect sizes and confidence intervals are reported alongside tests, with the
  confidence level stated, for example 95% CI [0.12, 0.48];
- table and figure numbering, titles, and notes follow one consistent style,
  and every table/figure is referenced in the text;
- every in-text citation matches a reference entry (author spelling, year) and
  every reference entry is cited; `et al.` usage is consistent;
- a citation marked `[SOURCE VERIFICATION REQUIRED]` is left in place and
  reported, never completed from memory.

Flag, do not fix, a value that looks inconsistent with its test (for example a
*p* value that does not match the statistic and degrees of freedom); that is a
`computation-audit` or `proof-audit` question.

## Local mathematical consistency

- symbols, indices, primes, decorations, subscripts, and superscripts;
- operators, relations, signs, coefficients, constants, and parentheses;
- quantified variables, ranges, hypotheses, domains, and codomains;
- dimensions, degrees, arities, filtrations, and page indices;
- consistency between statement, proof, definition, and cited formula;
- whether prose accurately describes the adjacent equation.

Flag rather than repair anything requiring proof reconstruction or a global
choice of convention.
