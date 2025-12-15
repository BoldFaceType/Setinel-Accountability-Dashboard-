import { AppState, Sprint, Rule, ChatMessage } from './types';

export const INITIAL_METRICS = {
  applicationsSent: 0,
  applicationsTarget: 50,
  interviews: 0,
  offers: 0,
  certifications: [],
  debtPaid: 0,
  portfolioItems: 0,
};

const SPRINT_1: Sprint = {
  id: 'sprint-1',
  title: 'Sprint 1: Job Application Blitz',
  dateRange: 'Dec 9, 2025 - Jan 19, 2026',
  objective: '25+ Applications, AZ-900, Portfolio Live',
  weeks: [
    {
      id: 's1-w1',
      number: 1,
      title: 'Foundation Reset',
      theme: 'Stop Building, Start Shipping',
      dateRange: 'Dec 9-15',
      isCurrent: false,
      tasks: [
        { id: 't1', description: 'LinkedIn Overhaul (Headline, About, Experience)', status: 'completed', completedAt: '2025-12-10T14:00:00Z', type: 'admin', verificationCriteria: 'Check LinkedIn public profile for keywords: "Clinical AI", "Azure", "Python".' },
        { id: 't2', description: 'Deploy Portfolio Site (Bio, Placeholders)', status: 'pending', type: 'portfolio', verificationCriteria: 'Verify public URL returns 200 OK and contains "About Me" section.' },
        { id: 't3', description: 'Complete AZ-900 Learning Path', status: 'pending', type: 'certification', verificationCriteria: 'Upload completion screenshot or badge link.' },
        { id: 't4', description: 'Schedule AZ-900 Exam', status: 'pending', type: 'certification', verificationCriteria: 'Verify email confirmation from PearsonVUE.' },
      ]
    },
    {
      id: 's1-w2',
      number: 2,
      title: 'Certification + First Apps',
      theme: 'Credentials & Cold Outreach',
      dateRange: 'Dec 16-22',
      isCurrent: false,
      tasks: [
        { id: 't5', description: 'Pass AZ-900 Exam', status: 'pending', type: 'certification', verificationCriteria: 'Verify Microsoft Credly badge URL.' },
        { id: 't6', description: 'Setup Job Alerts (6 keywords)', status: 'pending', type: 'admin', verificationCriteria: 'Manual review of alert settings screenshot.' },
        { id: 't7', description: 'Identify 15 Target Companies', status: 'pending', type: 'application', verificationCriteria: 'Check for list in "Target Companies.md" in project root.' },
        { id: 't8', description: 'Submit 5 Applications', status: 'pending', type: 'application', verificationCriteria: 'Verify 5 confirmation emails or application portal statuses.' },
      ]
    },
    {
      id: 's1-w3',
      number: 3,
      title: 'Holiday Maintenance',
      theme: 'Dont Lose Momentum',
      dateRange: 'Dec 23-29',
      isCurrent: false,
      tasks: [
        { id: 't9', description: 'Submit 5 Applications', status: 'pending', type: 'application', verificationCriteria: 'Verify 5 confirmation emails.' },
        { id: 't10', description: 'Start Clinical NLP Demo Project', status: 'pending', type: 'portfolio', verificationCriteria: 'Check GitHub repo creation and initial commit.' },
        { id: 't11', description: '2 LinkedIn Connection Requests', status: 'pending', type: 'networking', verificationCriteria: 'Manual confirmation.' },
      ]
    },
    {
      id: 's1-w4',
      number: 4,
      title: 'New Year Push',
      theme: 'While Others Rest, You Execute',
      dateRange: 'Dec 30 - Jan 5',
      isCurrent: false,
      tasks: [
        { id: 't12', description: 'Finish & Deploy Clinical NLP Demo', status: 'pending', type: 'portfolio', verificationCriteria: 'Verify live demo URL allows text input and returns NLP analysis.' },
        { id: 't13', description: 'Submit 5 Applications (Easy Apply)', status: 'pending', type: 'application', verificationCriteria: 'Verify 5 confirmation emails.' },
        { id: 't14', description: 'Sprint 1 Analysis: Identify 10 new targets', status: 'pending', type: 'admin', verificationCriteria: 'Check "Sprint 1 Analysis.md" for target list.' },
      ]
    },
    {
      id: 's1-w5',
      number: 5,
      title: 'Full Throttle',
      theme: 'Volume + Quality',
      dateRange: 'Jan 6-12',
      isCurrent: false,
      tasks: [
        { id: 't15', description: 'Submit 5 Applications', status: 'pending', type: 'application', verificationCriteria: 'Verify 5 confirmation emails.' },
        { id: 't16', description: 'Create MCP Mitigation GitHub Repo', status: 'pending', type: 'portfolio', verificationCriteria: 'Check GitHub repo existence and README.' },
        { id: 't17', description: 'LinkedIn Post about MCP Project', status: 'pending', type: 'networking', verificationCriteria: 'Verify URL of LinkedIn post.' },
        { id: 't18', description: 'Join 1 Healthcare AI Community', status: 'pending', type: 'networking', verificationCriteria: 'Screenshot of discord/slack introduction.' },
      ]
    },
    {
      id: 's1-w6',
      number: 6,
      title: 'Sprint Close',
      theme: 'Cross the Finish Line',
      dateRange: 'Jan 13-19',
      isCurrent: false,
      tasks: [
        { id: 't19', description: 'Submit 5+ Applications (Reach 28+ Total)', status: 'pending', type: 'application', verificationCriteria: 'Verify Application Tracker total count > 28.' },
        { id: 't20', description: 'Send Follow-ups to applications >7 days', status: 'pending', type: 'networking', verificationCriteria: 'Manual review.' },
        { id: 't21', description: 'Complete Sprint 1 Retrospective', status: 'pending', type: 'admin', verificationCriteria: 'Check "Sprint 1 Retrospective.md".' },
      ]
    }
  ]
};

const SPRINT_2: Sprint = {
  id: 'sprint-2',
  title: 'Sprint 2: Interview Pipeline',
  dateRange: 'Jan 20, 2026 - Mar 2, 2026',
  objective: '3+ Interviews, 1 Offer, AI-102 Cert',
  weeks: [
    {
      id: 's2-w7',
      number: 7,
      title: 'Sprint 2 Kickoff',
      theme: 'Assess, Adjust, Accelerate',
      dateRange: 'Jan 20-26',
      isCurrent: true,
      tasks: [
        { id: 't22', description: 'Sprint 1 Deep Analysis Doc', status: 'pending', type: 'admin', verificationCriteria: 'Check file "Analysis_Deep_Sprint1.pdf".', dueDate: '2026-01-23' },
        { id: 't23', description: 'Enroll in AI-102 Path', status: 'pending', type: 'certification', verificationCriteria: 'Receipt or enrollment screenshot.', dueDate: '2026-01-21' },
        { id: 't24', description: 'Submit 5 Applications', status: 'pending', type: 'application', verificationCriteria: 'Verify 5 confirmation emails.', dueDate: '2026-01-25' },
        { id: 't25', description: 'Schedule AI-102 Exam', status: 'pending', type: 'certification', verificationCriteria: 'Verify exam scheduling confirmation.', dueDate: '2026-01-24' },
      ]
    },
    {
      id: 's2-w8',
      number: 8,
      title: 'Pipeline Building',
      theme: 'Fill the Funnel',
      dateRange: 'Jan 27 - Feb 2',
      isCurrent: false,
      tasks: [
        { id: 't26', description: 'Submit 5 Applications', status: 'pending', type: 'application', verificationCriteria: 'Verify 5 confirmation emails.', dueDate: '2026-01-30' },
        { id: 't27', description: 'Create Story Bank (STAR format)', status: 'pending', type: 'admin', verificationCriteria: 'Check "STAR_Stories.md" for 5+ stories.' },
        { id: 't28', description: 'Complete AI-102 Modules 3-5', status: 'pending', type: 'certification', verificationCriteria: 'Progress screenshot.' },
      ]
    },
    {
      id: 's2-w9',
      number: 9,
      title: 'Intensification',
      theme: 'Double Down on What Works',
      dateRange: 'Feb 3-9',
      isCurrent: false,
      tasks: [
        { id: 't29', description: 'Submit 5 Applications (2 Referral)', status: 'pending', type: 'application', verificationCriteria: 'Verify 5 apps, 2 with referral flags.' },
        { id: 't30', description: 'Advanced Portfolio Project (RAG or Dashboard) 50%', status: 'pending', type: 'portfolio', verificationCriteria: 'GitHub repo check: commit history active.' },
        { id: 't31', description: 'Complete AI-102 Modules 6-8', status: 'pending', type: 'certification', verificationCriteria: 'Progress screenshot.' },
      ]
    },
    {
      id: 's2-w10',
      number: 10,
      title: 'Certification + Ship',
      theme: 'Credentials Matter',
      dateRange: 'Feb 10-16',
      isCurrent: false,
      tasks: [
        { id: 't32', description: 'Take and Pass AI-102 Exam', status: 'pending', type: 'certification', verificationCriteria: 'Verify Microsoft Credly badge.' },
        { id: 't33', description: 'Deploy Advanced Project to Prod', status: 'pending', type: 'portfolio', verificationCriteria: 'Verify live URL.' },
        { id: 't34', description: 'Submit 3 Applications', status: 'pending', type: 'application', verificationCriteria: 'Verify 3 confirmation emails.' },
      ]
    },
    {
      id: 's2-w11',
      number: 11,
      title: 'Interview Mode',
      theme: 'Convert Pipeline to Offers',
      dateRange: 'Feb 17-23',
      isCurrent: false,
      tasks: [
        { id: 't35', description: 'Submit 5+ Applications (or deep interview prep)', status: 'pending', type: 'application', verificationCriteria: 'Verify applications or Mock Interview recording.' },
        { id: 't36', description: 'Send 10 LinkedIn Messages', status: 'pending', type: 'networking', verificationCriteria: 'Screenshot of sent messages.' },
        { id: 't37', description: 'Path Contingency Check (A/B/C)', status: 'pending', type: 'admin', verificationCriteria: 'Check "Contingency_Plan_Update.md".' },
      ]
    },
    {
      id: 's2-w12',
      number: 12,
      title: 'Sprint Close',
      theme: 'Measure, Learn, Plan',
      dateRange: 'Feb 24 - Mar 2',
      isCurrent: false,
      tasks: [
        { id: 't38', description: 'Final Push: Hit 50+ Total Applications', status: 'pending', type: 'application', verificationCriteria: 'Verify total count in tracker.' },
        { id: 't39', description: 'Sprint 2 Retrospective Doc', status: 'pending', type: 'admin', verificationCriteria: 'Check "Sprint 2 Retrospective.md".' },
        { id: 't40', description: 'Draft Q2 2026 Plan', status: 'pending', type: 'admin', verificationCriteria: 'Check "Q2_2026_Plan_Draft.md".' },
      ]
    }
  ]
};

const INITIAL_RULES: Rule[] = [
  { 
    id: 'r1', 
    condition: 'Avoid high-stakes binary outcomes (applications, shipping)', 
    consequence: 'Redirect to Sprint tasks. Stop Architecture, Start Shipping.', 
    status: 'active' 
  },
  { 
    id: 'r2', 
    condition: 'New Project Proposal before 10-Week Sprint Complete', 
    consequence: 'Moratorium Enforced. Request Refused.', 
    status: 'active' 
  },
  { 
    id: 'r3', 
    condition: 'Missed Weekly Application Target (5)', 
    consequence: '$100 Donation to Hated Cause', 
    status: 'active' 
  },
  {
    id: 'r4',
    condition: 'Complexity Violation (>4hr task without shipping)',
    consequence: 'Forced "Ship Ugly" Protocol',
    status: 'active'
  }
];

const INITIAL_CHAT: ChatMessage[] = [
  {
    id: 'c1',
    sender: 'AI_Overseer',
    content: 'Protocol initialized. I am monitoring for "avoidance via complexity". Current objective: 25 Applications + AZ-900. No new projects allowed.',
    timestamp: new Date().toISOString()
  }
];

export const INITIAL_STATE: AppState = {
  user: {
    name: 'Candidate',
    isAuthenticated: false,
    isAIConnected: false
  },
  sprints: [SPRINT_1, SPRINT_2],
  metrics: INITIAL_METRICS,
  customMetrics: [],
  logs: [
    {
      id: 'init-1',
      timestamp: new Date().toISOString(),
      actor: 'AI_Overseer',
      action: 'SYSTEM_INIT',
      details: 'Accountability protocols initialized. Monitoring active.',
      level: 'info'
    }
  ],
  chatHistory: INITIAL_CHAT,
  rules: INITIAL_RULES,
  consequenceLevel: 0,
};