import { Report } from '../types';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface ResolveResponse {
  success: boolean;
  message?: string;
  auditResult?: {
    success: boolean;
    confidenceScore: number;
    restorationDetails: string;
    co2OffsetKg: number;
    ecoIndexBoost: number;
    safetyScoreIncrease: number;
  };
  heroPointsAwarded?: number;
  userSession?: {
    points: number;
  };
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    points: number;
    avatar: string;
    joinedSquads: string[];
    role?: 'Volunteer' | 'Civil Servant' | 'Organizer';
  };
}

// Get stored token safely
const TOKEN_KEY = 'community_hero_token';
const getStoredToken = () => localStorage.getItem(TOKEN_KEY);

const makeHeaders = (additional: Record<string, string> = {}) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...additional,
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {

  async generateMission(userDistrict: string, reports: any[]) {
  const res = await fetch('/api/ai/mission', {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify({
      userDistrict,
      reports
    })
  });

  if (!res.ok) {
    throw new Error('Mission generation failed');
  }

  return res.json();
},



  // Authentication & Session Endpoints
  async register(name: string, email: string, password: string, avatar?: string, role?: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, avatar, role }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;

    
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    const data: AuthResponse = await res.json();
    localStorage.setItem(TOKEN_KEY, data.token);
    return data;
  },

  async getMe(): Promise<AuthResponse['user']> {
    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: makeHeaders(),
    });
    if (!res.ok) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error('Session expired or unauthorized');
    }
    return res.json();
  },

  logout() {
    localStorage.removeItem(TOKEN_KEY);
  },

  // Leaderboard sync
  async getLeaderboard(): Promise<any[]> {
    const res = await fetch('/api/leaderboard');
    if (!res.ok) {
      throw new Error('Failed to fetch leaderboard');
    }
    return res.json();
  },

  // Reports Endpoints
  async getReports(): Promise<Report[]> {
    const res = await fetch('/api/reports');
    if (!res.ok) {
      throw new Error('Failed to fetch reports');
    }
    return res.json();
  },

  async createReport(report: Partial<Report>): Promise<Report> {
    const res = await fetch('/api/reports', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify(report),
    });
    if (!res.ok) {
      throw new Error('Failed to create report');
    }
    return res.json();
  },

  async upvoteReport(id: string): Promise<Report> {
    const res = await fetch(`/api/reports/${id}/upvote`, {
      method: 'POST',
      headers: makeHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to upvote report');
    }
    return res.json();
  },

  async verifyReport(id: string): Promise<{ report: Report; points: number | null }> {
    const res = await fetch(`/api/reports/${id}/verify`, {
      method: 'POST',
      headers: makeHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to verify report');
    }
    return res.json();
  },

  async resolveReport(reportId: string, imageBase64: string): Promise<ResolveResponse> {
    const res = await fetch('/api/reports/resolve', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ reportId, image: imageBase64 }),
    });
    if (!res.ok) {
      throw new Error('Failed to resolve report');
    }
    return res.json();
  },

  // Squad Endpoints
  async joinSquad(squadId: string): Promise<{ success: boolean; joinedSquads: string[] }> {
    const res = await fetch('/api/users/join-squad', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ squadId }),
    });
    if (!res.ok) {
      throw new Error('Failed to join squad');
    }
    return res.json();
  },

  // Points manipulation
  async addPoints(amount: number): Promise<{ success: boolean; points: number }> {
    const res = await fetch('/api/users/add-points', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      throw new Error('Failed to add points');
    }
    return res.json();
  },

  async spendPoints(amount: number): Promise<{ success: boolean; points: number }> {
    const res = await fetch('/api/users/spend-points', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ amount }),
    });
    if (!res.ok) {
      throw new Error('Failed to spend points');
    }
    return res.json();
  },

  // Update user district location
  async updateDistrict(district: string): Promise<{ success: boolean; user: any }> {
    const res = await fetch('/api/users/update-district', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ district }),
    });
    if (!res.ok) {
      throw new Error('Failed to update neighborhood location');
    }
    return res.json();
  },

  // AI Assistant Endpoints
  async chatWithAssistant(messages: ChatMessage[], userDistrict?: string, activeReports?: any[]): Promise<{ text: string }> {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: makeHeaders(),
      body: JSON.stringify({ messages, userDistrict, activeReports }),
    });
    if (!res.ok) {
      throw new Error('Failed to chat with assistant');
    }
    return res.json();
  },

  // Database Management & Audit Logging Endpoints
  async getAuditLogs(): Promise<any[]> {
    const res = await fetch('/api/admin/audit-logs', {
      method: 'GET',
      headers: makeHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve audit logs');
    }
    return res.json();
  },

  async getDbStatus(): Promise<any> {
    const res = await fetch('/api/admin/db/status', {
      method: 'GET',
      headers: makeHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to retrieve database status');
    }
    return res.json();
  },

  async triggerDbBackup(): Promise<any> {
    const res = await fetch('/api/admin/db/backup', {
      method: 'POST',
      headers: makeHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to trigger database backup');
    }
    return res.json();
  },

  
};
