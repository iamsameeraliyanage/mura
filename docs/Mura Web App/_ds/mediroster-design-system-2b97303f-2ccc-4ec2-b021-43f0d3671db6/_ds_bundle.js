/* @ds-bundle: {"format":3,"namespace":"MediRosterDesignSystem_2b9730","components":[{"name":"PrimaryButton","sourcePath":"components/buttons/PrimaryButton.jsx"},{"name":"CalendarCell","sourcePath":"components/calendar/CalendarCell.jsx"},{"name":"MonthGrid","sourcePath":"components/calendar/MonthGrid.jsx"},{"name":"PEN","sourcePath":"components/chips/DutyChip.jsx"},{"name":"DutyChip","sourcePath":"components/chips/DutyChip.jsx"},{"name":"FlagBadge","sourcePath":"components/chips/FlagBadge.jsx"},{"name":"StatusBadge","sourcePath":"components/chips/StatusBadge.jsx"},{"name":"FairnessRow","sourcePath":"components/fairness/FairnessRow.jsx"},{"name":"ValidationAlert","sourcePath":"components/feedback/ValidationAlert.jsx"},{"name":"NavItem","sourcePath":"components/navigation/NavItem.jsx"}],"sourceHashes":{"components/buttons/PrimaryButton.jsx":"2e43fe6e4827","components/calendar/CalendarCell.jsx":"85c4ac5210b1","components/calendar/MonthGrid.jsx":"19738b560430","components/chips/DutyChip.jsx":"c2e60f4b4a78","components/chips/FlagBadge.jsx":"78bd0f4a98ec","components/chips/StatusBadge.jsx":"573afe57f1e3","components/fairness/FairnessRow.jsx":"4118460277c6","components/feedback/ValidationAlert.jsx":"00410cbf6010","components/navigation/NavItem.jsx":"583e8a560cc4","ui_kits/mediroster/AdminScreen.jsx":"e0ed13fee5ac","ui_kits/mediroster/AppShell.jsx":"67072f504b56","ui_kits/mediroster/AuditTrail.jsx":"60569dbcbe37","ui_kits/mediroster/CalendarScreen.jsx":"c422882dc094","ui_kits/mediroster/FairnessDashboard.jsx":"00fe2beb938c","ui_kits/mediroster/LoginScreen.jsx":"6aa42e96049d","ui_kits/mediroster/WhatsAppExport.jsx":"5a5c7595d5c1","ui_kits/mediroster/data.js":"6e8686aa08b8","ui_kits/mediroster/icons.jsx":"85d20870ca5c"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.MediRosterDesignSystem_2b9730 = window.MediRosterDesignSystem_2b9730 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/buttons/PrimaryButton.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PrimaryButton — the single action button for MediRoster.
 * One accent (scrub teal). Variants: solid (default), outline, destructive, ghost.
 */
function PrimaryButton({
  children,
  variant = "solid",
  size = "md",
  icon = null,
  iconRight = null,
  disabled = false,
  type = "button",
  onClick,
  style = {},
  ...rest
}) {
  const sizes = {
    sm: {
      padding: "0 12px",
      height: 32,
      fontSize: "var(--text-sm)",
      gap: 6
    },
    md: {
      padding: "0 16px",
      height: 38,
      fontSize: "var(--text-base)",
      gap: 8
    },
    lg: {
      padding: "0 22px",
      height: 44,
      fontSize: "var(--text-md)",
      gap: 8
    }
  };
  const s = sizes[size] || sizes.md;
  const variants = {
    solid: {
      background: "var(--teal-600)",
      color: "var(--ink-on-accent)",
      border: "1px solid var(--teal-600)"
    },
    outline: {
      background: "var(--surface)",
      color: "var(--teal-700)",
      border: "1px solid var(--teal-600)"
    },
    destructive: {
      background: "var(--surface)",
      color: "var(--danger)",
      border: "1px solid var(--danger)"
    },
    ghost: {
      background: "transparent",
      color: "var(--ink-secondary)",
      border: "1px solid transparent"
    }
  };
  const v = variants[variant] || variants.solid;
  return /*#__PURE__*/React.createElement("button", _extends({
    type: type,
    disabled: disabled,
    onClick: onClick,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: s.gap,
      height: s.size,
      padding: s.padding,
      minHeight: s.height,
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--weight-semibold)",
      fontSize: s.fontSize,
      lineHeight: 1,
      borderRadius: "var(--radius-md)",
      cursor: disabled ? "not-allowed" : "pointer",
      opacity: disabled ? 0.45 : 1,
      boxShadow: variant === "solid" ? "var(--shadow-xs)" : "none",
      transition: "background var(--dur-fast) var(--ease-standard), opacity var(--dur-fast)",
      whiteSpace: "nowrap",
      ...v,
      ...style
    },
    onMouseDown: e => {
      if (!disabled) e.currentTarget.style.transform = "translateY(0.5px)";
    },
    onMouseUp: e => {
      e.currentTarget.style.transform = "none";
    },
    onMouseLeave: e => {
      e.currentTarget.style.transform = "none";
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex"
    }
  }, icon) : null, children, iconRight ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex"
    }
  }, iconRight) : null);
}
Object.assign(__ds_scope, { PrimaryButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/buttons/PrimaryButton.jsx", error: String((e && e.message) || e) }); }

// components/chips/DutyChip.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * PEN — the eight pen colors, keyed by pen id. `label` is the short code
 * shown on the chip (Ruwanda's pen id is "Rt" but reads "R" on the sheet).
 */
const PEN = {
  R: {
    label: "R",
    ink: "var(--pen-R-ink)",
    bg: "var(--pen-R-bg)",
    dot: "var(--pen-R-dot)",
    name: "Dr. Lal Rathnasiri"
  },
  G: {
    label: "G",
    ink: "var(--pen-G-ink)",
    bg: "var(--pen-G-bg)",
    dot: "var(--pen-G-dot)",
    name: "Dr. Gihan"
  },
  Pu: {
    label: "Pu",
    ink: "var(--pen-Pu-ink)",
    bg: "var(--pen-Pu-bg)",
    dot: "var(--pen-Pu-dot)",
    name: "Prof Unit / Dr. Kasun"
  },
  D: {
    label: "D",
    ink: "var(--pen-D-ink)",
    bg: "var(--pen-D-bg)",
    dot: "var(--pen-D-dot)",
    name: "Dr. Dinesha"
  },
  S: {
    label: "S",
    ink: "var(--pen-S-ink)",
    bg: "var(--pen-S-bg)",
    dot: "var(--pen-S-dot)",
    name: "Sulakshana"
  },
  Rt: {
    label: "R",
    ink: "var(--pen-Rt-ink)",
    bg: "var(--pen-Rt-bg)",
    dot: "var(--pen-Rt-dot)",
    name: "Ruwanda"
  },
  M: {
    label: "M",
    ink: "var(--pen-M-ink)",
    bg: "var(--pen-M-bg)",
    dot: "var(--pen-M-dot)",
    name: "Mekala"
  },
  U: {
    label: "U",
    ink: "var(--pen-U-ink)",
    bg: "var(--pen-U-bg)",
    dot: "var(--pen-U-dot)",
    name: "Udara"
  }
};

/**
 * DutyChip — the signature element. A rounded pill in a person's pen color
 * (tinted fill + strong text) showing their short code. The only vivid thing
 * on the calendar.
 */
function DutyChip({
  pen = "R",
  label,
  size = "md",
  secondary = false,
  dragging = false,
  conflict = false,
  dropValid = false,
  style = {},
  ...rest
}) {
  const p = PEN[pen] || PEN.R;
  const sizes = {
    sm: {
      h: 22,
      minW: 26,
      font: 12,
      pad: "0 7px"
    },
    md: {
      h: 28,
      minW: 32,
      font: 14,
      pad: "0 9px"
    },
    lg: {
      h: 34,
      minW: 40,
      font: 17,
      pad: "0 12px"
    }
  };
  const s = sizes[size] || sizes.md;
  let ring = "transparent";
  if (conflict) ring = "var(--danger-ring)";else if (dropValid) ring = "var(--teal-ring)";
  return /*#__PURE__*/React.createElement("span", _extends({
    role: "img",
    "aria-label": p.name,
    style: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: s.minW,
      height: s.h,
      padding: s.pad,
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--weight-semibold)",
      fontSize: s.font,
      lineHeight: 1,
      color: p.ink,
      background: secondary ? "var(--surface)" : p.bg,
      border: secondary ? `1px dashed ${p.dot}` : "1px solid transparent",
      borderRadius: "var(--radius-chip)",
      boxShadow: dragging ? `var(--shadow-lift), 0 0 0 2px ${ring}` : ring !== "transparent" ? `0 0 0 2px ${ring}` : "none",
      outline: ring !== "transparent" ? `2px solid ${ring}` : "none",
      outlineOffset: ring !== "transparent" ? "1px" : 0,
      transform: dragging ? "scale(1.05)" : "none",
      transition: "transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast)",
      cursor: "grab",
      userSelect: "none",
      ...style
    }
  }, rest), label || p.label);
}
Object.assign(__ds_scope, { PEN, DutyChip });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chips/DutyChip.jsx", error: String((e && e.message) || e) }); }

// components/chips/FlagBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FlagBadge — small duty-flag badges shown at the bottom of a calendar cell.
 *   cash      ◆  amber on warm cream  — casualty / cash day
 *   postcash  ■  indigo on lavender   — post-cash day
 *   conflict  ⚠  red                  — scheduling conflict
 */
const FLAGS = {
  cash: {
    glyph: "◆",
    ink: "var(--cash-ink)",
    bg: "var(--cash-bg)",
    label: "Cash / casualty"
  },
  postcash: {
    glyph: "■",
    ink: "var(--postcash-ink)",
    bg: "var(--postcash-bg)",
    label: "Post-cash"
  },
  conflict: {
    glyph: "⚠",
    ink: "var(--danger)",
    bg: "var(--danger-bg)",
    label: "Conflict"
  }
};
function FlagBadge({
  type = "cash",
  label,
  withText = false,
  style = {},
  ...rest
}) {
  const f = FLAGS[type] || FLAGS.cash;
  return /*#__PURE__*/React.createElement("span", _extends({
    title: f.label,
    "aria-label": f.label,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: withText ? 5 : 0,
      height: 18,
      minWidth: 18,
      padding: withText ? "0 7px" : 0,
      justifyContent: "center",
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 11,
      lineHeight: 1,
      color: f.ink,
      background: f.bg,
      borderRadius: "var(--radius-sm)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 10
    }
  }, f.glyph), withText ? /*#__PURE__*/React.createElement("span", null, label || f.label) : null);
}
Object.assign(__ds_scope, { FlagBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chips/FlagBadge.jsx", error: String((e && e.message) || e) }); }

// components/calendar/CalendarCell.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * CalendarCell — one day on the month grid. Day number (mono, top-left),
 * a centered DutyChip, and optional flag badges along the bottom. Tints for
 * weekend, public holiday; red ring on conflict.
 */
function CalendarCell({
  day,
  pen,
  label,
  secondaryPen,
  secondaryLabel,
  flags = [],
  conflict = false,
  weekend = false,
  holiday = false,
  today = false,
  muted = false,
  onClick,
  style = {},
  children,
  ...rest
}) {
  let bg = "var(--surface)";
  if (holiday) bg = "var(--holiday-bg)";else if (weekend) bg = "var(--weekend-bg)";
  if (muted) bg = "var(--surface-sunken)";
  return /*#__PURE__*/React.createElement("div", _extends({
    onClick: onClick,
    onMouseEnter: onClick ? e => {
      e.currentTarget.style.background = "var(--teal-50)";
    } : undefined,
    onMouseLeave: onClick ? e => {
      e.currentTarget.style.background = bg;
    } : undefined,
    style: {
      position: "relative",
      display: "flex",
      flexDirection: "column",
      minHeight: "var(--cell-min-h)",
      padding: 8,
      background: bg,
      borderRight: "var(--border-hair)",
      borderBottom: "var(--border-hair)",
      boxShadow: today ? "inset 0 0 0 2px var(--teal-600)" : "none",
      cursor: onClick ? "pointer" : "default",
      opacity: muted ? 0.55 : 1,
      transition: "background var(--dur-fast) var(--ease-standard)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      fontWeight: today ? 700 : 400,
      color: today ? "var(--teal-700)" : "var(--ink-tertiary)",
      fontVariantNumeric: "tabular-nums"
    }
  }, String(day).padStart(2, "0")), today ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: ".05em",
      color: "var(--teal-700)",
      background: "var(--teal-50)",
      borderRadius: "var(--radius-sm)",
      padding: "1px 5px"
    }
  }, "TODAY") : holiday ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 9,
      fontWeight: 700,
      letterSpacing: ".04em",
      color: "var(--danger)"
    }
  }, "PH") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 5,
      padding: "6px 0",
      flexWrap: "wrap"
    }
  }, pen ? /*#__PURE__*/React.createElement(__ds_scope.DutyChip, {
    pen: pen,
    label: label,
    conflict: conflict
  }) : children, secondaryPen ? /*#__PURE__*/React.createElement(__ds_scope.DutyChip, {
    pen: secondaryPen,
    label: secondaryLabel,
    secondary: true,
    size: "sm"
  }) : null), flags.length || conflict ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 4,
      alignItems: "center",
      minHeight: 18
    }
  }, flags.map((f, i) => /*#__PURE__*/React.createElement(__ds_scope.FlagBadge, {
    key: i,
    type: f
  })), conflict ? /*#__PURE__*/React.createElement(__ds_scope.FlagBadge, {
    type: "conflict"
  }) : null) : null);
}
Object.assign(__ds_scope, { CalendarCell });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/calendar/CalendarCell.jsx", error: String((e && e.message) || e) }); }

// components/calendar/MonthGrid.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/**
 * MonthGrid — the month calendar. Mon–Sun columns, 5–6 rows. Pass `days` as an
 * array of cell descriptors (or null for leading/trailing blanks). `compact`
 * renders the tighter mobile layout.
 *
 * day descriptor: { day, pen, label, secondaryPen, flags, conflict, weekend, holiday, today }
 */
function MonthGrid({
  days = [],
  compact = false,
  onCellClick,
  style = {}
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      border: "var(--border-hair)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      background: "var(--surface)",
      ...style
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)",
      borderBottom: "var(--border-hair)"
    }
  }, WEEKDAYS.map((d, i) => /*#__PURE__*/React.createElement("div", {
    key: d,
    style: {
      padding: compact ? "7px 0" : "9px 10px",
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      fontWeight: "var(--weight-semibold)",
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      color: i >= 5 ? "var(--ink-secondary)" : "var(--ink-tertiary)",
      textAlign: compact ? "center" : "left",
      background: i >= 5 ? "var(--weekend-bg)" : "transparent",
      borderRight: i < 6 ? "var(--border-hair)" : "none"
    }
  }, compact ? d[0] : d))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(7, 1fr)"
    }
  }, days.map((c, i) => c ? /*#__PURE__*/React.createElement(__ds_scope.CalendarCell, _extends({
    key: i
  }, c, {
    onClick: onCellClick ? () => onCellClick(c, i) : undefined,
    style: compact ? {
      minHeight: 64,
      padding: 5
    } : undefined
  })) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      minHeight: compact ? 64 : "var(--cell-min-h)",
      background: "var(--surface-sunken)",
      borderRight: "var(--border-hair)",
      borderBottom: "var(--border-hair)"
    }
  }))));
}
Object.assign(__ds_scope, { MonthGrid });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/calendar/MonthGrid.jsx", error: String((e && e.message) || e) }); }

// components/chips/StatusBadge.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * StatusBadge — roster lifecycle state. DRAFT (purple) or PUBLISHED (green),
 * with an optional version number in mono.
 */
function StatusBadge({
  status = "draft",
  version,
  style = {},
  ...rest
}) {
  const map = {
    draft: {
      ink: "var(--draft-ink)",
      bg: "var(--draft-bg)",
      label: "DRAFT"
    },
    published: {
      ink: "var(--published-ink)",
      bg: "var(--published-bg)",
      label: "PUBLISHED"
    }
  };
  const s = map[status] || map.draft;
  return /*#__PURE__*/React.createElement("span", _extends({
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      height: 24,
      padding: "0 10px",
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--weight-semibold)",
      fontSize: 11,
      letterSpacing: "var(--tracking-label)",
      color: s.ink,
      background: s.bg,
      borderRadius: "var(--radius-sm)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 6,
      height: 6,
      borderRadius: "var(--radius-pill)",
      background: s.ink
    }
  }), s.label, version != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontWeight: 500,
      opacity: 0.7,
      letterSpacing: 0
    }
  }, "v", version) : null);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/chips/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/fairness/FairnessRow.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * FairnessRow — one person in the FairnessPanel. Pen dot + name, mono tally
 * columns (on-call / cash / post-cash / weekend), and a thin bar showing this
 * person's share vs the pool average. Over → amber, under → green, balanced → grey.
 */
function FairnessRow({
  pen = "S",
  name,
  tallies = {},
  value,
  average,
  style = {},
  ...rest
}) {
  const p = __ds_scope.PEN[pen] || __ds_scope.PEN.S;
  const {
    onCall = 0,
    cash = 0,
    postCash = 0,
    weekend = 0
  } = tallies;
  const v = value != null ? value : onCall;
  const avg = average != null && average > 0 ? average : v;
  const ratio = avg > 0 ? v / avg : 1;
  const delta = Math.abs(ratio - 1);
  let barColor = "var(--bar-balanced)";
  if (delta > 0.12) barColor = ratio > 1 ? "var(--bar-over)" : "var(--bar-under)";

  // bar fill: average sits at 60% of track; scale share around it, clamp 6–100%
  const pct = Math.max(6, Math.min(100, ratio * 60));
  const Tally = ({
    n
  }) => /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      fontVariantNumeric: "tabular-nums",
      color: "var(--ink)",
      width: 22,
      textAlign: "right",
      flexShrink: 0
    }
  }, String(n).padStart(2, "0"));
  return /*#__PURE__*/React.createElement("div", _extends({
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "9px 4px",
      borderBottom: "var(--border-hair)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: "var(--radius-pill)",
      background: p.dot,
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-medium)",
      color: "var(--ink)",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, name || p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 4,
      background: "var(--bar-track)",
      borderRadius: 2,
      marginTop: 5,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: pct + "%",
      height: "100%",
      background: barColor,
      borderRadius: 2,
      transition: "width var(--dur-base) var(--ease-standard)"
    }
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Tally, {
    n: onCall
  }), /*#__PURE__*/React.createElement(Tally, {
    n: cash
  }), /*#__PURE__*/React.createElement(Tally, {
    n: postCash
  }), /*#__PURE__*/React.createElement(Tally, {
    n: weekend
  })));
}
Object.assign(__ds_scope, { FairnessRow });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/fairness/FairnessRow.jsx", error: String((e && e.message) || e) }); }

// components/feedback/ValidationAlert.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * ValidationAlert — inline scheduling warning. Describes a conflict and offers
 * a "Jump to day" link. Severity: warning (amber) or error (red).
 */
function ValidationAlert({
  severity = "warning",
  title,
  description,
  onJump,
  jumpLabel = "Jump to day",
  style = {},
  ...rest
}) {
  const map = {
    warning: {
      ink: "var(--cash-ink)",
      bg: "var(--cash-bg)",
      glyph: "⚠"
    },
    error: {
      ink: "var(--danger)",
      bg: "var(--danger-bg)",
      glyph: "⚠"
    }
  };
  const s = map[severity] || map.warning;
  return /*#__PURE__*/React.createElement("div", _extends({
    role: "alert",
    style: {
      display: "flex",
      gap: 11,
      padding: "11px 13px",
      background: s.bg,
      border: `1px solid ${s.ink}`,
      borderRadius: "var(--radius-md)",
      fontFamily: "var(--font-ui)",
      ...style
    }
  }, rest), /*#__PURE__*/React.createElement("span", {
    style: {
      color: s.ink,
      fontSize: 15,
      lineHeight: 1.3,
      flexShrink: 0
    }
  }, s.glyph), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, title ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      fontWeight: "var(--weight-semibold)",
      color: "var(--ink)"
    }
  }, title) : null, description ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--text-sm)",
      color: "var(--ink-secondary)",
      marginTop: title ? 2 : 0
    }
  }, description) : null), onJump ? /*#__PURE__*/React.createElement("button", {
    onClick: onJump,
    style: {
      flexShrink: 0,
      alignSelf: "center",
      background: "transparent",
      border: "none",
      color: s.ink,
      fontFamily: "var(--font-ui)",
      fontWeight: "var(--weight-semibold)",
      fontSize: "var(--text-sm)",
      cursor: "pointer",
      textDecoration: "underline",
      textUnderlineOffset: 2,
      whiteSpace: "nowrap"
    }
  }, jumpLabel) : null);
}
Object.assign(__ds_scope, { ValidationAlert });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/feedback/ValidationAlert.jsx", error: String((e && e.message) || e) }); }

// components/navigation/NavItem.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/**
 * NavItem — left-sidebar (desktop) or bottom-tab (mobile) navigation item.
 * Active state uses the teal accent; inactive is quiet slate.
 */
function NavItem({
  children,
  icon = null,
  active = false,
  variant = "sidebar",
  badge = null,
  onClick,
  style = {},
  ...rest
}) {
  const isBottom = variant === "bottom";
  const base = {
    display: "flex",
    alignItems: "center",
    fontFamily: "var(--font-ui)",
    cursor: "pointer",
    border: "none",
    background: "transparent",
    transition: "background var(--dur-fast) var(--ease-standard), color var(--dur-fast)",
    color: active ? "var(--teal-700)" : "var(--ink-secondary)"
  };
  const sidebar = {
    gap: 11,
    width: "100%",
    padding: "9px 12px",
    fontSize: "var(--text-base)",
    fontWeight: active ? "var(--weight-semibold)" : "var(--weight-medium)",
    borderRadius: "var(--radius-md)",
    background: active ? "var(--teal-50)" : "transparent",
    boxShadow: active ? "inset 2px 0 0 var(--teal-600)" : "none"
  };
  const bottom = {
    flexDirection: "column",
    gap: 3,
    flex: 1,
    padding: "7px 4px 5px",
    fontSize: 11,
    fontWeight: active ? "var(--weight-semibold)" : "var(--weight-medium)",
    minHeight: 48,
    justifyContent: "center"
  };
  return /*#__PURE__*/React.createElement("button", _extends({
    onClick: onClick,
    "aria-current": active ? "page" : undefined,
    style: {
      ...base,
      ...(isBottom ? bottom : sidebar),
      ...style
    }
  }, rest), icon ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      width: 20,
      height: 20,
      alignItems: "center",
      justifyContent: "center",
      opacity: active ? 1 : 0.85
    }
  }, icon) : null, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7
    }
  }, children, badge != null ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      fontWeight: 600,
      color: "var(--cash-ink)",
      background: "var(--cash-bg)",
      borderRadius: "var(--radius-pill)",
      padding: "1px 6px",
      lineHeight: 1.4
    }
  }, badge) : null));
}
Object.assign(__ds_scope, { NavItem });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/navigation/NavItem.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/AdminScreen.jsx
try { (() => {
/* MediRoster — Admin · Department Config. Settings-style screen. */
const {
  PrimaryButton: _PB,
  DutyChip: _DC,
  PEN: _PENa
} = window.MediRosterDesignSystem_2b9730;
function Section({
  title,
  desc,
  children
}) {
  return /*#__PURE__*/React.createElement("section", {
    style: {
      background: "var(--surface)",
      border: "var(--border-hair)",
      borderRadius: "var(--radius-lg)",
      marginBottom: 18,
      overflow: "hidden",
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 16,
      padding: "16px 20px",
      borderBottom: "var(--border-hair)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-ui)",
      fontSize: 16,
      fontWeight: 600,
      color: "var(--ink)"
    }
  }, title), desc ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "3px 0 0",
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      color: "var(--ink-secondary)"
    }
  }, desc) : null), /*#__PURE__*/React.createElement(_PB, {
    variant: "outline",
    size: "sm"
  }, "Save")), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "16px 20px"
    }
  }, children));
}
function Field({
  label,
  children,
  w
}) {
  return /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 5,
      width: w || "auto"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mr-label"
  }, label), children);
}
const inputStyle = {
  fontFamily: "var(--font-ui)",
  fontSize: 14,
  color: "var(--ink)",
  padding: "8px 11px",
  border: "var(--border-strong)",
  borderRadius: "var(--radius-sm)",
  background: "var(--surface)",
  outline: "none",
  width: "100%"
};
function AdminScreen() {
  const {
    staff
  } = window.RosterData;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      overflow: "auto",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 22
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: "var(--display-md)",
      color: "var(--ink)"
    }
  }, "Department config"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      color: "var(--ink-secondary)"
    }
  }, "Paediatrics \xB7 Lady Ridgeway Hospital for Children")), /*#__PURE__*/React.createElement(Section, {
    title: "Staff",
    desc: "People who appear on the roster and their pen colors."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 10
    }
  }, staff.map(s => /*#__PURE__*/React.createElement("div", {
    key: s.code,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "10px 12px",
      border: "var(--border-hair)",
      borderRadius: "var(--radius-md)"
    }
  }, /*#__PURE__*/React.createElement(_DC, {
    pen: s.pen
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      fontWeight: 600,
      color: "var(--ink)"
    }
  }, s.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-secondary)"
    }
  }, s.title, " \xB7 code ", s.code, " \xB7 active from ", s.from)), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 5
    }
  }, ["S", "Rt", "M", "U", "G", "D"].map(p => /*#__PURE__*/React.createElement("span", {
    key: p,
    title: _PENa[p].name,
    style: {
      width: 18,
      height: 18,
      borderRadius: "50%",
      background: _PENa[p].dot,
      border: p === s.pen ? "2px solid var(--ink)" : "2px solid transparent",
      cursor: "pointer",
      boxShadow: p === s.pen ? "0 0 0 2px var(--surface)" : "none"
    }
  }))))), /*#__PURE__*/React.createElement(_PB, {
    variant: "ghost",
    size: "sm",
    icon: /*#__PURE__*/React.createElement(IcoPlus, {
      size: 15
    }),
    style: {
      alignSelf: "flex-start"
    }
  }, "Add staff member"))), /*#__PURE__*/React.createElement(Section, {
    title: "Shift times",
    desc: "On-call and day-duty hours for this department."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "On-call start",
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    defaultValue: "08:00"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "On-call end",
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    defaultValue: "08:00 (+1d)"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Day duty start",
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    defaultValue: "08:00"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Day duty end",
    w: 140
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    defaultValue: "16:00"
  })))), /*#__PURE__*/React.createElement(Section, {
    title: "On-call positions",
    desc: "Descriptions shown on the roster and in exports."
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement(Field, {
    label: "Primary on-call"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    defaultValue: "First-call SHO/RHO \u2014 admissions & ward cover"
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Transfer duty (2nd on-call)"
  }, /*#__PURE__*/React.createElement("input", {
    style: inputStyle,
    defaultValue: "Accompanies inter-hospital transfers"
  })))));
}
Object.assign(window, {
  AdminScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/AdminScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/AppShell.jsx
try { (() => {
/* MediRoster — App shell: topbar (search · bell · profile) + grouped left sidebar. */
const {
  NavItem,
  StatusBadge: _SBshell
} = window.MediRosterDesignSystem_2b9730;
function SideGroup({
  label,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 2
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mr-label",
    style: {
      padding: "0 12px",
      marginBottom: 6,
      fontSize: 10
    }
  }, label), children);
}
function Sidebar({
  active,
  onNav
}) {
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: "var(--sidebar-w)",
      flexShrink: 0,
      background: "var(--surface)",
      borderRight: "var(--border-hair)",
      display: "flex",
      flexDirection: "column",
      padding: "18px 12px 14px",
      gap: 22
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "0 8px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "var(--radius-md)",
      background: "var(--teal-600)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IcoLogo, {
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 18,
      color: "var(--ink)",
      lineHeight: 1
    }
  }, "MediRoster"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      color: "var(--ink-tertiary)",
      marginTop: 3
    }
  }, "Lady Ridgeway \xB7 Paediatrics"))), /*#__PURE__*/React.createElement("nav", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 20
    }
  }, /*#__PURE__*/React.createElement(SideGroup, {
    label: "Roster"
  }, /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(IcoCalendar, null),
    active: active === "calendar",
    badge: 1,
    onClick: () => onNav("calendar")
  }, "Calendar"), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(IcoUsers, null),
    active: active === "fairness",
    onClick: () => onNav("fairness")
  }, "Fairness"), /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(IcoHistory, null),
    active: active === "audit",
    onClick: () => onNav("audit")
  }, "Audit trail")), /*#__PURE__*/React.createElement(SideGroup, {
    label: "Department"
  }, /*#__PURE__*/React.createElement(NavItem, {
    icon: /*#__PURE__*/React.createElement(IcoCog, null),
    active: active === "admin",
    onClick: () => onNav("admin")
  }, "Config"))), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "auto",
      padding: "12px",
      border: "var(--border-hair)",
      borderRadius: "var(--radius-lg)",
      background: "var(--paper)",
      display: "flex",
      flexDirection: "column",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      fontWeight: 600,
      color: "var(--ink)",
      whiteSpace: "nowrap"
    }
  }, "June roster"), /*#__PURE__*/React.createElement(_SBshell, {
    status: "draft",
    style: {
      height: 20,
      fontSize: 10,
      padding: "0 7px"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      color: "var(--ink-secondary)",
      lineHeight: 1.45
    }
  }, "1 conflict to resolve before publishing.")));
}
function Topbar() {
  return /*#__PURE__*/React.createElement("header", {
    style: {
      height: 60,
      flexShrink: 0,
      background: "var(--surface)",
      borderBottom: "var(--border-hair)",
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "0 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "var(--surface-sunken)",
      border: "1px solid transparent",
      borderRadius: "var(--radius-md)",
      padding: "0 12px",
      height: 36,
      width: 280,
      color: "var(--ink-tertiary)"
    }
  }, /*#__PURE__*/React.createElement(IcoSearch, {
    size: 15
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search staff, days, swaps\u2026",
    style: {
      border: "none",
      background: "transparent",
      outline: "none",
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      color: "var(--ink)",
      width: "100%"
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      marginLeft: "auto",
      display: "flex",
      alignItems: "center",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: {
      position: "relative",
      width: 36,
      height: 36,
      border: "var(--border-hair)",
      borderRadius: "var(--radius-pill)",
      background: "var(--surface)",
      color: "var(--ink-secondary)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer"
    }
  }, /*#__PURE__*/React.createElement(IcoBell, {
    size: 17
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 7,
      right: 8,
      width: 7,
      height: 7,
      borderRadius: "50%",
      background: "var(--danger)",
      border: "1.5px solid var(--surface)"
    }
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 1,
      height: 24,
      background: "var(--grid-line)"
    }
  }), /*#__PURE__*/React.createElement("button", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      border: "none",
      background: "transparent",
      cursor: "pointer",
      padding: "4px 2px"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "var(--radius-pill)",
      background: "var(--pen-Rt-bg)",
      color: "var(--pen-Rt-ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-ui)",
      fontWeight: 700,
      fontSize: 13
    }
  }, "R"), /*#__PURE__*/React.createElement("span", {
    style: {
      textAlign: "left"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--ink)",
      lineHeight: 1.2,
      whiteSpace: "nowrap"
    }
  }, "Dr. Ruwanda"), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      color: "var(--ink-tertiary)",
      whiteSpace: "nowrap",
      lineHeight: 1.3
    }
  }, "Roster editor")), /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-tertiary)",
      display: "flex"
    }
  }, /*#__PURE__*/React.createElement(IcoChevD, {
    size: 14
  })))));
}
function AppShell({
  active,
  onNav,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      height: "100vh",
      overflow: "hidden",
      background: "var(--paper)"
    }
  }, /*#__PURE__*/React.createElement(Sidebar, {
    active: active,
    onNav: onNav
  }), /*#__PURE__*/React.createElement("main", {
    style: {
      flex: 1,
      minWidth: 0,
      display: "flex",
      flexDirection: "column"
    }
  }, /*#__PURE__*/React.createElement(Topbar, null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minHeight: 0,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column"
    }
  }, children)));
}
Object.assign(window, {
  Sidebar,
  Topbar,
  AppShell
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/AppShell.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/AuditTrail.jsx
try { (() => {
/* MediRoster — Audit Trail: clean log of roster edits. */
const {
  DutyChip: _DutyChip
} = window.MediRosterDesignSystem_2b9730;
function AuditTrail() {
  const {
    audit
  } = window.RosterData;
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      overflow: "auto",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: "var(--display-md)",
      color: "var(--ink)"
    }
  }, "Audit trail"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      color: "var(--ink-secondary)"
    }
  }, "Every change to the June 2026 roster, newest first.")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "var(--border-hair)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      maxWidth: 820
    }
  }, audit.map((row, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "13px 18px",
      background: i % 2 ? "var(--surface-sunken)" : "var(--surface)",
      borderBottom: i < audit.length - 1 ? "var(--border-hair)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 12,
      color: "var(--ink-tertiary)",
      width: 132,
      flexShrink: 0,
      fontVariantNumeric: "tabular-nums"
    }
  }, row.ts), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      fontWeight: 600,
      color: "var(--ink)",
      width: 116,
      flexShrink: 0
    }
  }, row.user), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      color: "var(--ink-secondary)",
      flex: 1,
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--ink)",
      fontWeight: 500
    }
  }, row.action), " \xB7 ", row.detail), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7,
      flexShrink: 0,
      minWidth: 96,
      justifyContent: "flex-end"
    }
  }, row.from ? /*#__PURE__*/React.createElement(_DutyChip, {
    pen: row.from,
    size: "sm"
  }) : null, row.from && row.to ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--ink-tertiary)",
      fontSize: 13
    }
  }, "\u2192") : null, row.to ? /*#__PURE__*/React.createElement(_DutyChip, {
    pen: row.to,
    size: "sm"
  }) : null)))));
}
Object.assign(window, {
  AuditTrail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/AuditTrail.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/CalendarScreen.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* MediRoster — Monthly Calendar View (desktop). Reworked as a rich dashboard:
   greeting → stat cards → next-duty hero → calendar + fairness panel. */
const {
  MonthGrid,
  FairnessRow,
  StatusBadge,
  PrimaryButton,
  ValidationAlert,
  DutyChip,
  FlagBadge,
  PEN
} = window.MediRosterDesignSystem_2b9730;
const cardBase = {
  background: "var(--surface)",
  border: "var(--border-hair)",
  borderRadius: "var(--radius-lg)",
  boxShadow: "var(--shadow-xs)"
};
function RosterTabs({
  value,
  onChange
}) {
  const tabs = [{
    id: "sho",
    label: "SHO / RHO on-call"
  }, {
    id: "consultant",
    label: "Consultant casualty"
  }];
  return /*#__PURE__*/React.createElement("div", {
    style: {
      display: "inline-flex",
      background: "var(--surface-sunken)",
      borderRadius: "var(--radius-md)",
      padding: 3,
      gap: 3
    }
  }, tabs.map(t => /*#__PURE__*/React.createElement("button", {
    key: t.id,
    onClick: () => onChange(t.id),
    style: {
      border: "none",
      cursor: "pointer",
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      fontWeight: 600,
      padding: "6px 14px",
      borderRadius: "var(--radius-sm)",
      whiteSpace: "nowrap",
      background: value === t.id ? "var(--surface)" : "transparent",
      color: value === t.id ? "var(--ink)" : "var(--ink-secondary)",
      boxShadow: value === t.id ? "var(--shadow-xs)" : "none"
    }
  }, t.label)));
}
function StatCard({
  label,
  value,
  sub,
  icon,
  chipBg,
  chipInk,
  subInk
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardBase,
      flex: 1,
      minWidth: 168,
      padding: "15px 18px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12.5,
      fontWeight: 500,
      color: "var(--ink-secondary)"
    }
  }, label), /*#__PURE__*/React.createElement("span", {
    style: {
      width: 32,
      height: 32,
      flexShrink: 0,
      borderRadius: "var(--radius-md)",
      background: chipBg,
      color: chipInk,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 14
    }
  }, icon)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 30,
      color: "var(--ink)",
      lineHeight: 1.1,
      marginTop: 2,
      letterSpacing: "-0.01em"
    }
  }, value), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: subInk || "var(--ink-tertiary)",
      marginTop: 4
    }
  }, sub));
}
function NextDutyHero({
  onView
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardBase,
      padding: "18px 22px",
      display: "flex",
      alignItems: "center",
      gap: 20,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 56,
      height: 56,
      borderRadius: "var(--radius-lg)",
      background: "var(--pen-Rt-bg)",
      color: "var(--pen-Rt-ink)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-ui)",
      fontWeight: 700,
      fontSize: 23,
      flexShrink: 0
    }
  }, "R"), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 240
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9,
      marginBottom: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: ".05em",
      color: "var(--teal-700)",
      background: "var(--teal-50)",
      borderRadius: "var(--radius-sm)",
      padding: "3px 8px"
    }
  }, "UPCOMING"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      color: "var(--ink-secondary)"
    }
  }, "Your next on-call")), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 22,
      color: "var(--ink)",
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap"
    }
  }, "Sunday, June 14"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 16,
      marginTop: 6,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      color: "var(--ink-secondary)",
      whiteSpace: "nowrap"
    }
  }, /*#__PURE__*/React.createElement(IcoClock, {
    size: 15
  }), " 08:00 \u2192 08:00 (+1d)"), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--postcash-ink)",
      background: "var(--postcash-bg)",
      borderRadius: "var(--radius-sm)",
      padding: "2px 8px",
      whiteSpace: "nowrap"
    }
  }, "Weekend block"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement(PrimaryButton, {
    variant: "outline",
    size: "md"
  }, "Request swap"), /*#__PURE__*/React.createElement(PrimaryButton, {
    variant: "ghost",
    size: "md",
    onClick: onView
  }, "View day")));
}
function FairnessPanel() {
  const {
    fairness,
    fairnessAvg
  } = window.RosterData;
  return /*#__PURE__*/React.createElement("aside", {
    style: {
      width: "var(--fairness-w)",
      flexShrink: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardBase,
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "13px 14px 9px",
      borderBottom: "var(--border-hair)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 28,
      height: 28,
      borderRadius: "var(--radius-md)",
      background: "var(--teal-50)",
      color: "var(--teal-700)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IcoUsers, {
    size: 15
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 13.5,
      fontWeight: 600,
      color: "var(--ink)"
    }
  }, "Fairness \xB7 SHO pool")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
      marginTop: 8,
      paddingRight: 2
    }
  }, ["OC", "◆", "■", "WE"].map(c => /*#__PURE__*/React.createElement("span", {
    key: c,
    style: {
      width: 22,
      textAlign: "right",
      fontFamily: "var(--font-mono)",
      fontSize: 10,
      color: "var(--ink-tertiary)"
    }
  }, c)))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "2px 14px 8px"
    }
  }, fairness.map((f, i) => /*#__PURE__*/React.createElement(FairnessRow, _extends({
    key: f.pen
  }, f, {
    average: fairnessAvg,
    style: i === fairness.length - 1 ? {
      borderBottom: "none"
    } : undefined
  })))), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "10px 14px",
      borderTop: "var(--border-hair)",
      background: "var(--surface-sunken)",
      display: "flex",
      alignItems: "center",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: "var(--bar-over)",
      flexShrink: 0
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-secondary)"
    }
  }, "Mekala is ", /*#__PURE__*/React.createElement("b", {
    style: {
      color: "var(--ink)"
    }
  }, "+29%"), " over pool average"))), /*#__PURE__*/React.createElement("div", {
    style: {
      ...cardBase,
      marginTop: 14,
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "mr-label",
    style: {
      marginBottom: 8
    }
  }, "Legend"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "8px 14px"
    }
  }, ["S", "Rt", "M", "U"].map(p => /*#__PURE__*/React.createElement("span", {
    key: p,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 9,
      height: 9,
      borderRadius: "50%",
      background: PEN[p].dot
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-secondary)"
    }
  }, PEN[p].name)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      marginTop: 12,
      paddingTop: 10,
      borderTop: "var(--border-hair)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(FlagBadge, {
    type: "cash"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-secondary)"
    }
  }, "Cash")), /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(FlagBadge, {
    type: "postcash"
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-secondary)"
    }
  }, "Post-cash")))));
}
function DetailPopover({
  cell,
  onClose
}) {
  if (!cell) return null;
  const p = PEN[cell.pen];
  return /*#__PURE__*/React.createElement("div", {
    onClick: onClose,
    style: {
      position: "fixed",
      inset: 0,
      background: "rgba(27,39,51,0.18)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 40
    }
  }, /*#__PURE__*/React.createElement("div", {
    onClick: e => e.stopPropagation(),
    style: {
      width: 320,
      background: "var(--surface)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-lift)",
      border: "var(--border-hair)",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "14px 16px",
      borderBottom: "var(--border-hair)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 19,
      color: "var(--ink)"
    }
  }, "June ", cell.day, ", 2026"), cell.weekend ? /*#__PURE__*/React.createElement("span", {
    className: "mr-label"
  }, "Weekend") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16,
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(DutyChip, {
    pen: cell.pen,
    size: "lg",
    conflict: cell.conflict
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      fontWeight: 600,
      color: "var(--ink)"
    }
  }, p.name), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-secondary)"
    }
  }, "On-call \xB7 08:00 \u2192 08:00"))), cell.flags && cell.flags.length ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, cell.flags.map((f, i) => /*#__PURE__*/React.createElement(FlagBadge, {
    key: i,
    type: f,
    withText: true
  }))) : null, cell.conflict ? /*#__PURE__*/React.createElement(ValidationAlert, {
    severity: "error",
    title: "Double-booked",
    description: "Mekala is also down for transfer duty. Resolve before publishing."
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(PrimaryButton, {
    variant: "outline",
    size: "sm",
    style: {
      flex: 1
    }
  }, "Swap\u2026"), /*#__PURE__*/React.createElement(PrimaryButton, {
    variant: "ghost",
    size: "sm",
    onClick: onClose
  }, "Close")))));
}
function CalendarScreen() {
  const [roster, setRoster] = React.useState("sho");
  const [sel, setSel] = React.useState(null);
  const data = window.RosterData;
  const days = roster === "sho" ? data.sho : data.consultant;
  const myOnCalls = data.sho.filter(d => d && d.pen === "Rt").length;
  const cashCount = data.sho.filter(d => d && d.flags.includes("cash")).length;
  const navBtn = {
    border: "var(--border-hair)",
    background: "var(--surface)",
    borderRadius: "var(--radius-md)",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--ink-secondary)",
    cursor: "pointer"
  };
  return /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      overflow: "auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "26px 28px 32px",
      display: "flex",
      flexDirection: "column",
      gap: 18,
      maxWidth: 1320,
      margin: "0 auto"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 16,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 32,
      color: "var(--ink)",
      letterSpacing: "-0.01em"
    }
  }, "Good morning, Dr. Ruwanda"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "5px 0 0",
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      color: "var(--ink-secondary)"
    }
  }, "Here's the June 2026 roster \u2014 one conflict needs your attention before publishing.")), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(PrimaryButton, {
    variant: "ghost",
    size: "md",
    icon: /*#__PURE__*/React.createElement(IcoShare, {
      size: 16
    })
  }, "Export"), /*#__PURE__*/React.createElement(PrimaryButton, {
    variant: "outline",
    size: "md",
    icon: /*#__PURE__*/React.createElement(IcoSparkle, {
      size: 15
    })
  }, "Generate"), /*#__PURE__*/React.createElement(PrimaryButton, {
    variant: "solid",
    size: "md"
  }, "Publish"))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement(StatCard, {
    label: "Your on-calls",
    value: String(myOnCalls).padStart(2, "0"),
    sub: "Next: Sun, June 14",
    icon: /*#__PURE__*/React.createElement(IcoCalendar, {
      size: 16
    }),
    chipBg: "var(--teal-50)",
    chipInk: "var(--teal-700)"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Cash days",
    value: String(cashCount).padStart(2, "0"),
    sub: "Across the SHO pool",
    icon: "\u25C6",
    chipBg: "var(--cash-bg)",
    chipInk: "var(--cash-ink)"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Open conflicts",
    value: "01",
    sub: "June 12 \xB7 double booking",
    subInk: "var(--danger)",
    icon: "\u26A0",
    chipBg: "var(--danger-bg)",
    chipInk: "var(--danger)"
  }), /*#__PURE__*/React.createElement(StatCard, {
    label: "Days assigned",
    value: "30/30",
    sub: "Every day covered",
    icon: "\u25A0",
    chipBg: "var(--postcash-bg)",
    chipInk: "var(--postcash-ink)"
  })), /*#__PURE__*/React.createElement(NextDutyHero, {
    onView: () => setSel(days.find(d => d && d.day === 14))
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
      flexWrap: "wrap",
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("button", {
    style: navBtn
  }, /*#__PURE__*/React.createElement(IcoChevL, {
    size: 16
  })), /*#__PURE__*/React.createElement("h2", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 24,
      color: "var(--ink)",
      letterSpacing: "-0.01em",
      whiteSpace: "nowrap"
    }
  }, "June 2026"), /*#__PURE__*/React.createElement("button", {
    style: navBtn
  }, /*#__PURE__*/React.createElement(IcoChevR, {
    size: 16
  })), /*#__PURE__*/React.createElement(StatusBadge, {
    status: "draft",
    version: 3
  })), /*#__PURE__*/React.createElement(RosterTabs, {
    value: roster,
    onChange: setRoster
  })), /*#__PURE__*/React.createElement(ValidationAlert, {
    severity: "error",
    title: "1 conflict on this roster",
    description: "June 12 \u2014 Mekala is on-call and transfer duty at once.",
    onJump: () => setSel(days.find(d => d && d.day === 12)),
    style: {
      marginTop: -4
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: 20,
      alignItems: "flex-start",
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 520
    }
  }, /*#__PURE__*/React.createElement(MonthGrid, {
    days: days,
    onCellClick: c => setSel(c),
    style: {
      boxShadow: "var(--shadow-xs)"
    }
  })), /*#__PURE__*/React.createElement(FairnessPanel, null))), /*#__PURE__*/React.createElement(DetailPopover, {
    cell: sel,
    onClose: () => setSel(null)
  }));
}
Object.assign(window, {
  CalendarScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/CalendarScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/FairnessDashboard.jsx
try { (() => {
/* MediRoster — Fairness Dashboard: cumulative on-call history across months. */
const {
  PEN: _PEN
} = window.MediRosterDesignSystem_2b9730;
function FairnessDashboard() {
  const {
    months,
    history
  } = window.RosterData;
  const totals = months.map((_, mi) => history.reduce((s, r) => s + r.counts[mi], 0));
  const grand = totals.reduce((a, b) => a + b, 0);
  const avgPerPerson = grand / history.length;
  const cell = (v, over) => /*#__PURE__*/React.createElement("td", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      textAlign: "center",
      padding: "11px 8px",
      color: over ? "var(--cash-ink)" : "var(--ink)",
      background: over ? "var(--cash-bg)" : "transparent",
      fontWeight: over ? 600 : 400,
      fontVariantNumeric: "tabular-nums",
      borderBottom: "var(--border-hair)"
    }
  }, String(v).padStart(2, "0"));
  return /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 28,
      overflow: "auto",
      height: "100%"
    }
  }, /*#__PURE__*/React.createElement("header", {
    style: {
      marginBottom: 20
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: "var(--display-md)",
      color: "var(--ink)"
    }
  }, "Fairness dashboard"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "6px 0 0",
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      color: "var(--ink-secondary)"
    }
  }, "On-call counts \xB7 Dec 2025 \u2013 May 2026 \xB7 SHO / RHO pool")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "var(--border-hair)",
      borderRadius: "var(--radius-lg)",
      overflow: "hidden",
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "var(--surface-sunken)"
    }
  }, /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "left",
      padding: "10px 16px",
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "var(--tracking-label)",
      textTransform: "uppercase",
      color: "var(--ink-secondary)",
      borderBottom: "var(--border-hair)"
    }
  }, "Staff"), months.map(m => /*#__PURE__*/React.createElement("th", {
    key: m,
    style: {
      padding: "10px 8px",
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--ink-secondary)",
      borderBottom: "var(--border-hair)",
      textAlign: "center"
    }
  }, m)), /*#__PURE__*/React.createElement("th", {
    style: {
      padding: "10px 12px",
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      fontWeight: 700,
      color: "var(--ink)",
      borderBottom: "var(--border-hair)",
      textAlign: "center"
    }
  }, "Total"))), /*#__PURE__*/React.createElement("tbody", null, history.map(r => {
    const tot = r.counts.reduce((a, b) => a + b, 0);
    const over = tot > avgPerPerson * 1.2;
    return /*#__PURE__*/React.createElement("tr", {
      key: r.pen
    }, /*#__PURE__*/React.createElement("td", {
      style: {
        padding: "11px 16px",
        borderBottom: "var(--border-hair)"
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        display: "inline-flex",
        alignItems: "center",
        gap: 9
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        width: 9,
        height: 9,
        borderRadius: "50%",
        background: _PEN[r.pen].dot
      }
    }), /*#__PURE__*/React.createElement("span", {
      style: {
        fontFamily: "var(--font-ui)",
        fontSize: 13,
        fontWeight: 500,
        color: "var(--ink)"
      }
    }, r.name))), r.counts.map((v, i) => cell(v, false)), /*#__PURE__*/React.createElement("td", {
      style: {
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        textAlign: "center",
        padding: "11px 12px",
        fontWeight: 700,
        color: over ? "var(--cash-ink)" : "var(--ink)",
        background: over ? "var(--cash-bg)" : "transparent",
        borderBottom: "var(--border-hair)",
        borderLeft: "var(--border-hair)",
        fontVariantNumeric: "tabular-nums"
      }
    }, tot));
  })), /*#__PURE__*/React.createElement("tfoot", null, /*#__PURE__*/React.createElement("tr", {
    style: {
      background: "var(--surface-sunken)"
    }
  }, /*#__PURE__*/React.createElement("td", {
    style: {
      padding: "11px 16px",
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      fontWeight: 700,
      color: "var(--ink)"
    }
  }, "Pool total"), totals.map((t, i) => /*#__PURE__*/React.createElement("td", {
    key: i,
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      textAlign: "center",
      padding: "11px 8px",
      color: "var(--ink-secondary)",
      fontVariantNumeric: "tabular-nums"
    }
  }, t)), /*#__PURE__*/React.createElement("td", {
    style: {
      fontFamily: "var(--font-mono)",
      fontSize: 13,
      textAlign: "center",
      padding: "11px 12px",
      fontWeight: 700,
      color: "var(--ink)",
      borderLeft: "var(--border-hair)",
      fontVariantNumeric: "tabular-nums"
    }
  }, grand))))), /*#__PURE__*/React.createElement("p", {
    style: {
      marginTop: 12,
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-tertiary)",
      display: "flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 12,
      height: 12,
      borderRadius: 3,
      background: "var(--cash-bg)",
      border: "1px solid var(--cash-ink)"
    }
  }), "Amber marks anyone more than 20% over the pool average."));
}
Object.assign(window, {
  FairnessDashboard
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/FairnessDashboard.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/LoginScreen.jsx
try { (() => {
/* MediRoster — Login. Minimal, no self-signup. */
const {
  PrimaryButton: _PBl
} = window.MediRosterDesignSystem_2b9730;
const loginInput = {
  fontFamily: "var(--font-ui)",
  fontSize: 15,
  color: "var(--ink)",
  padding: "11px 13px",
  border: "var(--border-strong)",
  borderRadius: "var(--radius-md)",
  background: "var(--surface)",
  outline: "none",
  width: "100%"
};
function LoginScreen({
  onSignIn
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--paper)",
      padding: 24
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: 380,
      maxWidth: "100%"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 11,
      justifyContent: "center",
      marginBottom: 26
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--teal-600)"
    }
  }, /*#__PURE__*/React.createElement(IcoLogo, {
    size: 30
  })), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 26,
      color: "var(--ink)"
    }
  }, "MediRoster")), /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      border: "var(--border-hair)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
      padding: "28px 26px"
    }
  }, /*#__PURE__*/React.createElement("h1", {
    style: {
      margin: 0,
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 24,
      color: "var(--ink)",
      textAlign: "center"
    }
  }, "Lady Ridgeway Hospital"), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 22px",
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      color: "var(--ink-secondary)",
      textAlign: "center"
    }
  }, "Paediatrics \xB7 duty roster"), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mr-label"
  }, "Email"), /*#__PURE__*/React.createElement("input", {
    style: loginInput,
    type: "email",
    defaultValue: "ruwanda@lrh.health.gov.lk"
  })), /*#__PURE__*/React.createElement("label", {
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 6
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "mr-label"
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    style: loginInput,
    type: "password",
    defaultValue: "\xB7\xB7\xB7\xB7\xB7\xB7\xB7\xB7"
  })), /*#__PURE__*/React.createElement(_PBl, {
    variant: "solid",
    size: "lg",
    style: {
      width: "100%",
      marginTop: 4
    },
    onClick: onSignIn
  }, "Sign in")), /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "20px 0 0",
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink-tertiary)",
      textAlign: "center",
      display: "flex",
      alignItems: "center",
      gap: 6,
      justifyContent: "center"
    }
  }, /*#__PURE__*/React.createElement(IcoLock, {
    size: 13
  }), " Account created by your department admin"))));
}
Object.assign(window, {
  LoginScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/LoginScreen.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/WhatsAppExport.jsx
try { (() => {
/* MediRoster — Export / WhatsApp share mockup. How the published roster
   looks when shared to the department WhatsApp group, on a phone. */
const {
  MonthGrid: _MG,
  StatusBadge: _SB,
  PEN: _PENw
} = window.MediRosterDesignSystem_2b9730;
function RosterImageCard() {
  const days = window.RosterData.sho.map(d => d && {
    ...d,
    conflict: false,
    today: false
  });
  return /*#__PURE__*/React.createElement("div", {
    style: {
      background: "var(--surface)",
      borderRadius: 10,
      overflow: "hidden",
      border: "var(--border-hair)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 14px 10px",
      borderBottom: "var(--border-hair)",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-display)",
      fontWeight: 600,
      fontSize: 18,
      color: "var(--ink)"
    }
  }, "June 2026"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      color: "var(--ink-tertiary)"
    }
  }, "SHO on-call \xB7 Paediatrics")), /*#__PURE__*/React.createElement(_SB, {
    status: "published"
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 8
    }
  }, /*#__PURE__*/React.createElement(_MG, {
    days: days,
    compact: true
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      flexWrap: "wrap",
      gap: "6px 12px",
      padding: "8px 12px 12px"
    }
  }, ["S", "Rt", "M", "U"].map(p => /*#__PURE__*/React.createElement("span", {
    key: p,
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 5
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 8,
      height: 8,
      borderRadius: "50%",
      background: _PENw[p].dot
    }
  }), /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      color: "var(--ink-secondary)"
    }
  }, _PENw[p].name)))));
}
function Bubble({
  children,
  sub
}) {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: "flex-end",
      maxWidth: "86%",
      background: "#d9fdd3",
      borderRadius: "10px 10px 2px 10px",
      padding: 7,
      boxShadow: "var(--shadow-xs)"
    }
  }, children, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      justifyContent: "flex-end",
      gap: 4,
      alignItems: "center",
      marginTop: 3,
      paddingRight: 4
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 10,
      color: "#5b7a59"
    }
  }, sub)));
}
function WhatsAppExport() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      minHeight: "100%",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 28,
      background: "var(--paper)"
    }
  }, /*#__PURE__*/React.createElement("p", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      color: "var(--ink-secondary)",
      marginBottom: 18,
      textAlign: "center",
      maxWidth: 320
    }
  }, "Doctors check their duty on their phone. Publishing shares the roster straight to the department WhatsApp group."), /*#__PURE__*/React.createElement("div", {
    style: {
      width: 320,
      height: 620,
      background: "#0b141a",
      borderRadius: 30,
      padding: 8,
      boxShadow: "var(--shadow-lift)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      width: "100%",
      height: "100%",
      borderRadius: 24,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      background: "#e9e2d8"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      background: "#075e54",
      color: "#fff",
      padding: "12px 14px",
      display: "flex",
      alignItems: "center",
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "50%",
      background: "#0d9488",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-ui)",
      fontWeight: 700,
      fontSize: 13
    }
  }, "Px"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 14,
      fontWeight: 600
    }
  }, "Paediatrics Roster"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      opacity: 0.8
    }
  }, "Dr. Wasana, Dr. Ruwanda, +6"))), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: 12,
      display: "flex",
      flexDirection: "column",
      gap: 10,
      overflow: "hidden",
      background: "#e5ddd5"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: "center",
      background: "#fff",
      borderRadius: 8,
      padding: "3px 10px",
      fontFamily: "var(--font-ui)",
      fontSize: 10,
      color: "var(--ink-secondary)",
      boxShadow: "var(--shadow-xs)"
    }
  }, "Today"), /*#__PURE__*/React.createElement(Bubble, {
    sub: "08:41 \u2713\u2713"
  }, /*#__PURE__*/React.createElement(RosterImageCard, null), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 12,
      color: "var(--ink)",
      padding: "6px 4px 0"
    }
  }, "June on-call roster \u2014 published. Tap to view your days.")), /*#__PURE__*/React.createElement("div", {
    style: {
      alignSelf: "flex-start",
      maxWidth: "80%",
      background: "#fff",
      borderRadius: "10px 10px 10px 2px",
      padding: "7px 10px",
      boxShadow: "var(--shadow-xs)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 11,
      fontWeight: 600,
      color: "var(--pen-M-ink)"
    }
  }, "Mekala"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontFamily: "var(--font-ui)",
      fontSize: 13,
      color: "var(--ink)"
    }
  }, "Noted, thanks. Got the 4th and 16th."))))));
}
Object.assign(window, {
  WhatsAppExport
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/WhatsAppExport.jsx", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/data.js
try { (() => {
/* MediRoster UI-kit sample data — June 2026, Paediatrics.
   Plain script (no module): assigns window.RosterData.
   June 1 2026 is a Monday; 30 days; Mon–Sun grid. */
(function () {
  const WEEKEND = [6, 7, 13, 14, 20, 21, 27, 28];

  // --- SHO / RHO on-call roster (primary calendar) ---
  // one SHO on call per day; ◆ cash days; ■ post-cash the morning after.
  const shoOrder = ["S", "Rt", "M", "U"];
  const cashDays = [2, 5, 9, 12, 16, 19, 23, 26, 30];
  const sho = [];
  for (let d = 1; d <= 30; d++) {
    const oncall = shoOrder[(d - 1) % 4];
    const cash = cashDays.includes(d);
    const postcash = cashDays.includes(d - 1);
    const flags = [];
    if (cash) flags.push("cash");
    if (postcash) flags.push("postcash");
    sho.push({
      day: d,
      pen: oncall,
      flags,
      weekend: WEEKEND.includes(d),
      // a 2nd on-call (transfer duty) on a few busy days
      secondaryPen: [12, 19, 26].includes(d) ? shoOrder[(d + 1) % 4] : null,
      // seeded conflict to demonstrate the state
      conflict: d === 12,
      today: d === 12
    });
  }

  // --- Consultant casualty roster ---
  // Pu's casualty days are fixed: 3,8,11,19,23,27,28.
  const puCash = [3, 8, 11, 19, 23, 27, 28];
  const consOrder = ["R", "G", "Pu", "D"];
  const consultant = [];
  for (let d = 1; d <= 30; d++) {
    let pen;
    if (puCash.includes(d)) pen = "Pu";else pen = consOrder[(d - 1) % 4] === "Pu" ? "R" : consOrder[(d - 1) % 4];
    consultant.push({
      day: d,
      pen,
      flags: puCash.includes(d) ? ["cash"] : [],
      weekend: WEEKEND.includes(d),
      today: d === 12
    });
  }

  // pad to full weeks (June 1 = Monday → no leading blanks)
  function pad(arr) {
    const out = arr.slice();
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }

  // --- Fairness tallies (SHO pool) ---
  const fairness = [{
    pen: "S",
    name: "Sulakshana",
    tallies: {
      onCall: 8,
      cash: 3,
      postCash: 3,
      weekend: 2
    },
    value: 8
  }, {
    pen: "Rt",
    name: "Ruwanda",
    tallies: {
      onCall: 7,
      cash: 2,
      postCash: 2,
      weekend: 1
    },
    value: 7
  }, {
    pen: "M",
    name: "Mekala",
    tallies: {
      onCall: 9,
      cash: 4,
      postCash: 3,
      weekend: 3
    },
    value: 9
  }, {
    pen: "U",
    name: "Udara",
    tallies: {
      onCall: 4,
      cash: 1,
      postCash: 2,
      weekend: 1
    },
    value: 4
  }];
  const fairnessAvg = 7;

  // --- 6-month history (Dec 2025 – May 2026) on-call counts ---
  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May"];
  const history = [{
    pen: "S",
    name: "Sulakshana",
    counts: [7, 8, 6, 7, 8, 7]
  }, {
    pen: "Rt",
    name: "Ruwanda",
    counts: [6, 7, 7, 8, 6, 7]
  }, {
    pen: "M",
    name: "Mekala",
    counts: [9, 8, 9, 7, 9, 10]
  }, {
    pen: "U",
    name: "Udara",
    counts: [5, 4, 6, 5, 4, 5]
  }];

  // --- Audit trail ---
  const audit = [{
    ts: "2026-06-09 14:22",
    user: "Dr. Ruwanda",
    action: "Swapped on-call",
    detail: "R → D on June 15",
    from: "Rt",
    to: "D"
  }, {
    ts: "2026-06-09 14:05",
    user: "Dr. Ruwanda",
    action: "Added cash flag",
    detail: "◆ on June 12",
    from: null,
    to: "M"
  }, {
    ts: "2026-06-08 09:41",
    user: "Dr. Wasana",
    action: "Published roster",
    detail: "Consultant casualty · v2",
    from: null,
    to: null
  }, {
    ts: "2026-06-07 18:30",
    user: "Dr. Ruwanda",
    action: "Swapped on-call",
    detail: "M → S on June 26",
    from: "M",
    to: "S"
  }, {
    ts: "2026-06-07 11:12",
    user: "Dr. Ruwanda",
    action: "Generated draft",
    detail: "SHO on-call · June 2026",
    from: null,
    to: null
  }];

  // --- Staff config ---
  const staff = [{
    pen: "S",
    code: "S",
    name: "Sulakshana Perera",
    title: "SHO",
    from: "2025-01-01",
    active: true
  }, {
    pen: "Rt",
    code: "R",
    name: "Ruwanda Jayasinghe",
    title: "RHO",
    from: "2025-03-01",
    active: true
  }, {
    pen: "M",
    code: "M",
    name: "Mekala Fernando",
    title: "SHO",
    from: "2025-01-01",
    active: true
  }, {
    pen: "U",
    code: "U",
    name: "Udara Bandara",
    title: "SHO",
    from: "2025-06-01",
    active: true
  }];
  window.RosterData = {
    WEEKEND,
    sho: pad(sho),
    consultant: pad(consultant),
    fairness,
    fairnessAvg,
    months,
    history,
    audit,
    staff
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/data.js", error: String((e && e.message) || e) }); }

// ui_kits/mediroster/icons.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* MediRoster icon set — Lucide-style line icons (1.8 stroke, round caps).
   Loaded as a babel script; exports to window for the screen files. */
const Svg = ({
  size = 18,
  children,
  ...rest
}) => /*#__PURE__*/React.createElement("svg", _extends({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "1.8",
  strokeLinecap: "round",
  strokeLinejoin: "round"
}, rest), children);
const IcoCalendar = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "18",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 10h18M8 2v4M16 2v4"
}));
const IcoUsers = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M16 21v-2a4 4 0 0 0-8 0v2"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "7",
  r: "4"
}));
const IcoAlert = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 9v4M12 17h.01"
}));
const IcoCog = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4.5a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 9.4l.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 12 4.6V4.5a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.82 1.17l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9z"
}));
const IcoHistory = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M3 3v5h5"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3.05 13A9 9 0 1 0 6 5.3L3 8"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7v5l4 2"
}));
const IcoChevL = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M15 18l-6-6 6-6"
}));
const IcoChevR = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M9 18l6-6-6-6"
}));
const IcoShare = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "18",
  cy: "5",
  r: "3"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "6",
  cy: "12",
  r: "3"
}), /*#__PURE__*/React.createElement("circle", {
  cx: "18",
  cy: "19",
  r: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"
}));
const IcoDownload = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
}));
const IcoPlus = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 5v14M5 12h14"
}));
const IcoSparkle = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"
}));
const IcoSearch = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "11",
  cy: "11",
  r: "7"
}), /*#__PURE__*/React.createElement("path", {
  d: "m21 21-4.3-4.3"
}));
const IcoLogo = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
  x: "3",
  y: "4",
  width: "18",
  height: "18",
  rx: "3"
}), /*#__PURE__*/React.createElement("path", {
  d: "M3 9h18"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 14h2M14 14h2M8 18h2M14 18h2"
}));
const IcoLock = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("rect", {
  x: "4",
  y: "11",
  width: "16",
  height: "10",
  rx: "2"
}), /*#__PURE__*/React.createElement("path", {
  d: "M8 11V7a4 4 0 0 1 8 0v4"
}));
const IcoBell = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M10.3 21a1.94 1.94 0 0 0 3.4 0"
}));
const IcoClock = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("circle", {
  cx: "12",
  cy: "12",
  r: "9"
}), /*#__PURE__*/React.createElement("path", {
  d: "M12 7v5l3 2"
}));
const IcoChevD = p => /*#__PURE__*/React.createElement(Svg, p, /*#__PURE__*/React.createElement("path", {
  d: "m6 9 6 6 6-6"
}));
const IcoWhatsApp = ({
  size = 18,
  ...rest
}) => /*#__PURE__*/React.createElement("svg", _extends({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "currentColor"
}, rest), /*#__PURE__*/React.createElement("path", {
  d: "M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm5.8 14.13c-.24.68-1.42 1.32-1.95 1.36-.5.04-.97.22-3.27-.68-2.77-1.09-4.52-3.93-4.66-4.11-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.24-.27.53-.34.71-.34.18 0 .36 0 .51.01.16.01.39-.06.6.46.24.59.81 2.04.88 2.19.07.15.12.32.02.5-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.29-.12.57.16.27.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.21 1.37.27.14.43.12.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.6-.13.24.09 1.55.73 1.81.87.27.13.45.2.51.31.07.11.07.64-.17 1.32Z"
}));
Object.assign(window, {
  IcoCalendar,
  IcoUsers,
  IcoAlert,
  IcoCog,
  IcoHistory,
  IcoChevL,
  IcoChevR,
  IcoShare,
  IcoDownload,
  IcoPlus,
  IcoSparkle,
  IcoSearch,
  IcoLogo,
  IcoLock,
  IcoWhatsApp,
  IcoBell,
  IcoClock,
  IcoChevD
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "ui_kits/mediroster/icons.jsx", error: String((e && e.message) || e) }); }

__ds_ns.PrimaryButton = __ds_scope.PrimaryButton;

__ds_ns.CalendarCell = __ds_scope.CalendarCell;

__ds_ns.MonthGrid = __ds_scope.MonthGrid;

__ds_ns.PEN = __ds_scope.PEN;

__ds_ns.DutyChip = __ds_scope.DutyChip;

__ds_ns.FlagBadge = __ds_scope.FlagBadge;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.FairnessRow = __ds_scope.FairnessRow;

__ds_ns.ValidationAlert = __ds_scope.ValidationAlert;

__ds_ns.NavItem = __ds_scope.NavItem;

})();
