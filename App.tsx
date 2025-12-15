import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_STATE } from './constants';
import { AppState, Task, CustomMetric } from './types';
import { initializeMCP } from './services/mcpService';
import { verifyTaskWithAI, chatWithAI, generateSubTasks } from './services/aiService';
import { MetricCard } from './components/MetricCard';
import { TaskList } from './components/TaskList';
import { ConsoleLog } from './components/ConsoleLog';
import { ChatInterface } from './components/ChatInterface';
import { ActivityHeatmap } from './components/ActivityHeatmap';
import { CalendarView } from './components/CalendarView';
import { RulesPanel } from './components/RulesPanel';
import { LandingPage } from './components/LandingPage';
import { 
  Briefcase, 
  TrendingUp, 
  AlertOctagon, 
  Terminal, 
  ChevronDown, 
  ChevronRight,
  Activity,
  LogOut,
  Settings,
  Download,
  Upload,
  Plus,
  Save,
  X,
  Trash2,
  Minus,
  RefreshCw,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('sentinel_state');
    return saved ? JSON.parse(saved) : INITIAL_STATE;
  });

  const [expandedWeeks, setExpandedWeeks] = useState<Record<string, boolean>>({
    's2-w7': true // Expand current week by default
  });

  const [showSettings, setShowSettings] = useState(false);
  
  // Settings Form States
  const [sprintTitle, setSprintTitle] = useState('');
  const [sprintObj, setSprintObj] = useState('');
  const [sprintStart, setSprintStart] = useState('');
  const [sprintEnd, setSprintEnd] = useState('');
  
  const [weekSprintId, setWeekSprintId] = useState('');
  const [weekTitle, setWeekTitle] = useState('');
  const [weekTheme, setWeekTheme] = useState('');
  const [weekStart, setWeekStart] = useState('');
  const [weekEnd, setWeekEnd] = useState('');
  
  // Custom Metric Form
  const [metricLabel, setMetricLabel] = useState('');
  const [metricTarget, setMetricTarget] = useState('');
  const [metricUnit, setMetricUnit] = useState('');
  const [metricColor, setMetricColor] = useState<'blue'|'green'|'purple'|'red'>('blue');
  
  // Rule Form
  const [ruleCondition, setRuleCondition] = useState('');
  const [ruleConsequence, setRuleConsequence] = useState('');
  
  // Remote Form
  const [remoteUrl, setRemoteUrl] = useState('ws://localhost:8080');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persist state
  useEffect(() => {
    localStorage.setItem('sentinel_state', JSON.stringify(state));
    // Re-initialize MCP when state changes so the interface has the latest closure
    initializeMCP(state, setState);
  }, [state]);
  
  // Recover remote connection on reload if it was active
  useEffect(() => {
      if (state.user.isRemoteConnected && state.user.remoteUrl) {
          // Attempt reconnect after delay to allow UI to settle
          setTimeout(() => {
              window.SentinelAPI.connectRemote(state.user.remoteUrl!);
          }, 1000);
      }
  }, []);

  const toggleWeek = (weekId: string) => {
    setExpandedWeeks(prev => ({ ...prev, [weekId]: !prev[weekId] }));
  };

  const handleLogin = (name: string, enableAI: boolean) => {
      setState(prev => ({
          ...prev,
          user: {
              name,
              isAuthenticated: true,
              isAIConnected: enableAI
          },
          logs: [{
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              actor: 'System',
              action: 'AUTH_SUCCESS',
              details: `User ${name} authenticated. AI Uplink: ${enableAI ? 'ACTIVE' : 'OFFLINE'}`,
              level: 'success'
          }, ...prev.logs]
      }));
  };

  const handleLogout = () => {
      setState(prev => ({
          ...prev,
          user: { ...prev.user, isAuthenticated: false }
      }));
  };
  
  const handleSystemReset = () => {
      if (window.confirm("WARNING: SYSTEM PURGE INITIATED.\n\nThis will permanently delete all local data, task history, and logs. This action cannot be undone.\n\nAre you sure?")) {
          localStorage.removeItem('sentinel_state');
          setState(INITIAL_STATE);
          window.location.reload();
      }
  };

  const toggleTask = (taskId: string) => {
    setState(prev => {
      const newSprints = prev.sprints.map(s => ({
        ...s,
        weeks: s.weeks.map(w => ({
          ...w,
          tasks: w.tasks.map(t => {
            if (t.id === taskId) {
              // Only allow toggling between Pending and Completed (not Verified/Failed)
              if (t.status === 'verified' || t.status === 'failed') return t;
              
              const newStatus = t.status === 'completed' ? 'pending' : 'completed';
              return { 
                ...t, 
                status: newStatus,
                completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined
              };
            }
            return t;
          })
        }))
      }));

      // Calculate Metrics
      let newMetrics = { ...prev.metrics };
      const allTasks = newSprints.flatMap(s => s.weeks.flatMap(w => w.tasks));
      
      const completedApps = allTasks.filter(t => t.type === 'application' && (t.status === 'completed' || t.status === 'verified'));
      newMetrics.applicationsSent = completedApps.length * 5; // Estimation logic based on task grouping

      const log = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        actor: 'User',
        action: 'TASK_UPDATE',
        details: `Toggled task ${taskId} status`,
        level: 'info'
      } as const;

      return { ...prev, sprints: newSprints, metrics: newMetrics, logs: [log, ...prev.logs] };
    });
  };

  const handleVerificationRequest = async (task: Task) => {
      if (!state.user.isAIConnected) {
          window.SentinelAPI.addLog('System', 'VERIFY_ERROR', 'AI Uplink Offline. Cannot verify.', 'warning');
          return;
      }

      window.SentinelAPI.addLog('AI_Overseer', 'VERIFY_START', `Initiating verification protocol for ${task.description}`, 'info');

      const result = await verifyTaskWithAI(task);

      if (result.verified) {
          window.SentinelAPI.verifyTask(task.id, 'AI_Overseer', result.notes);
      } else {
          window.SentinelAPI.failTask(task.id, 'AI_Overseer', result.notes);
      }
  };

  const handleGenerateSubTasks = async (task: Task) => {
    if (!state.user.isAIConnected) {
      window.SentinelAPI.addLog('System', 'AI_ERROR', 'AI Uplink Offline. Cannot generate sub-tasks.', 'warning');
      return;
    }

    const subTaskStrings = await generateSubTasks(task.description);
    if (subTaskStrings.length > 0) {
      const subTasks = subTaskStrings.map((desc, idx) => ({
        id: `st-${task.id}-${Date.now()}-${idx}`,
        description: desc,
        isCompleted: false
      }));

      window.SentinelAPI.updateTask(task.id, { subTasks: [...(task.subTasks || []), ...subTasks] });
      window.SentinelAPI.addLog('AI_Overseer', 'SUBTASK_GEN', `Generated ${subTasks.length} sub-tasks for: ${task.description}`, 'info');
    }
  };

  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    setState(prev => {
      const newSprints = prev.sprints.map(s => ({
        ...s,
        weeks: s.weeks.map(w => ({
          ...w,
          tasks: w.tasks.map(t => {
            if (t.id === taskId && t.subTasks) {
              return {
                ...t,
                subTasks: t.subTasks.map(st => 
                  st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st
                )
              };
            }
            return t;
          })
        }))
      }));
      return { ...prev, sprints: newSprints };
    });
  };

  const handleAddSubTask = (taskId: string, desc: string) => {
      const allTasks = state.sprints.flatMap(s => s.weeks.flatMap(w => w.tasks));
      const task = allTasks.find(t => t.id === taskId);
      if (!task) return;

      const newSubTask = {
          id: `st-${Date.now()}`,
          description: desc,
          isCompleted: false
      };
      
      const updatedSubTasks = [...(task.subTasks || []), newSubTask];
      window.SentinelAPI.updateTask(taskId, { subTasks: updatedSubTasks });
  };

  const handleDeleteSubTask = (taskId: string, subTaskId: string) => {
      const allTasks = state.sprints.flatMap(s => s.weeks.flatMap(w => w.tasks));
      const task = allTasks.find(t => t.id === taskId);
      if (!task || !task.subTasks) return;
      
      const updatedSubTasks = task.subTasks.filter(st => st.id !== subTaskId);
      window.SentinelAPI.updateTask(taskId, { subTasks: updatedSubTasks });
  };

  // CRUD Handlers
  const addTask = (weekId: string, desc: string, type: Task['type'], criteria: string, dueDate?: string) => {
    window.SentinelAPI.addTask(weekId, desc, type, criteria, dueDate);
  };
  const editTask = (taskId: string, updates: Partial<Task>) => {
    window.SentinelAPI.updateTask(taskId, updates);
  };
  const deleteTask = (taskId: string) => {
    window.SentinelAPI.deleteTask(taskId);
  };
  const triggerConsequence = (ruleId: string) => {
    window.SentinelAPI.triggerConsequence(ruleId);
  };
  
  const handleSendMessage = async (text: string) => {
    // Add user message immediately
    const userMsg = {
        id: Date.now().toString(),
        sender: 'User' as const,
        content: text,
        timestamp: new Date().toISOString()
    };
    
    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, userMsg]
    }));

    if (!state.user.isAIConnected) {
        setTimeout(() => {
             setState(prev => ({
                ...prev,
                chatHistory: [...prev.chatHistory, {
                    id: (Date.now() + 1).toString(),
                    sender: 'AI_Overseer' as const,
                    content: "AI Uplink Offline. Authentication required.",
                    timestamp: new Date().toISOString()
                }]
            }));
        }, 500);
        return;
    }

    // Call AI
    const aiResponseText = await chatWithAI(state.chatHistory, text);

    setState(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, {
        id: (Date.now() + 1).toString(),
        sender: 'AI_Overseer' as const,
        content: aiResponseText,
        timestamp: new Date().toISOString()
      }]
    }));
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `sentinel_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsed = JSON.parse(e.target.result as string);
            window.SentinelAPI.importState(parsed);
            alert("Protocol State Restored Successfully.");
            setShowSettings(false);
          } catch (err) {
            alert("Invalid File Format. Import Failed.");
          }
        }
      };
    }
  };
  
  const handleRemoteConnect = (e: React.FormEvent) => {
      e.preventDefault();
      window.SentinelAPI.connectRemote(remoteUrl);
  };
  
  const handleRemoteDisconnect = () => {
      window.SentinelAPI.disconnectRemote();
  };

  const handleCreateSprint = (e: React.FormEvent) => {
      e.preventDefault();
      if(sprintTitle && sprintObj && sprintStart && sprintEnd) {
          window.SentinelAPI.addSprint(sprintTitle, sprintObj, sprintStart, sprintEnd);
          setSprintTitle('');
          setSprintObj('');
          setSprintStart('');
          setSprintEnd('');
          alert("New Tactical Sprint Initialized");
      }
  };

  const handleAddWeek = (e: React.FormEvent) => {
      e.preventDefault();
      if(weekSprintId && weekTitle && weekTheme && weekStart && weekEnd) {
          window.SentinelAPI.addWeek(weekSprintId, weekTitle, weekTheme, weekStart, weekEnd);
          setWeekTitle('');
          setWeekTheme('');
          setWeekStart('');
          setWeekEnd('');
          alert("Tactical Week Added to Sprint");
      }
  };
  
  const handleAddMetric = (e: React.FormEvent) => {
      e.preventDefault();
      if(metricLabel && metricTarget && metricUnit) {
          window.SentinelAPI.addCustomMetric(metricLabel, parseInt(metricTarget), metricUnit, metricColor);
          setMetricLabel('');
          setMetricTarget('');
          setMetricUnit('');
          alert("Tracking Metric Initialized");
      }
  };

  const handleAddRule = (e: React.FormEvent) => {
      e.preventDefault();
      if(ruleCondition && ruleConsequence) {
          window.SentinelAPI.addRule(ruleCondition, ruleConsequence);
          setRuleCondition('');
          setRuleConsequence('');
          alert("New Protocol Active");
      }
  };
  
  const handleMetricUpdate = (id: string, delta: number) => {
      const metric = state.customMetrics?.find(m => m.id === id);
      if(metric) {
          window.SentinelAPI.updateCustomMetric(id, Math.max(0, metric.value + delta));
      }
  };

  if (!state.user.isAuthenticated) {
      return <LandingPage onLogin={handleLogin} />;
  }

  // Derived state for heatmap and calendar
  const allTasks = state.sprints.flatMap(s => s.weeks.flatMap(w => w.tasks));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 relative">
      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-900 sticky top-0">
                    <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                        <Settings size={20} className="text-emerald-500"/> SYSTEM_CONTROL
                    </h2>
                    <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-6 space-y-8">
                     {/* Remote Uplink */}
                     <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 font-mono uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
                            <Wifi size={14}/> Remote Uplink (Bridge)
                        </h3>
                        <p className="text-xs text-slate-500">
                            Connect to a WebSocket Relay to allow external agents (Python scripts, etc.) to control this dashboard.
                        </p>
                        
                        {state.user.isRemoteConnected ? (
                            <div className="bg-emerald-900/20 border border-emerald-900 rounded p-3 flex justify-between items-center">
                                <div className="flex items-center gap-2 text-emerald-400">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"/>
                                    <span className="text-sm font-mono font-bold">CONNECTED: {state.user.remoteUrl}</span>
                                </div>
                                <button onClick={handleRemoteDisconnect} className="bg-slate-900 hover:bg-slate-800 text-slate-400 px-3 py-1 rounded text-xs border border-slate-700">
                                    DISCONNECT
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleRemoteConnect} className="flex gap-2">
                                <input 
                                    value={remoteUrl} 
                                    onChange={e => setRemoteUrl(e.target.value)} 
                                    placeholder="ws://localhost:8080" 
                                    className="flex-1 bg-black/50 border border-slate-700 rounded px-3 py-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" 
                                />
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded text-xs font-bold font-mono flex items-center gap-2">
                                    CONNECT
                                </button>
                            </form>
                        )}
                    </section>

                    {/* Data Management */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 font-mono uppercase border-b border-slate-800 pb-2">Data Persistence</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button onClick={handleExport} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 p-4 rounded border border-slate-600 transition-colors">
                                <Download size={20} /> Export State (JSON)
                            </button>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    onChange={handleImport}
                                    className="hidden"
                                    accept=".json"
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full h-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 p-4 rounded border border-slate-600 transition-colors"
                                >
                                    <Upload size={20} /> Import State (JSON)
                                </button>
                            </div>
                        </div>
                    </section>
                    
                    {/* Dynamic Metrics */}
                     <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 font-mono uppercase border-b border-slate-800 pb-2">Custom Metrics</h3>
                        
                        <div className="space-y-2">
                            {state.customMetrics?.map(m => (
                                <div key={m.id} className="flex justify-between items-center bg-black/30 p-2 rounded border border-slate-800">
                                    <span className={`text-xs font-mono text-${m.color}-400`}>{m.label} ({m.target} {m.unit})</span>
                                    <button onClick={() => window.SentinelAPI.deleteCustomMetric(m.id)} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>

                        <form onSubmit={handleAddMetric} className="grid grid-cols-2 gap-3">
                             <input value={metricLabel} onChange={e => setMetricLabel(e.target.value)} placeholder="Metric Name (e.g. Gym)" className="col-span-2 bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                             <input type="number" value={metricTarget} onChange={e => setMetricTarget(e.target.value)} placeholder="Target (e.g. 5)" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                             <input value={metricUnit} onChange={e => setMetricUnit(e.target.value)} placeholder="Unit (e.g. visits)" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                             <select value={metricColor} onChange={e => setMetricColor(e.target.value as any)} className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none">
                                <option value="blue">Blue</option>
                                <option value="green">Green</option>
                                <option value="purple">Purple</option>
                                <option value="red">Red</option>
                             </select>
                             <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded flex items-center justify-center gap-2 text-sm font-bold"><Plus size={16}/> TRACK METRIC</button>
                        </form>
                    </section>
                    
                    {/* Dynamic Rules */}
                     <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 font-mono uppercase border-b border-slate-800 pb-2">Custom Rules</h3>
                         <div className="space-y-2">
                            {state.rules.filter(r => r.id.startsWith('r-')).map(r => (
                                <div key={r.id} className="flex justify-between items-center bg-black/30 p-2 rounded border border-slate-800">
                                    <div className="text-xs font-mono">
                                        <div className="text-white">{r.condition}</div>
                                        <div className="text-rose-400">{r.consequence}</div>
                                    </div>
                                    <button onClick={() => window.SentinelAPI.deleteRule(r.id)} className="text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleAddRule} className="grid grid-cols-1 gap-3">
                             <input value={ruleCondition} onChange={e => setRuleCondition(e.target.value)} placeholder="Condition (e.g. Missed daily standup)" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                             <input value={ruleConsequence} onChange={e => setRuleConsequence(e.target.value)} placeholder="Consequence (e.g. 50 pushups)" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                             <button type="submit" className="bg-rose-600 hover:bg-rose-500 text-white p-2 rounded flex items-center justify-center gap-2 text-sm font-bold"><Plus size={16}/> ADD PROTOCOL</button>
                        </form>
                    </section>

                    {/* Sprint Management */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 font-mono uppercase border-b border-slate-800 pb-2">Initialize New Sprint</h3>
                        <form onSubmit={handleCreateSprint} className="grid grid-cols-1 gap-3">
                            <input value={sprintTitle} onChange={e => setSprintTitle(e.target.value)} placeholder="Sprint Title (e.g. 'Sprint 3: Negotiation')" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                            <input value={sprintObj} onChange={e => setSprintObj(e.target.value)} placeholder="Objective" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                            <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={sprintStart} onChange={e => setSprintStart(e.target.value)} className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                                <input type="date" value={sprintEnd} onChange={e => setSprintEnd(e.target.value)} className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                            </div>
                            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded flex items-center justify-center gap-2 text-sm font-bold"><Plus size={16}/> INITIALIZE SPRINT</button>
                        </form>
                    </section>

                    {/* Week Management */}
                    <section className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 font-mono uppercase border-b border-slate-800 pb-2">Add Week to Sprint</h3>
                        <form onSubmit={handleAddWeek} className="grid grid-cols-1 gap-3">
                             <select value={weekSprintId} onChange={e => setWeekSprintId(e.target.value)} className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required>
                                <option value="">Select Target Sprint</option>
                                {state.sprints.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                             </select>
                             <input value={weekTitle} onChange={e => setWeekTitle(e.target.value)} placeholder="Week Title" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                             <input value={weekTheme} onChange={e => setWeekTheme(e.target.value)} placeholder="Week Theme" className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                             <div className="grid grid-cols-2 gap-2">
                                <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)} className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                                <input type="date" value={weekEnd} onChange={e => setWeekEnd(e.target.value)} className="bg-black/50 border border-slate-700 rounded p-2 text-sm font-mono text-white focus:border-emerald-500 outline-none" required />
                            </div>
                            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded flex items-center justify-center gap-2 text-sm font-bold"><Plus size={16}/> ADD WEEK</button>
                        </form>
                    </section>
                    
                    {/* Danger Zone */}
                    <section className="space-y-4 pt-4 border-t border-rose-900/30">
                        <h3 className="text-sm font-bold text-rose-500 font-mono uppercase border-b border-rose-900/30 pb-2 flex items-center gap-2">
                            <AlertTriangle size={14}/> Danger Zone
                        </h3>
                        <div className="bg-rose-950/20 border border-rose-900/50 rounded p-4 flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="text-xs text-rose-300">
                                <p className="font-bold">System Purge (Factory Reset)</p>
                                <p className="opacity-70">Permanently delete all local data, tasks, and history. This action cannot be undone.</p>
                            </div>
                            <button 
                                onClick={handleSystemReset}
                                className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 border border-rose-700 px-4 py-2 rounded text-xs font-bold font-mono flex items-center gap-2 transition-colors whitespace-nowrap"
                            >
                                <RefreshCw size={14} /> WIPE DATA
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tighter text-white flex items-center gap-3">
            <Activity className="text-emerald-500" />
            SENTINEL<span className="text-slate-600">_DASHBOARD</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-mono">
            OPERATIVE: <span className="text-emerald-400">{state.user.name}</span> // AI: <span className={state.user.isAIConnected ? "text-emerald-400" : "text-rose-500"}>{state.user.isAIConnected ? "ONLINE" : "OFFLINE"}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
             <div className="text-xs text-slate-500 uppercase font-bold">Consequence Level</div>
             <div className="w-48 h-2 bg-slate-900 rounded-full mt-1 overflow-hidden border border-slate-800">
               <div 
                  className={`h-full transition-all duration-500 ${state.consequenceLevel > 50 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                  style={{ width: `${state.consequenceLevel}%` }}
               />
             </div>
          </div>
          <button onClick={() => setShowSettings(true)} className="p-2 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white transition-colors relative">
            <Settings size={16} />
            {state.user.isRemoteConnected && <span className="absolute top-0 right-0 w-2 h-2 bg-emerald-500 rounded-full animate-pulse border border-slate-900"></span>}
          </button>
          <button onClick={handleLogout} className="p-2 bg-slate-900 border border-slate-700 rounded text-slate-400 hover:text-white transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Full Width Top Section */}
        <div className="lg:col-span-12">
            <CalendarView tasks={allTasks} />
        </div>

        {/* Left Col: Metrics & Rules (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <MetricCard 
              label="Applications" 
              value={state.metrics.applicationsSent} 
              subValue={`Target: ${state.metrics.applicationsTarget}`} 
              icon={Briefcase}
              color="blue"
            />
            <MetricCard 
              label="Interviews" 
              value={state.metrics.interviews} 
              icon={TrendingUp}
              color="purple"
            />
             <MetricCard 
              label="Risks" 
              value={state.consequenceLevel > 0 ? "DETECTED" : "NONE"} 
              icon={AlertOctagon}
              color={state.consequenceLevel > 0 ? "red" : "green"}
            />
            
            {/* Render Custom Metrics */}
            {state.customMetrics?.map(m => (
               <div key={m.id} className="relative group">
                 <MetricCard 
                    label={m.label} 
                    value={m.value}
                    subValue={`Target: ${m.target} ${m.unit}`}
                    icon={Activity}
                    color={m.color}
                 />
                 <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                        onClick={() => handleMetricUpdate(m.id, -1)}
                        className="bg-black/50 p-1 rounded hover:bg-black text-white"
                     >
                        <Minus size={12}/>
                     </button>
                     <button 
                        onClick={() => handleMetricUpdate(m.id, 1)}
                        className="bg-black/50 p-1 rounded hover:bg-black text-white"
                     >
                        <Plus size={12}/>
                     </button>
                 </div>
               </div>
            ))}
          </div>

          <div className="bg-slate-900/30 border border-slate-800 rounded-lg p-4">
            <RulesPanel rules={state.rules} onTrigger={triggerConsequence} />
          </div>

          <ConsoleLog logs={state.logs} />
        </div>

        {/* Middle Col: Sprints (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          <ActivityHeatmap logs={state.logs} tasks={allTasks} />

          {state.sprints.map((sprint) => (
             <div key={sprint.id} className="bg-slate-900/30 border border-slate-800 rounded-lg overflow-hidden">
               <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
                 <div>
                   <h2 className="text-lg font-bold text-white">{sprint.title}</h2>
                   <p className="text-xs text-slate-400 font-mono">{sprint.dateRange} • {sprint.objective}</p>
                 </div>
                 {sprint.id === 'sprint-2' && <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded border border-emerald-500/30 animate-pulse">ACTIVE</span>}
               </div>

               <div className="p-4 space-y-4">
                 {sprint.weeks.map((week) => (
                   <div 
                        key={week.id} 
                        className={`border rounded-lg transition-all duration-300 ${
                            expandedWeeks[week.id] 
                            ? 'border-blue-500/50 bg-blue-950/10 shadow-[0_0_15px_rgba(59,130,246,0.1)]' 
                            : (week.isCurrent ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-slate-800 bg-slate-950/50')
                        }`}
                   >
                     <button 
                      onClick={() => toggleWeek(week.id)}
                      className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
                     >
                       <div className="flex items-center gap-3">
                          {expandedWeeks[week.id] ? <ChevronDown size={18} className="text-slate-500"/> : <ChevronRight size={18} className="text-slate-500"/>}
                          <div className="text-left">
                            <h3 className={`font-mono text-sm font-bold flex items-center gap-2 ${week.isCurrent ? 'text-emerald-400' : 'text-slate-300'}`}>
                              WEEK {week.number}: {week.title}
                              {week.isCurrent && (
                                  <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30 text-emerald-300">CURRENT</span>
                              )}
                            </h3>
                            <p className="text-xs text-slate-500">{week.theme}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                         <div className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-300">
                           {week.tasks.filter(t => t.status === 'completed' || t.status === 'verified').length}/{week.tasks.length}
                         </div>
                       </div>
                     </button>
                     
                     {expandedWeeks[week.id] && (
                       <div className="p-3 pt-0 border-t border-slate-800/50 mt-2">
                         <TaskList 
                            tasks={week.tasks} 
                            onToggle={toggleTask}
                            onAdd={(desc, type, criteria, dueDate) => addTask(week.id, desc, type, criteria, dueDate)}
                            onEdit={editTask}
                            onDelete={deleteTask}
                            onVerify={state.user.isAIConnected ? handleVerificationRequest : undefined}
                            onGenerateSubTasks={handleGenerateSubTasks}
                            onToggleSubTask={handleToggleSubTask}
                            onAddSubTask={handleAddSubTask}
                            onDeleteSubTask={handleDeleteSubTask}
                          />
                       </div>
                     )}
                   </div>
                 ))}
               </div>
             </div>
          ))}
        </div>

        {/* Right Col: Chat (3 cols) */}
        <div className="lg:col-span-3 space-y-6">
           <ChatInterface messages={state.chatHistory} onSendMessage={handleSendMessage} />
           
           <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
             <h3 className="text-sm font-bold text-slate-400 mb-2 font-mono flex items-center gap-2">
              <Terminal size={16} /> MCP_INTERFACE
            </h3>
            <div className="bg-black p-3 rounded border border-slate-800 font-mono text-[10px] text-emerald-500 overflow-x-auto">
              {`> SentinelAPI.sendChatMessage('AI', 'Status check?')\n> SentinelAPI.verifyTask('t22', 'Claude')\n> SentinelAPI.triggerConsequence('r3')`}
            </div>
            {state.user.isRemoteConnected && (
                <div className="mt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <Wifi size={10} /> REMOTE UPLINK ACTIVE
                </div>
            )}
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;