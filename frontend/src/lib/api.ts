/**
 * API Client Utility for BowlSmart Backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';


export interface BowlerProfile {
  age: number;
  height_cm: number;
  weight_kg: number;
  dominant_arm: 'right' | 'left';
  bowling_style: 'seam' | 'swing' | 'express_pace' | 'spin';
  experience_level: 'beginner' | 'club' | 'academy' | 'professional';
  self_reported_pace?: number;
  camera_angle: 'side_on' | 'front_on' | 'behind';
}

export interface AnalysisJobResponse {
  job_id: string;
  status: string;
}

export interface AnalysisStatusResponse {
  job_id: string;
  status: 'processing' | 'complete' | 'failed';
  progress: number;
  current_step: string;
  error?: string;
}

export const api = {
  /**
   * Health check to ping the backend
   */
  async healthCheck(): Promise<{ status: string }> {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  /**
   * Start a new video analysis job
   */
  async startAnalysis(videoFile: File, profile: BowlerProfile, userId?: string): Promise<AnalysisJobResponse> {
    const formData = new FormData();
    formData.append('video', videoFile);
    if (userId) formData.append('user_id', userId);
    
    // Append profile fields to formData
    Object.entries(profile).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const res = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to start analysis: ${errorText}`);
    }

    return res.json();
  },

  /**
   * Check the status of an ongoing analysis job
   */
  async getAnalysisStatus(jobId: string): Promise<AnalysisStatusResponse> {
    const res = await fetch(`${API_BASE_URL}/analyze/${jobId}/status`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Job not found');
      throw new Error('Failed to get analysis status');
    }
    return res.json();
  },

  /**
   * Retrieve the final result of a completed analysis job
   */
  async getAnalysisResult(jobId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/analyze/${jobId}/result`);
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Failed to get results: ${errorText}`);
    }
    return res.json();
  },

  /**
   * Get the URL for the annotated skeleton-overlay video
   */
  getAnnotatedVideoUrl(jobId: string): string {
    return `${API_BASE_URL}/analyze/${jobId}/video`;
  },

  /**
   * Get all completed reports
   */
  async getReports(userId?: string): Promise<any> {
    const url = userId ? `${API_BASE_URL}/reports?user_id=${userId}` : `${API_BASE_URL}/reports`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  /**
   * Send a chat message to Coach BowlSmart about a specific phase
   */
  async chatWithCoach(jobId: string, phase: string, message: string): Promise<{ reply: string; phase: string }> {
    const res = await fetch(`${API_BASE_URL}/analyze/${jobId}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, phase }),
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Chat failed: ${errorText}`);
    }
    return res.json();
  },

  /**
   * Get available phases for chat
   */
  async getChatPhases(jobId: string): Promise<{ phases: Array<{ id: string; name: string; focus_areas: string[] }> }> {
    const res = await fetch(`${API_BASE_URL}/analyze/${jobId}/chat/phases`);
    if (!res.ok) throw new Error('Failed to get chat phases');
    return res.json();
  },

  /**
   * Get raw keypoints timeseries and phase frames for comparison player
   */
  async getReportKeypoints(jobId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/reports/${jobId}/keypoints`);
    if (!res.ok) throw new Error('Failed to get report keypoints');
    return res.json();
  },

  /**
   * Compare two reports and return metric deltas
   */
  async compareReports(jobIdA: string, jobIdB: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/reports/${jobIdA}/compare/${jobIdB}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (!res.ok) throw new Error('Failed to compare reports');
    return res.json();
  },

  /**
   * Squads API
   */
  async getSquads(userId: string): Promise<any[]> {
    const res = await fetch(`${API_BASE_URL}/squads?user_id=${userId}`);
    if (!res.ok) throw new Error('Failed to fetch squads');
    return res.json();
  },

  async createSquad(name: string, coachId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/squads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, coach_id: coachId })
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to create squad');
    }
    return res.json();
  },

  async joinSquad(inviteCode: string, bowlerId: string, name: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/squads/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: inviteCode, bowler_id: bowlerId, name })
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(errorText || 'Failed to join squad');
    }
    return res.json();
  },

  async getSquadDashboard(squadId: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/squads/${squadId}/dashboard`);
    if (!res.ok) throw new Error('Failed to fetch squad dashboard');
    return res.json();
  },

  /**
   * Physiotherapy Booking
   */
  async bookPhysio(therapistId: string, therapistName: string, userName: string, userEmail: string): Promise<any> {
    const res = await fetch(`${API_BASE_URL}/physio/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        therapist_id: therapistId,
        therapist_name: therapistName,
        user_name: userName,
        user_email: userEmail
      })
    });
    if (!res.ok) throw new Error('Failed to book physiotherapy session');
    return res.json();
  }
};
