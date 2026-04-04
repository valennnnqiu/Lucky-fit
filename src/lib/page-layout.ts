/** Fixed content column (px). Wider viewports show `body` background on the sides only. */
export const PAGE_COLUMN_PX = 393;

/** Result page scaled column width (+30% over `PAGE_COLUMN_PX`). Weather / Stay informed use `TICKET_CARD_DISPLAY_PX` to match ticket art. See `globals.css` `--result-column-px`. */
export const RESULT_PAGE_COLUMN_PX = Math.round(PAGE_COLUMN_PX * 1.3);

/** Space between ticket art and the column edges (each side). */
export const TICKET_GUTTER_PX = 16;

/** Ticket machine graphic + overlay stack width: `PAGE_COLUMN_PX − 2 × TICKET_GUTTER_PX`. */
export const TICKET_CARD_DISPLAY_PX = PAGE_COLUMN_PX - 2 * TICKET_GUTTER_PX;

/** Inner overlay width: ticket width − `p-2` frame (8×2) − former horizontal inset (12). */
export const TICKET_OVERLAY_INNER_PX = TICKET_CARD_DISPLAY_PX - 16 - 12;

/**
 * Min height for the share-card outfit strip (dashed rows + `gap-3`).
 * Matches ~3 rows at ~116px each + 2×12px gaps so “Made by” stays fixed when
 * the bottom row is omitted (one-piece outfits).
 */
export const SHARE_CARD_OUTFIT_ROWS_MIN_HEIGHT_PX = 116 * 3 + 12 * 2;
