# TASKLIST — Implement Locked Journal, Portfolio, Dashboard

## Goal
Implement the already locked behavior for:
1) Trading Journal  
2) Portfolio  
3) Dashboard  

No UI redesign, no shadcn, no Tailwind in this tasklist.

---

## PART 1 — Trading Journal (Locked Definition) ✅ DONE

The Trading Journal records **executed actions only**.
Every journal entry represents something that actually happened and may affect portfolio state.
Reflections and ideas belong in **Thoughts & Theses**, not in the Journal.

---

### 1.1 Mandatory fields (cannot submit without these)

The following must always be present and visible when creating a journal entry.

**Entry identity**
- Entry type:
  - decision  
  (reflection entries do NOT exist in the Journal)

**Action type**
- buy
- sell
- long
- short
- deposit
- withdraw

**Instrument**
- Ticker / symbol

**Transaction mechanics**
- Quantity
- Price
- Value (derived from quantity × price)

**Time**
- Entry time
  - default = now
  - editable

**Position relationship**
- Declare whether the entry is:
  - creating a new position
  - related to an existing position
- If a sell results in quantity = 0 → the position is closed

**Payment / cost (for buy actions)**
- What asset was used to pay
- How much was paid
- Default payment asset = USD cash
- Default behavior:
  - buying with USD cash subtracts the payment amount from the Cash position
- If marked as “new money not yet in the app”:
  - record the inflow
  - do NOT subtract from existing cash

**Acceptance criteria**
- A journal entry cannot be saved if any mandatory field is missing
- Value is always derived deterministically
- Entry time defaults to now and can be edited
- Buy defaults to USD cash payment unless explicitly changed
- Sell that reduces quantity to zero closes the position

---

### 1.2 Optional fields (expandable, never required)

These fields must be recordable but skippable.

**Classification**
- Sector
- Asset class

**Context & intent**
- Reasons / rationale
- Thesis relation
- Time horizon

**Targets & logic**
- Price targets
- Invalidation conditions

**Emotional & cognitive**
- Emotions
- Confidence / conviction

**Execution context**
- Fees
- Exchange / venue / wallet / funding source (where the action happened)

**State & workflow**
- Status flag (e.g. active / inactive)

**Relations**
- Relation to previous journal entries

**Follow-up**
- Reminders / notifications

**Nice-to-have (explicitly later)**
- Attachments (do not implement now)

**Acceptance criteria**
- Saving works with only mandatory fields
- Optional fields are persisted and shown in JournalDetail if provided
- Attachments are NOT implemented

---

### 1.3 Explicitly out of scope for the journal

These must NOT exist anywhere in the journal.

- Reflection entries
- General notes or free-form observations
- Instrument identifier
- Instrument name
- Multiple timestamps (decision / execution / settlement)
- Currency choice (always dollars)
- Slippage
- Position sizing ratios
- Cash balance display

---

## PART 2 — Portfolio (Locked Lifecycle, Accounting, Aggregation, History)

### Implementation Status
- **Domain / Services / Tests**: ✅ DONE
- **UI (Portfolio.tsx, PositionDetail.tsx)**: ✅ DONE

**Next session**: implement Portfolio UI only. Domain logic is complete and must not change.

### 2.1 Position identity

- Same ticker = same position
- Spot and leveraged exposures are separate positions
- Places / accounts / wallets are ignored in the portfolio
  - They may exist as optional journal metadata only

---

### 2.2 Position lifecycle (LOCKED) ✅ DONE

- Position is **open** if quantity ≠ 0
- Position is **closed** if quantity = 0
- Closed positions:
  - do not appear in the portfolio list
  - remain in history for aggregation and graphs
- No other lifecycle states exist

---

### 2.3 Spot accounting (LOCKED) ✅ DONE

- Buy → quantity increases
- Sell → quantity decreases
- Sell to zero → position closes
- Payment/funding is recorded in the journal
- Portfolio reflects resulting quantities only

**Leveraged positions**
- Exist as separate positions
- Exact leverage math is deferred
- This does not block portfolio implementation

---

### 2.4 P&L (LOCKED) ✅ DONE

**Types**
- Realized P&L
- Unrealized P&L
- Combined P&L = realized + unrealized

**Defaults**
- Combined P&L shown by default
- User can view realized-only or unrealized-only

**Scope**
- P&L shown per position
- P&L shown for entire portfolio

**Time-based views**
- Calculations support:
  - specific periods (e.g. last month)
  - since beginning
- Time is based on journal entry timestamps

---

### 2.5 Current price source ✅ DONE

- Current price is **manual** for now
- API-based pricing is explicitly deferred
- Manual price must be sufficient to compute value and P&L

---

### 2.6 Historical graph data (LOCKED)

**What it shows**
- Total portfolio value over time
- Cumulative P&L over time

**Timeline**
- Starts from first recorded journal entry
- Uses journal entry time

**Behavior**
- Closed positions continue to affect history
- Current portfolio view shows open positions only

---

## PART 3 — Dashboard (Locked Structure, No New Logic)

### 3.1 Role (LOCKED)

The dashboard is:
- an overview
- a summary
- a starting point

The dashboard is not:
- a detailed portfolio view
- a journal
- an analysis screen
- a configuration surface

---

### 3.2 Content structure (LOCKED)

The dashboard has three vertical sections, in this order.

**Top — Portfolio summary**
- High-level summary of current portfolio state
- Uses current holdings only
- No tables
- Shows:
  - current portfolio value
  - portfolio P&L (combined)
  - simple history graph (recent period)

**Middle — North Star / Thesis**
- Shows the current thesis
- Read-only
- Mental anchor

**Bottom — Quick access**
- Links to:
  - Portfolio
  - Trading Journal
  - Thoughts & Theses
  - Analytics & Patterns
  - Settings

---

### 3.3 Scope boundaries (LOCKED)

- Dashboard does not introduce new logic
- Dashboard does not perform complex analysis
- Dashboard does not diverge from existing app structure
- Dashboard remains simple and stable

---

## Completion Criteria

- Journal enforces mandatory vs optional vs out-of-scope rules exactly
- Portfolio lifecycle, accounting, P&L, and history behave deterministically
- Dashboard structure remains unchanged, but reflects correct portfolio data
- No UI redesign included
