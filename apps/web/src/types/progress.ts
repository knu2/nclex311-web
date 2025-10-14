/**
 * TypeScript interfaces for Progress Dashboard
 * Story 1.5.8: Progress Dashboard
 */

export interface CompletedConcept {
  concept_id: string;
  concept_title: string;
  concept_slug: string;
  completed_at: string;
}

export interface ChapterProgress {
  chapter_id: string;
  chapter_number: number;
  chapter_title: string;
  concept_count: number;
  completed_concept_count: number;
  completion_percentage: number;
  completed_concepts: CompletedConcept[];
}

export interface OverallProgress {
  total_concepts: number;
  completed_concepts: number;
  completion_percentage: number;
}

export interface UserProgress {
  user_id: string;
  overall_progress: OverallProgress;
  chapters: ChapterProgress[];
}

export interface ProgressDashboardProps {
  progress: UserProgress;
}
