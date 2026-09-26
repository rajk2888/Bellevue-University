---
description: Interview the user and fill in company/profile.yaml for the MetaFloor company overlay
---

Fill in `${CLAUDE_PLUGIN_ROOT}/company/profile.yaml` for the user's company.

1. Read the current profile and list every field still set to `TODO`.
2. Ask about the missing fields in small batches, in this order: company basics (name, industry, regulation), sites, systems of record, enabled workflows, KPI targets, approval limits and approvers, autonomy. For systems, give only the MetaFloor skill names listed in the profile comments as choices.
3. Don't guess values. If the user doesn't know one, leave it `TODO` and note it.
4. Write the updated YAML, keeping the comments, then summarize what changed and what is still `TODO`.
5. Don't raise `autonomy.default` above `recommend` unless the user explicitly asks to.

$ARGUMENTS
