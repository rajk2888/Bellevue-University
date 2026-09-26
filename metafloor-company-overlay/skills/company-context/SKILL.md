---
name: company-context
description: Company-specific context for the MetaFloor Supply Chain plugin. Use before any MetaFloor supply-chain skill, workflow, command (scm-run, scm-replenish, scm-audit, scm-autonomy, scm-connectors), or review agent, and whenever the user asks a supply-chain question about "our" plants, suppliers, inventory, orders, KPIs, or systems. It supplies the company's system landscape, sites, KPI targets, approval limits, and autonomy ceiling.
---

# Company context for MetaFloor Supply Chain

Read `${CLAUDE_PLUGIN_ROOT}/company/profile.yaml` before doing any supply-chain work and apply it as follows.

## 1. Check the profile is filled in

If `company.name` or any `approval_limits` value is still `TODO`, say which fields are missing and offer `/metafloor-company-overlay:company-setup`. Until the limits are filled in, work in `observe` mode only: analyze and explain, but don't propose transactions.

## 2. Pick systems from the profile

- For each domain in `systems`, use only the MetaFloor skill named there (prefix `b86515f9-bc96-4a84-b72a-fadf7cd5a74f:`). Treat domains set to `none` as out of scope, and don't bring in skills for systems the company doesn't run.
- Only suggest the MetaFloor workflows listed in `workflows_enabled`. If a request needs another workflow, say so and ask before using it.
- Use the company's own site codes from `sites` in all output (for example SAP plant/WERKS), and translate terms using `glossary`.

## 3. Judge results against company KPIs

Mark results as on-target or exceptions using the values in `kpis`. Don't use generic industry benchmarks. When you do mention a benchmark for context, label it as external.

## 4. Enforce approval limits and autonomy

- The effective autonomy level is the lower of `autonomy.default` and whatever level the MetaFloor `scm-autonomy` dial is set to. Never go above the profile's level.
- Any action whose value is above an `approval_limits` threshold is a recommendation for the matching `approvers` role, never an executed change.
- Workflows in `autonomy.never_autonomous` always stop for a named human decision, whatever the dial says.
- If `company.regulated` is true, pass every quality, recall, or compliance decision to MetaFloor's `decision-reviewer` agent and cite the relevant item in `company.regulations`.

## 5. Output conventions

- Show money in `company.currency`, and put periods in `company.fiscal_calendar` terms.
- End every recommendation with: the system of record, the site code, the approver role it needs, and the KPI it affects.
