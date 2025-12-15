import React from 'react';
import { AlertTriangle, Lock, DollarSign, Activity } from 'lucide-react';
import { Rule } from '../types';

interface RulesPanelProps {
  rules: Rule[];
  onTrigger: (ruleId: string) => void;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({ rules, onTrigger }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-slate-500 font-mono uppercase tracking-wider mb-2 flex items-center gap-2">
        <Lock size={12} /> Active Protocols
      </h3>
      {rules.map(rule => (
        <div 
          key={rule.id} 
          className={`p-3 rounded border text-xs relative overflow-hidden group ${
            rule.status === 'triggered' 
            ? 'bg-rose-950/30 border-rose-900 text-rose-300' 
            : 'bg-slate-900/50 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex justify-between items-start gap-2 relative z-10">
            <div>
              <div className="font-bold mb-1 text-slate-300">{rule.condition}</div>
              <div className={`font-mono ${rule.status === 'triggered' ? 'text-rose-400' : 'text-slate-500'}`}>
                 CONSEQUENCE: {rule.consequence}
              </div>
            </div>
            {rule.status !== 'triggered' && (
              <button 
                onClick={() => onTrigger(rule.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity bg-rose-900/50 hover:bg-rose-900 text-rose-200 px-2 py-1 rounded text-[10px] font-mono border border-rose-800"
              >
                TRIGGER
              </button>
            )}
            {rule.status === 'triggered' && <AlertTriangle size={14} className="text-rose-500" />}
          </div>
        </div>
      ))}
    </div>
  );
};