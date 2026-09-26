# MetaFloor company overlay

A small companion plugin that tailors the **MetaFloor Supply Chain** plugin
(`b86515f9-bc96-4a84-b72a-fadf7cd5a74f`, Anthropic Directory) to one company.
MetaFloor itself stays unmodified. This overlay adds:

| Piece | Purpose |
|---|---|
| `company/profile.yaml` | Your company's sites, systems of record, enabled workflows, KPI targets, approval limits, and autonomy ceiling |
| `skills/company-context` | Loads the profile before any MetaFloor work: routes to your systems only, measures results against your KPIs, and enforces your approval limits |
| `commands/company-setup` | `/metafloor-company-overlay:company-setup`, an interview that fills in the profile |

## Setup

1. Enable **MetaFloor Supply Chain** on your claude.ai account (it is currently not enabled).
2. Install this directory as a plugin (for example `claude --plugin-dir ./metafloor-company-overlay`,
   or add it to a marketplace).
3. Run `/metafloor-company-overlay:company-setup`, or edit `company/profile.yaml` directly
   and replace every `TODO`.

Until the profile has a company name and approval limits, the overlay keeps Claude in
observe-only mode.
