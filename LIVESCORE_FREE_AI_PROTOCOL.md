# livescorefree.online AI Governance Protocol

This document defines the architectural and stylistic guardrails for **livescorefree.online** to ensure consistency when being managed by multiple AI agents.

## 1. The Kinetic Mission
All agents must prioritize **"The Stadium Spectacle"** — a visceral, high-energy sports experience.
- **Goal**: Scores and match clocks must feel alive (Kinetic).
- **Execution**: Use directed DOM patching in `app.js` and `api.js` to avoid page flickering.

## 2. Multi-Agent Architecture
The codebase is decoupled into specialized modules to allow concurrent agent contributions:
- **`state.js` (The Ground Truth)**: Persistent application state.
- **`api.js` (The Data Agent)**: Responsible for fetches and real-time syncing.
- **`ui-pages.js` (The Layout Agent)**: Owns the "Stadium" screen structures.
- **`ui-matches.js` (The Component Agent)**: Owns atomic UI tokens (Match Tickets, Badges).

## 3. The Brutalist Design Tokens
Strict adherence to these CSS rules is required to maintain the brand:
- **Border Radius**: Always `0px !important`.
- **Typography**: `Lexend` (Athletic/Headlines), `Work Sans` (Editorial/Body).
- **Primary Color**: `#ae131a` (Match Intensity Red).
- **No Borders**: Use surface tonal shifts (Depth) for separation instead of 1px lines.

## 4. Real-Time Synchronization Rules
- **Match Loop**: 15-second refresh cycle.
- **Kinetic Ticker**: 1-second client-side increment for live clocks.
- **Newsroom**: 5-minute headline refresh.
- **Standings**: 15-minute background table update.

## 5. Automated Execution
Run the following to start the local broadcast:
```powershell
npm start
```
Or use the validation suite for CI/CD checks:
```powershell
npm run validate
```

---
*Created by Antigravity AI Agent for livescorefree.online.*
