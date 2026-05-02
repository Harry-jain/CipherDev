import Link from 'next/link';
import { Shield, Cpu, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const dynamic = 'force-dynamic';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-black to-black" />
        
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center space-y-8 animate-fadeIn">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center glow-strong">
                <span className="text-white font-bold text-4xl">C</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-5xl sm:text-7xl font-bold text-gray-100 tracking-tight">
              AI that stays on{' '}
              <span className="gradient-text">your device</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto">
              Run powerful language models entirely in your browser using WebGPU.
              No servers, no API keys, no data transmission. Complete privacy guaranteed.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
              <Link href="/models">
                <Button size="lg" className="gap-2 glow">
                  Get Started
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="/audit">
                <Button variant="secondary" size="lg" className="gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Audit
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-16">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">100%</div>
                <div className="text-sm text-gray-500 mt-1">Private</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">0</div>
                <div className="text-sm text-gray-500 mt-1">Data Sent</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">4</div>
                <div className="text-sm text-gray-500 mt-1">Models</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 - Privacy */}
            <Card className="p-8 space-y-4 animate-slideIn" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100">
                Zero Data Transmission
              </h3>
              <p className="text-gray-400 leading-relaxed">
                All inference happens locally in your browser using WebGPU or WASM.
                Your conversations never leave your device. IBM Bob certified.
              </p>
              <Link href="/audit" className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium">
                View Privacy Audit
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Card>

            {/* Feature 2 - Performance */}
            <Card className="p-8 space-y-4 animate-slideIn" style={{ animationDelay: '0.2s' }}>
              <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center">
                <Zap className="h-6 w-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100">
                Hardware Accelerated
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Leverages WebGPU for blazing-fast inference on compatible devices.
                Automatic fallback to WASM ensures universal compatibility.
              </p>
              <Link href="/models" className="inline-flex items-center text-purple-400 hover:text-purple-300 text-sm font-medium">
                Check Your Hardware
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Card>

            {/* Feature 3 - Models */}
            <Card className="p-8 space-y-4 animate-slideIn" style={{ animationDelay: '0.3s' }}>
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center">
                <Cpu className="h-6 w-6 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-100">
                Multiple Models
              </h3>
              <p className="text-gray-400 leading-relaxed">
                Choose from TinyLlama (650MB), Gemma 2B, Llama 3.2 3B, or Phi-3.5.
                Optimized quantized models for efficient browser execution.
              </p>
              <Link href="/chat" className="inline-flex items-center text-green-400 hover:text-green-300 text-sm font-medium">
                Start Chatting
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">C</span>
              </div>
              <span className="text-gray-400 text-sm">
                © 2024 CipherDev. Privacy-first AI.
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/audit" className="hover:text-gray-300 transition-colors">
                Privacy Audit
              </Link>
              <Link href="/models" className="hover:text-gray-300 transition-colors">
                Models
              </Link>
              <Link href="/chat" className="hover:text-gray-300 transition-colors">
                Chat
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Made with Bob
