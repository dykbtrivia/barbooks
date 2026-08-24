// Print page geometry for the 6x9in book, shared by any page type that needs
// to size its own content to fit within the printable area without pushing
// PageFooter past the page boundary.
//
// PRINT_HEADER_HEIGHT_PX and PRINT_FOOTER_HEIGHT_PX were measured directly
// (Puppeteer, @media print, 576x864 viewport) against the rendered
// PageHeaderScorecard and PageFooter components — they held constant across
// page types (list/bracket/etc.) since both have fixed-size content.
export const PRINT_PAGE_WIDTH_PX = 576;   // 6in @ 96dpi
export const PRINT_PAGE_HEIGHT_PX = 864;  // 9in @ 96dpi
export const PRINT_BODY_PAD_X_PX = 72;    // body { padding: 0.5in 0.75in } in global.css
export const PRINT_BODY_PAD_Y_PX = 48;

export const PRINT_HEADER_HEIGHT_PX = 146; // PageHeaderScorecard, measured
export const PRINT_FOOTER_HEIGHT_PX = 70;  // PageFooter, measured

// Width available inside body's horizontal padding — matches every page
// type's content wrapper once print:max-w-none is applied.
export const PRINT_CONTENT_WIDTH_PX = PRINT_PAGE_WIDTH_PX - PRINT_BODY_PAD_X_PX * 2;

// Max height any page-type's own content can occupy without overflowing the
// page (and pushing the footer off it). <main> is a flex-1 box that fills
// exactly (page - header - footer) before it's forced to grow past that by
// oversized content, so this is a hard ceiling, not an estimate.
export const PRINT_CONTENT_AREA_HEIGHT_PX =
  PRINT_PAGE_HEIGHT_PX - PRINT_HEADER_HEIGHT_PX - PRINT_FOOTER_HEIGHT_PX;
