# SEMICON West talk

"Addressing the risks associated with the global semiconductor supply chain - Leveraging Data and AI Governance"

| File | What it is |
|---|---|
| `semicon-west-supply-chain-risk-SCW26.pptx` | The deck on the official SCW26 template, with the speaker's own edits (name, date, backup slides removed). Present this one. |
| `semicon-west-supply-chain-risk-SCW26.pdf` | PDF export of the deck above |
| `semicon-west-supply-chain-risk.pptx` | Same content in the earlier standalone design |
| `qa-prep.md` | Likely audience questions with 30-60 second answers |
| `build-deck.js` | Source of truth for slide content and speaker notes (pptxgenjs) |
| `record-hook.js`, `apply-template.py` | Re-render `build-deck.js` onto the SCW26 template |
| `SCW26_General_PPT_Template.pptx` | The template supplied by SEMI |

## Rebuild

From a directory with `pptxgenjs`, `react`, `react-dom`, `react-icons`, and `sharp` installed, plus `python-pptx`:

```
node build-deck.js semicon-west-supply-chain-risk.pptx
node -r ./record-hook.js build-deck.js recorded.json
python3 apply-template.py SCW26_General_PPT_Template.pptx recorded.json semicon-west-supply-chain-risk-SCW26.pptx
```

The rebuild regenerates the deck from `build-deck.js`, so it would overwrite the manual edits in the SCW26 file (speaker details, removed backup and sources slides). Reapply them after rebuilding.
