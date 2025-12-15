
export type Status = 'pending' | 'in-progress' | 'completed' | 'verified' | 'failed';

export interface SubTask {
  id: string;
  description: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  description: string;
  status: Status;
  dueDate?: string; // ISO Date string
  completedAt?: string; // ISO Date string
  type: 'application' | 'certification' | 'portfolio' | 'networking' | 'finance' | 'admin';
  verifiedBy?: string; // 'user' or 'ai-agent'
  verificationCriteria?: string; // Instructions for AI to verify completion
  subTasks?: SubTask[];
}

export interface Week {
  id: string;
  number: number;
  title: string;
  theme: string;
  dateRange: string;
  tasks: Task[];
  isCurrent: boolean;
}

export interface Sprint {
  id: string;
  title: string;
  dateRange: string;
  objective: string;
  weeks: Week[];
}

export interface Metrics {
  applicationsSent: number;
  applicationsTarget: number;
  interviews: number;
  offers: number;
  certifications: string[];
  debtPaid: number;
  portfolioItems: number;
}

export interface CustomMetric {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  color: 'blue' | 'green' | 'purple' | 'red';
}

export interface SystemLog {
  id: string;
  timestamp: string;
  actor: 'User' | 'AI_Overseer' | 'Remote_Agent';
  action: string;
  details: string;
  level: 'info' | 'warning' | 'critical' | 'success';
}

export interface ChatMessage {
  id: string;
  sender: 'User' | 'AI_Overseer';
  content: string;
  timestamp: string;
}

export interface Rule {
  id: string;
  condition: string;
  consequence: string;
  status: 'active' | 'triggered' | 'resolved';
}

export interface UserProfile {
  name: string;
  isAuthenticated: boolean;
  isAIConnected: boolean;
  remoteUrl?: string;
  isRemoteConnected?: boolean;
}

export interface AppState {
  user: UserProfile;
  sprints: Sprint[];
  metrics: Metrics;
  customMetrics: CustomMetric[];
  logs: SystemLog[];
  chatHistory: ChatMessage[];
  rules: Rule[];
  consequenceLevel: number; // 0-100, where 100 is critical lockdown
}