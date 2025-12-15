import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { Task } from '../types';

interface CalendarViewProps {
  tasks: Task[];
}

export const CalendarView: React.FC<CalendarViewProps> = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  
  const days = [];
  // Empty slots for days before the 1st
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  const getTasksForDate = (date: Date | null) => {
    if (!date) return [];
    // Convert local date to YYYY-MM-DD for comparison with ISO strings
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    return tasks.filter(t => t.dueDate && t.dueDate.startsWith(dateStr));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
             <h3 className="text-sm font-bold text-slate-300 font-mono flex items-center gap-2">
                <CalendarIcon size={16} className="text-emerald-500" /> 
                SCHEDULE :: {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
                <button onClick={prevMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronLeft size={16}/></button>
                <button onClick={nextMonth} className="p-1 hover:bg-slate-800 rounded text-slate-400"><ChevronRight size={16}/></button>
            </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-500 uppercase">{d}</div>
            ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
            {days.map((date, idx) => {
                const dayTasks = getTasksForDate(date);
                const isToday = date && new Date().toDateString() === date.toDateString();
                const hasDeadline = dayTasks.length > 0;
                
                return (
                    <div 
                        key={idx} 
                        className={`
                            min-h-[80px] border rounded p-1 flex flex-col items-start gap-1 relative overflow-hidden transition-colors
                            ${!date ? 'border-transparent' : 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/50'}
                            ${isToday ? 'ring-1 ring-emerald-500/50 bg-emerald-900/10' : ''}
                            ${hasDeadline && !isToday ? 'bg-slate-900/80' : ''}
                        `}
                    >
                        {date && (
                            <>
                                <div className="flex justify-between w-full items-start">
                                    <span className={`text-[10px] font-mono ${isToday ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                                        {date.getDate()}
                                    </span>
                                    {hasDeadline && <Clock size={10} className="text-amber-500/50" />}
                                </div>
                                
                                <div className="flex flex-col gap-0.5 w-full mt-1">
                                    {dayTasks.slice(0, 3).map(t => (
                                        <div 
                                            key={t.id} 
                                            className={`text-[8px] truncate px-1 rounded w-full border
                                                ${t.status === 'completed' || t.status === 'verified' 
                                                    ? 'bg-blue-900/20 text-blue-300/50 line-through border-transparent' 
                                                    : t.status === 'failed' 
                                                        ? 'bg-rose-900/30 text-rose-300 border-rose-900/50' 
                                                        : 'bg-amber-900/20 text-amber-200 border-amber-900/30' // Highlight due items
                                                }
                                            `}
                                            title={`${t.description} (Due)`}
                                        >
                                            {t.description}
                                        </div>
                                    ))}
                                    {dayTasks.length > 3 && (
                                        <div className="text-[8px] text-slate-500 pl-1">+{dayTasks.length - 3} more</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};