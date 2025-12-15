import React, { useEffect, useRef } from 'react';
import { SystemLog } from '../types';

interface ConsoleLogProps {
  logs: SystemLog[];
}

export const ConsoleLog: React.FC<ConsoleLogProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-black/80 rounded-lg border border-slate-800 p-4 font-mono text-xs h-64 overflow-y-auto shadow-inner">
      <div className="text-slate-500 mb-2 sticky top-0 bg-black/80 pb-2 border-b border-slate-800 flex justify-between">
        <span>// SYSTEM_LOGS</span>
        <span className="animate-pulse text-emerald-500">● LIVE</span>
      </div>
      <div className="space-y-1">
        {logs.slice().reverse().map((log) => (
          <div key={log.id} className="flex gap-2">
            <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
            <span className={`${
              log.actor === 'AI_Overseer' ? 'text-purple-400' : 'text-blue-400'
            }`}>
              {log.actor}
            </span>
            <span className="text-slate-400">::</span>
            <span className={`${
              log.level === 'critical' ? 'text-rose-500 font-bold' :
              log.level === 'success' ? 'text-emerald-400' :
              log.level === 'warning' ? 'text-yellow-400' : 'text-slate-300'
            }`}>
              {log.details}
            </span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};