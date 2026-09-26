# Adaptive interview guide

Ask only unresolved material questions, in batches of at most five.

## Research target

- What is the exact main question and current deliverable?
- What counts as success, and what negative result or obstruction is valuable?
- What is explicitly out of scope for this phase?
- What is the current strongest evidence and principal blocker?

## Manuscript or submission deliverable

Ask this section only when the current deliverable is a manuscript, article,
chapter, proceedings submission, thesis component, or grant-facing research
document. Never guess an answer from an existing TeX class, filename, old draft,
generic venue practice, or the current rendered length.

- What exact venue, call, template and submission category govern the document?
- What language must be used, and who is the intended mathematical audience?
- What is the deadline, including date, time, timezone and whether it is hard,
  soft or an internal target?
- What is the page/count limit, and does that convention include front matter,
  bibliography, figures/tables, appendices and supplemental material?
- What reviewed page budget should be used for front matter, main exposition,
  figures/tables, bibliography, appendices/supplement and contingency? If the
  owner has not allocated it, record the budget as unresolved rather than
  silently consuming the margin.

## Bellevue University doctoral context

Ask only what the project has not recorded. Record answers in the charter;
never guess program rules, milestones, or deadlines.

- Is this a course assignment, a qualifying/comprehensive exam component, a
  dissertation proposal, or a dissertation chapter? Which course or milestone?
- Who is the instructor, chair, or committee, and what review must happen
  before a result is called proved, final, or submitted?
- What citation style and template are required (default APA 7th edition)?
- What does the course syllabus, program, or committee allow for AI
  assistance, and what disclosure is required?
- Does the research use human-subjects data needing an IRB determination, or
  employer data (for example SAP ECC extracts) needing written authorization
  or a data use agreement? Where may such data be stored and processed?

## Authority and provenance

- Which file is the live dashboard?
- Where do durable proofs, claim obligations, conventions, literature checks,
  computations, the history entry point, program/phase route indexes, and
  standalone research records live?
- What review is required before “proved” or manuscript integration?
- Which old files are historical rather than authoritative?

## Mathematical conventions

For statistics and machine-learning projects, also ask: vector/matrix
notation and orientation (row vs. column), estimator and random-variable
notation, loss and risk definitions, log base, train/validation/test split
policy, random-seed policy, and the software stack (Python/R versions and key
libraries).

- Coefficient rings/fields and characteristic?
- Homological/cohomological grading and differential degree?
- Variance, left/right actions, duals, invariants/coinvariants, completions?
- Sign, orientation, normalization, indexing, and canonical low-dimensional
  examples?
- Finiteness, connectedness, smoothness, tangential, or equivariance assumptions?

## Autonomy and protection

- Which semantic files may be edited autonomously?
- Which paths are read-only or historical?
- Which convention changes require explicit approval?
- May the agent create standalone route records, append to the designated route
  index, and write a linked program closeout at material checkpoints?
- What Git actions are authorized?

## Verification and resources

- What are the fast, targeted, full, and manuscript commands?
- Which canonical examples catch mathematical regressions?
- What runtime, memory, core, network, and storage limits apply?
- Which computation outputs must receive manifests/checksums?

## Confidentiality and literature

- Is the repository unpublished, private, licensed, embargoed, or public?
- May public sources be browsed and PDFs retained locally?
- If sources may be retained, should the standard ignored
  `.research-cache/literature/` cache be enabled for repeated checks?
- May repository content be uploaded to external tools?
- Are private correspondence or collaborator notes available, and who may see
  them?

## Skill layer

- Is the `mathbox-bu` plugin installed for each host in use?
- Is local-only use sufficient, or must collaborators/cloud sessions receive
  exact vendored copies?
- Is there any recurring procedure truly unique to this repository?

Default recommendation: install the `mathbox-bu` plugin and create no project
copies of its skills.
