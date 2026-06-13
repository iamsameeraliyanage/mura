/* ============================================================
   Mura / MediRoster — prototype data module
   Real fixtures from uploads/05-test-fixtures.json (June 2026)
   plus invented edge states sanctioned by the user:
   - July 2026 consultant DRAFT with unavailability conflicts
   - August 2026 pre-generated roster w/ 5th-weekend decision
   - Consultant re-publish (v4) revalidation scenario for SHO June
   ============================================================ */

export const PEOPLE = {
  R:  { pen: "R",  code: "R",  name: "Dr. Lal Rathnasiri", short: "Rathnasiri", role: "Consultant" },
  G:  { pen: "G",  code: "G",  name: "Dr. Gihan",          short: "Gihan",      role: "Consultant" },
  Pu: { pen: "Pu", code: "Pu", name: "Prof Unit",          short: "Prof Unit",  role: "Consultant", seat: true, holder: "Dr. Kasun" },
  D:  { pen: "D",  code: "D",  name: "Dr. Dinesha",        short: "Dinesha",    role: "Consultant" },
  S:  { pen: "S",  code: "S",  name: "Sulakshana",         short: "Sulakshana", role: "RHO" },
  Rt: { pen: "Rt", code: "R",  name: "Ruwanda",            short: "Ruwanda",    role: "SHO" },
  M:  { pen: "M",  code: "M",  name: "Mekala",             short: "Mekala",     role: "RHO" },
  U:  { pen: "U",  code: "U",  name: "Udara",              short: "Udara",      role: "SHO", note: "Returned from maternity leave June 2026" },
};

export const CONSULTANTS = ["R", "G", "Pu", "D"];
export const SHOS = ["S", "Rt", "M", "U"];

/* months: firstDow 0 = Monday */
export const MONTHS = {
  "2026-06": { key: "2026-06", name: "June 2026",   short: "Jun", days: 30, firstDow: 0, holidays: { 29: "Poson Poya" } },
  "2026-07": { key: "2026-07", name: "July 2026",   short: "Jul", days: 31, firstDow: 2, holidays: {} },
  "2026-08": { key: "2026-08", name: "August 2026", short: "Aug", days: 31, firstDow: 5, holidays: {} },
};

/* ---------- Consultant rosters ---------- */
export const CONSULTANT_ROSTERS = {
  "2026-06": {
    status: "published", version: 3, publishedAt: "May 28, 09:42",
    assignments: {
      1:"R",2:"G",3:"Pu",4:"D",5:"G",6:"R",7:"R",8:"Pu",9:"G",10:"R",
      11:"Pu",12:"D",13:"G",14:"G",15:"R",16:"D",17:"G",18:"R",19:"Pu",20:"D",
      21:"D",22:"G",23:"Pu",24:"D",25:"G",26:"R",27:"Pu",28:"Pu",29:"D",30:"R",
    },
    weekends: [ { days:[6,7], who:"R" }, { days:[13,14], who:"G" }, { days:[20,21], who:"D" }, { days:[27,28], who:"Pu" } ],
    prevTail: { date: "May 31", who: "Pu" },
  },
  "2026-07": {
    status: "draft", version: 1, generatedAt: "Jun 10, 14:05",
    assignments: {
      1:"Pu",2:"D",3:"R",4:"G",5:"G",6:"D",7:"Pu",8:"R",9:"D",10:"G",
      11:"Pu",12:"Pu",13:"R",14:"D",15:"G",16:"R",17:"Pu",18:"R",19:"R",20:"G",
      21:"Pu",22:"D",23:"Pu",24:"G",25:"D",26:"D",27:"R",28:"Pu",29:"D",30:"R",31:"G",
    },
    weekends: [ { days:[4,5], who:"G" }, { days:[11,12], who:"Pu" }, { days:[18,19], who:"R" }, { days:[25,26], who:"D" } ],
    prevTail: { date: "Jun 30", who: "R" },
  },
  /* August exists only as a pre-generated draft the Generate flow reveals */
  "2026-08": {
    status: "none", version: 0,
    pregen: {
      assignments: {
        1:"D",2:"D",3:"R",4:"Pu",5:"G",6:"R",7:"D",8:"G",9:"G",10:"Pu",
        11:"D",12:"R",13:"Pu",14:"D",15:"R",16:"R",17:"G",18:"D",19:"Pu",20:"G",
        21:"R",22:"Pu",23:"Pu",24:"R",25:"G",26:"D",27:"Pu",28:"G",31:"D",
      },
      weekends: [ { days:[1,2], who:"D" }, { days:[8,9], who:"G" }, { days:[15,16], who:"R" }, { days:[22,23], who:"Pu" } ],
      fifthWeekend: { days:[29,30] },
      prevTail: { date: "Jul 31", who: "G" },
    },
  },
};

/* ---------- SHO/RHO roster — June 2026 (real fixture) ----------
   One person per day = on-call. cash / postCash are flags.
   ncw = non-cash weekend (same person Sat+Sun). second = 2nd on-call (transfer). */
export const SHO_ROSTERS = {
  "2026-06": {
    status: "published", version: 2, publishedAt: "May 30, 21:15", builtAgainstVersion: 3,
    assignments: {
      1:{ who:"Rt", postCash:true, note:"Post-cash of May 31 (Pu)" },
      2:{ who:"U" },
      3:{ who:"S",  cash:true, second:"M" },
      4:{ who:"Rt", postCash:true },
      5:{ who:"S" },
      6:{ who:"M",  ncw:true },
      7:{ who:"M",  ncw:true },
      8:{ who:"U",  cash:true, second:"S" },
      9:{ who:"M",  postCash:true },
      10:{ who:"Rt" },
      11:{ who:"S", cash:true, second:"Rt" },
      12:{ who:"M", postCash:true },
      13:{ who:"S", ncw:true },
      14:{ who:"S", ncw:true },
      15:{ who:"Rt" },
      16:{ who:"S" },
      17:{ who:"M" },
      18:{ who:"U" },
      19:{ who:"Rt", cash:true, second:"M" },
      20:{ who:"U", postCash:true, ncw:true },
      21:{ who:"U", ncw:true },
      22:{ who:"Rt" },
      23:{ who:"U", cash:true, second:"S" },
      24:{ who:"S", postCash:true },
      25:{ who:"M" },
      26:{ who:"U" },
      27:{ who:"M", cash:true, cwd:"Sat", second:"S" },
      28:{ who:"Rt", cash:true, cwd:"Sun", second:"U" },
      29:{ who:"U", postCash:true },
      30:{ who:"Rt" },
    },
    rotation: { order: ["Rt","M","S","U"], carried: "May last non-cash weekend = Ruwanda, so June starts at Mekala", sequence: "M (6–7) → S (13–14) → U (20–21)" },
  },
};

/* Revalidation scenario: Wasana re-publishes June v4 moving Pu's casualty 23 → 25 */
export const REVALIDATION_SCENARIO = {
  consultantVersion: 4, change: "Pu casualty moved June 23 → June 25",
  affected: {
    23: "Cash flag no longer matches — Pu is not on consultant casualty June 23",
    24: "Post-cash of a day that is no longer a cash day",
    25: "Pu now on casualty — this day needs the cash flag",
    26: "Day after new cash day — needs post-cash (different person than June 25)",
  },
};

/* ---------- Unavailability ---------- */
export const UNAVAILABILITY = [
  { id:1, who:"G",  from:"Jul 10", to:"Jul 15", fromISO:"2026-07-10", toISO:"2026-07-15", days:[10,11,12,13,14,15], month:"2026-07", reason:"Conference — Singapore", by:"Dr. Wasana", at:"Jun 08, 11:20", conflicts:[10,15] },
  { id:2, who:"M",  from:"Aug 03", to:"Aug 05", fromISO:"2026-08-03", toISO:"2026-08-05", days:[3,4,5], month:"2026-08", reason:"MD Part 1 exam", by:"Ruwanda", at:"Jun 09, 18:02", conflicts:[] },
  { id:3, who:"U",  from:"Jul 06", to:"Jul 07", fromISO:"2026-07-06", toISO:"2026-07-07", days:[6,7], month:"2026-07", reason:"Child's vaccination + leave", by:"Ruwanda", at:"Jun 11, 08:44", conflicts:[] },
  { id:4, who:"D",  from:"Jun 16", to:"Jun 16", fromISO:"2026-06-16", toISO:"2026-06-16", days:[16], month:"2026-06", reason:"Private clinic commitment (resolved by swap)", by:"Dr. Wasana", at:"May 26, 16:31", conflicts:[16], resolved:true },
];

/* ---------- Fairness ---------- */
export const CONSULTANT_6MO = {
  range: "Dec 2025 – May 2026",
  casualty: { R:46, Pu:47, D:44, G:45 },
  weekend:  { R:6,  Pu:8,  D:6,  G:4 },
};
export const SHO_HISTORY = [
  { month:"Apr 2026", pool:3, onCall:{ S:9, Rt:9, M:9 },        cash:{ S:2, Rt:3, M:2 }, postCash:{ S:3, Rt:1, M:2 } },
  { month:"May 2026", pool:3, onCall:{ S:10, Rt:11, M:10 },     cash:{ S:3, Rt:2, M:2 }, postCash:{ S:2, Rt:3, M:2 } },
  { month:"Jun 2026", pool:4, onCall:{ S:7, Rt:8, M:7, U:8 },   cash:{ S:2, Rt:2, M:1, U:2 }, postCash:{ S:1, Rt:2, M:2, U:2 } },
];

/* ---------- Audit log ---------- */
export const AUDIT = [
  { id:12, at:"Jun 10, 14:32", who:"Dr. Wasana", role:"Consultant editor", action:"swap",    roster:"Consultant · Jul 2026 · v1 draft", detail:"Jul 03", before:"G", after:"R", reason:"Gihan away 10–15, rebalancing early month" },
  { id:11, at:"Jun 10, 14:05", who:"Dr. Wasana", role:"Consultant editor", action:"generate",roster:"Consultant · Jul 2026 · v1 draft", detail:"Auto-generated 31 days · 4 weekend blocks", before:"—", after:"31 slots" },
  { id:10, at:"May 30, 21:15", who:"Ruwanda",    role:"SHO editor",        action:"publish", roster:"SHO/RHO · Jun 2026 · v2",          detail:"Published against consultant v3", before:"v1 draft", after:"v2 published" },
  { id:9,  at:"May 30, 20:58", who:"Ruwanda",    role:"SHO editor",        action:"swap",    roster:"SHO/RHO · Jun 2026 · v1 draft",    detail:"Jun 20", before:"M", after:"U", reason:"Weekend rotation carried from May ends at U" },
  { id:8,  at:"May 30, 20:51", who:"Ruwanda",    role:"SHO editor",        action:"swap",    roster:"SHO/RHO · Jun 2026 · v1 draft",    detail:"Jun 09", before:"S", after:"M", reason:"Inverse cash/post-cash compensation" },
  { id:7,  at:"May 29, 07:12", who:"Ruwanda",    role:"SHO editor",        action:"generate",roster:"SHO/RHO · Jun 2026 · v1 draft",    detail:"Cash days locked to Pu: 3, 8, 11, 19, 23, 27, 28", before:"—", after:"30 slots" },
  { id:6,  at:"May 28, 09:42", who:"Dr. Wasana", role:"Consultant editor", action:"publish", roster:"Consultant · Jun 2026 · v3",       detail:"Re-published — unlocked SHO roster", before:"v2", after:"v3 published" },
  { id:5,  at:"May 28, 09:40", who:"Dr. Wasana", role:"Consultant editor", action:"swap",    roster:"Consultant · Jun 2026 · v2",       detail:"Jun 16", before:"D", after:"D ⇄ G swap with Jun 17", reason:"Dinesha private clinic on the 16th" },
  { id:4,  at:"May 26, 16:31", who:"Dr. Wasana", role:"Consultant editor", action:"unavail", roster:"Staff",                            detail:"Dinesha · Jun 16", before:"—", after:"1 day blocked" },
  { id:3,  at:"May 25, 10:09", who:"Dr. Wasana", role:"Consultant editor", action:"publish", roster:"Consultant · Jun 2026 · v2",       detail:"Initial publish", before:"v1 draft", after:"v2 published" },
  { id:2,  at:"May 24, 19:30", who:"Dr. Wasana", role:"Consultant editor", action:"generate",roster:"Consultant · Jun 2026 · v1 draft", detail:"Auto-generated 30 days · 4 weekend blocks", before:"—", after:"30 slots" },
  { id:1,  at:"May 24, 19:21", who:"Admin",      role:"Admin",             action:"config",  roster:"Staff",                            detail:"Udara re-activated from Jun 01 (returned from maternity leave)", before:"inactive", after:"active" },
];

/* ---------- Shift config (Pead defaults) ---------- */
export const SHIFT_CONFIG = [
  { duty:"On-call",            layer:"SHO/RHO",    time:"8:00 am → next day 4:00 pm", hours:"32 h", note:"Every day · exactly one person" },
  { duty:"Cash (casualty)",    layer:"SHO/RHO",    time:"8:00 am → next day 4:00 pm", hours:"32 h", note:"Flag on the on-call · only on Pu days" },
  { duty:"Post-cash",          layer:"SHO/RHO",    time:"8:00 am → 4:00 pm",          hours:"8 h",  note:"Day after every cash day · different person" },
  { duty:"2nd on-call",        layer:"SHO/RHO",    time:"8:00 am → 4:00 pm",          hours:"8 h",  note:"Transfer duty · someone not on-call that day" },
  { duty:"Weekday casualty",   layer:"Consultant", time:"8:00 am → next day 8:00 am", hours:"24 h", note:"" },
  { duty:"Weekend casualty",   layer:"Consultant", time:"Sat 8:00 am → Mon 8:00 am",  hours:"48 h", note:"One consultant covers the whole block" },
];

/* ---------- Roles & navigation ---------- */
export const ROLES = {
  ADMIN: { key:"ADMIN", label:"Admin",      person:"Admin",       caption:"Sees everything" },
  E1:    { key:"E1",    label:"Dr. Wasana", person:"Dr. Wasana",  caption:"Consultant roster editor" },
  E2:    { key:"E2",    label:"Ruwanda",    person:"Ruwanda",     caption:"SHO/RHO roster editor" },
};

export const NAV = [
  { id:"dashboard",  label:"Dashboard",       href:"Dashboard.dc.html",         roles:["ADMIN","E1","E2"], icon:"M3 3h7v9H3z M14 3h7v5h-7z M14 12h7v9h-7z M3 16h7v5H3z" },
  { id:"consultant", label:"Consultant roster", href:"Consultant Roster.dc.html", roles:["ADMIN","E1"],     icon:"M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 9.5h18 M8 2v4 M16 2v4" },
  { id:"sho",        label:"SHO/RHO roster",  href:"SHO Roster.dc.html",        roles:["ADMIN","E2"],      icon:"M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 9.5h18 M8 2v4 M16 2v4 M8 14h.01 M12 14h.01 M16 14h.01 M8 17.5h.01 M12 17.5h.01" },
  { id:"fairness",   label:"Fairness",        href:"Fairness.dc.html",          roles:["ADMIN","E1","E2"], icon:"M18 20V10 M12 20V4 M6 20v-6 M3 20h18" },
  { id:"staff",      label:"Staff & config",  href:"Staff.dc.html",             roles:["ADMIN"],           icon:"M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M2 21v-1a6 6 0 0 1 6-6h2a6 6 0 0 1 6 6v1 M17.5 3.3a4 4 0 0 1 0 7.4 M22 21v-1a6 6 0 0 0-4-5.6" },
  { id:"unavail",    label:"Unavailability",  href:"Unavailability.dc.html",    roles:["ADMIN","E1","E2"], icon:"M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M3 9.5h18 M8 2v4 M16 2v4 M10 13.5l4 4 M14 13.5l-4 4" },
  { id:"audit",      label:"Audit trail",     href:"Audit.dc.html",             roles:["ADMIN","E1","E2"], icon:"M3 12a9 9 0 1 0 2.8-6.5L3 8 M3 3v5h5 M12 7v5l3.5 2" },
  { id:"share",      label:"Share & export",  href:"Share.dc.html",             roles:["ADMIN","E1","E2"], icon:"M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7 M12 3v13 M8 7l4-4 4 4" },
  { id:"mobile",     label:"Mobile preview",  href:"Mobile.dc.html",            roles:["ADMIN","E1","E2"], icon:"M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z M11 18.5h2" },
];

/* ---------- Helpers ---------- */
export function getRole() {
  try { return localStorage.getItem("mura_role") || "E1"; } catch (e) { return "E1"; }
}
export function setRole(r) {
  try { localStorage.setItem("mura_role", r); } catch (e) {}
}

/* Build calendar cells for a month: leading/trailing nulls + day numbers */
export function buildCells(monthKey) {
  const m = MONTHS[monthKey];
  const cells = [];
  for (let i = 0; i < m.firstDow; i++) cells.push(null);
  for (let d = 1; d <= m.days; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
export function dowOf(monthKey, day) {
  return (MONTHS[monthKey].firstDow + day - 1) % 7; /* 0=Mon … 5=Sat 6=Sun */
}
export function isWeekend(monthKey, day) {
  return dowOf(monthKey, day) >= 5;
}

/* Consultant tallies for an assignments map */
export function consultantTallies(assignments, weekends) {
  const t = {}; CONSULTANTS.forEach((c) => (t[c] = { days: 0, weekend: 0 }));
  Object.values(assignments).forEach((w) => { if (t[w]) t[w].days++; });
  (weekends || []).forEach((b) => { if (t[b.who]) t[b.who].weekend++; });
  return t;
}

/* SHO tallies for an assignments map */
export function shoTallies(assignments) {
  const t = {}; SHOS.forEach((s) => (t[s] = { onCall: 0, cash: 0, postCash: 0, weekend: 0 }));
  Object.values(assignments).forEach((a) => {
    if (!a || !t[a.who]) return;
    t[a.who].onCall++;
    if (a.cash) t[a.who].cash++;
    if (a.postCash) t[a.who].postCash++;
    if (a.ncw) t[a.who].weekend += 0.5; /* two ncw days = 1 weekend */
  });
  SHOS.forEach((s) => (t[s].weekend = Math.round(t[s].weekend)));
  return t;
}

/* Consultant validation — returns [{day, rule, text, severity}] */
export function validateConsultant(monthKey, assignments, weekends, prevTail) {
  const m = MONTHS[monthKey];
  const issues = [];
  const roster = CONSULTANT_ROSTERS[monthKey];
  const wkList = weekends || (roster && roster.weekends) || [];
  const tail = prevTail || (roster && roster.prevTail) || (roster && roster.pregen && roster.pregen.prevTail);
  /* V1: back-to-back (weekend blocks exempt) */
  const wkDays = {};
  wkList.forEach((b) => b.days.forEach((d) => (wkDays[d] = b.who)));
  for (let d = 1; d < m.days; d++) {
    const a = assignments[d], b = assignments[d + 1];
    if (a && b && a === b && !(wkDays[d] === a && wkDays[d + 1] === a)) {
      issues.push({ day: d + 1, rule: "V1", severity: "error", text: PEOPLE[a].name + " is on back-to-back days (" + m.short + " " + d + " + " + (d + 1) + ")" });
    }
  }
  /* V1 cross-month */
  if (tail && assignments[1] === tail.who) {
    issues.push({ day: 1, rule: "V1", severity: "error", text: PEOPLE[assignments[1]].name + " was on casualty " + tail.date + " — back-to-back across the month boundary" });
  }
  /* V7: unassigned days */
  for (let d = 1; d <= m.days; d++) {
    if (!assignments[d]) issues.push({ day: d, rule: "V7", severity: "warn", text: m.short + " " + String(d).padStart(2, "0") + " has no consultant assigned" });
  }
  /* V9: unavailability */
  UNAVAILABILITY.filter((u) => u.month === monthKey && !u.resolved).forEach((u) => {
    u.days.forEach((d) => {
      if (assignments[d] === u.who) {
        issues.push({ day: d, rule: "V9", severity: "error", text: PEOPLE[u.who].name + " is assigned " + m.short + " " + String(d).padStart(2, "0") + " but is unavailable (" + u.reason + ")" });
      }
    });
  });
  return issues;
}

/* SHO validation against a consultant roster's Pu days */
export function validateSho(monthKey, assignments, puDays) {
  const m = MONTHS[monthKey];
  const issues = [];
  for (let d = 1; d <= m.days; d++) {
    const a = assignments[d];
    if (!a || !a.who) { issues.push({ day: d, rule: "V7", severity: "warn", text: m.short + " " + String(d).padStart(2, "0") + " has no on-call assigned" }); continue; }
    /* V4: cash days must equal Pu days */
    const isPu = puDays.indexOf(d) >= 0;
    if (a.cash && !isPu) issues.push({ day: d, rule: "V4", severity: "error", text: m.short + " " + String(d).padStart(2, "0") + " carries the cash flag but Pu is not on consultant casualty" });
    if (!a.cash && isPu) issues.push({ day: d, rule: "V4", severity: "error", text: m.short + " " + String(d).padStart(2, "0") + " is a Pu casualty day but has no cash flag" });
    /* V5: post-cash person ≠ previous day's cash person */
    if (a.postCash && d > 1) {
      const prev = assignments[d - 1];
      if (prev && prev.cash && prev.who === a.who) {
        issues.push({ day: d, rule: "V5", severity: "error", text: PEOPLE[a.who].name + " is post-cash " + m.short + " " + String(d).padStart(2, "0") + " right after their own cash day — must be a different person" });
      }
    }
    /* V2: back-to-back on-call (non-cash weekends exempt) */
    if (d > 1) {
      const prev = assignments[d - 1];
      if (prev && prev.who === a.who && !(a.ncw && prev.ncw)) {
        issues.push({ day: d, rule: "V2", severity: "error", text: PEOPLE[a.who].name + " is on-call back-to-back (" + m.short + " " + (d - 1) + " + " + d + ")" });
      }
    }
  }
  return issues;
}
