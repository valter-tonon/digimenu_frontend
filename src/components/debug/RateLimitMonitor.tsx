/**
 * Rate Limit Monitor Component
 * 
 * Development tool to monitor API rate limiting status
 * Only shows in development mode
 */

'use client';

import React, { useState, useEffect } from 'react';
import { apiRateLimit } from '@/utils/apiRateLimit';
import { AlertTriangle, Clock, Shield, X } from 'lucide-react';

interface RateLimitMonitorProps {
  enabled?: boolean;
}

export const RateLimitMonitor: React.FC<RateLimitMonitorProps> = ({ 
  enabled = process.env.NODE_ENV === 'development' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const currentStats = apiRateLimit.getStats();
      setStats(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  if (!enabled) return null;

  const hasActiveEndpoints = Object.keys(stats).length > 0;
  const hasBlockedEndpoints = Object.values(stats).some((stat: any) => stat.blocked);

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`p-3 rounded-full shadow-lg transition-colors ${
            hasBlockedEndpoints 
              ? 'bg-red-500 text-white animate-pulse' 
              : hasActiveEndpoints 
                ? 'bg-amber-500 text-white' 
                : 'bg-gray-500 text-white'
          }`}
          title="Rate Limit Monitor"
        >
          <Shield className="w-5 h-5" />
        </button>
      </div>

      {/* Monitor Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Rate Limit Monitor
            </h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 max-h-80 overflow-y-auto">
            {Object.keys(stats).length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <Shield className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No API calls tracked yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(stats).map(([endpoint, stat]: [string, any]) => (
                  <div
                    key={endpoint}
                    className={`p-2 rounded border ${
                      stat.blocked 
                        ? 'border-red-200 bg-red-50' 
                        : stat.remaining < 3 
                          ? 'border-amber-200 bg-amber-50'
                          : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono text-gray-700 truncate">
                        {endpoint}
                      </span>
                      {stat.blocked && (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className={stat.blocked ? 'text-red-600' : 'text-gray-600'}>
                        {stat.blocked ? 'BLOCKED' : `${stat.count} calls`}
                      </span>
                      <span className="text-gray-500">
                        {stat.remaining} remaining
                      </span>
                    </div>

                    {stat.resetIn > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        <span>
                          Reset in {Math.ceil(stat.resetIn / 1000)}s
                        </span>
                      </div>
                    )}

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                      <div
                        className={`h-1 rounded-full transition-all ${
                          stat.blocked 
                            ? 'bg-red-500' 
                            : stat.remaining < 3 
                              ? 'bg-amber-500'
                              : 'bg-green-500'
                        }`}
                        style={{
                          width: `${Math.max(0, (stat.remaining / (stat.count + stat.remaining)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  apiRateLimit.clearAll();
                  setStats({});
                }}
                className="w-full px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Clear All Limits
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default RateLimitMonitor;