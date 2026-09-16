# Vashudevan MetGlobal LLP — Premium Corporate Design System

> Status: Visual source of truth for VMG. This document defines the approved design direction and audit-derived implementation rules. It does not itself change production UI.

## 1. Brand Direction

VMG should look and feel like an established international recyclable-metal supply-chain company: premium, corporate, industrial, global, responsible, precise, trustworthy, understated, modern, and professional.

The visual reference is a serious global industrial / logistics / commodities company — not a trendy SaaS startup.

### Avoid

- Playful SaaS visuals or startup-template styling.
- Neon colours or loud gradients.
- Glassmorphism as a default surface treatment.
- Giant rounded “bubble” UI.
- Excessive shadows, glow, bounce, parallax, or decorative motion.
- Huge empty bands without information hierarchy.
- Random border radii or unrelated component styles.
- Multiple unrelated typefaces.
- All-caps major headings used as the default.

Premium quality should come from precision, spacing, typography, alignment, restrained colour, and consistent component geometry.
## 2. Colour System

Use navy + warm white/off-white + copper/orange as the dominant visual balance. Green is a support accent only and must remain restrained.

```css
:root {
  --vmg-navy-950: #050b14;
  --vmg-navy-900: #0a1728;
  --vmg-navy-800: #13243a;

  --vmg-copper-600: #9e6739;
  --vmg-copper-500: #b87943;
  --vmg-copper-100: #f6e5d5;

  --vmg-green-600: #508034;
  --vmg-green-100: #edf3e9;

  --vmg-white: #ffffff;
  --vmg-warm-50: #fbf8f2;
  --vmg-warm-100: #f7f2ed;
```

The logo contains stronger orange/green tones, but interface accents should default to the more muted copper and green tokens above.```css
  --vmg-text-primary: #0f172a;
  --vmg-text-secondary: #526173;
  --vmg-text-muted: #667386;

  --vmg-border: #dfe5ec;
  --vmg-border-strong: #cfd7e1;

  --vmg-success: #2f7d55;
  --vmg-error: #b42318;
  --vmg-warning: #c78640;
}
```

### Colour usage rules

- Navy 900 is the primary dark brand surface for headers, final CTAs, footer zones, and selected high-trust sections.
- Navy 950 is reserved for the deepest dark surfaces and contrast layers; do not use it everywhere.
- Copper 500 is the standard CTA/accent colour; Copper 600 is the darker hover/active tone.
- Copper 100 may be used for subtle accent backgrounds and focus treatment.
- Green is for restrained brand/support signals, success, or logo-adjacent accents — never as the dominant theme.
- Warm 50/100 may alternate with white to create section rhythm without grey SaaS-looking panels.
- Text contrast must remain strong; muted text should not be used for essential instructions or form labels.
- Do not introduce one-off colours when an existing token can serve the same semantic role.
## 3. Typography

Primary type family: **Manrope** site-wide unless a functional component has a strong technical reason to use a specialist face.

Approved weights: **400, 500, 600, 700, 800**. Avoid unnecessary 900 weights.

### Desktop scale

| Role | Size | Weight | Line height |
| --- | ---: | ---: | ---: |
| Hero H1 | 56–64px | 800 | 1.02–1.08 |
| Page H1 | 48–56px | 800 | 1.05–1.12 |
| Section H2 | 34–40px | 700–800 | 1.12–1.20 |
| Section H3 | 24–28px | 700 | 1.20–1.28 |
| Card title | 18–20px | 700 | 1.25–1.35 |
| Body | 16px | 400–500 | 1.55–1.70 |
| Supporting body | 14–15px | 400–500 | 1.55–1.65 |
| Small/meta | 13–14px | 500–600 | 1.45–1.60 |
| Eyebrow | 11–12px | 700 | 1.2 |

Eyebrows use uppercase with approximately `.10em–.16em` letter spacing.
### Mobile scale

| Role | Size | Weight | Line height |
| --- | ---: | ---: | ---: |
| Hero H1 | 36–42px | 800 | 1.02–1.10 |
| Page H1 | 34–40px | 800 | 1.06–1.14 |
| H2 | 28–32px | 700–800 | 1.14–1.22 |
| H3 | 21–24px | 700 | 1.20–1.30 |
| Body | 15–16px | 400–500 | 1.55–1.70 |
| Small | 13–14px | 500–600 | 1.45–1.60 |

### Typography rules

- Long-form copy should target roughly 65–72 characters per line.
- Paragraphs should not span the full 1180–1200px container.
- Major headings use natural/title case by default.
- Reserve uppercase for small eyebrows, labels, short utility text, and intentionally compact metadata.
- Do not use the same font size for every heading level.
- Maintain stronger spacing above headings than below them so headings visually belong to the content that follows.
- Current audit note: the site uses a system/Segoe UI stack, product/guide heroes reach ~72–74px at 1440–1920px, while some About/Contact H1s are only ~32px. Future implementation should normalize these extremes to this scale.
- Current audit note: 272 of 290 audited H1/H2/H3 elements are centered. This is too much centering for editorial and technical content.
## 4. Capitalisation

Use uppercase selectively, not as the default visual voice.

**Keep uppercase:** `MATERIAL OVERVIEW`, `CURRENT CATALOGUE`, `LEARN MORE`, compact eyebrows, small status labels, and similar metadata.

**Prefer title/natural case:** primary hero/page titles, section headings, editorial headings, Contact/Legal headings, and large conversion headings.

Example: `ALUMINIUM SCRAP SUPPLY & SOURCING` should visually become `Aluminium Scrap Supply & Sourcing` during implementation without changing the semantic page intent.

## 5. Container System

```css
--container-max: 1200px;
--gutter-desktop: 32px;
--gutter-tablet: 24px;
--gutter-mobile: 20px;
--reading-max: 72ch;
```

Rules:

- Standard page content should use one shared 1180–1200px maximum container.
- Use narrower readable measures inside that container for prose; do not create unrelated page-wide container systems.
- Existing 1160/1180/1200px layouts may converge on this system while preserving intentional narrower component widths.
- Full-bleed backgrounds may span the viewport; their content still aligns to the standard container.
## 6. Spacing System

Use an 8px-led spacing rhythm with controlled intermediate values:

`4, 8, 12, 16, 24, 32, 40, 48, 64, 80, 96px`.

### Section density

| Density | Desktop | Tablet | Mobile | Use |
| --- | ---: | ---: | ---: | --- |
| Compact | 40–48px | 36–40px | ~32px | related links, short CTA/support bands |
| Standard | 72–80px | 56–64px | 44–48px | normal content sections |
| Hero | 88–96px | ~72px | 56–64px | primary page/marketing heroes |

Rules:

- Do not assign identical padding to every section.
- Short sections should not consume standard/hero-height whitespace merely for visual drama.
- Section density should reflect content density and importance.
- Large empty bands are not a premium signal.
- Keep left/right gutters consistent even when vertical density changes.
- Current guide audit: many guide sections use `58px` top + `58px` bottom for only ~150–230 characters of copy. Target roughly 40px + 40px there (about a 31% reduction).
- Current product audit: Related Guidance sections are often compact-content sections using standard padding; these should move to Compact density.
## 7. Alignment Rules

Alignment should follow information hierarchy, not a site-wide “center everything” rule.

### Center by default

- Primary marketing hero.
- Major final conversion CTA where appropriate.
- Trust/member/verification presentation when the layout benefits from symmetry.
- Locations/map presentation where the map is the focal object.

### Left-align by default

- Editorial and guide sections.
- Documentation and Resources content.
- Product/material explanatory sections.
- Grade/search-term explanation sections.
- Legal/policy long-form sections.
- Long FAQ/context blocks where reading flow matters.

Cards may have locally centered elements when semantically appropriate, but a centered card grid does not require every section heading and paragraph to be centered.
## 8. Button System

All buttons belong to one visual family, but different button roles must remain distinct.

| Type | Treatment |
| --- | --- |
| Primary CTA | Copper 500 fill, high-contrast text, strongest visual priority |
| Secondary CTA | White/transparent surface, navy text, subtle border |
| Tertiary/text CTA | Text-led, minimal surface, restrained underline/arrow treatment |
| Utility button | Compact header/tracking/feedback control; same geometry discipline |
| Icon button | Minimum 44×44px touch target; icon optically centered |

Standard geometry: **44–48px height**, approximately **8px radius**, Manrope **600–700**.

States:

- Default: clear hierarchy, no unnecessary shadow.
- Hover: subtle colour shift, maximum 1–2px `translateY`, restrained shadow if needed.
- Active: remove lift / slight press effect only.
- Focus-visible: high-contrast copper focus ring with clear offset.
- Disabled: reduced emphasis while preserving label readability.
- Loading: preserve button dimensions; replace/augment label without layout shift.

Never use large scaling, bounce, flashing glow, or inconsistent pill shapes for normal CTAs.
### Current button audit

The deployed site currently renders button/control families at many heights (including ~32, 36, 38, 42, 46, 48, 50, 52 and 58px) and radii (0, 7, 8, 9, 10px, pill, circle).

Future normalization priorities:

- Send Buying Requirement / Submit Material Offer / Contact VMG Desk.
- Download / Preview / brochure actions.
- Track Shipment controls.
- Contact Submit.
- Get Directions / View in Google Maps.
- Subscribe.
- Give Feedback.
- Popup Submit.
- FAQ/resource actions.
- Need Help and floating utilities, while preserving their circular/utility role.

The bright-blue map actions and pill-shaped Contact Submit are visually outside the preferred VMG CTA family and should be normalized when implementation is approved.

## 9. Form, Select, and Dropdown System

Inputs, textareas, selects, dropdowns, file upload, newsletter, Track Shipment, popup fields, and Contact fields must share one geometry and state language.
Recommended control geometry:

- Height: **46–48px** for standard single-line controls.
- Radius: **8px**.
- Border: `1px solid var(--vmg-border)`.
- Text: 14–15px, navy/primary.
- Placeholder: muted, but still readable.
- Focus: copper border + subtle copper focus ring.
- Textarea: content-driven height; same radius/border/focus language.
- File upload: same surface/border language with clear filename/status feedback.

Required states: default, hover, focus, filled, disabled, success, error.

Accessibility rules:

- Preserve native semantic `select` elements where practical.
- Do not replace a working native control with custom JS solely for appearance.
- Labels remain visible; placeholder text is not a substitute for a label.
- Minimum interactive target is 44×44px on touch devices.
- Error/success state must not depend on colour alone.

Current audit: Contact, Track Shipment, newsletter, popup, and enhanced selects use different heights/radii/focus treatments. These should be visually unified without changing their working semantics/backend.
## 10. Card System

Use a restrained, consistent card family for product, information, enquiry, resource, FAQ-category, and trust cards.

### Base card

- Radius: **12–14px**.
- Border: `1px solid var(--vmg-border)` or an equivalent low-contrast brand-context border.
- Shadow: extremely restrained; prefer border + surface contrast over deep elevation.
- Padding: generally 20–24px desktop and 16–20px mobile.
- Title gap: 8–12px before supporting copy.
- Hover: at most 1–2px lift plus subtle border/shadow change.
- Do not scale large card surfaces.

### Product cards

- Preserve the current product image ratio: audit found **84/84 catalogue images at ~1.33:1 with `object-fit: cover`**.
- Keep consistent image crop and card dimensions within a grid.
- Captions should have a stable minimum rhythm without creating large blank areas.
- Product photography should not be recoloured or stylized by CSS filters.

Current audit found card radii ranging from 0 through 16px. Normal content cards should converge on this system; circular utility controls and intentionally distinct trust badges remain exceptions.
## 11. Surface, Radius, and Shadow Discipline

Recommended general-purpose tokens for future implementation:

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 14px;
--shadow-soft: 0 8px 24px rgba(10, 23, 40, .08);
--shadow-float: 0 10px 24px rgba(3, 12, 23, .18);
```

Rules:

- Standard buttons/forms: `--radius-md`.
- Content cards: `--radius-lg`.
- Small utility tags/badges may use smaller radius.
- Circular floating actions remain circular.
- Pill radius is reserved for tags/chips or intentionally capsule-shaped controls, not normal form submits or arbitrary CTAs.
- Use one shadow family. Avoid component-specific dramatic shadows.

## 12. Motion System

```css
--motion-fast: 160ms;
--motion-ui: 220ms;
--motion-reveal: 300ms;
--motion-ease: cubic-bezier(.22,1,.36,1);
```
Allowed motion:

- Opacity transitions.
- 8–12px maximum reveal translation.
- Subtle 1–2px hover lift.
- Dropdown/menu fade + short slide.
- Restrained card reveal.

Avoid:

- Bounce.
- Large scale transitions.
- Parallax.
- Scroll-jacking.
- Typewriter effects.
- Continuous decorative movement.
- Large rotations.
- Mechanical animation that distracts from information.

`prefers-reduced-motion` must be respected for normal site motion. The separately approved homepage intro remains governed by its existing frozen behavior until explicitly changed.

## 13. Responsive Rules

Primary QA viewports: **393×852, 430×932, 820×1180, 1440×900, 1920×1080**.
### Mobile

- Use 20px standard gutter; current nested pages should not fall below a practical readable margin.
- Scale hero/page headings per the mobile type table rather than preserving desktop proportions.
- Stack CTAs cleanly when two buttons cannot remain comfortably inline.
- Maintain ≥44px touch targets.
- Reduce section padding before reducing body readability.
- Keep cards single-column when a multi-column layout would compress copy or touch targets.
- Check floating actions and help menus against safe-area insets and Netlify Drawer interference during preview QA.

### Tablet

- Use 24px gutter.
- Prefer 2-column grids where content remains legible; avoid desktop-density 4-column card grids by default.
- Maintain readable copy width even when the container becomes wide.

### Desktop

- Use 32px gutter with 1200px max container.
- Avoid allowing very wide screens to inflate H1s or section spacing beyond the approved scale.
- Use available width to improve layout relationships, not to create additional empty space.

No target viewport may introduce horizontal overflow, clipped CTA labels, inaccessible dropdowns, or form controls below comfortable touch size.
## 14. Iconography

Use one restrained icon language across header, social links, footer, floating actions, cards, forms, feedback, accordions, and Go To Top.

- Keep stroke/fill treatment visually consistent within the same component family.
- Normalize optical icon size, not only numeric width/height.
- Normalize icon-button container dimensions.
- Avoid mixing highly detailed icons with minimal line icons at the same hierarchy level.
- Brand-owned social logos may retain their official marks/colours when already approved.
- Do not replace existing assets during a visual-polish pass unless an actual inconsistency cannot be solved through sizing/alignment.

## 15. Page Alignment Pattern

A typical content page should follow this visual rhythm:

1. Hero or page heading establishes context.
2. Introductory/explanatory content uses a readable left-aligned measure.
3. Cards/grids align to the shared container.
4. Related guidance uses Compact density.
5. Final conversion CTA may return to centered or balanced two-column presentation.
6. Trust/member/footer transition remains visually calm and clearly separated.

Do not structurally rebuild pages merely to make them conform to this pattern; apply it through typography, spacing, alignment, and component styling first.
## 16. Product / Material Page Rules

Applies to all ten product pages.

### Preserve

- Current page structure and SEO content.
- Specification-first positioning.
- Grade/search-term information.
- Current catalogue grid.
- Existing consistent 1.33:1 product image ratio.
- Related guidance and final enquiry CTA.

### Future visual normalization

- Hero H1: move from current ~72–74px/900 toward 56–64px/800 desktop.
- Hero composition may remain centered; informational sections should generally become left-aligned.
- “What to include in an enquiry” card should use the shared card system.
- Intro/grade/catalogue bands should use consistent standard density rather than fixed identical padding everywhere.
- “Related buyer and supplier guidance” should use Compact density; it is currently disproportionately tall for its content.
- Grade/search-term cards should share padding, border, radius, title hierarchy, and hover behavior.
- Product captions should use the Small/Meta scale and a predictable minimum vertical rhythm.
- Final CTA stays visually high-priority but must use the shared button family.

Do not alter product terms, availability language, catalogue data, or page architecture as part of visual normalization.
## 17. Guide Page Rules

Applies to all four current guides.

Current audit finding: normal guide bands are commonly about 260px tall with 58px top and 58px bottom padding, even when the section contains only about 150–230 characters. This produces large empty page bands.

### Future implementation target

- Reduce standard guide-section vertical padding by approximately 25–35%; about 40px top and 40px bottom is the preferred starting point.
- Keep hero spacing distinct from article-section spacing.
- Keep editorial body copy to about 65–72 characters per line.
- Left-align article H2s and prose by default.
- Preserve centered treatment only where it functions as a hero or final CTA.
- “Continue your research” should use Compact density.
- Reference/source sections may use slightly more separation when link lists need scanning space, but not hero-level padding.
- Do not remove guide content to achieve compactness.

The intended result is editorial and premium, not cramped.
## 18. Homepage Rules

The homepage structure is not a redesign target. The approved homepage intro media, poster, fallback, Skip behavior, timing, and handoff are frozen unless explicitly reopened.

Audit and future polish should focus only on:

- Typography hierarchy.
- Section spacing rhythm.
- CTA/button consistency.
- Card consistency.
- Content alignment.
- Section transitions.
- Footer transition.

Do not change TradingView or Locations content/structure during design normalization. Keep hero/final CTA/Locations-centered treatments where they serve the composition; move informational sections toward the alignment rules in this document.

## 19. Resources Page Rules

Preserve the existing information architecture and content. The visual priority is to remove unnecessary mechanical presentation while retaining the workflow information.
### Trade Docket / printer audit

Current implementation:

- Markup: `resources/index.html`, `.trade-docket` / `[data-trade-docket]` block in “Our Process”.
- Behavior: `assets/js/vmg-resources.js`, which drives processing/printing/complete stages through `[data-docket-print]`, status labels, and `setStage()`.
- Mechanical motion: `assets/css/vmg-resources.css`, especially `.docket-paper-shell`, `[data-stage="printing"]`, `@keyframes vmg-docket-feed`, `docket-spin`, and `docket-pulse`.

Approved future direction:

- Keep the same workflow information and right-side docket concept if desired.
- Remove the mechanical printing/feed/spinner/pulse experience.
- Present the docket as a static premium visual.
- Allowed reveal: simple opacity + small slide only, using the Motion System.

This behavioral change requires explicit implementation approval; this document only specifies the target.

## 20. Header System

Do not restructure the header. Treat the existing header as a precision-alignment problem, not an architecture problem.
Header requirements:

- Logo, Track Shipment, Give Feedback, social controls, navigation text, and active indicators should appear aligned to an intentional common grid/baseline.
- Keep current navigation structure and mobile menu behavior.
- Normalize nav typography to the same Manrope family and weight logic.
- Keep active underline restrained and precise.
- About submenu should use one consistent dropdown language: 8–10px radius, subtle border/shadow, compact vertical rhythm, short fade/slide.
- Social icons should be optically equal in size even when source marks differ.
- Utility controls may be visually compact but must remain accessible.

### Track Shipment audit

Current root cause of the “Coming Soon” message following the page:

- `assets/js/config.js` creates `.vmg-track-toast`, appends it directly to `document.body`, and currently dismisses it after about 3200ms.
- `assets/css/vmg-trade-nav.css` positions `.vmg-track-toast` as `fixed` (desktop around `top:146px`, with a mobile top override).
- A later hotfix layer also enforces fixed positioning/z-index.

Future target: place/anchor the status directly below the relevant Track control, keep it attached to the header/control area so it scrolls away with that area, and auto-close after about **2–2.5 seconds**. Do not let it follow the visitor down the page.
## 21. Floating Actions / Need Help

Normal stack order remains:

1. Go To Top
2. Call
3. WhatsApp
4. Need Help

Need Help is the stable anchor.

When Need Help opens:

- Need Help stays in exactly the same fixed position.
- The help menu opens directly above Need Help.
- Go To Top / Call / WhatsApp temporarily disappear.
- Exit animation: `opacity: 0`, `scale(.92)`, `translateY(6px)`, approximately 150–180ms.
- Disable pointer interaction only after/with the visual exit state.

When Help closes, return the hidden controls smoothly using the inverse transition.

Current implementation already provides the correct state hooks: `assets/js/vmg-help.js` owns `.vmg-help`, `.vmg-help-trigger`, `.vmg-help-menu`, `.vmg-floating-actions`, and the `body.vmg-help-open` state. Existing CSS already places the menu above the trigger and hides the sibling controls. Future work should refine the transition, not rewrite the component.

Preview note: Netlify Drawer can overlap bottom floating controls on narrow preview viewports; use Netlify’s supported Drawer-hidden QA state before diagnosing a production UI defect.
## 22. Footer System

Do not restructure the footer. Preserve its current information architecture and trust/member content.

Future polish targets:

- Normalize member badge alignment and perceived card dimensions.
- Normalize Verified & Registered card alignment.
- Use the shared form system for newsletter input/button.
- Improve spacing hierarchy between legal mini-links, newsletter, copyright, company label, and social icons.
- Keep footer social icons optically aligned.
- Maintain clean mobile stacking and touch targets.

**RecycleInMe is frozen and must remain completely unchanged** in logo, label, “Premium Member” wording, link behavior, and status. Do not recommend restyling or replacing it.

## 23. Popup System

The existing “Let’s Stay Connected” popup should visually inherit the same premium form language as Contact while preserving its behavior and backend.

Future normalization: shared field height/radius/border/focus, consistent label/body typography, primary CTA treatment, compact success alert, disciplined mobile width, accessible close button, restrained 12–14px panel radius, and soft shadow.

Do not change popup timing, submission logic, or backend merely for visual consistency.
## 24. Contact Page System

Preserve the current information/form structure and backend. Future visual work should focus on consistency.

- Contact information column: left-aligned, readable hierarchy, consistent spacing between address/contact/hours groups.
- Form: use the shared form and button systems; remove outlier pill/colour treatments.
- “Find Us”: keep as its own clear section but avoid excessive empty height.
- “Join the Vashudevan Family”: use natural/title case visually rather than large all-caps styling.
- CTA actions should use the primary/secondary VMG button family.

### Future map component

Wait for the user-supplied final map code before implementation. Do not invent or replace the map now.When the final map code is supplied, preferred visual constraints are:

- Desktop max-height about 400–420px.
- Mobile approximately 4:3 ratio.
- 12px radius.
- Subtle border.
- Lazy loading where supported.
- Clear map fallback plus Get Directions action, styled through the VMG button system.

## 25. Legal and FAQ Content Recommendations

These are content-audit recommendations only. Do not implement them as part of a visual pass.

### Privacy Policy

Recommended additions for clarity:

- Explicitly disclose Google Analytics / GA4 and associated technical/device/session usage information, approximate location where applicable, and analytics cookies/browser identifiers where applicable.
- Explain that photos, specifications, PDFs, inspection reports, and other supporting documents submitted through Contact may be processed to answer the enquiry.
- Advise users not to submit unrelated sensitive information.
- Add generic CAPTCHA/security/anti-abuse provider disclosure where applicable.
- Consider the presentation heading “Privacy & Data Requests Contact” without inventing a privacy officer.

Do not state that VMG is fully DPDP compliant unless separately reviewed.
### Disclaimer

Recommended single clarification under Products / Grades:

> Industry grade names and trade terms are reference labels; the agreed transaction specification and contract terms control.

Do not bloat the Disclaimer beyond genuinely useful clarifications.

### FAQ

Recommend these four additions because they answer real user questions rather than manufacturing SEO volume:

1. **Are catalogue photos and material examples a guarantee of current stock? — YES.** Clarify that images/examples are reference material and availability depends on current supply and specification review.
2. **Can international buyers and suppliers contact VMG? — YES.** Existing approved business/site positioning supports international sourcing/supply enquiries.
3. **Can I attach photos, specifications, inspection reports or supporting documents to my enquiry? — YES.** The current Contact form supports attachments; the answer must reflect actual limits/functionality.
4. **How does VMG handle information submitted through the website? — YES.** Keep the answer short and link to the Privacy Policy.

Do not mass-create FAQs for search-engine volume.

## 26. Accessibility and Interaction Baseline

Premium polish must not reduce accessibility.
- Minimum touch target: 44×44px.
- Preserve visible `focus-visible` treatment.
- Maintain sufficient text/background contrast.
- Preserve semantic native controls where practical.
- Menus/dropdowns must be keyboard reachable and close predictably.
- Motion must honor reduced-motion preferences except separately approved frozen experiences.
- Do not hide essential text purely for visual minimalism.
- Error states require text/icon support, not colour alone.

## 27. CSS Architecture Recommendation

The current site has accumulated multiple CSS layers and overrides. Do **not** consolidate them before production; that creates unnecessary regression risk.

Future approved implementation should add one final polish layer:

`/assets/css/vmg-premium-system.css`

Load it **last** on public pages.

Primary responsibilities:

- Design tokens.
- Typography.
- Container/spacing normalization.
- Button and form systems.
- Card and alignment normalization.
- Motion and responsive polish.Modify existing component files only when behavior genuinely requires it, such as the Track notification or Resources printer behavior.

### Existing layers most likely to conflict with the future premium system

- `assets/css/styles.css` — broad base/page styles.
- `assets/css/vmg-responsive-polish.css` — large responsive override layer.
- `assets/css/vmg-chatgpt-mobile-fixes.css` — focused mobile/floating overrides.
- `assets/css/vmg-nav-premium-overrides.css` — header/navigation specificity.
- `assets/css/vmg-trade-nav.css` — Track/navigation geometry and toast.
- `assets/css/vmg-seo-content.css` — product/guide content system.
- `assets/css/vmg-resources.css` — Resources-specific layout and docket.
- `assets/css/vmg-header-*` layers — header geometry/combined/sticky behavior.
- Page-local `<style>` blocks, especially on Resources and legacy/core pages.
- `assets/css/production-hotfix.css` where its selectors intentionally carry high authority.

Implementation must inspect specificity before adding `!important`. The final layer should normalize visual tokens with the smallest selector strength that reliably wins.

Do not create `vmg-premium-system.css` until implementation is approved.

## 28. Current Audit Findings — Priority Matrix

### P0 — obvious inconsistency / broken premium experience

| Area | Current issue | Proposed change | Rule/token | Risk | Benefit |
| --- | --- | --- | --- | --- | --- |
| Guides | Repeated 58/58px padding creates oversized 260px bands for short copy | Reduce standard bands ~25–35%, usually ~40/40px | Section density | Low | More editorial, less empty |
| Type hierarchy | 72–74px/900 SEO heroes vs ~32px core-page H1s | Normalize to approved Manrope scale | Typography | Medium | Consistent corporate hierarchy || Alignment | 272/290 audited headings centered | Left-align editorial/product/legal information sections | Alignment rules | Low | Stronger reading hierarchy |
| Resources | Mechanical Trade Docket printer/feed/spinner animation | Keep information; make docket static with restrained reveal | Motion system | Medium | More premium, less gimmicky |
| Track Shipment | Fixed body-level toast follows viewport for ~3.2s | Anchor below Track control; dismiss ~2–2.5s | Motion + header system | Medium | Correct spatial behavior |

### P1 — important visual polish

| Area | Current issue | Proposed change | Rule/token | Risk | Benefit |
| --- | --- | --- | --- | --- | --- |
| Buttons | Many heights/radii/colour families | Normalize to role-based 44–48px / ~8px system | Button system | Medium | Site-wide consistency |
| Forms | Contact/Track/newsletter/popup/select geometry differs | Shared 46–48px field system | Form system | Medium | Higher trust / usability |
| Product related guidance | Too much vertical space for short content | Compact section density | Spacing | Low | Better rhythm |
| Cards | Several radius/shadow families | Normalize standard content cards | Card system | Low | Cleaner visual language |
| Header | Utility controls do not read as one optical baseline | Normalize sizing/alignment only | Header system | Medium | More intentional top chrome |
| Footer | Bottom utility area is dense and micro-text-heavy | Refine spacing/type hierarchy; preserve structure | Spacing/type | Low | Cleaner finish |
| Contact | Submit/maps actions visually outside CTA family | Apply primary/secondary family | Buttons/forms | Low | Consistent conversion UI |
| Need Help | Hiding siblings lacks full desired transition geometry | Reuse body state with .92 scale + 6px/opacity transition | Motion system | Low | Polished, stable anchor |

### P2 — nice refinements

- Normalize social/icon optical sizing.
- Tune border/shadow consistency on trust and resource cards.
- Reduce unnecessary all-caps major headings.
- Normalize minor eyebrow spacing and card-title gaps.
- Audit subtle reveal timing so multiple sections do not animate competitively.
## 29. Page-Specific Audit Notes

### Homepage

- Keep hero, final CTA, Locations/map presentation, intro, TradingView, and Locations structure intact.
- Normalize middle-page heading alignment: information-heavy sections should not all default to center.
- Existing Home uses several 1020/1060/1120/1180/1200px widths; converge outer containers while preserving intentional readable sub-widths.
- “WORK WITH VMG” and other large all-caps major headings should be reviewed for title-case presentation; small eyebrows may stay uppercase.
- Preserve the current serious navy/industrial imagery direction.

### About — Who We Are

- Current large headings (“WHO WE ARE”, “OUR HISTORY”, “OUR CORE VALUES”, “OUR MISSION”, “DOWNLOAD OUR BROCHURE”) overuse all caps and center alignment.
- Keep the existing structure/images; normalize type scale and use natural/title case for major headings.
- Historical/mission copy should remain readable and primarily left-aligned.
- Brochure CTA may remain centered as a conversion band.

### About — Our Impact

- Preserve content structure.
- Use the shared H1/H2/H3 scale; cards/content should feel factual and industrial rather than campaign-like.
- Avoid adding decorative sustainability-green dominance; green remains a support accent.
### Products Index

- Preserve catalogue architecture.
- Normalize filters/cards/CTA controls to the common button/card system.
- Use consistent grid spacing and card image treatment.
- Avoid introducing oversized marketing whitespace between catalogue functions.

### Market

- Preserve TradingView implementation, symbols, data, and market functionality.
- Apply common heading/container rules only.
- “Market Reference Notice” is a support label and should not visually compete with H2 content.
- Keep live-data surfaces functional and restrained; avoid decorative motion around charts.

### Resources

- Hero and brochure areas are visually strong but need common button/card geometry.
- Buyer/Supplier/Partner resource grids, guides, and documentation should use left-aligned readable content even when card titles remain locally centered where helpful.
- “Our Process” should move away from the mechanical printer experience per Section 19.
- Short “Have A Question?” / support bands should use Compact rather than large standard spacing where content density is low.

### FAQ

- Preserve accordion/category architecture and existing extensive content.
- Category labels may remain compact uppercase-style metadata, but question headings should follow readable H3 sizing/alignment.
- Avoid adding FAQ content solely to fill visual space.
- Maintain accessible accordion focus and state indication.
### Privacy Policy / Disclaimer

- Preserve legal content unless a separately approved content edit is being made.
- Long-form legal H2s should become left-aligned and use the normal section H3/H2 hierarchy rather than repeated centered bands.
- Reduce unnecessary vertical banding; legal pages should read like clear professional documents.
- Keep readable line length and clear section numbering.

## 30. Sections That Should Remain Centered

- Primary marketing heroes when the current composition is built around a centered focal statement.
- Final CTA/conversion bands where both message and action benefit from symmetry.
- Locations title/map presentation.
- Trust/member/verification groupings.
- Short brochure/download conversion blocks.

## 31. Sections That Should Generally Become Left-Aligned

- Product specification-first introductions.
- Product grade/search-term explanations.
- Product catalogue section headings where the grid reads left-to-right.
- Related guidance content labels.
- All guide article sections.
- Resources/documentation explanatory content.
- Privacy/Disclaimer section headings and body copy.
- Long FAQ/contextual descriptions.
- Contact information groups and other informational prose.
## 32. Mobile Tightening Priorities

- Reduce oversized hero and section padding before reducing readable body size.
- Prevent long H1s from exceeding the approved 36–42px mobile hero range.
- Use single-column cards when text/buttons would otherwise wrap awkwardly.
- Keep CTA stacks compact but preserve 44px touch targets.
- Normalize form control heights so Contact, popup, newsletter, and Track feel related.
- Tighten footer gaps and micro-type hierarchy without shrinking legal/utility links below comfortable readability.
- Preserve floating-action safe-area clearance and test with the preview Drawer hidden where necessary.

## 33. Desktop Tightening Priorities

- Cap SEO/product/guide heroes within the 56–64px range rather than allowing 72–74px H1s.
- Reduce 58/58px short editorial bands to an appropriate density.
- Converge 1160/1180/1200px outer containers.
- Left-align information-heavy sections instead of using centered headings throughout.
- Remove oversized blank bands whose height is not driven by content.
- Keep trust/footer zones compact enough to feel intentional rather than stacked as separate microsites.

## 34. Optional Structural Ideas — User Approval Required

No structural rewrite is recommended by default. The current information architecture can achieve the target premium standard through visual-system normalization and a few surgical behavioral corrections.

Any future proposal that changes DOM hierarchy, page sections, URLs, navigation structure, product catalogue architecture, footer architecture, or SEO content must be separated from the visual implementation plan and approved before work begins.
## 35. Future Implementation Order

When the user approves implementation, prefer this sequence to minimize regression risk:

1. Add the final `vmg-premium-system.css` token/typography/container layer.
2. Normalize global typography, section density, alignment, buttons, forms, and cards without altering behavior.
3. QA all canonical routes at the five standard viewports.
4. Apply page-specific spacing/alignment refinements to Products and Guides.
5. Normalize Header, Footer, Contact, Popup, Resources, and FAQ visuals.
6. Make only the approved behavioral corrections: Resources printer removal/static state, Track status anchoring, and Need Help sibling transition.
7. Re-run full browser regression for intro, popup, TradingView, Locations, floating actions, forms, GA4, search, navigation, console, assets, and overflow.

Do not combine an unrelated content/SEO/URL/backend rewrite with the premium visual pass.

## 36. Definition of Done for Future Visual Implementation

A premium-polish implementation is complete only when:

- Manrope hierarchy is consistent and no arbitrary 900-weight heading system remains.
- Colour use maps to approved tokens; no new one-off palette has emerged.
- Outer page containers and gutters follow the shared container system.
- Short sections use compact spacing and editorial pages no longer contain disproportionate blank bands.
- Buttons and forms belong to the approved families and preserve accessibility.
- Product image ratios remain consistent.
- Header/footer/floating controls remain functionally unchanged except explicitly approved behavior corrections.
- No page has horizontal overflow at any standard viewport.- Homepage intro still starts/finishes exactly as approved.
- TradingView and Locations remain intact.
- Contact forms, attachment flow, popup backend, newsletter, and enquiry routing still work.
- Need Help remains the stable anchor and floating siblings transition correctly.
- Track status stays with its control and self-dismisses in the approved timing window.
- Resources no longer performs mechanical printer motion if that behavioral change is approved.
- RecycleInMe remains exactly unchanged.
- `prefers-reduced-motion` is respected for normal site motion.
- No new fatal console errors, broken first-party assets, clipped text, or layout regressions appear.

## 37. Design Governance

For every new page/component:

- Start from these tokens rather than copying a one-off page style.
- Reuse an existing component role before inventing a new button/card/form type.
- Use the standard container and spacing system.
- Choose alignment based on reading hierarchy, not habit.
- Check mobile first-class behavior, not just desktop scaling.
- Treat content accuracy, accessibility, SEO semantics, and existing working behavior as constraints, not obstacles to visual polish.
- If a proposed visual treatment requires a structural rewrite, document it separately for approval.

This document is the default visual authority for VMG. Page-specific exceptions should be rare, intentional, documented, and visually compatible with the premium corporate system.
## Appendix A — Audit Baseline (16 September 2026)

The rules above were derived from a deployed visual audit of the current PR #12 preview, not from a generic template.

Audit scope included all 24 canonical pages: Home; both About pages; Products index; all ten product/material pages; Market; Resources; all four Guides; FAQ; Contact; Privacy Policy; and Disclaimer.

Representative responsive inspection covered 393×852, 430×932, 820×1180, 1440×900, and 1920×1080.

Key measured observations:

- 24/24 audited pages currently compute to the system/Segoe UI-style font stack rather than Manrope.
- 272 of 290 audited H1/H2/H3 elements are centered.
- Product/guide desktop hero H1s commonly render around 72–74px with weight 900; several core-page H1s render around 32px.
- Button/control geometry is fragmented across many rendered heights and radii.
- Product catalogue imagery is highly consistent: 84 audited product images at roughly 1.33:1 using `object-fit: cover`.
- Outer content widths cluster around 1160, 1180, and 1200px, with additional Home-specific narrower widths.
- Guide body sections commonly use 58px top + 58px bottom padding and are frequently ~260px tall for relatively short text.
- No audited representative viewport showed horizontal overflow during the baseline inspection.

These measurements are diagnostic evidence, not immutable targets. The normative targets are the design-system rules in Sections 1–37.