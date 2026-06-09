# 🌍 EcoTrack — Carbon Footprint Awareness Platform

A highly interactive, single-file web app that helps users calculate their personal carbon footprint and take action to reduce their environmental impact.

> Built for **Hack2Skill × Google for Developers Challenge — Carbon Footprint Awareness Platform**

---

## 🚀 Live Demo

Just open `index.html` in any modern browser — no installation, no build step, no server needed.

---

## ✨ Features

- 🎚️ **Live Sliders** — footprint updates in real-time as you adjust inputs
- 🃏 **Card Selectors** — pick car type, diet, energy source with one click
- 📊 **Dual Charts** — doughnut breakdown + monthly bar chart (Chart.js)
- 🌍 **World Comparison** — see how you stack up vs India, Global, USA, EU averages
- 🔢 **Animated Results** — number count-up animation on reveal
- ⏱️ **Live Hero Counters** — real-time global CO₂ ticker
- ✅ **Clickable Tips** — 13 actionable tips you can save as goals
- 🌱 **Green Pledge Section** — commit to eco-friendly actions
- 🔔 **Toast Notifications** — feedback on every interaction
- 🎨 **Floating Particle Background** — ambient visual atmosphere
- ♿ **Accessible** — ARIA labels, keyboard nav, focus rings, reduced motion support
- 📱 **Fully Responsive** — works on mobile, tablet, and desktop

---

## 📁 Project Structure

```
carbon-footprint-platform/
├── index.html    ← Entire app (HTML + CSS + JS in one file)
└── README.md
```

Everything — styles, logic, charts — lives in `index.html`. No dependencies to install.

---

## 🧮 Emission Factors

Calculations are based on:
- **IPCC AR6** — transport and food emission factors
- **Central Electricity Authority (CEA) 2023** — Indian grid emission factor (0.82 kg CO₂/kWh)
- **GHG Protocol** — shopping and home energy

---

## 🛠 Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Structure & semantics |
| CSS3 | Design, animations, layout |
| Vanilla JavaScript (ES6+) | Calculator logic, interactivity |
| [Chart.js 4.4](https://www.chartjs.org/) | Data visualizations |
| [Google Fonts](https://fonts.google.com/) | Space Grotesk + Inter typography |

---

## 📊 Scoring System

| Grade | Annual Footprint |
|---|---|
| 🌟 A+ | < 1.5t CO₂e |
| ✅ A  | 1.5 – 2.5t |
| 👍 B  | 2.5 – 3.5t |
| ⚠️ C  | 3.5 – 5t   |
| 🔴 D  | 5 – 8t     |
| 🚨 F  | > 8t       |

---

## ♿ Accessibility

- Skip navigation link
- Semantic HTML5 landmarks (`main`, `nav`, `footer`)
- ARIA roles and live regions
- Full keyboard navigation
- Visible focus indicators
- `prefers-reduced-motion` support

---

## 📄 License

MIT License — free to use, modify, and distribute.
