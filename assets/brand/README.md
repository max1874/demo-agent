# demo-agent brand artwork

Every vector here is traced by hand from a single geometric reference,
`original-icon-dark.png`, using its original 1254 × 1254 coordinates for the
sphere and the three cards. The tracing is not automatic and not pixel-exact,
and the warm gradient is an approximation rather than a reproduction of the
original texture.

- **mark-dark.svg / mark-light.svg** — transparent single-colour mark, all three
  cards kept. Occluded edges carry a 7-unit transparent gap so the layers stay
  legible when everything is one colour.
- **mark-small-dark.svg / mark-small-light.svg** — the same three-card paths as
  the standard mark, with no layer dropped. Separation between layers is limited
  at 16 px.
- **icon-dark.svg / icon-light.svg** — vector gradient icons at the original
  proportions, with the outer padding tightened.
- **favicon.svg** — dark ground, all three cards.
- **lockup-dark.svg / lockup-light.svg** — horizontal wordmark with the corrected
  symbol. The lettering is still live text relying on system font fallbacks; it
  has not been converted to outlines.
- **contour-overlay.svg** — the original image with the vector contour drawn over
  it in cyan, including paths hidden behind upper layers, for checking
  proportions.
- **original-icon-dark.png / original-banner.png** — unmodified copies of the
  source artwork.
- **preview.html** — side-by-side comparison of the original, the contour
  overlay, the dark and light variants, and the small sizes.
