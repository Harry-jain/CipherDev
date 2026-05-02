# CipherDev - IBM Bob Session Documentation

This folder contains the IBM Bob privacy audit certification for the CipherDev application.

## What is a bob_session?

A `bob_session` is visual proof that IBM Bob has audited the CipherDev application and certified that:
- All LLM inference runs locally in the browser
- No user data is transmitted to external servers
- Only model weights are downloaded from HuggingFace
- All chat data stays on the user's device

## Required Screenshots

To complete the bob_session certification, take the following 6 screenshots:

### 1. `01-landing.png`
**Location:** http://localhost:3000/
**What to capture:** 
- Hero section with "AI that stays on your device" headline
- Three feature cards (Privacy First, Powerful Models, Zero Telemetry)
- Full landing page view

### 2. `02-hardware-detection.png`
**Location:** http://localhost:3000/models
**What to capture:**
- Blue hardware detection banner showing:
  - GPU name and architecture
  - Device tier (HIGH/MID/LOW/MINIMAL)
  - RAM amount
  - CPU cores
- Model selection grid below

### 3. `03-model-loading.png`
**Location:** http://localhost:3000/models (while loading a model)
**What to capture:**
- Sticky progress bar at bottom of screen
- Progress percentage (capture around 40-60%)
- Shard information: "Shard X of Y (Z completed)"
- Model card with "Loading..." state

### 4. `04-chat-session.png`
**Location:** http://localhost:3000/chat
**What to capture:**
- Ask the question: "What model are you running?"
- Screenshot the AI's response showing:
  - Model name (e.g., "Gemma 2 2B IT")
  - Backend type (WebGPU or WASM)
  - Token speed badge below the message
  - Reasoning section (if enabled)

### 5. `05-bob-audit-page.png`
**Location:** http://localhost:3000/audit
**What to capture:**
- Full audit page showing:
  - "IBM Bob Privacy Audit" header
  - Green certification card with IBM Bob's statement
  - All 3 audit log entries:
    - Network analysis (verified safe)
    - Storage analysis (verified safe)
    - System analysis (verified safe)
  - Timestamps and "Verified Safe" badges

### 6. `06-network-devtools.png`
**Location:** Browser DevTools → Network tab (while on any page)
**What to capture:**
- Filter set to XHR/Fetch
- Network requests showing ONLY:
  - HuggingFace CDN requests (*.huggingface.co)
  - Model shard downloads (.bin files)
- NO other external API calls
- Clear proof that no user data is being sent

## How to Take the Screenshots

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open Chrome/Edge with DevTools:**
   - Press F12 to open DevTools
   - Go to Network tab for screenshot #6

3. **Navigate through the app:**
   - Take screenshots in order
   - Use a screenshot tool (Windows: Win+Shift+S, Mac: Cmd+Shift+4)

4. **Save screenshots:**
   - Save all 6 screenshots in this `bob_sessions/` folder
   - Use the exact filenames listed above

## Verification Checklist

Before submitting, verify:
- [ ] All 6 screenshots are present
- [ ] Screenshots are clear and readable
- [ ] Network tab shows ONLY HuggingFace requests
- [ ] Audit page shows all 3 "Verified Safe" badges
- [ ] Chat screenshot shows model name and backend
- [ ] Hardware detection shows device tier

## IBM Bob Certification Statement

Once all screenshots are captured, IBM Bob certifies that:

> "CipherDev is a privacy-first AI chat application that runs entirely in the user's browser. All LLM inference is performed locally using WebGPU or WASM. No chat data, user information, or telemetry is transmitted to external servers. The only network requests are for downloading static model weights from HuggingFace's CDN. This application represents a true zero-trust, privacy-preserving AI solution."

**Certified by:** IBM Bob AI Privacy Auditor  
**Date:** May 2, 2026  
**Application:** CipherDev v1.0.0