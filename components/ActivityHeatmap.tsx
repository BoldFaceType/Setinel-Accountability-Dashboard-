import React from 'react';
import { Task, SystemLog } from '../types';

interface HeatmapProps {
  logs: SystemLog[];
  tasks: Task[];
}

export const ActivityHeatmap: React.FC<HeatmapProps> = ({ logs, tasks }) => {
  // Generate last 16 weeks for visualization
  const weeks = 16;
  const days = 7;
  
  const getIntensity = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    // Filter logs for activity history
    const events = logs.filter(l => l.timestamp.startsWith(dateStr));
    
    // Filter tasks for completion status (Source of Truth)
    const completedTasks = tasks.filter(t => 
      (t.status === 'completed' || t.status === 'verified') && 
      t.completedAt && 
      t.completedAt.startsWith(dateStr)
    );
    
    // Weight: Completed Task = 4, Verification Log = 2, Update Log = 1
    let score = events.reduce((acc, curr) => {
      if (curr.action === 'TASK_VERIFICATION' || curr.action === 'TASK_COMPLETED') return acc + 2;
      if (curr.action === 'TASK_UPDATE') return acc + 1;
      return acc;
    }, 0);

    // Add significant weight for actual completed tasks on this day
    score += completedTasks.length * 4;

    if (score === 0) return 'bg-slate-900';
    if (score < 4) return 'bg-emerald-900/40';
    if (score < 8) return 'bg-emerald-700/60';
    if (score < 15) return 'bg-emerald-500/80';
    return 'bg-emerald-400';
  };

  const grid = [];
  // Start from 'weeks' ago
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));
  // Adjust to start on a Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  for (let w = 0; w < weeks; w++) {
    const weekCol = [];
    for (let d = 0; d < days; d++) {
      const current = new Date(startDate);
      current.setDate(startDate.getDate() + (w * 7) + d);
      weekCol.push(current);
    }
    grid.push(weekCol);
  }

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 mb-6">
      <div className="flex justify-between items-center mb-2">
         <h3 className="text-xs font-mono font-bold text-slate-400">ACTIVITY_HEATMAP</h3>
         <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
            <span>LESS</span>
            <div className="w-2 h-2 bg-slate-900 rounded-[1px]"></div>
            <div className="w-2 h-2 bg-emerald-900/40 rounded-[1px]"></div>
            <div className="w-2 h-2 bg-emerald-500/80 rounded-[1px]"></div>
            <span>MORE</span>
         </div>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {grid.map((week, i) => (
          <div key={i} className="flex flex-col gap-1">
            {week.map((day, j) => (
              <div 
                key={day.toISOString()}
                className={`w-3 h-3 rounded-[2px] ${getIntensity(day)} transition-colors hover:border hover:border-white/50`}
                title={`${day.toLocaleDateString()}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};