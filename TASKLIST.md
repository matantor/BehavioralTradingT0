# TASKLIST — Import Diagnostics

## Task A: Add Dev Import "Analyze" Mode

**Goal:** Add analysis capability to Dev Import that reports data quality issues before import.

**Output per ticker:**
- First buy time, first sell time
- Total buy qty, total sell qty
- Flag: "sell before buy" (first sell < first buy)
- Flag: "sell qty exceeds buys" (total sell > total buy)

**Cash flow summary:**
- Total deposits, total withdrawals
- Flag: "withdraw exceeds deposits"

**Acceptance:**
- New "Analyze" button on Dev Import page
- Results displayed in collapsible panel
- No changes to import logic or domain services

---

## Task B: Decide Import Rule Strategy (Design Only)

**Options to evaluate:**

1. **Strict mode** (current behavior)
   - Data must include buys/deposits before sells/withdraws
   - Fails with clear error if not

2. **Assisted mode** (new)
   - Auto-seed opening balances for tickers with sells but no buys
   - Requires user confirmation before applying
   - Creates synthetic "opening balance" entries

**Decision needed:**
- Which mode is default?
- Is assisted mode opt-in or does it require explicit flag?
- How to handle partial coverage (some tickers have buys, some don't)?

**Deliverable:** Written decision in DECISIONS.md (no code)
