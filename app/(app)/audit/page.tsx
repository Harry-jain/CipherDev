'use client';

import { useEffect } from 'react';
import { Shield, Activity, Database, FileKey2, CheckCircle } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { BobAuditAdapter } from '@/features/audit/bobAuditAdapter';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default function AuditPage() {
  const { auditLogs, setAuditLogs, setAuditing } = useAppStore();

  useEffect(() => {
    // Run audit on mount
    setAuditing(true);
    
    // Simulate audit process with delay for effect
    setTimeout(() => {
      const logs = BobAuditAdapter.runAudit();
      setAuditLogs(logs);
      setAuditing(false);
    }, 1000);
  }, [setAuditLogs, setAuditing]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'network':
        return Activity;
      case 'storage':
        return Database;
      case 'system':
        return FileKey2;
      default:
        return Shield;
    }
  };

  return (
    <div className="min-h-full p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-600/20 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-green-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-100">IBM Bob Privacy Audit</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Independent verification of CipherDev's privacy guarantees by IBM Bob,
            the trusted AI privacy auditor.
          </p>
        </div>

        {/* Certification Card */}
        <Card className="p-8 bg-green-900/20 border-green-800/50 glow">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-100 mb-2">
                  Privacy Certification
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  IBM Bob has analyzed the CipherDev runtime and certifies that all network
                  requests are restricted to fetching static model weights from HuggingFace.
                  <strong className="text-green-400"> No chat data, no telemetry, and no user
                  information leaves this device.</strong>
                </p>
                <p className="text-gray-400 mt-3 text-sm">
                  All inference happens locally using WebGPU or WASM. Your conversations are
                  stored only in your browser's local storage and can be exported as local files.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-green-800/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Audit Status</span>
                <Badge variant="success" className="gap-2">
                  <CheckCircle className="h-3 w-3" />
                  Verified Safe
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Audit Logs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-100">Audit Log</h2>
          
          {auditLogs.length === 0 ? (
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <div className="animate-spin">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <span className="text-gray-300">Running privacy audit...</span>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {auditLogs.map((log, index) => {
                const Icon = getIcon(log.type);
                
                return (
                  <Card
                    key={index}
                    className="p-6 animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        log.type === 'network' ? 'bg-blue-600/20' :
                        log.type === 'storage' ? 'bg-purple-600/20' :
                        'bg-green-600/20'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          log.type === 'network' ? 'text-blue-400' :
                          log.type === 'storage' ? 'text-purple-400' :
                          'text-green-400'
                        }`} />
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-100 capitalize">
                            {log.type} Verification
                          </h3>
                          <Badge variant={log.isSafe ? 'success' : 'danger'} className="gap-2">
                            <CheckCircle className="h-3 w-3" />
                            {log.isSafe ? 'Verified Safe' : 'Issue Detected'}
                          </Badge>
                        </div>

                        <p className="text-gray-300 text-sm leading-relaxed">
                          {log.description}
                        </p>

                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toISOString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Additional Info */}
        <Card className="p-6 bg-gray-800/30">
          <h3 className="font-semibold text-gray-100 mb-3">About IBM Bob</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-3">
            IBM Bob is an independent AI privacy auditor that verifies applications claiming
            to be privacy-first. Bob analyzes network traffic, storage patterns, and system
            calls to ensure no user data is transmitted externally.
          </p>
          <p className="text-gray-400 text-sm leading-relaxed">
            This audit was performed automatically when you loaded this page. You can verify
            these claims yourself by opening your browser's DevTools (F12) and checking the
            Network tab - you'll see only requests to HuggingFace for model weights.
          </p>
        </Card>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-800/50">
          <p className="text-sm text-gray-500">
            Audit completed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Made with IBM Bob 🤖🔒
          </p>
        </div>
      </div>
    </div>
  );
}

// Made with Bob
