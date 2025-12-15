import React, { useState, useEffect } from 'react';
import { Task } from '../types';
import { suggestTaskType, prioritizeTasks, generateTaskDetails } from '../services/aiService';
import { CheckCircle2, Circle, ShieldCheck, XCircle, Plus, Trash2, Edit2, X, Check, Eye, AlertCircle, Calendar, Sparkles, Loader2, ListOrdered, Wand2, Workflow, CheckSquare, Square, Save, CornerDownRight } from 'lucide-react';

interface TaskListProps {
  tasks: Task[];
  onToggle: (taskId: string) => void;
  onAdd: (desc: string, type: Task['type'], criteria: string, dueDate?: string) => void;
  onEdit: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onVerify?: (task: Task) => void; 
  onGenerateSubTasks?: (task: Task) => void;
  onToggleSubTask?: (taskId: string, subTaskId: string) => void;
  onAddSubTask?: (taskId: string, desc: string) => void;
  onDeleteSubTask?: (taskId: string, subTaskId: string) => void;
}

type SortMethod = 'default' | 'status' | 'type' | 'dueDate' | 'ai-priority';

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onToggle, 
  onAdd, 
  onEdit, 
  onDelete, 
  onVerify, 
  onGenerateSubTasks, 
  onToggleSubTask,
  onAddSubTask,
  onDeleteSubTask
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<Task['type']>('admin');
  const [newCriteria, setNewCriteria] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  
  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDesc, setEditDesc] = useState('');
  const [editType, setEditType] = useState<Task['type']>('admin');
  const [editCriteria, setEditCriteria] = useState('');
  const [editDue, setEditDue] = useState('');

  // Subtask Input State
  const [subTaskInputs, setSubTaskInputs] = useState<Record<string, string>>({});

  const [sortMethod, setSortMethod] = useState<SortMethod>('default');
  
  // AI Suggestion State
  const [isSuggestingType, setIsSuggestingType] = useState(false);
  const [userHasSelectedType, setUserHasSelectedType] = useState(false);
  
  // AI Generation State
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  
  // AI Prioritization State
  const [isPrioritizing, setIsPrioritizing] = useState(false);
  const [aiSortedIds, setAiSortedIds] = useState<string[]>([]);
  
  // Local state to track loading operations per task
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [generatingSubTasksId, setGeneratingSubTasksId] = useState<string | null>(null);

  // Auto-categorize task based on description
  useEffect(() => {
    if (userHasSelectedType || !newDesc || newDesc.length < 4 || isGeneratingDetails) return;

    const timeoutId = setTimeout(async () => {
      setIsSuggestingType(true);
      const suggestedType = await suggestTaskType(newDesc, newCriteria);
      if (suggestedType) {
        setNewType(suggestedType);
      }
      setIsSuggestingType(false);
    }, 1000); // 1s debounce

    return () => clearTimeout(timeoutId);
  }, [newDesc, newCriteria, userHasSelectedType, isGeneratingDetails]);

  const handleAdd = () => {
    if (newDesc.trim()) {
      onAdd(newDesc.trim(), newType, newCriteria.trim(), newDueDate || undefined);
      setNewDesc('');
      setNewCriteria('');
      setNewDueDate('');
      setNewType('admin');
      setUserHasSelectedType(false);
      setIsAdding(false);
    }
  };

  const handleAiGenerate = async () => {
    if (!newDesc.trim()) return;
    setIsGeneratingDetails(true);
    const result = await generateTaskDetails(newDesc);
    if (result) {
      setNewDesc(result.description);
      setNewCriteria(result.criteria);
      setNewType(result.type);
      setUserHasSelectedType(true);
    }
    setIsGeneratingDetails(false);
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditDesc(task.description);
    setEditType(task.type);
    setEditCriteria(task.verificationCriteria || '');
    setEditDue(task.dueDate || '');
  };

  const saveEdit = () => {
    if (editingId && editDesc.trim()) {
      onEdit(editingId, {
          description: editDesc.trim(),
          type: editType,
          verificationCriteria: editCriteria.trim(),
          dueDate: editDue || undefined
      });
      setEditingId(null);
    }
  };
  
  const handleVerifyClick = async (task: Task) => {
      if (onVerify) {
          setVerifyingId(task.id);
          onVerify(task);
          
          setTimeout(() => {
             setVerifyingId(current => current === task.id ? null : current);
          }, 8000);
      }
  }

  const handleSubTaskClick = async (task: Task) => {
    if (onGenerateSubTasks) {
      setGeneratingSubTasksId(task.id);
      await onGenerateSubTasks(task);
      setGeneratingSubTasksId(null);
    }
  };

  const handleAddSubTaskSubmit = (taskId: string) => {
      const text = subTaskInputs[taskId];
      if (text && text.trim() && onAddSubTask) {
          onAddSubTask(taskId, text.trim());
          setSubTaskInputs(prev => ({ ...prev, [taskId]: '' }));
      }
  };

  const handleAiPrioritize = async () => {
    if (tasks.length === 0) return;
    setIsPrioritizing(true);
    const sortedIds = await prioritizeTasks(tasks);
    setAiSortedIds(sortedIds);
    setSortMethod('ai-priority');
    setIsPrioritizing(false);
  };

  const getSortedTasks = () => {
    const sorted = [...tasks];
    if (sortMethod === 'status') {
      const statusOrder: Record<string, number> = {
        'failed': 0,
        'pending': 1,
        'in-progress': 2,
        'completed': 3, 
        'verified': 4
      };
      return sorted.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
    if (sortMethod === 'type') {
      return sorted.sort((a, b) => a.type.localeCompare(b.type));
    }
    if (sortMethod === 'dueDate') {
      return sorted.sort((a, b) => {
        if (!a.dueDate) return 1; 
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    }
    if (sortMethod === 'ai-priority' && aiSortedIds.length > 0) {
      return sorted.sort((a, b) => {
        const idxA = aiSortedIds.indexOf(a.id);
        const idxB = aiSortedIds.indexOf(b.id);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
      });
    }
    return sorted; 
  };

  const getIcon = (status: Task['status']) => {
    switch (status) {
      case 'verified': return <ShieldCheck className="w-5 h-5 text-emerald-400" />;
      case 'completed': return <AlertCircle className="w-5 h-5 text-amber-400" />; 
      case 'failed': return <XCircle className="w-5 h-5 text-rose-500" />;
      default: return <Circle className="w-5 h-5 text-slate-600 hover:text-slate-400 transition-colors" />;
    }
  };

  const getStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'verified': return 'bg-emerald-950/30 border-emerald-900/50 text-emerald-200';
      case 'completed': return 'bg-amber-950/20 border-amber-900/30 text-amber-100 opacity-80';
      case 'failed': return 'bg-rose-950/30 border-rose-900/50 text-rose-200';
      default: return 'bg-slate-900/50 border-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-2 mt-2">
      {/* Sorting Controls */}
      <div className="flex justify-end items-center gap-2 mb-2">
        <button
          onClick={handleAiPrioritize}
          disabled={isPrioritizing || tasks.length < 2}
          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-all ${
            sortMethod === 'ai-priority' 
              ? 'bg-purple-900/30 border-purple-500/50 text-purple-300' 
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-purple-300 hover:border-purple-500/30'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title="AI-driven prioritization based on impact and urgency"
        >
          {isPrioritizing ? <Loader2 size={10} className="animate-spin" /> : <ListOrdered size={10} />}
          {isPrioritizing ? 'RANKING...' : 'AI RANK'}
        </button>

        <span className="text-[10px] text-slate-500 font-mono uppercase ml-2">Sort By:</span>
        <select 
          value={sortMethod}
          onChange={(e) => setSortMethod(e.target.value as SortMethod)}
          className="bg-slate-900 border border-slate-700 text-xs text-slate-400 rounded px-2 py-0.5 focus:outline-none focus:border-slate-500 font-mono"
        >
          <option value="default">Default</option>
          <option value="status">Status</option>
          <option value="dueDate">Due Date</option>
          <option value="type">Type</option>
          <option value="ai-priority" disabled={aiSortedIds.length === 0}>AI Priority</option>
        </select>
      </div>

      {getSortedTasks().map((task, index) => (
        <div 
          key={task.id}
          className={`flex flex-col p-3 rounded border ${getStatusColor(task.status)} group transition-all duration-500`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1">
              <div className="flex flex-col items-center gap-1">
                  <button 
                    onClick={() => onToggle(task.id)}
                    disabled={task.status === 'verified' || task.status === 'failed'}
                    className="hover:opacity-80 transition-opacity disabled:cursor-not-allowed mt-0.5"
                    title={task.status === 'completed' ? 'Pending AI Verification' : 'Toggle Status'}
                  >
                    {getIcon(task.status)}
                  </button>
                  {sortMethod === 'ai-priority' && (
                     <span className="text-[8px] font-mono text-purple-400/50">#{index + 1}</span>
                  )}
              </div>
              
              <div className="flex flex-col flex-1 min-w-0">
                {editingId === task.id ? (
                  <div className="flex flex-col gap-2 w-full animate-in fade-in zoom-in-95 duration-200">
                    <input 
                      className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:border-blue-500 outline-none"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Task description"
                      maxLength={200}
                      autoFocus
                    />
                    <div className="flex gap-2">
                        <select 
                            className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300 flex-1 focus:border-blue-500 outline-none"
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as Task['type'])}
                        >
                            <option value="admin">ADMIN</option>
                            <option value="application">APPLICATION</option>
                            <option value="certification">CERTIFICATION</option>
                            <option value="portfolio">PORTFOLIO</option>
                            <option value="networking">NETWORKING</option>
                            <option value="finance">FINANCE</option>
                        </select>
                         <input 
                            type="date"
                            className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300 focus:border-blue-500 outline-none"
                            value={editDue}
                            onChange={(e) => setEditDue(e.target.value)}
                        />
                    </div>
                    <input 
                      className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-400 focus:border-blue-500 outline-none"
                      value={editCriteria}
                      onChange={(e) => setEditCriteria(e.target.value)}
                      placeholder="Verification criteria"
                      maxLength={500}
                    />
                    <div className="flex justify-end gap-2 mt-1">
                        <button onClick={() => setEditingId(null)} className="p-1 text-rose-400 hover:bg-rose-900/30 rounded"><X size={14}/></button>
                        <button onClick={saveEdit} className="p-1 text-emerald-400 hover:bg-emerald-900/30 rounded"><Save size={14}/></button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-sm break-all ${task.status === 'verified' ? 'line-through opacity-50' : ''}`}>
                        {task.description}
                      </span>
                      {task.status === 'completed' && (
                        <div className="flex items-center gap-2">
                             <span className="text-[10px] bg-amber-900/40 text-amber-300 px-1.5 py-0.5 rounded border border-amber-900/50">
                                PENDING
                             </span>
                             {onVerify && (
                                 <button 
                                    onClick={() => handleVerifyClick(task)}
                                    disabled={verifyingId === task.id}
                                    className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-0.5 rounded flex items-center gap-1 transition-colors disabled:opacity-50"
                                 >
                                    {verifyingId === task.id ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>}
                                    VERIFY
                                 </button>
                             )}
                        </div>
                      )}
                      {task.status === 'verified' && (
                        <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-900/50 flex items-center gap-1">
                           VERIFIED <ShieldCheck size={8} />
                        </span>
                      )}
                       {task.status === 'failed' && (
                        <span className="text-[10px] bg-rose-900/40 text-rose-300 px-1.5 py-0.5 rounded border border-rose-900/50 flex items-center gap-1">
                           REJECTED
                        </span>
                      )}
                    </div>
                    
                    {/* Metadata Row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[10px] uppercase tracking-wide opacity-60">
                      <span className="text-blue-300/80">{task.type}</span>
                      {task.dueDate && (
                         <span className={`flex items-center gap-1 ${new Date(task.dueDate) < new Date() && task.status === 'pending' ? 'text-rose-400 font-bold' : 'text-slate-400'}`}>
                           <Calendar size={10} /> {new Date(task.dueDate).toLocaleDateString()}
                         </span>
                      )}
                      {task.verifiedBy && <span className="text-emerald-400">• Verified by {task.verifiedBy}</span>}
                      {task.verificationCriteria && (
                        <span className="flex items-center gap-1 text-slate-400 max-w-[200px] truncate" title={task.verificationCriteria}>
                          <Eye size={10} /> {task.verificationCriteria}
                        </span>
                      )}
                    </div>

                    {/* Subtasks Section */}
                    {(task.subTasks && task.subTasks.length > 0 || onAddSubTask) && (
                      <div className="mt-3 pl-3 border-l-2 border-slate-800 space-y-2">
                        {task.subTasks?.map(st => (
                          <div 
                            key={st.id} 
                            className="flex items-start justify-between group/sub"
                          >
                            <div 
                                onClick={() => onToggleSubTask && onToggleSubTask(task.id, st.id)}
                                className={`flex items-start gap-2 cursor-pointer ${st.isCompleted ? 'opacity-40' : 'opacity-80'}`}
                            >
                                {st.isCompleted 
                                ? <CheckSquare size={12} className="text-emerald-500 mt-0.5" /> 
                                : <Square size={12} className="text-slate-500 group-hover/sub:text-slate-300 mt-0.5" />}
                                <span className={`text-xs font-mono break-all ${st.isCompleted ? 'line-through decoration-slate-600' : ''}`}>{st.description}</span>
                            </div>
                            {onDeleteSubTask && (
                                <button 
                                    onClick={() => onDeleteSubTask(task.id, st.id)}
                                    className="opacity-0 group-hover/sub:opacity-100 text-slate-600 hover:text-rose-500 transition-opacity"
                                >
                                    <X size={10} />
                                </button>
                            )}
                          </div>
                        ))}
                        
                        {/* Manual Add Subtask */}
                        {onAddSubTask && (
                             <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/50">
                                <CornerDownRight size={10} className="text-slate-600"/>
                                <input 
                                    className="bg-transparent border-b border-slate-800 text-[10px] font-mono text-slate-400 w-full focus:outline-none focus:border-slate-500 placeholder-slate-700"
                                    placeholder="Add sub-step..."
                                    value={subTaskInputs[task.id] || ''}
                                    onChange={(e) => setSubTaskInputs(prev => ({...prev, [task.id]: e.target.value}))}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubTaskSubmit(task.id)}
                                    maxLength={150}
                                />
                                <button 
                                    onClick={() => handleAddSubTaskSubmit(task.id)}
                                    disabled={!subTaskInputs[task.id]}
                                    className="text-slate-600 hover:text-blue-400 disabled:opacity-0"
                                >
                                    <Plus size={12} />
                                </button>
                             </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-start">
              {editingId !== task.id && (
                 <>
                   {onGenerateSubTasks && (
                    <button 
                      onClick={() => handleSubTaskClick(task)}
                      disabled={generatingSubTasksId === task.id}
                      className="text-slate-500 hover:text-purple-400 disabled:opacity-50"
                      title="AI Break Down Task"
                    >
                      {generatingSubTasksId === task.id ? <Loader2 size={14} className="animate-spin"/> : <Workflow size={14} />}
                    </button>
                   )}
                   <button onClick={() => startEdit(task)} className="text-slate-500 hover:text-blue-400"><Edit2 size={14} /></button>
                   <button onClick={() => onDelete(task.id)} className="text-slate-500 hover:text-rose-400"><Trash2 size={14} /></button>
                 </>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {/* Add Task Button */}
      {isAdding ? (
        <div className="p-3 rounded border border-slate-800 bg-slate-900/50 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 relative">
           <div className="relative">
             <input 
               className="w-full bg-black/50 border border-slate-700 rounded px-2 py-1 text-sm font-mono text-white focus:outline-none focus:border-blue-500 pr-8"
               placeholder="Task description (e.g. 'Apply to 5 jobs')..."
               value={newDesc}
               onChange={(e) => setNewDesc(e.target.value)}
               maxLength={200}
               autoFocus
             />
             <button
               onClick={handleAiGenerate}
               disabled={isGeneratingDetails || !newDesc.trim()}
               className="absolute right-1 top-1 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-colors"
               title="AI Enhance: Auto-generate description & criteria"
             >
               {isGeneratingDetails ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
             </button>
           </div>
           
           <div className="flex gap-2">
             <input 
               className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-400 focus:outline-none focus:border-blue-500 flex-1"
               placeholder="Verification criteria..."
               value={newCriteria}
               onChange={(e) => setNewCriteria(e.target.value)}
               maxLength={500}
             />
             <input 
                type="date"
                className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-400 focus:outline-none focus:border-blue-500"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
             />
           </div>
           <div className="flex justify-between items-center">
             <div className="relative">
                <select 
                   className="bg-black/50 border border-slate-700 rounded px-2 py-1 text-xs font-mono text-slate-300 pr-8"
                   value={newType}
                   onChange={(e) => {
                       setNewType(e.target.value as any);
                       setUserHasSelectedType(true);
                   }}
                >
                   <option value="admin">ADMIN</option>
                   <option value="application">APPLICATION</option>
                   <option value="certification">CERTIFICATION</option>
                   <option value="portfolio">PORTFOLIO</option>
                   <option value="networking">NETWORKING</option>
                   <option value="finance">FINANCE</option>
                </select>
                {isSuggestingType && (
                    <div className="absolute right-2 top-1.5 pointer-events-none">
                         <Loader2 size={10} className="animate-spin text-emerald-500" />
                    </div>
                )}
                {!isSuggestingType && !userHasSelectedType && newDesc.length > 3 && !isGeneratingDetails && (
                    <div className="absolute right-2 top-1.5 pointer-events-none text-emerald-500/50">
                        <Sparkles size={10} />
                    </div>
                )}
             </div>
             <div className="flex gap-2">
               <button onClick={() => { setIsAdding(false); setUserHasSelectedType(false); }} className="text-xs text-slate-500 hover:text-slate-300">CANCEL</button>
               <button onClick={handleAdd} className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded">ADD</button>
             </div>
           </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full py-2 border border-dashed border-slate-800 rounded text-slate-600 hover:text-slate-400 hover:border-slate-600 hover:bg-slate-900/50 transition-all flex items-center justify-center gap-2 text-xs font-mono"
        >
          <Plus size={14} /> ADD TASK
        </button>
      )}
    </div>
  );
};