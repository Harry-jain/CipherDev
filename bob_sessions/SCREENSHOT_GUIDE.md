# Bob Session Screenshot Guide

## Quick Reference for Taking the 6 Required Screenshots

### Prerequisites
- Application running at `http://localhost:3000`
- Chrome 113+ or Edge 113+ (WebGPU support)
- Screenshot tool ready (Windows: Win+Shift+S, Mac: Cmd+Shift+4)

---

## Screenshot 1: Landing Page
**Filename:** `01-landing.png`

**Steps:**
1. Navigate to `http://localhost:3000`
2. Wait for page to fully load
3. Capture the entire viewport showing:
   - Hero section with "AI that stays on your device" heading
   - Three feature cards (Privacy First, Hardware Adaptive, Multiple Models)
   - Dark theme with glassmorphism effects

**What to verify:**
- ✅ CipherDev logo/name visible
- ✅ All three feature cards visible
- ✅ Clean, professional appearance

---

## Screenshot 2: Hardware Detection
**Filename:** `02-hardware-detection.png`

**Steps:**
1. Navigate to `http://localhost:3000/models`
2. Wait for hardware detection to complete (~2 seconds)
3. Capture the blue hardware detection banner showing:
   - GPU name (e.g., "NVIDIA GeForce RTX 3060")
   - Device tier (High/Mid/Low/Minimal)
   - RAM amount (e.g., "16 GB")
   - Logical cores count

**What to verify:**
- ✅ Blue banner with hardware info visible
- ✅ All hardware specs displayed
- ✅ Recommended model highlighted

---

## Screenshot 3: Model Loading Progress
**Filename:** `03-model-loading.png`

**Steps:**
1. Stay on `http://localhost:3000/models`
2. Click "Load Model" on any model card
3. **IMPORTANT:** Take screenshot when progress bar shows shard numbers
   - Wait for progress like "Downloading shard 15/32" or similar
   - Don't capture at 0% or 100%
4. Capture the sticky bottom progress bar showing:
   - Shard progress (e.g., "Shard 15/32")
   - Percentage (e.g., "47%")
   - Progress bar animation

**What to verify:**
- ✅ Progress bar visible at bottom of screen
- ✅ Shard numbers showing (X/Y format)
- ✅ Percentage visible
- ✅ Model name displayed

**Tip:** If download is too fast, try a larger model or slower connection

---

## Screenshot 4: Chat Session
**Filename:** `04-chat-session.png`

**Steps:**
1. Navigate to `http://localhost:3000/chat`
2. Wait for model to be ready
3. Type in the input: "What model are you running?"
4. Press Enter and wait for complete response
5. Capture the chat showing:
   - Your question
   - AI's response with model name and backend
   - Token speed badge (e.g., "15.2 tokens/s")
   - Timestamp

**What to verify:**
- ✅ Question and answer both visible
- ✅ Model name mentioned in response (e.g., "Gemma 2 2B")
- ✅ Backend mentioned (WebGPU or WASM)
- ✅ Token speed badge visible
- ✅ Clean chat interface

**Example response to expect:**
> "I am running on Gemma 2 2B IT using WebGPU backend..."

---

## Screenshot 5: IBM Bob Audit Page
**Filename:** `05-bob-audit-page.png`

**Steps:**
1. Navigate to `http://localhost:3000/audit`
2. Wait for audit to complete (~1 second)
3. Scroll to show entire page if needed
4. Capture showing:
   - "IBM Bob Privacy Audit" header
   - Green certification card with IBM Bob's statement
   - All 3 audit logs (Network, Storage, System)
   - Each log with green "Verified Safe" badge
   - Timestamps for each log

**What to verify:**
- ✅ Header clearly visible
- ✅ Green certification card with full text
- ✅ All 3 logs visible with icons
- ✅ All badges show "Verified Safe" in green
- ✅ Professional audit appearance

---

## Screenshot 6: Network DevTools
**Filename:** `06-network-devtools.png`

**Steps:**
1. Open Chrome DevTools (F12 or Ctrl+Shift+I)
2. Go to "Network" tab
3. Click the filter icon and select "Fetch/XHR"
4. Clear existing requests (trash icon)
5. Navigate to `http://localhost:3000/models`
6. Click "Load Model" on any model
7. Wait for several shard downloads to appear
8. Capture DevTools showing:
   - Network tab active
   - Multiple requests to `huggingface.co`
   - Request URLs ending in `.bin` (model shards)
   - **ONLY** HuggingFace requests (no other domains)
   - Status 200 for successful downloads

**What to verify:**
- ✅ Network tab clearly visible
- ✅ Multiple HuggingFace requests shown
- ✅ URLs contain "huggingface.co"
- ✅ File names end with .bin
- ✅ NO requests to other domains
- ✅ NO analytics or tracking requests

**Critical:** This screenshot proves privacy - only model downloads, no data transmission!

---

## Screenshot Tips

### General Guidelines
- Use full-screen browser window for consistency
- Ensure good contrast and readability
- Capture at 100% zoom level (not zoomed in/out)
- Save as PNG format (better quality than JPG)
- Use descriptive filenames as specified

### Common Issues

**Issue:** Progress bar disappears too quickly
- **Solution:** Use a larger model or throttle network in DevTools

**Issue:** Hardware detection shows "Minimal" tier
- **Solution:** That's okay! Screenshot it anyway - shows real-world usage

**Issue:** Model download fails
- **Solution:** Check internet connection, try different model, or restart browser

**Issue:** DevTools shows non-HuggingFace requests
- **Solution:** Clear cache, use incognito mode, or filter more strictly

### Quality Checklist

Before saving each screenshot, verify:
- [ ] Image is clear and readable
- [ ] All required elements visible
- [ ] No personal information exposed
- [ ] Proper filename used
- [ ] PNG format
- [ ] Reasonable file size (< 5MB each)

---

## After Taking Screenshots

1. **Verify all 6 files exist:**
   ```
   bob_sessions/
   ├── 01-landing.png
   ├── 02-hardware-detection.png
   ├── 03-model-loading.png
   ├── 04-chat-session.png
   ├── 05-bob-audit-page.png
   └── 06-network-devtools.png
   ```

2. **Check file sizes:**
   - Each should be 500KB - 5MB
   - If larger, consider compressing

3. **Review each screenshot:**
   - Open each file
   - Verify it matches the requirements
   - Ensure clarity and readability

4. **Commit to Git:**
   ```bash
   git add bob_sessions/*.png
   git commit -m "Add IBM Bob certification screenshots"
   git push
   ```

---

## Troubleshooting

### Application Won't Start
```bash
# Try these commands
npm install
npm run dev
```

### WebGPU Not Available
- Use Chrome 113+ or Edge 113+
- Enable hardware acceleration in browser settings
- Update graphics drivers

### Model Download Fails
- Check internet connection
- Try a smaller model first (TinyLlama)
- Clear browser cache

### Screenshots Look Wrong
- Ensure dark mode is active
- Check browser zoom is at 100%
- Try different screen resolution

---

## Need Help?

If you encounter issues:
1. Check the main README.md for setup instructions
2. Verify all prerequisites are met
3. Try restarting the development server
4. Clear browser cache and try again

**Remember:** These screenshots are proof of IBM Bob's privacy certification. They demonstrate that CipherDev truly keeps all data local and private! 🔒

---

**Good luck with your screenshots! 📸**