import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Clock, TrendingUp, Users, Calendar } from 'lucide-react';

function fmtDuration(seconds) {
  if (!seconds || seconds < 60) return `${seconds || 0}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function UserTimeAnalytics() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7); // days

  useEffect(() => {
    loadSessions();
  }, [range]);

  const loadSessions = async () => {
    setLoading(true);
    try {
      const all = await base44.entities.UserSession.list('-sessionStart', 500);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - range);
      const filtered = all.filter(s => new Date(s.sessionStart) >= cutoff && s.durationSeconds > 0);
      setSessions(filtered);
    } catch (e) {
      console.error('Failed to load sessions:', e);
    }
    setLoading(false);
  };

  // Aggregate by user
  const userMap = {};
  for (const s of sessions) {
    if (!s.profileId) continue;
    if (!userMap[s.profileId]) {
      userMap[s.profileId] = {
        profileId: s.profileId,
        username: s.username || 'Unknown',
        totalSeconds: 0,
        sessionCount: 0,
        lastSeen: s.sessionStart,
      };
    }
    userMap[s.profileId].totalSeconds += s.durationSeconds || 0;
    userMap[s.profileId].sessionCount += 1;
    if (new Date(s.sessionStart) > new Date(userMap[s.profileId].lastSeen)) {
      userMap[s.profileId].lastSeen = s.sessionStart;
    }
  }

  const ranked = Object.values(userMap).sort((a, b) => b.totalSeconds - a.totalSeconds);
  const totalSeconds = ranked.reduce((sum, u) => sum + u.totalSeconds, 0);
  const topUser = ranked[0];

  return (
    <div className="space-y-4">
      {/* Header + Range Picker */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-400" /> Time Spent Analytics
        </h3>
        <div className="flex gap-1">
          {[7, 14, 30].map(d => (
            <button
              key={d}
              onClick={() => setRange(d)}
              className={`text-xs px-3 py-1 rounded-lg transition-all ${range === d ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600">
          <div className="flex items-center gap-2 mb-1"><Users className="w-3.5 h-3.5 text-blue-400" /><span className="text-xs text-slate-400">Active Users</span></div>
          <p className="text-xl font-bold text-white">{ranked.length}</p>
        </div>
        <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600">
          <div className="flex items-center gap-2 mb-1"><Clock className="w-3.5 h-3.5 text-green-400" /><span className="text-xs text-slate-400">Total Time</span></div>
          <p className="text-xl font-bold text-white">{fmtDuration(totalSeconds)}</p>
        </div>
        <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600">
          <div className="flex items-center gap-2 mb-1"><Calendar className="w-3.5 h-3.5 text-amber-400" /><span className="text-xs text-slate-400">Sessions</span></div>
          <p className="text-xl font-bold text-white">{sessions.length}</p>
        </div>
        <div className="bg-slate-700/60 rounded-xl p-3 border border-slate-600">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="w-3.5 h-3.5 text-pink-400" /><span className="text-xs text-slate-400">Top User</span></div>
          <p className="text-sm font-bold text-white truncate">{topUser?.username || '—'}</p>
        </div>
      </div>

      {/* Leaderboard */}
      {loading ? (
        <div className="text-center py-8 text-slate-400">Loading sessions...</div>
      ) : ranked.length === 0 ? (
        <div className="text-center py-8 text-slate-400">No session data yet for this period.</div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 mb-2">Ranked by total time in last {range} days</p>
          {ranked.map((u, i) => {
            const pct = totalSeconds > 0 ? Math.round((u.totalSeconds / totalSeconds) * 100) : 0;
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div key={u.profileId} className="bg-slate-700/50 rounded-xl p-3 border border-slate-600/50 flex items-center gap-3">
                <span className="text-lg w-6 text-center">{medals[i] || `#${i + 1}`}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white truncate">{u.username}</span>
                    <span className="text-sm text-indigo-300 font-bold ml-2 shrink-0">{fmtDuration(u.totalSeconds)}</span>
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-1.5">
                    <div
                      className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-slate-500">{u.sessionCount} session{u.sessionCount !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-slate-500">
                      Last: {new Date(u.lastSeen).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}