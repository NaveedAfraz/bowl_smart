/**
 * Supabase Client for BowlSmart
 * Handles authentication and database operations
 */

import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  user_id: string;
  full_name: string;
  age: number;
  height_cm: number;
  weight_kg: number;
  dominant_arm: 'right' | 'left';
  bowling_style: string;
  experience_level: string;
  self_reported_pace: number | null;
  created_at: string;
  updated_at: string;
};

export type AnalysisRecord = {
  id: string;
  user_id: string;
  job_id: string;
  overall_score: number;
  phase_scores: any;
  biomechanics: any;
  injury_risk: any;
  pace_leaks: any;
  max_pace_potential: number;
  ai_report: any;
  phase_timestamps: any;
  video_filename: string;
  created_at: string;
};
