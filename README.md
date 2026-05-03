# CipherDev - Privacy-First AI Chat

![CipherDev Banner](https://img.shields.io/badge/Privacy-First-blue?style=for-the-badge) ![WebGPU](https://img.shields.io/badge/WebGPU-Enabled-green?style=for-the-badge) ![IBM Bob Certified](https://img.shields.io/badge/IBM%20Bob-Certified-success?style=for-the-badge)

**Run powerful AI models entirely in your browser. No servers, no API keys, no data transmission.**

CipherDev is a fully client-side AI chat application that runs Large Language Models using WebGPU or WASM. Every conversation stays on your device. IBM Bob certified for zero data transmission.

## ✨ Features

### 🔒 **100% Private**
- All LLM inference runs locally in your browser
- No backend servers for chat processing
- No API keys required
- No telemetry or analytics
- IBM Bob Privacy Audit certified

### ⚡ **Hardware Accelerated**
- WebGPU support for blazing-fast inference
- Automatic WASM fallback for compatibility
- Smart device tier detection
- Optimized model recommendations

### 🤖 **Multiple Models**
- **TinyLlama 1.1B** (650MB) - Fast, lightweight
- **Gemma 2 2B IT** (1.4GB) - Balanced performance
- **Llama 3.2 3B** (1.9GB) - High quality
- **Phi-3.5-mini** (2.2GB) - Advanced reasoning

### 🎙️ **Live Meeting Transcription** (NEW!)
- Real-time speech-to-text with Whisper AI
- Voice Activity Detection (VAD) for optimal quality
- AI-powered meeting summaries
- Export to Markdown or JSON
- 100% local processing - no audio leaves your device

### 🏥 **Health Risk Assessment**
- Real-time health/disaster risk evaluation
- Temperature, heart rate, and condition analysis
- Watsonx AI integration (optional)
- Privacy-preserving local processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Chrome 113+ or Edge 113+ (for WebGPU)
- 4GB+ RAM recommended

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chipherdev.git
cd chipherdev

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [https://devcipher.vercel.app/](https://devcipher.vercel.app/) in your browser.

### Build for Production

```bash
npm run build
npm start

**Note about Build Warnings**: During production build, you may see warnings about error pages (404/500). These are non-fatal warnings from Next.js static generation and do not affect the application functionality. All main pages build successfully.

```

## 📁 Project Structure

```
chipherdev/
├── app/                      # Next.js 14 App Router
│   ├── (app)/               # App routes with layout
│   │   ├── chat/           # Chat interface
│   │   ├── models/         # Model selection
│   │   ├── audit/          # Privacy audit
│   │   └── settings/       # Settings page
│   ├── api/                # API routes
│   │   └── check-risk/     # Health risk assessment
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── components/              # React components
│   ├── ui/                 # UI primitives
│   ├── layout/             # Layout components
│   └── check-risk/         # Risk assessment UI
├── features/                # Feature modules
│   ├── hardware/           # Device detection
│   ├── llm/                # LLM engines
│   ├── audit/              # Privacy audit
│   └── conversation/       # Export utilities
├── store/                   # Zustand state management
│   ├── slices/             # State slices
│   └── useAppStore.ts      # Combined store
├── lib/                     # Utilities
├── bob_sessions/            # Privacy proof screenshots
└── public/                  # Static assets
```

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | React 18, Tailwind CSS 3.4 |
| LLM Engine | @mlc-ai/web-llm (WebGPU) |
| Fallback | @xenova/transformers (WASM) |
| State | Zustand 5 |
| Icons | Lucide React |

## 🎯 How It Works

### 1. Hardware Detection
CipherDev automatically detects your device capabilities:
- WebGPU availability
- GPU name and memory
- RAM and CPU cores
- Device tier classification (High/Mid/Low/Minimal)

### 2. Model Loading
Models are downloaded from HuggingFace and cached locally:
- Quantized models (4-bit) for efficiency
- Progressive loading with status updates
- IndexedDB caching for instant reloads

### 3. Local Inference
All chat processing happens in your browser:
- WebGPU acceleration when available
- WASM fallback for universal support
- Streaming responses for real-time feedback
- No data ever sent to external servers

### 4. Privacy Audit
IBM Bob verifies zero data transmission:
- Network request analysis
- Storage inspection
- System verification
- Visual proof via screenshots

## 🔐 Privacy Guarantees

### What CipherDev DOES:
✅ Run AI models locally in your browser  
✅ Download model weights from HuggingFace  
✅ Store models in browser cache (IndexedDB)  
✅ Export conversations as local files  

### What CipherDev DOES NOT:
❌ Send your messages to any server  
❌ Collect analytics or telemetry  
❌ Require API keys or accounts  
❌ Track your usage  
❌ Share data with third parties  

## 📊 Performance

| Device Tier | GPU | RAM | Recommended Model | Speed |
|------------|-----|-----|-------------------|-------|
| High | WebGPU, 2GB+ VRAM | 8GB+ | Llama 3.2 3B | ~30 tokens/s |
| Mid | WebGPU | 4GB+ | Gemma 2 2B | ~20 tokens/s |
| Low | WebGPU | 4GB+ | TinyLlama 1.1B | ~15 tokens/s |
| Minimal | WASM only | 2GB+ | TinyLlama 1.1B | ~5 tokens/s |

## 🏥 Health Risk Assessment API

CipherDev includes a health/disaster risk assessment feature:

```typescript
POST /api/check-risk
{
  "age": 35,
  "location": "Mumbai",
  "healthCondition": "diabetic",
  "temperature": 38.5,
  "humidity": 80,
  "heartRate": 95
}

Response:
{
  "risk": "medium",
  "action": "medical_kit",
  "reason": "Elevated temperature with pre-existing condition"
}
```

### Optional Watsonx Integration
Set environment variables to use IBM Watsonx AI:
```bash
WATSONX_API_KEY=your_api_key
WATSONX_PROJECT_ID=your_project_id
WATSONX_URL=https://us-south.ml.cloud.ibm.com

#### How to Get Watsonx API Credentials

**Step-by-step guide:**

1. **Sign up for IBM Cloud** (if you don't have an account):
   - Visit [https://cloud.ibm.com/registration](https://cloud.ibm.com/registration)
   - Create a free IBM Cloud account

2. **Create a Watsonx.ai instance**:
   - Go to [IBM Cloud Catalog](https://cloud.ibm.com/catalog)
   - Search for "watsonx.ai"
   - Click on "watsonx.ai" service
   - Select your region (e.g., Dallas, Frankfurt, Tokyo)
   - Choose a pricing plan (Lite plan available for free)
   - Click "Create"

3. **Get your API Key**:
   - Go to [IBM Cloud API Keys](https://cloud.ibm.com/iam/apikeys)
   - Click "Create an IBM Cloud API key"
   - Give it a name (e.g., "CipherDev Watsonx Key")
   - Click "Create"
   - **Important**: Copy and save the API key immediately (you won't be able to see it again)

4. **Get your Project ID**:
   - Go to [Watsonx Projects](https://dataplatform.cloud.ibm.com/projects)
   - Create a new project or select an existing one
   - Click on the "Manage" tab
   - Copy the "Project ID" from the project details

5. **Find your Watsonx URL**:
   - Based on your region:
     - **US South (Dallas)**: `https://us-south.ml.cloud.ibm.com`
     - **EU (Frankfurt)**: `https://eu-de.ml.cloud.ibm.com`
     - **JP (Tokyo)**: `https://jp-tok.ml.cloud.ibm.com`

#### Configure Your Environment

Create a `.env.local` file in your project root:

```bash
# Copy from example
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:

```bash
WATSONX_API_KEY=your_actual_api_key_here
WATSONX_PROJECT_ID=your_actual_project_id_here
WATSONX_URL=https://us-south.ml.cloud.ibm.com
```

Then restart the development server:

```bash
npm run dev
```

**Note**: Without these credentials, the app will use a simple rule-based risk assessment system (no external API calls).
```

## 🧪 Development

### Run Tests
```bash
npm test
```

### Lint Code
```bash
npm run lint
```

### Type Check
```bash
npm run type-check
```

## 📸 IBM Bob Privacy Audit

CipherDev is certified by IBM Bob for zero data transmission. See `bob_sessions/` for proof screenshots:

1. **Landing Page** - Feature showcase
2. **Hardware Detection** - Device capabilities
3. **Model Loading** - Download progress
4. **Chat Session** - Live conversation
5. **Audit Page** - Privacy certification
6. **Network DevTools** - Zero external requests

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## 🙏 Acknowledgments

- **@mlc-ai/web-llm** - WebGPU inference engine
- **@xenova/transformers** - WASM fallback
- **HuggingFace** - Model hosting
- **IBM Bob** - Privacy audit certification

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/chipherdev/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/chipherdev/discussions)

---

**Made with ❤️ and with chaos also with IBM Bob 🤖🔒**

*CipherDev - AI that respects your privacy*
