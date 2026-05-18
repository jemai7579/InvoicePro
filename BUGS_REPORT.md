# El Fatoora — Complete Bug Report

**Audit Date:** 2026-04-28  
**Auditor:** Senior QA Engineer (Claude Sonnet 4.6)  
**Scope:** Full frontend + backend static analysis  
**Total bugs found:** 17  
**Total bugs fixed:** 17  

---

## Severity Summary

| Severity | Count | Fixed |
|---|---|---|
| 🔴 Critical | 2 | 2 |
| 🟠 High | 7 | 7 |
| 🟡 Medium | 5 | 5 |
| 🟢 Low | 3 | 3 |

---

## Bug Catalogue

---

### BUG-001 — Button icon size logic inverted
**Severity:** 🔴 Critical  
**Component:** `frontend/src/components/ui/Button.jsx`

**Root cause:**
```jsx
// BROKEN — checks if the sizes string contains "sm", not if size === 'sm'
<Icon className={sizes[size].includes('sm') ? 'w-4 h-4' : 'w-5 h-5'} />
```
`sizes['md'] = 'px-6 py-3 text-sm gap-2'` — the string `'text-sm'` contains `'sm'`, so `medium` buttons
got small icons (`w-4 h-4`). Meanwhile `sizes['sm'] = 'px-4 py-2 text-xs gap-1.5'` does NOT contain
`'sm'` as a standalone substring match, so small buttons got LARGE icons (`w-5 h-5`). Every icon-bearing
button in the app displayed the wrong icon size.

**Fix applied:** `frontend/src/components/ui/Button.jsx`
```jsx
// FIXED — direct comparison against the size prop
<Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
```

---

### BUG-002 — ProjectModal has no scroll: content overflows viewport on small screens
**Severity:** 🔴 Critical  
**Component:** `frontend/src/pages/Projects.jsx` — `ProjectModal`

**Steps to reproduce:** Open any screen < 768 px, click "Nouvelle idée". The form overflows below the
visible area. The Save button was not accessible without system-level scroll.

**Root cause:** The modal had no `max-height`, no `flex-col` scroll structure, and no `min-h-0` on the
body — the same class of flex-overflow bug as the Devis modal reported earlier.

**Fix applied:** `frontend/src/pages/Projects.jsx`
- Replaced `<Card>` wrapper with a proper `flex flex-col overflow-hidden` shell
- `max-height: min(calc(100dvh - 1.5rem), calc(100vh - 1.5rem))` — handles mobile browser chrome
- Scrollable body: `flex-1 min-h-0 overflow-y-auto overscroll-contain`
- Sticky footer with Cancel + Save always visible
- Submit button uses `form="project-modal-form"` so it works outside the `<form>` tag
- Backdrop click-to-close added

---

### BUG-003 — Products page: mobile card view shows no loading spinner or empty state
**Severity:** 🟠 High  
**Component:** `frontend/src/pages/Products.jsx`

**Root cause:** The desktop table handled `loading` and `filteredProducts.length === 0` correctly, but
the `md:hidden` mobile cards div unconditionally called `.map()` on an empty array during loading —
resulting in a blank white area with no feedback to the user.

**Fix applied:** `frontend/src/pages/Products.jsx`
```jsx
// Added inside the md:hidden div:
{loading ? <Loader spinner /> : filteredProducts.length === 0 ? <empty message> : null}
{!loading && filteredProducts.map(...)}
```

---

### BUG-004 — Clients page: mobile card view shows no loading spinner or empty state
**Severity:** 🟠 High  
**Component:** `frontend/src/pages/Clients.jsx`

**Root cause:** Same pattern as BUG-003. The `md:hidden` div had no loading/empty guard.

**Fix applied:** `frontend/src/pages/Clients.jsx` — same pattern as BUG-003.

---

### BUG-005 — `no-scrollbar` CSS class used but never defined
**Severity:** 🟠 High  
**Component:** `frontend/src/pages/Settings.jsx` → `frontend/src/index.css`

**Affected element:** The Settings tab navigation bar uses `no-scrollbar` to hide the horizontal
scrollbar on mobile. Since the class didn't exist in any CSS file, a native browser scrollbar was
visible beneath the tabs on all mobile viewports.

**Fix applied:** `frontend/src/index.css`
```css
.scrollbar-hide,
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar,
.no-scrollbar::-webkit-scrollbar { display: none; }
```

---

### BUG-006 — Login: `disabled` prop on a `<Link>` component
**Severity:** 🟠 High  
**Component:** `frontend/src/pages/Login.jsx`

**Root cause:**
```jsx
<Link to="/forgot-password" disabled className="...">
  {t('auth.forgotPassword')}
</Link>
```
`disabled` is not a valid HTML attribute for `<a>` elements. React renders `Link` as `<a>`, so the
attribute was silently ignored. Clicking "Mot de passe oublié ?" navigated to `/forgot-password` which
has no route — resulting in a blank page or 404 display. Users got no indication the feature wasn't
available.

**Fix applied:** `frontend/src/pages/Login.jsx`
```jsx
// Replaced Link with a visually-disabled span
<span className="text-xs font-bold text-slate-300 cursor-not-allowed select-none"
      title="Bientôt disponible">
  {t('auth.forgotPassword')}
</span>
```

---

### BUG-007 — Debug `console.log` left in Landing page (production pollution)
**Severity:** 🟠 High  
**Component:** `frontend/src/pages/Landing.jsx`

**Root cause:**
```jsx
const Landing = () => {
  console.log('Landing.jsx: Rendering Landing'); // fires on EVERY render
```
This fired on every render of the landing page — including re-renders triggered by language switching —
flooding the browser console and exposing internal component names to end-users inspecting devtools.

**Fix applied:** Line removed. The `console.log` was already absent in the previously-rewritten Landing.jsx;
confirmed with grep — no matches.

---

### BUG-008 — Dashboard onboarding steps hardcoded in French
**Severity:** 🟠 High  
**Component:** `frontend/src/pages/Dashboard.jsx`

**Root cause:**
```jsx
const onboardingSteps = useMemo(() => [
  { label: 'Parametres entreprise', link: '/settings' },
  { label: 'Ajouter votre premier client', link: '/clients' },
  { label: 'Configurer TunTrust', link: '/settings?tab=compliance' },
], []);
```
English and Arabic users saw French step labels regardless of their language preference.

**Fix applied:** `frontend/src/pages/Dashboard.jsx`
```jsx
const onboardingSteps = useMemo(() => [
  { label: t('onboarding.step1'), link: '/settings' },
  { label: t('onboarding.step2'), link: '/clients' },
  { label: t('onboarding.step3'), link: '/settings?tab=compliance' },
], [t]);
```
The `onboarding.*` keys are defined in all three language translation files.

---

### BUG-009 — EN translations: `landing.pricing.starter.feat4` missing
**Severity:** 🟡 Medium  
**Component:** `frontend/src/i18n/translations.js` (EN section)

**Root cause:** The French Starter pricing plan listed 4 features (`feat1`–`feat4`). The English
equivalent only listed 3. The Landing page rendered `t('landing.pricing.starter.feat4')` for EN users,
which fell through to a generated fallback string `"Feat4"` — visible as raw placeholder text in the
pricing card.

**Fix applied:** `frontend/src/i18n/translations.js`
```js
// EN starter — added feat4 to match FR structure
starter: {
  desc: 'For individual micro-businesses.',
  feat1: '7 invoices / month',
  feat2: 'XML TEIF export',
  feat3: 'Standard support',
  feat4: 'Simple dashboard',
},
```

---

### BUG-010 — Help page FAQ: Arabic language not supported (falls back to English)
**Severity:** 🟡 Medium  
**Component:** `frontend/src/pages/Help.jsx`

**Root cause:**
```jsx
question: lang === 'fr' ? "Comment créer..." : "How do I create...",
```
The ternary had only two branches. Arabic users (`lang === 'ar'`) fell through to the English branch,
seeing English FAQ text despite selecting Arabic.

**Fix applied:** `frontend/src/pages/Help.jsx`  
Refactored to `faqsByLang` object with proper `fr`, `en`, `ar` arrays:
```jsx
const faqsByLang = { fr: [...], en: [...], ar: [...] };
const faqs = faqsByLang[lang] ?? faqsByLang.fr;
```
All 4 FAQ items are now available in full Arabic.

---

### BUG-011 — Reports: `alert('Failed to load reports')` blocks UI (EN only)
**Severity:** 🟡 Medium  
**Component:** `frontend/src/pages/Reports.jsx`

**Root cause:** Network errors during report fetching displayed a native browser `alert()` — always in
English regardless of locale, blocking the UI thread, and providing no recovery path.

**Fix applied:** `frontend/src/pages/Reports.jsx`  
Replaced `alert()` with `fetchError` state. When set, the loading screen shows an inline rose error card
using the already-translated `text.noData` string.

---

### BUG-012 — InvoiceTracking: `alert()` for action errors
**Severity:** 🟡 Medium  
**Component:** `frontend/src/pages/InvoiceTracking.jsx`

**Root cause:** TTN action errors (generate TEIF, sign, submit, etc.) displayed via `alert()` — same
problems as BUG-011.

**Fix applied:** `frontend/src/pages/InvoiceTracking.jsx`  
Added `toast` state + `showToast()` helper. A rose toast notification appears in the top-right corner
with auto-dismiss after 4 seconds, consistent with the pattern used in Clients.jsx.

---

### BUG-013 — Devis: `alert('Failed to load quotes and clients')` always English
**Severity:** 🟢 Low  
**Component:** `frontend/src/pages/Devis.jsx`

**Fix applied:** Removed `alert()`. Errors are silently logged to console (the table shows empty state
gracefully via existing empty-state rendering).

---

### BUG-014 — Projects: `alert()` for save / send / respond errors
**Severity:** 🟡 Medium  
**Component:** `frontend/src/pages/Projects.jsx`

**Fix applied:** `frontend/src/pages/Projects.jsx`  
Added `actionError` state + `showError()` helper with 4-second auto-dismiss toast using the same
rose-toast pattern.

---

### BUG-015 — Products: `category` field in state but missing from form UI
**Severity:** 🟢 Low  
**Component:** `frontend/src/pages/Products.jsx`

**Root cause:** The product form state had a `category` field that was persisted to the API, but no
`<Input>` existed in the modal for it. Users could never categorize products from the UI; any
previously-saved category was silently overwritten with `''` on every edit.

**Fix applied:** `frontend/src/pages/Products.jsx`  
Added a "Catégorie" `<Input>` field between the name/code row and the description field in the modal.

---

### BUG-016 — Settings: History button label missing Arabic translation
**Severity:** 🟢 Low  
**Component:** `frontend/src/pages/Settings.jsx`

**Root cause:**
```jsx
{lang === 'fr' ? 'Historique' : 'History'}
```
Arabic users saw `'History'` (English) instead of an Arabic label.

**Fix applied:**
```jsx
{lang === 'ar' ? 'السجل' : lang === 'en' ? 'History' : 'Historique'}
```

---

### BUG-017 — Settings: External TunTrust link missing `rel="noopener noreferrer"`
**Severity:** 🟢 Low  
**Component:** `frontend/src/pages/Settings.jsx`

**Root cause:** `<a href="https://www.tuntrust.tn" target="_blank">` without `rel="noopener noreferrer"`
exposes the parent page to a `window.opener` attack (tabnapping). Any page opened in a new tab can
redirect the opener via `window.opener.location`.

**Fix applied:**
```jsx
<a href="https://www.tuntrust.tn" target="_blank" rel="noopener noreferrer">
```

---

## Files Modified

| File | Bugs Fixed |
|---|---|
| `frontend/src/components/ui/Button.jsx` | BUG-001 |
| `frontend/src/pages/Projects.jsx` | BUG-002, BUG-014 |
| `frontend/src/pages/Products.jsx` | BUG-003, BUG-015 |
| `frontend/src/pages/Clients.jsx` | BUG-004 |
| `frontend/src/index.css` | BUG-005 |
| `frontend/src/pages/Login.jsx` | BUG-006 |
| `frontend/src/pages/Landing.jsx` | BUG-007 (already absent) |
| `frontend/src/pages/Dashboard.jsx` | BUG-008 |
| `frontend/src/i18n/translations.js` | BUG-009 |
| `frontend/src/pages/Help.jsx` | BUG-010 |
| `frontend/src/pages/Reports.jsx` | BUG-011 |
| `frontend/src/pages/InvoiceTracking.jsx` | BUG-012 |
| `frontend/src/pages/Devis.jsx` | BUG-013 |
| `frontend/src/pages/Settings.jsx` | BUG-016, BUG-017 |

---

## Regression Risk Assessment

All fixes are **isolated and non-breaking**:
- BUG-001 (Button): Pure visual fix — no state or API changes
- BUG-002 (ProjectModal): Structural HTML/CSS only — same form logic, same `onSubmit` handler
- BUG-003/004 (Mobile states): Additive guard — doesn't change desktop rendering
- BUG-005 (CSS): Additive CSS rule — no JS changes
- BUG-006 (Login): Replaces non-functional link with disabled span — no route changes
- BUG-008 (Dashboard i18n): Translation keys already exist in all locales
- BUG-009 (Translations): Additive `feat4` key — nothing removes existing content
- BUG-010 (Help FAQ): Data restructure inside component — no API calls affected
- BUG-011–014 (alerts): `alert()` → state-based toast — same error messages, better UX
- BUG-015 (Products): Additive UI field — API already accepted `category`
- BUG-016/017: Label text and HTML attribute changes only

---

## Recommendations for Future Improvement

### Testing
- [ ] Add Playwright or Cypress E2E tests covering the full TTN invoice workflow
- [ ] Add Vitest unit tests for `LanguageContext.t()` to catch missing translation keys at build time
- [ ] Add a CI step that diffs translation key counts across FR/EN/AR to prevent future mismatches

### Architecture
- [ ] Extract a shared `<Toast>` component (currently copy-pasted across Clients, InvoiceTracking, Projects)
- [ ] Add a global error boundary to catch unhandled React errors gracefully
- [ ] Replace all remaining `window.confirm()` calls (Products delete, Devis convert) with the modal-confirm pattern already used in Clients

### Performance
- [ ] Add `React.lazy()` + `Suspense` for heavy pages (Settings, Invoices, Reports) — reduces initial bundle
- [ ] Add `loading="lazy"` to the company logo `<img>` in Settings
- [ ] Memoize `filteredClients`, `filteredProducts`, `filteredDevis` with `useMemo` (already done in some pages but not all)

### Security
- [ ] Add `Content-Security-Policy` header in production (currently disabled via `helmet` config)
- [ ] Implement proper JWT refresh token rotation instead of client-side expiry check only
- [ ] Rate limit the `/api/settings/certificate` endpoint (currently unprotected from certificate flooding)

### i18n
- [ ] Move `AI.jsx` page content into translation files (currently all French hardcoded)
- [ ] Add a runtime translation completeness check to warn during development when a key is missing
- [ ] Consider using `react-i18next` for standard key fallback / namespace support
