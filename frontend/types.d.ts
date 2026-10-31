/**
 * JOBNEX Career Intelligence Platform
 * TypeScript Domain Model & API Contract Definitions
 */

export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Hybrid';
export type JobStatus = 'Active' | 'Draft' | 'Paused' | 'Closed' | 'Archived';
export type CandidateStage = 'Applied' | 'Screening' | 'Interview' | 'Technical Round' | 'HR Round' | 'Offer' | 'Hired' | 'Rejected';

export interface ExtractedJobDetails {
  id?: string | number;
  jobId?: number;
  title: string;
  company?: string | null;
  location?: string | null;
  jobType?: JobType;
  experience?: string | null;
  requiredSkills: string[];
  preferredSkills: string[];
  certifications?: string[];
  keywords: string[];
  responsibilities: string[];
  rawText?: string;
  sourceFile?: string;
}

export interface TailoringSuggestion {
  id: string;
  category: 'Content Improvements' | 'Skill Improvements' | 'Experience Improvements' | 'ATS Optimization Tips';
  title: string;
  description: string;
  actionableSnippet?: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedImpactPoints: number;
}

export interface PriorityItem {
  id: string;
  level: 'High Priority' | 'Medium Priority' | 'Low Priority';
  title: string;
  detail: string;
  pointsBoost: number;
}

export interface JobMatchAnalysisResult {
  analysisId: number;
  jobId: number;
  matchScore: number; // 0 - 100
  scoreLabel: 'Strong Match' | 'Moderate Alignment' | 'Critical Gaps Detected';
  keywordMatch: {
    matched: string[];
    missing: string[];
    matchPercentage: number;
    totalKeywords: number;
  };
  skillGap: {
    skillsFound: string[];
    skillsMissing: string[];
    criticalMissingSkills: string[];
    coveragePercentage: number;
  };
  tailoringSuggestions: TailoringSuggestion[];
  priorityMeter: {
    high: PriorityItem[];
    medium: PriorityItem[];
    low: PriorityItem[];
    potentialScoreBoost: number;
  };
  visualizations: {
    atsScore: number;
    keywordMatchPct: number;
    skillCoveragePct: number;
    passingScoreBenchmark: number; // e.g. 75
  };
  analyzedAt: string;
}

export interface RecruiterJob {
  id: string;
  title: string;
  company: string;
  department: string | null;
  location: string | null;
  status: JobStatus;
  applicantsCount: number;
  createdDate: string;
  experienceLevel: string | null;
  requiredSkills: string[];
  description: string;
}

export interface InterviewNote {
  id: string;
  author: string;
  role: string;
  date: string;
  text: string;
  rating?: number; // 1-5
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  location: string | null;
  targetJobId: string | null;
  targetJobTitle: string;
  stage: CandidateStage;
  atsScore: number;
  experience: string;
  skills: string[];
  missingSkills?: string[];
  resumeSummary: string;
  appliedDate: string | null;
  interviewNotes: InterviewNote[];
  source?: string | null;
  avatarUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

export interface RecruiterDashboardMetrics {
  totalJobs: number;
  activeJobs: number;
  candidatesApplied: number;
  interviewsScheduled: number;
  hiresCompleted: number;
  trends: {
    jobsTrend: string;
    activeTrend: string;
    candidatesTrend: string;
    interviewsTrend: string;
    hiresTrend: string;
  };
}

export interface FunnelStageMetric {
  stage: CandidateStage;
  count: number;
  conversionRate: number; // percentage of previous stage or overall
  dropoutCount: number;
}

export interface SourceMetric {
  source: string;
  candidatesCount: number;
  hiresCount: number;
  percentage: number;
}

export interface RecruitmentAnalytics {
  funnel: FunnelStageMetric[];
  sources: SourceMetric[];
  timeToHireDays: {
    average: number;
    industryBenchmark: number;
    breakdown: {
      sourcingDays: number;
      screeningDays: number;
      techRoundDays: number;
      offerDays: number;
    };
  };
  conversionRate: {
    overallConversionPct: number;
    offerAcceptancePct: number;
    totalOffers: number;
    totalHires: number;
  };
}
