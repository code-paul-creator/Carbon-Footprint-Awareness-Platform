# 🌍 EcoTrack — Carbon Footprint Awareness Platform

[![Tests](https://img.shields.io/badge/tests-94%20passing-4ade80?style=flat-square&logo=jest)](#-testing)
[![Accessibility](https://img.shields.io/badge/WCAG-2.1%20AA-4ade80?style=flat-square)](#-accessibility)
[![Security](https://img.shields.io/badge/security-CSP%20%7C%20XSS%20protected-4ade80?style=flat-square)](#-security)
[![Code Quality](https://img.shields.io/badge/code-JSDoc%20%7C%20strict%20mode-4ade80?style=flat-square)](#-code-quality)
[![License](https://img.shields.io/badge/license-MIT-60a5fa?style=flat-square)](LICENSE)

> **Hack2Skill × Google for Developers — Challenge 3: Carbon Footprint Awareness Platform**

A highly interactive, accessible, security-hardened, and comprehensively tested single-page web application that helps users calculate their personal carbon footprint across four major lifestyle categories and take concrete, data-backed steps to reduce their environmental impact.

---

## 🚀 Live Demo

🌐 **[View Live →](https://code-paul-creator.github.io/Carbon-Footprint-Awareness-Platform/)**

Open `index.html` in any modern browser — no build step, no server, no installation required.

---

## 🎯 Problem Statement Alignment

Climate change is the defining challenge of our generation. The core problems EcoTrack solves:

| Problem | EcoTrack Solution |
|---------|-------------------|
| People underestimate their footprint by 2–3× | Real-time live calculator with accurate IPCC-sourced emission factors |
| No visibility into which category impacts most | Visual doughnut & bar charts breaking down all 4 categories |
| No personalised action guidance | 13 filterable tips with CO₂ savings, plus a pledge system |
| Abstract global problem feels distant | World comparison vs India, Global, USA, EU averages |

---

## ✨ Features

### 🧮 Interactive Calculator
- **Live sliders** — footprint updates in real-time with every input change
- **Visual card selectors** — pick car type, diet, energy source by clicking cards
- **4-step guided wizard** — Transport → Home Energy → Diet → Shopping
- **Sticky live preview bar** — running total always visible while filling in steps
- **Step progress indicator** — visual stepper with done/active/pending states

### 📊 Rich Results Dashboard
- **Animated count-up** — total footprint animates into view on reveal
- **Grade A+ to F** — with personalised feedback message and colour coding
- **4 category breakdown cards** — with proportional fill bars
- **Doughnut chart** — visual share of each category (Chart.js)
- **Monthly bar chart** — simulated monthly footprint breakdown
- **World comparison panel** — vs India avg (1.9t), Global avg (4t), USA (14.5t), EU (6.4t), 2050 target (2t)

### 💡 Actionable Tips
- 13 high-impact tips across all 4 categories
- Filterable by category (Transport / Home / Diet / Shopping)
- Clickable to save as personal goals — with toast confirmation

### 🌱 Green Pledge System
- 10 concrete eco-pledges users can commit to
- Live session pledge counter

### 🎨 UX & Design
- Deep forest dark theme with CSS custom properties
- Floating particle background animation
- Toast notifications on every meaningful interaction
- Live CO₂ global counter in hero section
- Fully responsive (mobile, tablet, desktop)

---

## 🧪 Testing

**94 automated tests** across 10 test suites — runnable in both Node.js and the browser.

### Run Tests

```bash
# Node.js (no install needed)
node tests/calculator.test.js

# Browser
open tests/index.html
```

### Test Suites & Coverage

| Suite | Tests | What It Covers |
|-------|-------|----------------|
| `sanitizeInput()` | 13 | NaN, null, undefined, Infinity, clamping, parsing |
| `safeLookup()` | 6 | null/undefined objects, missing keys, prototype safety |
| `round()` | 6 | Decimal places, zero, negatives |
| `calculateTransport()` | 13 | All fuel types, flights, public transport, combined |
| `calculateHome()` | 9 | Energy sources, household scaling, LPG, edge cases |
| `calculateFood()` | 6 | All diet types, waste & local multipliers, ordering |
| `calculateShopping()` | 7 | All categories, formula correctness, summation |
| `getGrade()` | 15 | All grade boundaries, types, colors, messages |
| `calculateTotalFootprint()` | 9 | Integration, sanitization, field completeness |
| Emission Factors Integrity | 10 | Immutability, data ordering, boundary coverage |
| **Total** | **94** | **All passing ✅** |

### Sample Tests

```javascript
// Validates correct formula derivation
test('petrol 100km/week annual emission', () => {
  const result = calculateTransport({ carKmPerWeek: 100, carType: 'petrol' });
  expect(result).toBeCloseTo((100 * 52 * 0.21) / 1000, 3); // ✅ 1.092t
});

// Validates immutability of constants
test('mutation of EMISSION_FACTORS silently fails (frozen)', () => {
  const before = EMISSION_FACTORS.transport.carPerKm.petrol;
  try { EMISSION_FACTORS.transport.carPerKm.petrol = 99; } catch (_) {}
  expect(EMISSION_FACTORS.transport.carPerKm.petrol).toBe(before); // ✅
});

// Validates prototype pollution prevention
test('does not access prototype properties', () => {
  expect(safeLookup({}, 'toString', 7)).toBe(7); // ✅
});
```

---

## 🔒 Security

| Measure | Implementation |
|---------|---------------|
| **Content Security Policy** | Strict CSP meta header — blocks XSS & injection |
| **X-Content-Type-Options** | `nosniff` — prevents MIME-type sniffing attacks |
| **X-Frame-Options** | `SAMEORIGIN` — prevents clickjacking |
| **Referrer Policy** | `strict-origin-when-cross-origin` |
| **Permissions Policy** | Explicitly disables geolocation, microphone, camera |
| **Immutable constants** | `Object.freeze()` on all emission factor objects |
| **Prototype pollution guard** | `hasOwnProperty` check in `safeLookup()` |
| **Strict mode** | `'use strict'` enforced in all JavaScript modules |
| **Input sanitization** | `sanitizeInput()` clamps all numeric inputs to valid range |
| **Zero data exfiltration** | `connect-src: none` in CSP — no external requests |
| **No `eval()` / `innerHTML`** | All DOM updates use `textContent` or safe methods |

---

## ⚡ Efficiency

| Technique | Detail |
|-----------|--------|
| **Separated concerns** | `js/calculator.js` is a pure logic module with no DOM access |
| **Pure functions** | All calculations are deterministic with no side effects |
| **Frozen constants** | `EMISSION_FACTORS` allocated once at startup, never re-created |
| **`requestAnimationFrame`** | Smooth animations without blocking the main thread |
| **Batched DOM writes** | All results rendered in one pass — no layout thrashing |
| **CDN-loaded Chart.js** | Served from edge, cached across sessions |
| **No build toolchain** | Zero compilation overhead — ships as-written |
| **Total bundle** | < 100 KB uncompressed |

---

## 📐 Code Quality

- **JSDoc** — every public function documented with `@param`, `@returns`, `@example`, and `@see`
- **`'use strict'`** — enforced in all modules
- **Named constants** — `KG_PER_TONNE`, `WEEKS_PER_YEAR`, `MONTHS_PER_YEAR`, `MIN_HOUSEHOLD`
- **Single Responsibility Principle** — calculator logic cleanly separated from UI logic
- **Defensive defaults** — all function parameters have explicit, safe default values
- **Grade thresholds as data** — `GRADE_THRESHOLDS` array eliminates nested `if-else` chains
- **Dual export pattern** — works in both Node.js (`module.exports`) and browser (`window.EcoTrack`)
- **ES6+** — destructuring, arrow functions, template literals, `const`/`let`, `Object.freeze()`

---

## ♿ Accessibility

- Skip-to-content link for keyboard users
- Semantic HTML5 landmarks (`<main>`, `<nav>`, `<footer>`, `<section>`, `<article>`)
- ARIA roles, `aria-label`, `aria-live` on all dynamic result regions
- Full keyboard navigation — all interactive elements reachable via Tab
- Visible focus rings on every interactive element
- `prefers-reduced-motion` media query respected — all animations disabled when set
- Colour contrast ratio ≥ 4.5:1 throughout (WCAG 2.1 AA)
- All charts include `aria-label` and `role="img"` for screen reader compatibility

---

## 📊 Emission Factors & Data Sources

| Category | Value | Source |
|----------|-------|--------|
| Indian grid electricity | 0.82 kg CO₂/kWh | CEA 2023 |
| Petrol car | 0.21 kg CO₂/km | IPCC AR6 WG3 |
| Short-haul flight | 0.255 kg CO₂/km (incl. RFI) | IPCC AR6 |
| Long-haul flight | 0.195 kg CO₂/km | IPCC AR6 |
| Public transport (India) | 0.089 kg CO₂/km | IPCC AR6 |
| LPG cylinder (14.2 kg) | 0.0629 t CO₂e | GHG Protocol |
| Vegan diet | 1.5 t CO₂e/year | Poore & Nemecek (2018) |
| Omnivore diet | 3.3 t CO₂e/year | Poore & Nemecek (2018) |

---

## 📁 Project Structure

```
carbon-footprint-platform/
├── index.html              # Full SPA (HTML + CSS + UI logic)
├── js/
│   └── calculator.js       # Pure calculation engine (JSDoc, frozen constants, dual export)
├── tests/
│   ├── calculator.test.js  # 94 unit, integration & boundary tests
│   └── index.html          # Browser test runner with progress bar
└── README.md               # This file
```

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| HTML5 | — | Semantic structure & accessibility |
| CSS3 | — | Design system, animations, responsive layout |
| JavaScript | ES6+ strict | Calculator engine & UI interactivity |
| [Chart.js](https://www.chartjs.org/) | 4.4.0 | Doughnut & bar chart visualizations |
| [Google Fonts](https://fonts.google.com/) | — | Space Grotesk + Inter typography |

---

## 🌐 Deployment

Deployed via **GitHub Pages** — automatically built from the `main` branch root.

```
Settings → Pages → Branch: main → / (root) → Save
```

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built with 💚 for a sustainable future · EcoTrack v3.0.0*

