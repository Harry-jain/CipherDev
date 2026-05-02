'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RiskResult {
  risk: 'low' | 'medium' | 'high';
  action: 'none' | 'medical_kit' | 'rescue';
  reason: string;
}

export function RiskCheckButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RiskResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    age: '',
    location: '',
    healthCondition: '',
    temperature: '',
    humidity: '',
    heartRate: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/check-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          age: parseInt(formData.age),
          location: formData.location,
          healthCondition: formData.healthCondition,
          temperature: parseFloat(formData.temperature),
          humidity: formData.humidity ? parseFloat(formData.humidity) : undefined,
          heartRate: formData.heartRate ? parseInt(formData.heartRate) : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assess risk');
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'danger';
      default: return 'default';
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="secondary"
        className="gap-2"
      >
        <AlertTriangle className="h-4 w-4" />
        Check Health Risk
      </Button>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Health Risk Assessment</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsOpen(false);
            setResult(null);
            setError(null);
          }}
        >
          Close
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Age *
            </label>
            <input
              type="number"
              required
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Location *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Health Condition *
            </label>
            <input
              type="text"
              required
              value={formData.healthCondition}
              onChange={(e) => setFormData({ ...formData, healthCondition: e.target.value })}
              placeholder="e.g., diabetic, asthma"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Temperature (°C) *
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Humidity (%)
            </label>
            <input
              type="number"
              value={formData.humidity}
              onChange={(e) => setFormData({ ...formData, humidity: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Heart Rate (bpm)
            </label>
            <input
              type="number"
              value={formData.heartRate}
              onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Assessing...
            </>
          ) : (
            'Assess Risk'
          )}
        </Button>
      </form>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800/50 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Risk Level:</span>
            <Badge variant={getRiskColor(result.risk)}>
              {result.risk.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-300">Recommended Action:</span>
            <span className="text-sm text-gray-100 font-medium">
              {result.action.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-700/50">
            <p className="text-sm text-gray-400">{result.reason}</p>
          </div>
        </div>
      )}
    </Card>
  );
}

// Made with Bob
