import React from 'react';
import { AppState, Status, Task, ChatMessage, Sprint, Week, CustomMetric } from '../types';

/**
 * This service exposes a global interface on `window` that an AI Agent 
 * (like the one reading this code) can interact with programmatically.
 */

interface MCPInterface {
  getState: () => AppState;
  getTasks: (filter?: 'pending' | 'overdue' | 'all') => Task[];
  
  // Task Operations
  verifyTask: (taskId: string, agentName: string, notes?: string) => void;
  failTask: (taskId: string, agentName: string, reason: string) => void;
  addTask: (weekId: string, description: string, type: Task['type'], verificationCriteria?: string, dueDate?: string) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;

  // Lifecycle Operations
  addSprint: (title: string, objective: string, startDate: string, endDate: string) => void;
  addWeek: (sprintId: string, title: string, theme: string, startDate: string, endDate: string) => void;

  // Chat Operations
  sendChatMessage: (sender: 'AI_Overseer', content: string) => void;

  // System Operations
  updateMetric: (metric: string, value: any) => void;
  
  // Dynamic Features
  addCustomMetric: (label: string, target: number, unit: string, color: 'blue'|'green'|'purple'|'red') => void;
  updateCustomMetric: (id: string, value: number) => void;
  deleteCustomMetric: (id: string) => void;
  addRule: (condition: string, consequence: string) => void;
  deleteRule: (id: string) => void;

  addLog: (actor: string, action: string, details: string, level: 'info'|'warning'|'critical'|'success') => void;
  triggerConsequence: (ruleId: string) => void;
  importState: (newState: AppState) => void;
  
  // Remote Connection
  connectRemote: (url: string) => void;
  disconnectRemote: () => void;
}

declare global {
  interface Window {
    SentinelAPI: MCPInterface;
  }
}

let socket: WebSocket | null = null;

export const initializeMCP = (
  state: AppState, 
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  
  const api: MCPInterface = {
    
    getState: () => state,

    getTasks: (filter = 'all') => {
      const allTasks = state.sprints.flatMap(s => s.weeks.flatMap(w => w.tasks));
      if (filter === 'all') return allTasks;
      return allTasks.filter(t => t.status === filter);
    },

    addTask: (weekId, description, type, verificationCriteria, dueDate) => {
      setState(prev => {
        const newTask: Task = {
          id: `t-${Date.now()}`,
          description,
          status: 'pending',
          type,
          verificationCriteria,
          dueDate
        };

        const newSprints = prev.sprints.map(s => ({
          ...s,
          weeks: s.weeks.map(w => {
            if (w.id === weekId) {
              return { ...w, tasks: [...w.tasks, newTask] };
            }
            return w;
          })
        }));

        return {
           ...prev,
           sprints: newSprints,
           logs: [{
             id: Date.now().toString(),
             timestamp: new Date().toISOString(),
             actor: 'AI_Overseer',
             action: 'TASK_CREATED',
             details: `Created task: ${description} (Due: ${dueDate || 'None'})`,
             level: 'info'
           }, ...prev.logs]
        }
      });
    },

    updateTask: (taskId, updates) => {
       setState(prev => ({
         ...prev,
         sprints: prev.sprints.map(s => ({
           ...s,
           weeks: s.weeks.map(w => ({
             ...w,
             tasks: w.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
           }))
         })),
         logs: [{
             id: Date.now().toString(),
             timestamp: new Date().toISOString(),
             actor: 'AI_Overseer',
             action: 'TASK_UPDATED',
             details: `Updated task ${taskId}`,
             level: 'info'
           }, ...prev.logs]
       }));
    },

    deleteTask: (taskId) => {
      setState(prev => ({
         ...prev,
         sprints: prev.sprints.map(s => ({
           ...s,
           weeks: s.weeks.map(w => ({
             ...w,
             tasks: w.tasks.filter(t => t.id !== taskId)
           }))
         })),
         logs: [{
             id: Date.now().toString(),
             timestamp: new Date().toISOString(),
             actor: 'AI_Overseer',
             action: 'TASK_DELETED',
             details: `Deleted task ${taskId}`,
             level: 'warning'
           }, ...prev.logs]
       }));
    },

    verifyTask: (taskId: string, agentName: string, notes: string = '') => {
      console.log(`[MCP] Verifying task ${taskId} by ${agentName}`);
      setState(prev => {
        const newSprints = prev.sprints.map(s => ({
          ...s,
          weeks: s.weeks.map(w => ({
            ...w,
            tasks: w.tasks.map(t => {
              if (t.id === taskId) {
                return { 
                  ...t, 
                  status: 'verified' as Status, 
                  verifiedBy: agentName,
                  completedAt: t.completedAt || new Date().toISOString()
                };
              }
              return t;
            })
          }))
        }));
        
        const newLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          actor: agentName as any,
          action: 'TASK_VERIFICATION',
          details: `Task ${taskId} verified by ${agentName}. ${notes}`,
          level: 'success' as const
        };

        return { ...prev, sprints: newSprints, logs: [newLog, ...prev.logs] };
      });
    },

    failTask: (taskId: string, agentName: string, reason: string) => {
       console.log(`[MCP] Failing task ${taskId} by ${agentName}`);
       setState(prev => {
        const newSprints = prev.sprints.map(s => ({
          ...s,
          weeks: s.weeks.map(w => ({
            ...w,
            tasks: w.tasks.map(t => {
              if (t.id === taskId) {
                return { ...t, status: 'failed' as Status, verifiedBy: agentName };
              }
              return t;
            })
          }))
        }));

        const newLevel = Math.min(prev.consequenceLevel + 10, 100);
        
        const newLog = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          actor: agentName as any,
          action: 'TASK_FAILURE',
          details: `Task ${taskId} marked FAILED. Reason: ${reason}. Consequence Level increased to ${newLevel}%`,
          level: 'critical' as const
        };

        return { 
          ...prev, 
          sprints: newSprints, 
          logs: [newLog, ...prev.logs],
          consequenceLevel: newLevel
        };
      });
    },

    addSprint: (title, objective, startDate, endDate) => {
      setState(prev => {
        const newSprint: Sprint = {
          id: `sprint-${Date.now()}`,
          title,
          objective,
          dateRange: `${startDate} - ${endDate}`,
          weeks: []
        };
        return {
          ...prev,
          sprints: [...prev.sprints, newSprint],
          logs: [{
             id: Date.now().toString(),
             timestamp: new Date().toISOString(),
             actor: 'AI_Overseer',
             action: 'SPRINT_CREATED',
             details: `Initialized ${title}`,
             level: 'info'
           }, ...prev.logs]
        };
      });
    },

    addWeek: (sprintId, title, theme, startDate, endDate) => {
      setState(prev => {
        const targetSprint = prev.sprints.find(s => s.id === sprintId);
        if (!targetSprint) return prev;

        const weekNum = targetSprint.weeks.length + prev.sprints.flatMap(s => s.weeks).length + 1; // Global week count approximation
        
        const newWeek: Week = {
          id: `w-${Date.now()}`,
          number: weekNum,
          title,
          theme,
          dateRange: `${startDate} - ${endDate}`,
          isCurrent: false,
          tasks: []
        };

        const newSprints = prev.sprints.map(s => {
          if (s.id === sprintId) {
            return { ...s, weeks: [...s.weeks, newWeek] };
          }
          return s;
        });

        return {
          ...prev,
          sprints: newSprints,
           logs: [{
             id: Date.now().toString(),
             timestamp: new Date().toISOString(),
             actor: 'AI_Overseer',
             action: 'WEEK_ADDED',
             details: `Added week to ${targetSprint.title}`,
             level: 'info'
           }, ...prev.logs]
        };
      });
    },

    sendChatMessage: (sender, content) => {
      setState(prev => ({
        ...prev,
        chatHistory: [...prev.chatHistory, {
          id: Date.now().toString(),
          sender,
          content,
          timestamp: new Date().toISOString()
        }]
      }));
    },

    updateMetric: (metric: string, value: any) => {
      setState(prev => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [metric]: value
        }
      }));
    },
    
    addCustomMetric: (label, target, unit, color) => {
        setState(prev => ({
            ...prev,
            customMetrics: [...(prev.customMetrics || []), {
                id: `cm-${Date.now()}`,
                label,
                target,
                unit,
                color,
                value: 0
            }]
        }));
    },
    
    updateCustomMetric: (id, value) => {
        setState(prev => ({
            ...prev,
            customMetrics: (prev.customMetrics || []).map(m => 
                m.id === id ? { ...m, value } : m
            )
        }));
    },
    
    deleteCustomMetric: (id) => {
        setState(prev => ({
            ...prev,
            customMetrics: (prev.customMetrics || []).filter(m => m.id !== id)
        }));
    },
    
    addRule: (condition, consequence) => {
        setState(prev => ({
            ...prev,
            rules: [...prev.rules, {
                id: `r-${Date.now()}`,
                condition,
                consequence,
                status: 'active'
            }]
        }));
    },
    
    deleteRule: (id) => {
        setState(prev => ({
            ...prev,
            rules: prev.rules.filter(r => r.id !== id)
        }));
    },

    addLog: (actor, action, details, level) => {
      setState(prev => ({
        ...prev,
        logs: [{
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          actor: actor as any,
          action,
          details,
          level
        }, ...prev.logs]
      }));
    },

    triggerConsequence: (ruleId) => {
       setState(prev => {
         const rule = prev.rules.find(r => r.id === ruleId);
         const details = rule ? `Consequence Triggered: ${rule.consequence}` : `Rule ${ruleId} triggered`;
         
         return {
           ...prev,
           consequenceLevel: Math.min(prev.consequenceLevel + 25, 100),
           rules: prev.rules.map(r => r.id === ruleId ? { ...r, status: 'triggered' } : r),
           logs: [{
             id: Date.now().toString(),
             timestamp: new Date().toISOString(),
             actor: 'AI_Overseer',
             action: 'CONSEQUENCE_TRIGGERED',
             details,
             level: 'critical'
           }, ...prev.logs]
         };
       });
    },

    importState: (newState: any) => {
      if (!newState || typeof newState !== 'object') {
          throw new Error("Invalid format: Root must be an object");
      }
      
      const requiredKeys = ['user', 'sprints', 'metrics', 'logs', 'chatHistory', 'rules'];
      const missingKeys = requiredKeys.filter(key => !(key in newState));
      
      if (missingKeys.length > 0) {
          throw new Error(`Invalid format: Missing keys [${missingKeys.join(', ')}]`);
      }

      if (!Array.isArray(newState.sprints) || !Array.isArray(newState.logs)) {
          throw new Error("Invalid format: Sprints or Logs must be arrays");
      }

      if (typeof newState.user?.name !== 'string') {
          throw new Error("Invalid format: Malformed User Profile");
      }

      setState(newState);
    },

    connectRemote: (url: string) => {
        if (socket) {
            socket.close();
        }

        try {
            socket = new WebSocket(url);
            
            socket.onopen = () => {
                setState(prev => ({
                    ...prev,
                    user: { ...prev.user, isRemoteConnected: true, remoteUrl: url },
                    logs: [{
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        actor: 'System',
                        action: 'REMOTE_LINK',
                        details: `Uplink established to ${url}`,
                        level: 'success'
                    }, ...prev.logs]
                }));
            };

            socket.onclose = () => {
                setState(prev => ({
                    ...prev,
                    user: { ...prev.user, isRemoteConnected: false },
                    logs: [{
                        id: Date.now().toString(),
                        timestamp: new Date().toISOString(),
                        actor: 'System',
                        action: 'REMOTE_DISCONNECT',
                        details: `Uplink severed`,
                        level: 'warning'
                    }, ...prev.logs]
                }));
            };
            
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    // Protocol: { action: "addTask", args: [...] }
                    if (data.action && typeof api[data.action as keyof MCPInterface] === 'function') {
                        
                        const fn = api[data.action as keyof MCPInterface] as Function;
                        const result = fn(...(data.args || []));
                        
                        // Send response if return ID is provided or request expects data
                        if (socket && socket.readyState === WebSocket.OPEN) {
                           socket.send(JSON.stringify({
                               type: 'RESPONSE',
                               requestId: data.requestId,
                               result: result,
                               status: 'OK'
                           })); 
                        }
                    }
                } catch (e) {
                    console.error("MCP Execution Error", e);
                }
            };

        } catch (e) {
             console.error("Connection Failed", e);
        }
    },
    
    disconnectRemote: () => {
        if(socket) {
            socket.close();
            socket = null;
        }
    }
  };
  
  window.SentinelAPI = api;
};
