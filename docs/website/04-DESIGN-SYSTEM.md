# 04 · Design System & Brand Rules

**VMG public website · 08 Oct 2026 · Proposed governance, current look frozen**

## Intent and visual language
Professional, restrained international B2B metals/logistics brand. Maintain brand recognition and commercial clarity. Do not redesign approved layouts to implement this document.

## Existing coded tokens (source: `assets/css/styles.css`)
| Token | Current code | Usage |
|---|---|---|
| `--brand` | `#FFA500` | Primary orange emphasis |
| `--brand-700` | `#E69500` | Stronger orange / interaction |
| `--text` | `#111827` | Main body copy |
| `--muted` | `#475569` | Secondary text |
| `--ink` | `#0f172a` | Deep navy/ink |
| `--border` | `#e5e7eb` | Dividers |
| `--bg` | `#ffffff` | White canvas |

These are current code values, **not** an instruction to replace an approved alternate palette. Confirm official brand assets before changing logo, color or typeface. Logo source `assets/img/vmg-header-logo.svg` and favicon `assets/img/LOGO.png`.

## Content geometry
- Center-align titles and subtitles in editorial sections; justify longer body paragraphs only where it stays readable and does not create large word-spacing gaps.
- Keep headings legible, restrained and consistent. Max reading measure ~65–80 characters; fluid content widths adapting to desktop and mobile.
- Semantic H1 once per page, coherent H2/H3 hierarchy, no headings for decoration.
- CTA: plain action label such as “Contact VMG Desk”, “Explore Products”, “View Company Profile”. Avoid urgency/clickbait.
- White/neutral panels, consistent radii, understated shadows, adequate contrast; never add decorative charts without real data.
- Mobile-first: ensure 320 px width works, 44 px minimum interactive targets where practical, readable labels and menu operation.

## Typography
Existing CSS uses a system-first stack. **Do not introduce extra third-party webfonts by default**; fonts incur bandwidth and privacy considerations. Agree on exact scale in a reviewed visual design token change before implementation.

## Accessibility and motion
Visible keyboard focus; contrast WCAG AA targets; meaningful `alt`; controls labelled; errors shown in text; reduced motion respected. No animated movement that prevents navigation or reading. Check dark overlay/hero text contrast on actual images.

## Component specifications
| Component | Required behavior |
|---|---|
| Global header | Brand consistent, navigation accessible, predictable sticky behavior |
| Product card | Correct name/image, explicit click target and matching details |
| CTA | One primary per meaningful decision section; verified link |
| Enquiry form | Clear fields, validation, privacy text, success/error feedback |
| Footer | One accurate company/contact identity, legal links and social links |
| Brochure | Authentic document, obvious preview/download |
| Market ticker | Licensed/attributed delayed/indicative values, graceful failure |

## Review gates
Compare desktop/tablet/mobile screenshot baselines; check CLS and interactions. A design change that modifies words/images/DOM order/functionality requires explicit sign-off rather than being described as “CSS-only”.
