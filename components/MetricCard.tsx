import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ label, value, subValue, icon: Icon, color = "blue" }) => {
  const colorClasses = {
    blue: "text-blue-400 border-blue-900/30 bg-blue-900/10",
    green: "text-emerald-400 border-emerald-900/30 bg-emerald-900/10",
    purple: "text-purple-400 border-purple-900/30 bg-purple-900/10",
    red: "text-rose-400 border-rose-900/30 bg-rose-900/10",
  }[color] || "text-slate-400";

  return (
    <div className={`p-4 rounded-lg border ${colorClasses} backdrop-blur-sm transition-all hover:scale-[1.02]`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider opacity-70 mb-1">{label}</p>
          <h3 className="text-2xl font-bold font-mono">{value}</h3>
          {subValue && <p className="text-xs opacity-60 mt-1">{subValue}</p>}
        </div>
        <Icon className="w-5 h-5 opacity-80" />
      </div>
    </div>
  );
};