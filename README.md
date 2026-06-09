# 🌍 EcoTrack — Carbon Footprint Awareness Platform

A clean, accessible web app that helps users calculate their personal carbon footprint and discover actionable ways to reduce their environmental impact.

## 🚀 Live Demo

Open `index.html` in any modern browser — no build step or server required.

## ✨ Features

- **Carbon Footprint Calculator** — covers Transport, Home Energy, Diet, and Shopping
- **Visual Breakdown Chart** — interactive doughnut chart powered by Chart.js
- **Impact Score** — graded A+ to F with personalised feedback
- **Comparison Bars** — compare your footprint against India avg, global avg, and 2050 target
- **13 Actionable Tips** — filterable by category with real CO₂ savings
- **Fully Accessible** — WCAG 2.1 AA compliant (skip links, ARIA labels, keyboard navigation, focus rings, reduced motion support)
- **Responsive** — works on mobile, tablet, and desktop
- **No dependencies to install** — pure HTML, CSS, and vanilla JavaScript

## 📁 Project Structure

```
carbon-footprint-platform/
├── index.html          # Main app entry point
├── css/
│   └── style.css       # All styles (design tokens, layout, components)
├── js/
│   └── app.js          # Calculator logic, chart rendering, event handlers
└── README.md
```

## 🧮 Emission Factors

Emission factors are based on:
- **IPCC AR6** (transport, food)
- **Central Electricity Authority (CEA) 2023** — Indian grid emission factor
- **GHG Protocol** (shopping, home energy)

## ♿ Accessibility

- Skip navigation link
- Semantic HTML5 landmarks
- ARIA roles, labels, and live regions
- Full keyboard navigation with visible focus indicators
- Reduced motion support via `prefers-reduced-motion`
- Colour contrast ratio ≥ 4.5:1

## 🛠 Tech Stack

- HTML5
- CSS3 (custom properties, grid, flexbox)
- Vanilla JavaScript (ES6+, strict mode)
- [Chart.js 4.4](https://www.chartjs.org/) — for the doughnut chart
- [Google Fonts](https://fonts.google.com/) — Space Grotesk + Inter

## 📊 Scoring Criteria

| Grade | Footprint |
|-------|-----------|
| A+    | < 1.5t CO₂e/year |
| A     | 1.5–2.5t |
| B     | 2.5–3.5t |
| C     | 3.5–5t   |
| D     | 5–8t     |
| F     | > 8t     |

## 🌱 Contributing

Pull requests welcome! To contribute:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT License — free to use, modify, and distribute.

---

*Built for the Hack2Skill × Google for Developers Challenge — Carbon Footprint Awareness Platform*
ng README (1).md…]()
