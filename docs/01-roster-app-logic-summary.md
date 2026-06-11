# Hospital Roster App — Complete Logic Summary
*Verified with Dr. Ruwanda — requirements locked*
*Department: Paediatrics (Pead) | Date: June 2026*

---

## 1. System Structure

1. Hierarchy: **Hospital → Department (Pead) → Roster layers**
2. Phase 1 builds **2 layers only**: Consultant roster + SHO/RHO roster
3. Future layers: HO, MO, Nurses (same pattern, added later)
4. Future scope: all hospitals/departments in Sri Lanka — everything is configurable per department

## 2. Users & Roles

| Role | Person | Power |
|---|---|---|
| Admin | You | Creates hospitals, departments, users, staff config. Sees everything |
| E1 — Consultant roster editor | Dr. Wasana (senior) | Creates & publishes consultant casualty roster |
| E2 — SHO/RHO roster editor | Your wife (Ruwanda) | Creates & publishes SHO/RHO roster |
| Viewers | Everyone else | Read-only (Phase 2, via website) |

**Workflow:** E1 publishes consultant roster → E2 gets unlocked → E2 builds SHO roster independently.

**Re-publishing:** E1 can edit and re-publish anytime, even after publishing. Affected dates are flagged for E2. (Email notifications = Phase 2.)

## 3. Consultant Roster Logic

**The 4 consultants:**
- R = Dr. Lal Rathnasiri
- G = Dr. Gihan
- Pu = **Prof Unit** (currently Dr. Kasun) — a unit, not a person; the assigned doctor can change while history stays with the unit
- D = Dr. Dinesha

**Duty types:**
- **Weekday casualty** — 24 hrs, 8:00am → next day 8:00am
- **Weekend casualty** — 48 hrs, Saturday 8:00am → Monday 8:00am, ONE consultant covers the whole weekend block
- ~~Friday casualty~~ — removed, not used
- Public holidays — no effect on the consultant pattern

**Auto-generation rules (learned from Dec 2025 – June 2026 data):**
1. Each consultant gets **7–8 casualty days per month** (30÷4)
2. Each consultant gets **exactly 1 weekend block per month** (4 consultants, 4 weekends)
3. Weekend assignment has **no fixed rotation** — Wasana balances it manually, and consultants sometimes request specific dates (personal favours). App default: auto-balance, then editor swaps freely
4. **No back-to-back days** for the same consultant (except inside their own weekend block)
5. Minimum ~2–3 day gap between a consultant's duties
6. Generator checks **the last days of the previous month** to avoid cross-month back-to-back
7. Fairness tracked cumulatively across months (like the 6-month summary table); weekend casualty counted separately from weekday casualty

## 4. SHO/RHO Roster Logic

**The pool (currently 4):**
- S = Sulakshana (RHO)
- R = Ruwanda (SHO)
- M = Mekala (RHO)
- U = Udara (SHO, rejoined June after maternity leave)

SHO + RHO = **one combined pool**, same duties, same weight. Job title is profile info only. (Configurable — other departments may separate them.)

**Pool turnover (important):** April/May the pool was 1 SHO + 2 RHOs. In June, Udara (SHO) returned from maternity leave → now 2 SHOs + 2 RHOs. The RHOs are **not permanent** — they're expected to leave in ~2 months, and new SHOs/RHOs will replace them. The pool composition changes every few months, so the app must make adding/removing pool members and re-balancing effortless.

**Key dependency:** This team belongs to the **Prof Unit**. Their casualty days = the days **Pu** is on consultant casualty. In June: 3, 8, 11, 19, 23, 27, 28.

**The duty model (confirmed simplification): one person per day = that day's on-call. Cash and post-cash are FLAGS on top of the on-call slot.**

| Duty | When | Rule |
|---|---|---|
| **On-call** | Every single day | Exactly 1 SHO per day; counts split evenly (June: 8/8/7/7). Shift: 8:00am → next day 4:00pm |
| **Cash flag** (casualty) | Only on Pu's casualty days | That day's on-call carries the cash flag — same shift (8:00am → next day 4:00pm) |
| **Post-cash flag** | The day AFTER every cash day | That day's on-call carries the post-cash flag — a DIFFERENT person than the previous day's cash. Stays at hospital, hands over, keeps helping with patients; may leave early with consultant's permission |
| **2nd on-call** (transfer duty) | Casualty days, when a bad patient needs transfer to Colombo Children's | Not written on the paper roster today. Default in app: auto-pick someone **not on-call that day**; editor can swap in that view |

**Balancing rules:**
1. On-call, cash, and post-cash counts are each balanced separately per month
2. Cash and post-cash **inversely compensate** (someone with more cash gets less post-cash — June: S 2/1, M 1/2; April: R 3/1, S 2/3)
3. Post-cash **crosses month boundaries** (June 1 was post-cash of May 31's casualty)

**Weekend rules (confirmed — these are Pead-specific, configurable per department):**
1. **Cash weekend** (Pu's weekend): split between 2 different SHOs — one takes Saturday, another takes Sunday (June: 27=M, 28=R). The Monday after is a **post-cash day** (June 29 ■ = post-cash of the 28th)
2. **Non-cash weekend**: ONE person covers both Sat + Sun (June: 6–7=M, 13–14=S, 20–21=U) and it counts as **2 on-calls** in their tally
3. Non-cash weekend rotation: fixed order **R→M→S→U** by default, carries over between months ("May last non cash – R" → June starts with M). Editor can swap freely

**Shift times (Pead config):**
- On-call (incl. cash days): 8:00am → next day 4:00pm (32 hrs)
- Post-cash, 2nd on-call & other duties: 8:00am → 4:00pm
- Fully configurable per department (names, times, number of positions)

**Staff pool changes:** April/May had 3 people (1 SHO + 2 RHOs, ~9–10 on-calls each), June has 4 (2 SHOs + 2 RHOs, ~7–8 each). Handled by staff active-from/until dates + edit & re-publish. Expect frequent churn — RHOs rotate out every few months.

**Fairness for joiners/leavers (confirmed):** new pool members start their counts from **0**. Data for people who leave is **kept permanently** (history, audit, and the 6-month summaries must survive staff turnover).

**Public holidays (PH):** marked on the roster as a display flag; lighter work unless casualty. No special roster rule.

## 5. Core App Features (Phase 1)

1. Admin panel — hospital, department, staff & shift configuration from frontend
2. Auto-generate next month's roster (both layers) using the rules above
3. **Unavailable dates per person** — editors mark "Dr. Gihan away 10th–15th"; the generator respects them and warns if an existing assignment conflicts
4. Drag & drop editing — swap doctors/SHOs between days; fairness counters update live
5. **Validation & conflict warnings** — visible alerts when an edit breaks a rule: back-to-back on-calls, post-cash person = previous day's cash person, cash day not matching Pu's consultant days, unassigned day, assignment on an unavailable date
6. Publish / re-publish flow with downstream flagging
7. **Cash-day revalidation** — if Wasana moves Pu's casualty after the SHO roster is published, the app flags exactly which SHO cash/post-cash days no longer match the consultant roster
8. **Five-weekend months** — generator assigns 4 weekends, leaves the 5th flagged as "needs decision"; Wasana picks who takes it using the cumulative fairness history shown alongside
9. Fairness dashboard — per person, per duty type, cumulative across months
10. Roster history & audit trail — every change: who, what, when
11. Print / PDF export — clean monthly view for notice boards
12. **Share as image / WhatsApp** — one-tap export of the monthly roster as an image for the WhatsApp group (how rosters actually circulate today)
13. Real datetimes in the database (shifts cross midnight and month boundaries)

**Deferred (noted in data model, built later):** the **Unit layer** — Pead's other units (R's, G's, D's teams) likely keep similar rosters. Database will include a `unit` level under department from day one (Phase 1 has just one unit: Prof Unit), but multi-unit UI and editors come later.

## 6. ✅ Confirmed Answers (verified with Ruwanda)

All 9 open questions are now resolved and folded into the sections above:

1. **Non-cash weekend** — one person covers both Sat+Sun. Pead-specific; other departments may differ (configurable)
2. **2nd on-call** — not on the paper roster. App default: pick someone not on-call that day; editor swaps in that view
3. **Cash day hours** — cash SHO works the on-call shift, 8:00am → next day 4:00pm
4. **Post-cash** — stays at hospital (8am–4pm), hands over to the day's on-call, helps with patients; may leave early with consultant's permission
5. **Monday after cash weekend** — yes, it's a post-cash day
6. **Non-cash weekend rotation** — fixed R→M→S→U by default, carries across months, editor can swap
7. **Weekend on-call tally** — a non-cash weekend counts as 2 on-calls
8. **Consultant weekends** — no fixed rotation; balanced manually, with personal-favour requests honoured via swaps
9. **Joiners/leavers** — counts start from 0; historical data is always kept
10. **Post-cash person = that day's on-call** — confirmed. The model is: one person per day (the on-call), with cash/post-cash as flags. Post-cash days count in the on-call tally

## 7. Status

**Requirements are locked.** Next steps: tech stack → database schema → UI mockups → build.
