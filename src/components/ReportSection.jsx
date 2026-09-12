import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, Calendar, TrendingUp, Trophy, Clock, CheckCircle2, 
  AlertCircle, Flame, Code2, BookOpen, Download, Loader2, 
  Sparkles, Star, X, RefreshCw
} from 'lucide-react';

/* ============================
   SANITIZE (Firebase can't store undefined)
   ============================ */
const sanitize = (obj) => {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitize).filter(v => v !== null && v !== undefined);
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    Object.keys(obj).forEach(key => {
      const val = sanitize(obj[key]);
      if (val !== undefined && val !== null) {
        cleaned[key] = val;
      }
    });
    return cleaned;
  }
  return obj;
};

const formatMinutes = (m) => {
  if (!m) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}h ${mm}m` : `${h}h`;
};

const getDateRange = (type) => {
  const now = new Date();
  const start = new Date();
  if (type === 'weekly') {
    start.setDate(now.getDate() - 6);
  } else {
    start.setDate(now.getDate() - 29);
  }
  start.setHours(0, 0, 0, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
    days: type === 'weekly' ? 7 : 30
  };
};

/* ============================
   MAIN COMPONENT
   ============================ */
const ReportSection = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('weekly');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [report, setReport] = useState(null);
  const reportRef = useRef();

  const [allData, setAllData] = useState({
    tasks: [],
    submissions: [],
    sessions: [],
    subjects: [],
    dailyGoals: {},
    activities: [],
    platforms: {}
  });

  const userId = user?.uid;

  /* ===== Load real data ===== */
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
      onValue(ref(realtimeDb, `users/${userId}/dailyGoal`), (s) => {
        setAllData(prev => ({ ...prev, dailyGoals: s.val() || {} }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/activities`), (s) => {
        const d = s.val();
        setAllData(prev => ({ ...prev, activities: d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : [] }));
      }),
      onValue(ref(realtimeDb, `users/${userId}/cpPlatforms`), (s) => {
        setAllData(prev => ({ ...prev, platforms: s.val() || {} }));
      }),
    ];
    const t = setTimeout(() => setLoading(false), 800);
    return () => { unsubs.forEach(u => u()); clearTimeout(t); };
  }, [userId]);

  /* ===== Load saved reports ===== */
  useEffect(() => {
    if (!userId) return;
    const unsub = onValue(ref(realtimeDb, `users/${userId}/reports`), (s) => {
      const d = s.val();
      const list = d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : [];
      list.sort((a, b) => (b.generatedAt || '').localeCompare(a.generatedAt || ''));
      setSavedReports(list);
    });
    return () => unsub();
  }, [userId]);

  /* ===== GENERATE REPORT ===== */
  const generateReport = (type) => {
    setGenerating(true);
    setTimeout(() => {
      try {
        const range = getDateRange(type);
        
        // Filter by date range
        const tasksInRange = allData.tasks.filter(t => {
          const d = t.taskDate || (t.createdAt || '').split('T')[0];
          return d >= range.start && d <= range.end;
        });
        const subsInRange = allData.submissions.filter(s => s.date >= range.start && s.date <= range.end);
        const sessionsInRange = allData.sessions.filter(s => s.date >= range.start && s.date <= range.end);

        // Summary stats
        const totalTasks = tasksInRange.length;
        const completedTasks = tasksInRange.filter(t => t.completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const totalStudyMinutes = Math.round(sessionsInRange.reduce((s, x) => s + (x.duration || 0), 0) / 60);
        const totalSubmissions = subsInRange.length;
        const uniqueProblems = new Set(subsInRange.map(s => s.problemKey).filter(Boolean)).size;

        // Subject breakdown
        const subjectBreakdown = allData.subjects.map(subj => {
          const subjSessions = sessionsInRange.filter(s => 
            s.subject === subj.id || (subj.chapters || []).some(c => c.id === s.chapterId)
          );
          const subjMinutes = Math.round(subjSessions.reduce((s, x) => s + (x.duration || 0), 0) / 60);
          const totalChapters = subj.chapters?.length || 0;
          const completedChapters = subj.chapters?.filter(c => c.status === 'completed').length || 0;
          const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
          
          const dailyMin = Number(subj.dailyMinutes) || 60;
          const targetTotalMinutes = dailyMin * range.days;
          const attainment = targetTotalMinutes > 0 ? Math.round((subjMinutes / targetTotalMinutes) * 100) : 0;
          
          return {
            name: subj.name || 'Untitled',
            icon: subj.icon || '📘',
            color: subj.color || '#6366F1',
            progress: progress || 0,
            completedChapters: completedChapters || 0,
            totalChapters: totalChapters || 0,
            minutes: subjMinutes || 0,
            targetMinutes: targetTotalMinutes || 0,
            attainment: attainment || 0,
            status: attainment >= 80 ? 'excellent' : attainment >= 50 ? 'good' : 'needs-push'
          };
        });

        // Coding platform breakdown
        const codingBreakdown = Object.entries(allData.platforms)
          .filter(([key, p]) => p && typeof p === 'object')
          .map(([key, p]) => {
            const platformSubs = subsInRange.filter(s => s.platform === key);
            const entry = {
              name: key.charAt(0).toUpperCase() + key.slice(1),
              handle: p.handle || '',
              submissionsInRange: platformSubs.length,
            };
            if (p.currentRating != null) entry.rating = p.currentRating;
            if (p.targetRating != null) entry.targetRating = p.targetRating;
            if (p.solved != null) entry.solved = p.solved;
            if (p.lastSync) entry.lastSync = p.lastSync;
            return entry;
          });

        // Daily stats
        const dayStats = {};
        for (let i = 0; i < range.days; i++) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const ds = d.toISOString().split('T')[0];
          const dayTasks = tasksInRange.filter(t => (t.taskDate || (t.createdAt || '').split('T')[0]) === ds);
          const daySessions = sessionsInRange.filter(s => s.date === ds);
          const daySubs = subsInRange.filter(s => s.date === ds);
          const dayMinutes = Math.round(daySessions.reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
          dayStats[ds] = {
            tasks: dayTasks.length,
            completed: dayTasks.filter(t => t.completed).length,
            minutes: dayMinutes,
            submissions: daySubs.length,
            active: (dayTasks.length > 0 || dayMinutes > 0 || daySubs.length > 0)
          };
        }
        const activeDays = Object.values(dayStats).filter(d => d.active).length;
        const consistencyRate = Math.round((activeDays / range.days) * 100);

        // Best day
        let bestDay = { date: '', score: -1, tasks: 0, minutes: 0, submissions: 0, completed: 0 };
        Object.entries(dayStats).forEach(([date, s]) => {
          const score = s.completed * 10 + s.minutes + s.submissions * 5;
          if (score > bestDay.score) {
            bestDay = { date, score, tasks: s.tasks, completed: s.completed, minutes: s.minutes, submissions: s.submissions };
          }
        });

        // Streak
        const sortedDates = Object.keys(dayStats).sort().reverse();
        let streak = 0;
        for (const d of sortedDates) {
          if (dayStats[d].active) streak++;
          else break;
        }

        // Strengths & Weaknesses
        const strengths = [];
        const weaknesses = [];

        subjectBreakdown.forEach(s => {
          if (s.attainment >= 80 && s.minutes > 0) {
            strengths.push({
              title: s.name,
              icon: s.icon,
              detail: `${formatMinutes(s.minutes)} spent — ${s.attainment}% of target. Keep going! 🔥`,
              color: s.color
            });
          } else if (s.attainment < 40 && s.totalChapters > 0) {
            weaknesses.push({
              title: s.name,
              icon: s.icon,
              detail: `Only ${s.attainment}% (${formatMinutes(s.minutes)} / ${formatMinutes(s.targetMinutes)}). Push harder! 💪`,
              color: s.color
            });
          }
        });

        if (completionRate >= 70 && totalTasks > 0) {
          strengths.push({
            title: 'Task Discipline',
            icon: '✅',
            detail: `Completed ${completedTasks}/${totalTasks} tasks (${completionRate}%). Excellent! 🎯`,
            color: '#10B981'
          });
        } else if (completionRate < 40 && totalTasks > 0) {
          weaknesses.push({
            title: 'Task Completion',
            icon: '⚠️',
            detail: `Only ${completionRate}% completion. Break tasks into smaller chunks! 🚀`,
            color: '#F59E0B'
          });
        }

        if (totalStudyMinutes >= range.days * 120) {
          strengths.push({
            title: 'Study Consistency',
            icon: '📚',
            detail: `Total ${formatMinutes(totalStudyMinutes)} across ${range.days} days. Outstanding! ⭐`,
            color: '#6366F1'
          });
        } else if (totalStudyMinutes < range.days * 30 && totalStudyMinutes > 0) {
          weaknesses.push({
            title: 'Study Time',
            icon: '📉',
            detail: `Only ${formatMinutes(totalStudyMinutes)}. Aim for 2h/day! 💡`,
            color: '#EF4444'
          });
        }

        if (totalSubmissions >= 20) {
          strengths.push({
            title: 'Coding Grind',
            icon: '💻',
            detail: `${totalSubmissions} submissions, ${uniqueProblems} unique problems! 🏆`,
            color: '#F59E0B'
          });
        }

        if (consistencyRate >= 80) {
          strengths.push({
            title: 'Consistency Master',
            icon: '🔥',
            detail: `Active ${activeDays}/${range.days} days (${consistencyRate}%). You're unstoppable! ⚡`,
            color: '#F97316'
          });
        } else if (consistencyRate < 50) {
          weaknesses.push({
            title: 'Consistency',
            icon: '📆',
            detail: `Only active ${activeDays}/${range.days} days. Try daily short sessions! 🎯`,
            color: '#EF4444'
          });
        }

        const reportData = {
          type: type === 'weekly' ? 'Weekly' : 'Monthly',
          generatedAt: new Date().toISOString(),
          range: { start: range.start, end: range.end, days: range.days },
          summary: {
            totalTasks: totalTasks || 0,
            completedTasks: completedTasks || 0,
            completionRate: completionRate || 0,
            totalStudyMinutes: totalStudyMinutes || 0,
            totalSubmissions: totalSubmissions || 0,
            uniqueProblems: uniqueProblems || 0,
            activeDays: activeDays || 0,
            consistencyRate: consistencyRate || 0,
            streak: streak || 0,
            bestDay: bestDay.date ? bestDay : null,
          },
          subjectBreakdown: subjectBreakdown.length > 0 ? subjectBreakdown : [],
          codingBreakdown: codingBreakdown.length > 0 ? codingBreakdown : [],
          strengths: strengths.length > 0 ? strengths : [],
          weaknesses: weaknesses.length > 0 ? weaknesses : [],
        };

        setReport(sanitize(reportData));
        setGenerating(false);
      } catch (err) {
        console.error('Report generation failed:', err);
        alert('❌ Report generation failed: ' + err.message);
        setGenerating(false);
      }
    }, 400);
  };

  /* ===== Save report ===== */
  const saveReport = async () => {
    if (!userId || !report) return;
    try {
      const reportsRef = ref(realtimeDb, `users/${userId}/reports`);
      const newRef = push(reportsRef);
      await set(newRef, sanitize(report));
      alert('✅ Report saved to history!');
    } catch (err) {
      console.error('Save error:', err);
      alert('❌ Failed to save: ' + err.message);
    }
  };

  /* ===== Download PDF ===== */
  const downloadPDF = async (reportData) => {
    if (!reportRef.current) {
      alert('❌ Report view not found. Try regenerating.');
      return;
    }
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: '#0A0E1A',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - 20);

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pageHeight - 20);
      }

      const filename = `${reportData.type}-Report-${new Date(reportData.generatedAt).toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF error:', err);
      alert('❌ PDF download failed: ' + err.message);
    }
  };

  if (loading) return <div className="card p-6 text-center text-[#6B7280]">Loading your data...</div>;

  return (
    <div className="space-y-4">
      {/* Header + Generate */}
      <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Performance Reports</h2>
              <p className="text-xs text-[#6B7280]">Auto-generated from your real activity</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setReportType('weekly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                reportType === 'weekly' ? 'bg-[#6366F1] text-white' : 'bg-white/5 text-[#9CA3AF] hover:text-white'
              }`}>
              Weekly (7d)
            </button>
            <button onClick={() => setReportType('monthly')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                reportType === 'monthly' ? 'bg-[#6366F1] text-white' : 'bg-white/5 text-[#9CA3AF] hover:text-white'
              }`}>
              Monthly (30d)
            </button>
          </div>
        </div>

        <button onClick={() => generateReport(reportType)} disabled={generating}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3">
          {generating ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing your data...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Generate {reportType === 'weekly' ? 'Weekly' : 'Monthly'} Report</>
          )}
        </button>
      </div>

      {/* Report View */}
      <AnimatePresence>
        {report && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div ref={reportRef}>
              <ReportView report={report} user={user} />
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={saveReport} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
                <CheckCircle2 className="w-4 h-4" /> Save Report
              </button>
              <button onClick={() => downloadPDF(report)}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all">
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button onClick={() => setReport(null)}
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl font-semibold transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved Reports */}
      {savedReports.length > 0 && !report && (
        <div className="card p-5">
          <h3 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#818CF8]" /> Report History
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {savedReports.map((r, i) => (
              <div key={r.id || i} className="flex items-center justify-between p-3 bg-[#0F1420] rounded-xl border border-[#1F2937]">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">{r.type} Report</p>
                  <p className="text-[10px] text-[#6B7280] truncate">
                    {new Date(r.generatedAt).toLocaleString('en-GB')}
                    {r.summary && ` · ${r.summary.completedTasks || 0}/${r.summary.totalTasks || 0} tasks · ${formatMinutes(r.summary.totalStudyMinutes || 0)}`}
                  </p>
                </div>
                <button onClick={() => setReport(r)}
                  className="text-xs text-[#818CF8] hover:text-white font-semibold ml-2 flex-shrink-0">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {savedReports.length === 0 && !report && (
        <div className="card p-12 text-center">
          <FileText className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-40" />
          <p className="text-sm text-[#6B7280] mb-3">No saved reports yet</p>
          <p className="text-xs text-[#6B7280]">Generate your first report to see insights!</p>
        </div>
      )}
    </div>
  );
};

/* ============================
   REPORT VIEW
   ============================ */
const ReportView = ({ report, user }) => {
  const { summary, subjectBreakdown, codingBreakdown, strengths, weaknesses, range } = report;

  return (
    <div className="card p-6 md:p-8 space-y-6" style={{ backgroundColor: '#0F1420' }}>
      
      {/* Header */}
      <div className="border-b border-[#1F2937] pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#6366F1] mb-1">
              {report.type} Performance Report
            </p>
            <h1 className="text-xl md:text-3xl font-bold text-white truncate">
              {user?.displayName || user?.email?.split('@')[0] || 'Student'}'s Progress
            </h1>
            <p className="text-xs text-[#6B7280] mt-1">
              {new Date(range.start).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' → '}
              {new Date(range.end).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              {' '}({range.days} days)
            </p>
          </div>
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
            <Trophy className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatBox icon={CheckCircle2} label="Tasks Done" 
          value={`${summary.completedTasks}/${summary.totalTasks}`} 
          sub={`${summary.completionRate}%`} color="#10B981" />
        <StatBox icon={Clock} label="Study Time" 
          value={formatMinutes(summary.totalStudyMinutes)} 
          sub={`${Math.round((summary.totalStudyMinutes || 0) / range.days)}m/day`} color="#6366F1" />
        <StatBox icon={Code2} label="Problems" 
          value={summary.uniqueProblems} 
          sub={`${summary.totalSubmissions} subs`} color="#F59E0B" />
        <StatBox icon={Flame} label="Streak" 
          value={`${summary.streak}d`} 
          sub={`${summary.activeDays}/${range.days} active`} color="#F97316" />
      </div>

      {/* Consistency */}
      <div className="p-4 bg-[#161B2E] rounded-xl border border-[#1F2937]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wider">Consistency Rate</span>
          <span className="text-lg font-bold text-white">{summary.consistencyRate}%</span>
        </div>
        <div className="h-2 bg-[#0F1420] rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-emerald-400 transition-all"
            style={{ width: `${summary.consistencyRate}%` }} />
        </div>
        <p className="text-[11px] text-[#6B7280] mt-2">
          Active {summary.activeDays} out of {range.days} days
        </p>
      </div>

      {/* Subject Breakdown */}
      {subjectBreakdown && subjectBreakdown.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#818CF8]" /> Subject Performance
          </h2>
          <div className="space-y-2">
            {subjectBreakdown.map((s, i) => (
              <div key={i} className="p-3 bg-[#161B2E] rounded-xl border border-[#1F2937]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-xl flex-shrink-0">{s.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{s.name}</p>
                      <p className="text-[10px] text-[#6B7280]">
                        {s.completedChapters}/{s.totalChapters} chapters · {formatMinutes(s.minutes)} studied
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className={`text-lg font-bold ${
                      s.status === 'excellent' ? 'text-emerald-400' : 
                      s.status === 'good' ? 'text-amber-400' : 'text-red-400'
                    }`}>{s.attainment}%</p>
                    <p className="text-[9px] text-[#6B7280]">of {formatMinutes(s.targetMinutes)}</p>
                  </div>
                </div>
                <div className="h-1.5 bg-[#0F1420] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(s.attainment, 100)}%`, backgroundColor: s.color }} />
                </div>
                {s.attainment >= 80 && (
                  <p className="text-[11px] text-emerald-400 mt-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Excellent! Keep going! 🔥
                  </p>
                )}
                {s.attainment < 40 && s.totalChapters > 0 && (
                  <p className="text-[11px] text-amber-400 mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> Push harder! 💪
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Coding Breakdown */}
      {codingBreakdown && codingBreakdown.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-[#818CF8]" /> Coding Platforms
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {codingBreakdown.map((c, i) => (
              <div key={i} className="p-3 bg-[#161B2E] rounded-xl border border-[#1F2937]">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{c.name}</p>
                    <p className="text-[10px] text-[#6B7280] truncate">@{c.handle}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-base font-bold text-emerald-400">{c.submissionsInRange}</p>
                    <p className="text-[9px] text-[#6B7280]">submissions</p>
                  </div>
                </div>
                {c.rating > 0 && (
                  <p className="text-[11px] text-[#9CA3AF] mt-2">
                    Rating: <span className="font-bold text-white">{c.rating}</span>
                    {c.targetRating && <span className="text-[#6B7280]"> / {c.targetRating}</span>}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths */}
      {strengths && strengths.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4" /> What You Did Great
          </h2>
          <div className="space-y-2">
            {strengths.map((s, i) => (
              <div key={i} className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{s.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-emerald-400">{s.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{s.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses && weaknesses.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Areas to Improve
          </h2>
          <div className="space-y-2">
            {weaknesses.map((w, i) => (
              <div key={i} className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">{w.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-amber-400">{w.title}</p>
                  <p className="text-xs text-[#9CA3AF] mt-0.5">{w.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Best Day */}
      {summary.bestDay && summary.bestDay.date && (
        <div className="p-4 bg-gradient-to-r from-[#6366F1]/10 to-[#8B5CF6]/10 rounded-xl border border-[#6366F1]/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#6366F1]/20 flex items-center justify-center flex-shrink-0">
              <Star className="w-5 h-5 text-[#818CF8]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#818CF8] uppercase tracking-wider">Best Day</p>
              <p className="text-sm text-white truncate">
                {new Date(summary.bestDay.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}
                {' — '}
                {summary.bestDay.completed || 0} tasks · {summary.bestDay.minutes || 0}m study · {summary.bestDay.submissions || 0} submissions
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-[#1F2937] pt-4 text-center">
        <p className="text-[10px] text-[#6B7280]">
          Generated by CareerVerse · {new Date(report.generatedAt).toLocaleString('en-GB')}
        </p>
      </div>
    </div>
  );
};

/* ============================
   STAT BOX
   ============================ */
const StatBox = ({ icon: Icon, label, value, sub, color }) => (
  <div className="p-4 bg-[#161B2E] rounded-xl border border-[#1F2937]">
    <div className="flex items-center gap-2 mb-2">
      <Icon className="w-4 h-4" style={{ color }} />
      <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">{label}</span>
    </div>
    <p className="text-xl font-bold text-white truncate">{value}</p>
    {sub && <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">{sub}</p>}
  </div>
);

export default ReportSection;
