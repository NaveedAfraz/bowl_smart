/**
 * Database operations for BowlSmart
 * Handles profile CRUD and analysis persistence via Supabase
 */

import { supabase } from './supabase';
import type { Profile, AnalysisRecord } from './supabase';

export const db = {
  // ── Profiles ──────────────────────────────────────────────

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return null;
    return data;
  },

  async upsertProfile(userId: string, profile: Partial<Profile>): Promise<{ error: any }> {
    const { error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        ...profile,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    return { error };
  },

  // ── Analyses ──────────────────────────────────────────────

  async saveAnalysis(userId: string, jobId: string, result: any, videoFilename: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('analyses')
      .insert({
        user_id: userId,
        job_id: jobId,
        overall_score: result.overall_score,
        phase_scores: result.phase_scores,
        biomechanics: result.biomechanics,
        injury_risk: result.injury_risk,
        pace_leaks: result.pace_leaks,
        max_pace_potential: result.max_pace_potential,
        ai_report: result.ai_report,
        phase_timestamps: result.phase_timestamps || {},
        video_filename: videoFilename,
      });

    return { error };
  },

  async getUserAnalyses(userId: string): Promise<AnalysisRecord[]> {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return data || [];
  },

  async getAnalysis(analysisId: string): Promise<AnalysisRecord | null> {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', analysisId)
      .single();

    if (error) return null;
    return data;
  },

  async getAnalysisByJobId(jobId: string): Promise<AnalysisRecord | null> {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('job_id', jobId)
      .single();

    if (error) return null;
    return data;
  },

  // ── Chat Messages ─────────────────────────────────────────

  async saveChatMessage(userId: string, jobId: string, phase: string, role: string, content: string) {
    await supabase
      .from('chat_messages')
      .insert({ user_id: userId, job_id: jobId, phase, role, content });
  },

  async getChatHistory(jobId: string, phase: string) {
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content, created_at')
      .eq('job_id', jobId)
      .eq('phase', phase)
      .order('created_at', { ascending: true });

    return data || [];
  },
};
