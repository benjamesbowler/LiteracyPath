import {
  REPORT_STATUS_IDS,
  REPORT_STATUS_LABELS,
  canonicalStatusId
} from "../../policy/reportingBible.js";

/**
 * The workbook palette.
 *
 * These are the screen's own hex values, lifted from `src/App.css` and
 * `src/styles/student-reports.css` and prefixed with the alpha channel ExcelJS
 * wants. The old export palette was a separate invention — `greenSoft FFD9FBE8`
 * where the screen renders `#F0FDF4`, `redSoft FFFFDADA` where the screen
 * renders `#FEF2F2` — so a printed sheet and the app disagreed about the same
 * child. One palette, defined once, consumed by both.
 *
 * Note the deliberate absence of a red-green pairing as the only signal: every
 * status also carries a mark glyph and a word, per CCSSO's colour-blindness
 * guidance.
 */

const argb = hex => `FF${String(hex).replace("#", "").toUpperCase()}`;

export const WORKBOOK_COLORS = Object.freeze({
  // Brand
  primary: argb("0C6B65"),
  primaryStrong: argb("084E4A"),
  primarySoft: argb("E3F4F2"),
  ink: argb("172033"),
  inkStrong: argb("101828"),
  inkMuted: argb("51607A"),
  inkSubtle: argb("6B7585"),
  surface: argb("FFFFFF"),
  surfaceSubtle: argb("F8FAFC"),
  background: argb("F1F5F9"),
  border: argb("E2E8F0"),
  borderStrong: argb("CBD5E1"),

  // Status fills — identical to the screen
  secureFill: argb("F0FDF4"),
  secureText: argb("14532D"),
  secureEdge: argb("BBF7D0"),
  developingFill: argb("FEF3C7"),
  developingText: argb("78350F"),
  developingEdge: argb("FDE68A"),
  needsSupportFill: argb("FEF2F2"),
  needsSupportText: argb("7F1D1D"),
  needsSupportEdge: argb("FECACA"),
  neutralFill: argb("FFFFFF"),
  neutralText: argb("51607A"),
  neutralEdge: argb("E2E8F0"),
  mixedFill: argb("EFF6FF"),
  mixedText: argb("1E3A8A"),
  mixedEdge: argb("BFDBFE"),

  // Accents for section tabs
  teal: argb("0F766E"),
  blue: argb("2563EB"),
  amber: argb("B45309"),
  purple: argb("7C3AED"),
  slate: argb("475569")
});

export const WORKBOOK_FONTS = Object.freeze({
  family: "Calibri",
  coverTitle: { name: "Calibri", size: 26, bold: true, color: { argb: WORKBOOK_COLORS.inkStrong } },
  coverSubtitle: { name: "Calibri", size: 13, color: { argb: WORKBOOK_COLORS.inkMuted } },
  coverEyebrow: { name: "Calibri", size: 10, bold: true, color: { argb: WORKBOOK_COLORS.primary } },
  sectionTitle: { name: "Calibri", size: 14, bold: true, color: { argb: WORKBOOK_COLORS.inkStrong } },
  sectionHelp: { name: "Calibri", size: 10, italic: true, color: { argb: WORKBOOK_COLORS.inkMuted } },
  tableHeader: { name: "Calibri", size: 10, bold: true, color: { argb: WORKBOOK_COLORS.surface } },
  body: { name: "Calibri", size: 11, color: { argb: WORKBOOK_COLORS.ink } },
  bodyMuted: { name: "Calibri", size: 10, color: { argb: WORKBOOK_COLORS.inkMuted } },
  kpiValue: { name: "Calibri", size: 22, bold: true, color: { argb: WORKBOOK_COLORS.inkStrong } },
  kpiLabel: { name: "Calibri", size: 9, bold: true, color: { argb: WORKBOOK_COLORS.inkMuted } },
  kpiNote: { name: "Calibri", size: 9, color: { argb: WORKBOOK_COLORS.inkSubtle } },
  banner: { name: "Calibri", size: 8, italic: true, color: { argb: WORKBOOK_COLORS.inkSubtle } }
});

/**
 * Status → cell treatment. Keyed by canonical status id, never by regex over
 * the display string. The old exporter matched `/support|miss|incorrect|no|risk/`
 * against cell text, which coloured the word "Norwich" as a failure and any
 * sentence containing "no" as needing support.
 */
export const STATUS_CELL_STYLES = Object.freeze({
  [REPORT_STATUS_IDS.SECURE]: {
    fill: WORKBOOK_COLORS.secureFill,
    font: WORKBOOK_COLORS.secureText,
    edge: WORKBOOK_COLORS.secureEdge,
    mark: "✓"
  },
  [REPORT_STATUS_IDS.DEVELOPING]: {
    fill: WORKBOOK_COLORS.developingFill,
    font: WORKBOOK_COLORS.developingText,
    edge: WORKBOOK_COLORS.developingEdge,
    mark: "~"
  },
  [REPORT_STATUS_IDS.NEEDS_SUPPORT]: {
    fill: WORKBOOK_COLORS.needsSupportFill,
    font: WORKBOOK_COLORS.needsSupportText,
    edge: WORKBOOK_COLORS.needsSupportEdge,
    mark: "!"
  },
  [REPORT_STATUS_IDS.MIXED_EVIDENCE]: {
    fill: WORKBOOK_COLORS.mixedFill,
    font: WORKBOOK_COLORS.mixedText,
    edge: WORKBOOK_COLORS.mixedEdge,
    mark: "?"
  },
  [REPORT_STATUS_IDS.NOT_ENOUGH_EVIDENCE]: {
    fill: WORKBOOK_COLORS.neutralFill,
    font: WORKBOOK_COLORS.neutralText,
    edge: WORKBOOK_COLORS.neutralEdge,
    mark: "–"
  },
  [REPORT_STATUS_IDS.NOT_CHECKED]: {
    fill: WORKBOOK_COLORS.neutralFill,
    font: WORKBOOK_COLORS.neutralText,
    edge: WORKBOOK_COLORS.neutralEdge,
    mark: "–"
  }
});

export function statusCellStyle(status) {
  return STATUS_CELL_STYLES[canonicalStatusId(status)];
}

export function statusMark(status) {
  return statusCellStyle(status).mark;
}

/**
 * The legend rows, so every workbook can print the same key the screen shows.
 * `mark` exists so the sheet is readable in greyscale and to a colour-blind
 * reader — the bible forbids colour as the sole carrier of meaning.
 */
export function statusLegendRows() {
  return Object.values(REPORT_STATUS_IDS).map(id => ({
    statusId: id,
    mark: STATUS_CELL_STYLES[id].mark,
    label: REPORT_STATUS_LABELS[id]
  }));
}

export const NUMBER_FORMATS = Object.freeze({
  integer: "0",
  oneDecimal: "0.0",
  twoDecimal: "0.00",
  percent: "0%",
  percentOneDecimal: "0.0%",
  fraction: "0/0",
  date: "yyyy-mm-dd",
  dateTime: "yyyy-mm-dd hh:mm"
});
