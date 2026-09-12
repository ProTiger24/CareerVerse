import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  Activity, CheckCircle2, Clock, Trophy, Code2, BookOpen,
  TrendingUp, Users, Calendar, BarChart3, PieChart as PieIcon,
  Award, Flame, Target, Zap
} from 'lucide-react';

/* ============================
   HELPERS
   ============================ */
const formatMinutes = (m) => {
  if (!m) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}h ${mm}m` : `${h}h`;
};

const COLORS = {
  indigo: '#6366F1',
  emerald: '#10B981',
  amber: '#F59E0B',
  red: '#EF4444',
  blue: '#3B82F6',
  pink: '#EC4899',
  purple: '#8B5CF6',
  cyan: '#06B6D4',
  green: '#22C55E',
};

const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

/* ============================
   SECTION CARD (Title header)
   ============================ */
const SectionCard = ({ icon: Icon, title, subtitle, children }) => (
  <div className="card overflow-hidden">
    <div className="px-5 py-3 border-b border-[#1F2937] flex items-center gap-2 bg-[#161B2E]">
      <Icon className="w-4 h-4 text-[#818CF8]" />
      <h3 className="text-sm font-bold text-white">{title}</h3>
      {subtitle && <span className="text-[10px] text-[#6B7280] ml-auto">{subtitle}</span>}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

/* ============================
   MAIN COMPONENT
   ============================ */
const Analytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState({
    tasks: [],
    submissions: [],
    sessions: [],
    subjects: [],
    projects: [],
    technologies: [],
    platforms: {},
  });

  const userId = user?.uid;

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);
    const unsubs = [
      onValue(ref(realtimeDb, `users/${userId}/tasks`), (s) => {
        const d = s.val();
        setAllData(prev => ({ ...prev, tasks: d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : [] }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/submissions`), (s) => {
        const d = s.val();
        setAllData(prev => ({ ...prev, submissions: d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : [] }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/codingSessions`), (s) => {
        const d = s.val();
        setAllData(prev => ({ ...prev, sessions: d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : [] }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/studySubjects`), (s) => {
        const d = s.val();
        setAllData(prev => ({
          ...prev,
          subjects: d ? Object.keys(d).map(k => ({
            id: k, ...d[k],
            chapters: d[k].chapters ? Object.keys(d[k].chapters).map(ck => ({ id: ck, ...d[k].chapters[ck] })) : []
          })) : []
        }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/projects`), (s) => {
        const d = s.val();
        setAllData(prev => ({ ...prev, projects: d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : [] }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/technologies`), (s) => {
        const d = s.val();
        setAllData(prev => ({ ...prev, technologies: d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : [] }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/cpPlatforms`), (s) => {
        setAllData(prev => ({ ...prev, platforms: s.val() || {} }));
      }),
    ];
    const t = setTimeout(() => setLoading(false), 600);
    return () => { unsubs.forEach(u => u()); clearTimeout(t); };
  }, [userId]);

  if (loading) return <div className="card p-6 text-center text-[#6B7280]">Loading analytics...</div>;

  /* ============================
     COMPUTE STATS
     ============================ */
  const { tasks, submissions, sessions, subjects, projects, technologies, platforms } = allData;

  // ---- Task stats ----
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = totalTasks - completedTasks;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // ---- Study stats ----
  const totalStudyMinutes = Math.round(sessions.reduce((s, x) => s + (x.duration || 0), 0) / 60);
  const totalSessions = sessions.length;

  // ---- Coding stats ----
  const totalSubmissions = submissions.length;
  const uniqueProblems = new Set(submissions.map(s => s.problemKey).filter(Boolean)).size;
  const totalSolved = Object.values(platforms).reduce((s, p) => s + (p.solved || 0), 0);

  // ---- Streak ----
  const streak = (() => {
    if (!submissions.length && !sessions.length) return 0;
    const allDates = [
      ...submissions.map(s => s.date),
      ...sessions.map(s => s.date),
    ];
    const uniqueDays = [...new Set(allDates)].sort().reverse();
    let s = 0;
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    for (const day of uniqueDays) {
      if (day === d.toISOString().split('T')[0]) {
        s++;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return s;
  })();

  // ============================
  // CHART 1: Task Completion Donut
  // ============================
  const taskPieData = [
    { name: 'Completed', value: completedTasks, color: COLORS.emerald },
    { name: 'Pending', value: pendingTasks, color: COLORS.amber },
  ].filter(d => d.value > 0);

  // ============================
  // CHART 2: Weekly Activity (Bar)
  // ============================
  const weeklyActivity = (() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    return days.map((dayName, i) => {
      const dayDate = new Date(weekStart);
      dayDate.setDate(weekStart.getDate() + i);
      const ds = dayDate.toISOString().split('T')[0];

      const dayTasks = tasks.filter(t => (t.taskDate || (t.createdAt || '').split('T')[0]) === ds);
      const daySessions = sessions.filter(s => s.date === ds);
      const daySubs = submissions.filter(s => s.date === ds);
      const dayMinutes = Math.round(daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);

      return {
        day: dayName,
        Tasks: dayTasks.filter(t => t.completed).length,
        Study: dayMinutes,
        Coding: daySubs.length,
      };
    });
  })();

  // ============================
  // CHART 3: Subject-wise Study Hours (Bar)
  // ============================
  const subjectStudyData = subjects.map(subj => {
    const subjSessions = sessions.filter(s =>
      s.subject === subj.id || (subj.chapters || []).some(c => c.id === s.chapterId)
    );
    const subjMinutes = Math.round(subjSessions.reduce((s, x) => s + (x.duration || 0), 0) / 60);
    return {
      name: subj.name?.substring(0, 12) || 'Untitled',
      Minutes: subjMinutes,
      Chapters: subj.chapters?.filter(c => c.status === 'completed').length || 0,
      color: subj.color || COLORS.indigo,
    };
  }).filter(s => s.Minutes > 0 || s.Chapters > 0);

  // ============================
  // CHART 4: Coding Platform Distribution (Pie)
  // ============================
  const platformPieData = Object.entries(platforms)
    .filter(([key, p]) => p && p.solved > 0)
    .map(([key, p], i) => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      value: p.solved || 0,
      color: PIE_COLORS[i % PIE_COLORS.length],
    }));

  // If no platforms with solved, use submissions distribution
  if (platformPieData.length === 0 && submissions.length > 0) {
    const byPlatform = {};
    submissions.forEach(s => {
      byPlatform[s.platform] = (byPlatform[s.platform] || 0) + 1;
    });
    Object.entries(byPlatform).forEach(([key, count], i) => {
      platformPieData.push({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        value: count,
        color: PIE_COLORS[i % PIE_COLORS.length],
      });
    });
  }

  // ============================
  // CHART 5: Learning Progress (Bar) — Subject-wise
  // ============================
  const subjectProgressData = subjects.map(subj => {
    const total = subj.chapters?.length || 0;
    const done = subj.chapters?.filter(c => c.status === 'completed').length || 0;
    const inProg = subj.chapters?.filter(c => c.status === 'in-progress').length || 0;
    return {
      name: subj.name?.substring(0, 10) || 'Untitled',
      Completed: done,
      'In Progress': inProg,
      Pending: total - done - inProg,
    };
  }).filter(s => s.Completed > 0 || s['In Progress'] > 0 || s.Pending > 0);

  // ============================
  // CHART 6: Study Trend (Last 30 days Line)
  // ============================
  const studyTrend = (() => {
    const arr = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const dayMinutes = Math.round(sessions.filter(s => s.date === ds).reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
      const daySubs = submissions.filter(s => s.date === ds).length;
      arr.push({
        date: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        Study: dayMinutes,
        Coding: daySubs * 5, // scale
      });
    }
    return arr;
  })();

  /* ============================
     KPI Stat Cards
     ============================ */
  const statCards = [
    { icon: CheckCircle2, label: 'Tasks Completed', value: `${completedTasks}/${totalTasks}`, sub: `${taskCompletionRate}%`, color: COLORS.emerald, bg: 'bg-emerald-500/10' },
    { icon: Clock, label: 'Study Time', value: formatMinutes(totalStudyMinutes), sub: `${totalSessions} sessions`, color: COLORS.indigo, bg: 'bg-[#6366F1]/10' },
    { icon: Code2, label: 'Problems Solved', value: uniqueProblems || totalSolved, sub: `${totalSubmissions} submissions`, color: COLORS.amber, bg: 'bg-amber-500/10' },
    { icon: Flame, label: 'Current Streak', value: `${streak} day${streak !== 1 ? 's' : ''}`, sub: 'Keep going!', color: COLORS.pink, bg: 'bg-pink-500/10' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* =================== KPI Cards =================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {statCards.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`card p-4 ${s.bg}`}>
            <div className="flex items-center gap-2 mb-3">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#9CA3AF]">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[10px] text-[#6B7280] mt-1">{s.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* =================== ROW 1: Task Donut + Weekly Activity =================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* Task Completion Donut */}
        <SectionCard icon={PieIcon} title="Task Statistics" subtitle="All time">
          {totalTasks === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[#6B7280]">No tasks created yet</p>
            </div>
          ) : (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={taskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {taskPieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      iconType="rect"
                      formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="p-3 rounded-xl bg-[#0F1420] border border-[#1F2937] text-center">
                  <p className="text-lg font-bold text-white">{totalTasks}</p>
                  <p className="text-[10px] text-[#6B7280] uppercase">Total</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <p className="text-lg font-bold text-emerald-400">{completedTasks}</p>
                  <p className="text-[10px] text-emerald-400/70 uppercase">Done</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-lg font-bold text-amber-400">{pendingTasks}</p>
                  <p className="text-[10px] text-amber-400/70 uppercase">Pending</p>
                </div>
              </div>
            </>
          )}
        </SectionCard>

        {/* Weekly Activity Bar */}
        <SectionCard icon={BarChart3} title="Weekly Activity" subtitle="This week">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="day" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>}
                />
                <Bar dataKey="Tasks" fill={COLORS.emerald} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Study" fill={COLORS.indigo} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Coding" fill={COLORS.amber} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {/* =================== ROW 2: Subject Study Hours + Platform Distribution =================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">

        {/* Subject-wise Study */}
        <SectionCard icon={BookOpen} title="Subject-wise Study" subtitle="Minutes per subject">
          {subjectStudyData.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[#6B7280]">No subject activity yet</p>
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectStudyData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                  <XAxis type="number" stroke="#6B7280" fontSize={11} />
                  <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={11} width={80} />
                  <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                  <Bar dataKey="Minutes" fill={COLORS.indigo} radius={[0, 4, 4, 0]}>
                    {subjectStudyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS.indigo} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </SectionCard>

        {/* Platform Distribution */}
        <SectionCard icon={Code2} title="Coding Platforms" subtitle="Problems solved">
          {platformPieData.length === 0 ? (
            <div className="text-center py-12">
              <Code2 className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-40" />
              <p className="text-sm text-[#6B7280]">No coding activity yet</p>
            </div>
          ) : (
            <>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={platformPieData} cx="50%" cy="50%" outerRadius={85} paddingAngle={2} dataKey="value">
                      {platformPieData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-2">
                {platformPieData.map((p, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></span>
                      <span className="text-[#9CA3AF]">{p.name}</span>
                    </div>
                    <span className="text-white font-semibold">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </SectionCard>
      </div>

      {/* =================== ROW 3: Learning Progress =================== */}
      {subjectProgressData.length > 0 && (
        <SectionCard icon={TrendingUp} title="Learning Progress" subtitle="Chapters by subject">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectProgressData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={11} />
                <YAxis stroke="#6B7280" fontSize={11} />
                <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
                <Legend verticalAlign="top" height={36} formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>} />
                <Bar dataKey="Completed" stackId="a" fill={COLORS.emerald} radius={[0, 0, 0, 0]} />
                <Bar dataKey="In Progress" stackId="a" fill={COLORS.amber} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Pending" stackId="a" fill="#374151" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      )}

      {/* =================== ROW 4: 30-Day Study Trend =================== */}
      <SectionCard icon={Activity} title="Study Trend" subtitle="Last 30 days">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={studyTrend}>
              <defs>
                <linearGradient id="studyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.indigo} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={COLORS.indigo} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="codingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.amber} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={COLORS.amber} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" />
              <XAxis dataKey="date" stroke="#6B7280" fontSize={10} interval={4} />
              <YAxis stroke="#6B7280" fontSize={11} />
              <Tooltip contentStyle={{ background: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }} />
              <Legend verticalAlign="top" height={36} formatter={(value) => <span style={{ color: '#9CA3AF', fontSize: 12 }}>{value}</span>} />
              <Area type="monotone" dataKey="Study" stroke={COLORS.indigo} strokeWidth={2} fill="url(#studyGrad)" />
              <Area type="monotone" dataKey="Coding" stroke={COLORS.amber} strokeWidth={2} fill="url(#codingGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* =================== EXTRA: Projects & Technologies Snapshot =================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Projects</h4>
          </div>
          <p className="text-2xl font-bold text-white">{projects.length}</p>
          <p className="text-xs text-[#6B7280] mt-1">
            {projects.filter(p => p.status === 'completed').length} completed · 
            {' '}{projects.filter(p => p.status === 'active').length} active
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-bold text-white">Technologies</h4>
          </div>
          <p className="text-2xl font-bold text-white">{technologies.length}</p>
          <p className="text-xs text-[#6B7280] mt-1">
            {technologies.filter(t => t.status === 'learning').length} learning · 
            {' '}{technologies.filter(t => t.status === 'done').length} mastered
          </p>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-[#818CF8]" />
            <h4 className="text-sm font-bold text-white">Overall Score</h4>
          </div>
          <p className="text-2xl font-bold text-white">
            {Math.round((taskCompletionRate + (subjects.length > 0 ? 80 : 50) + (streak > 0 ? 90 : 30)) / 3)}%
          </p>
          <p className="text-xs text-[#6B7280] mt-1">Based on tasks, consistency & coding</p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
