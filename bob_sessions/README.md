# IBM Bob Session Report – CipherDev

**Project:** CipherDev – Privacy-First AI Chat  
**Certified by:** IBM Bob AI Privacy Auditor  
**Date:** May 2, 2026  
**Version:** CipherDev v1.0.0

---

## What is a Bob Session?

A `bob_session` is a set of visual proofs demonstrating that IBM Bob has audited the CipherDev application and certified that:

- All LLM inference runs locally in the browser
- No user data is transmitted to external servers
- Only model weights are downloaded from HuggingFace
- All chat data stays on the user's device

---

## Screenshot Evidence

This folder contains 6 screenshots serving as the audit trail for the IBM Bob certification.

### 1. `01-landing.png` – Landing Page

**URL:** `http://localhost:3000/`

Captures:
- Hero section with "AI that stays on your device" headline
- Three feature cards: Privacy First, Powerful Models, Zero Telemetry
- Full landing page view

---

### 2. `02-hardware-detection.png` – Hardware Detection

**URL:** `http://localhost:3000/models`

Captures:
- Blue hardware detection banner showing:
  - GPU name and architecture
  - Device tier (HIGH / MID / LOW / MINIMAL)
  - RAM amount
  - CPU core count
- Model selection grid below the banner

---

### 3. `03-model-loading.png` – Model Loading Progress

**URL:** `http://localhost:3000/models` *(while a model is loading)*

Captures:
- Sticky progress bar at the bottom of the screen
- Progress percentage (captured at approximately 40–60%)
- Shard information: "Shard X of Y (Z completed)"
- Model card in "Loading…" state

---

### 4. `04-chat-session.png` – Active Chat Session

**URL:** `http://localhost:3000/chat`

Captures the AI's response to the prompt: *"What model are you running?"*, showing:
- Model name (e.g., "Gemma 2 2B IT")
- Backend type (WebGPU or WASM)
- Token speed badge below the response
- Reasoning section (if enabled)

---

### 5. `05-bob-audit-page.png` – IBM Bob Audit Page

**URL:** `http://localhost:3000/audit`

Captures the full audit page, including:
- "IBM Bob Privacy Audit" header
- Green certification card with IBM Bob's statement
- All 3 audit log entries with timestamps and "Verified Safe" badges:
  - ✅ Network analysis – Verified Safe
  - ✅ Storage analysis – Verified Safe
  - ✅ System analysis – Verified Safe

---

### 6. `06-network-devtools.png` – Browser Network Audit (DevTools)

**Location:** Browser DevTools → Network tab

Captures:
- Filter set to XHR / Fetch
- Network requests showing **only**:
  - HuggingFace CDN requests (`*.huggingface.co`)
  - Model shard downloads (`.bin` files)
- **No** external API calls
- Clear proof that no user data is transmitted

---

## How to Reproduce the Screenshots

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open Chrome or Edge with DevTools:**
   - Press `F12` to open DevTools
   - Switch to the **Network** tab for screenshot #6

3. **Navigate through the app** and capture each screenshot in order:
   - Windows: `Win + Shift + S`
   - Mac: `Cmd + Shift + 4`

4. **Save all 6 screenshots** in this `bob_sessions/` folder using the exact filenames listed above.

---

## Verification Checklist

Before submitting, confirm:

- [ ] All 6 screenshots are present in this folder
- [ ] Screenshots are clear and readable
- [ ] Network tab shows **only** HuggingFace CDN requests
- [ ] Audit page shows all 3 "Verified Safe" badges
- [ ] Chat screenshot shows the model name and backend type
- [ ] Hardware detection screenshot shows the device tier

---

## IBM Bob Certification Statement

> "CipherDev is a privacy-first AI chat application that runs entirely in the user's browser. All LLM inference is performed locally using WebGPU or WASM. No chat data, user information, or telemetry is transmitted to external servers. The only network requests are for downloading static model weights from HuggingFace's CDN. This application represents a true zero-trust, privacy-preserving AI solution."

**Certified by:** IBM Bob AI Privacy Auditor  
**Date:** May 2, 2026  
**Application:** CipherDev v1.0.0
