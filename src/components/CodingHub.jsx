import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, Plus, X, Trash2, Edit3, Trophy, Flame, Target, Clock, 
  ExternalLink, CheckCircle2, Circle, FolderGit2, Rocket, Layers, 
  Link as LinkIcon, RefreshCw, Loader2, AlertCircle, TrendingUp,
  Zap, Award, Calendar
} from 'lucide-react';

/* ============================
   HEATMAP (Full width GitHub-style)
   ============================ */
const Heatmap = ({ submissions }) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 53 weeks × 7 days grid (Codeforces/GitHub style)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Align start to the Sunday of the week (52 weeks ago)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 363); // 52 weeks
  // Roll back to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const totalDays = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);

  // Group submissions by date
  const submissionsByDate = {};
  submissions.forEach(s => {
    const d = s.date;
    if (!submissionsByDate[d]) submissionsByDate[d] = 0;
    submissionsByDate[d]++;
  });

  // Build grid [week][day]
  const grid = [];
  for (let w = 0; w < totalWeeks; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const cellDate = new Date(startDate);
      cellDate.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = cellDate.toISOString().split('T')[0];
      const count = submissionsByDate[dateStr] || 0;
      const isFuture = cellDate > today;
      week.push({ date: dateStr, count, isFuture, dayOfWeek: d });
    }
    grid.push(week);
  }

  // Month labels
  const monthLabels = [];
  let lastMonth = -1;
  grid.forEach((week, wi) => {
    const firstDay = new Date(week[0].date);
    const month = firstDay.getMonth();
    if (month !== lastMonth && week[0].dayOfWeek <= 3) {
      monthLabels.push({ 
        weekIndex: wi, 
        label: firstDay.toLocaleDateString('en-US', { month: 'short' }) 
      });
      lastMonth = month;
    }
  });

  const getColor = (count, isFuture) => {
    if (isFuture) return 'bg-transparent';
    if (count === 0) return 'bg-[#161B2E]';
    if (count <= 1) return 'bg-emerald-900';
    if (count <= 3) return 'bg-emerald-700';
    if (count <= 6) return 'bg-emerald-500';
    return 'bg-emerald-400';
  };

  return (
    <div className="w-full">
      {/* Month labels */}
      <div className="relative h-4 mb-1 ml-8">
        {monthLabels.map((m, i) => (
          <span
            key={i}
            className="absolute text-[10px] text-[#6B7280] font-medium"
            style={{ left: `${(m.weekIndex / totalWeeks) * 100}%` }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        {/* Day labels */}
        <div className="flex flex-col justify-between text-[9px] text-[#6B7280] py-0.5 flex-shrink-0">
          <span>Mon</span>
          <span>Wed</span>
          <span>Fri</span>
        </div>

        {/* Heatmap grid */}
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-[3px] min-w-max">
            {grid.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-[3px]">
                {week.map((cell, di) => (
                  <div
                    key={di}
                    onMouseEnter={(e) => {
                      setHoveredCell(cell);
                      setTooltipPos({ x: e.clientX, y: e.clientY });
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`w-[11px] h-[11px] rounded-sm ${getColor(cell.count, cell.isFuture)} 
                      transition-all hover:ring-1 hover:ring-white/40 cursor-pointer`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-xs text-[#6B7280]">
          {submissions.length} submission{submissions.length !== 1 ? 's' : ''} in the last year
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
          <span>Less</span>
          <div className="w-[11px] h-[11px] rounded-sm bg-[#161B2E]"></div>
          <div className="w-[11px] h-[11px] rounded-sm bg-emerald-900"></div>
          <div className="w-[11px] h-[11px] rounded-sm bg-emerald-700"></div>
          <div className="w-[11px] h-[11px] rounded-sm bg-emerald-500"></div>
          <div className="w-[11px] h-[11px] rounded-sm bg-emerald-400"></div>
          <span>More</span>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredCell && !hoveredCell.isFuture && (
        <div
          className="fixed z-50 bg-[#1F2937] border border-[#374151] rounded-lg px-3 py-2 shadow-xl pointer-events-none"
          style={{ left: tooltipPos.x + 10, top: tooltipPos.y + 10 }}
        >
          <p className="text-xs font-semibold text-white">
            {hoveredCell.count} submission{hoveredCell.count !== 1 ? 's' : ''}
          </p>
          <p className="text-[10px] text-[#9CA3AF]">
            {new Date(hoveredCell.date).toLocaleDateString('en-GB', { 
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' 
            })}
          </p>
        </div>
      )}
    </div>
  );
};

/* ============================
   STATUS BADGE
   ============================ */
const StatusBadge = ({ status }) => {
  const s = { 
    'active': 'badge-info', 'completed': 'badge-success', 
    'pending': 'badge-warning', 'paused': 'badge-warning', 
    'learning': 'badge-info', 'done': 'badge-success' 
  };
  return <span className={s[status] || 'badge-info'}>{status}</span>;
};

/* ============================
   MODAL
   ============================ */
const Modal = ({ onClose, title, icon: Icon, children }) => (
  <motion.div 
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    onClick={onClose}
  >
    <motion.div 
      initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
      className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
      onClick={e => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-[#818CF8]" />} {title}
        </h2>
        <button onClick={onClose} className="text-[#6B7280] hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </motion.div>
  </motion.div>
);

/* ============================
   CUSTOM SECTION ITEMS
   ============================ */
const CustomSectionItems = ({ items, sectionId, onAdd, onToggle, onDelete }) => {
  const [input, setInput] = useState('');
  return (
    <div>
      <form onSubmit={(e) => { e.preventDefault(); if (input.trim()) { onAdd(sectionId, input.trim()); setInput(''); } }} className="flex gap-2 mb-3">
        <input type="text" placeholder="Add item..." className="input-field flex-1 text-xs" value={input} onChange={e => setInput(e.target.value)} />
        <button type="submit" className="bg-[#6366F1] hover:bg-[#4F46E5] text-white px-3 py-2 rounded-lg text-xs">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </form>
      {items.length === 0 ? (
        <p className="text-xs text-[#6B7280] text-center py-3">No items yet</p>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {items.map(item => (
            <div key={item.id} className="flex items-center gap-2 p-2 bg-[#0F1420] rounded-lg border border-[#1F2937]">
              <button onClick={() => onToggle(sectionId, item.id, item.done)}>
                {item.done ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Circle className="w-4 h-4 text-[#6B7280]" />}
              </button>
              <span className={`text-xs flex-1 ${item.done ? 'line-through text-[#6B7280]' : 'text-white/85'}`}>{item.title}</span>
              <button onClick={() => onDelete(sectionId, item.id)} className="text-red-500/50 hover:text-red-500">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ============================
   MAIN COMPONENT
   ============================ */
const CodingHub = () => {
  const { user } = useAuth();
  const [view, setView] = useState('cp');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  // Platforms
  const [platforms, setPlatforms] = useState({});
  const [showPlatformForm, setShowPlatformForm] = useState(false);
  const [platformForm, setPlatformForm] = useState({ 
    platform: 'codeforces', handle: '', currentRating: '', targetRating: '' 
  });

  // Submissions (all platforms combined, for heatmap)
  const [submissions, setSubmissions] = useState([]);

  // Projects
  const [projects, setProjects] = useState([]);
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const emptyProject = { name: '', description: '', tech: '', status: 'active', progress: 0, github: '', liveUrl: '' };
  const [projectForm, setProjectForm] = useState(emptyProject);

  // Technologies
  const [technologies, setTechnologies] = useState([]);
  const [showTechForm, setShowTechForm] = useState(false);
  const [editingTechId, setEditingTechId] = useState(null);
  const emptyTech = { name: '', category: 'language', status: 'learning', progress: 0, resource: '', notes: '' };
  const [techForm, setTechForm] = useState(emptyTech);

  // Custom sections
  const [customSections, setCustomSections] = useState([]);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState({ title: '', icon: '📌' });

  const userId = user?.uid;

  /* ===== Load from Firebase ===== */
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const unsubs = [
      onValue(ref(realtimeDb, `users/${userId}/cpPlatforms`), (s) => setPlatforms(s.val() || {})),
      onValue(ref(realtimeDb, `users/${userId}/submissions`), (s) => {
        const d = s.val();
        setSubmissions(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
      }),
      onValue(ref(realtimeDb, `users/${userId}/projects`), (s) => {
        const d = s.val();
        setProjects(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
      }),
      onValue(ref(realtimeDb, `users/${userId}/technologies`), (s) => {
        const d = s.val();
        setTechnologies(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
      }),
      onValue(ref(realtimeDb, `users/${userId}/customSections`), (s) => {
        const d = s.val();
        setCustomSections(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
      }),
    ];
    const t = setTimeout(() => setLoading(false), 500);
    return () => { unsubs.forEach(u => u()); clearTimeout(t); };
  }, [userId]);

  /* ===== Auto-sync Codeforces on load ===== */
  useEffect(() => {
    if (platforms.codeforces?.handle && userId) {
      syncCodeforces(platforms.codeforces.handle, true);
    }
    // eslint-disable-next-line
  }, [userId]);

  /* ===== Codeforces API sync ===== */
  const syncCodeforces = async (handle, silent = false) => {
    if (!handle || !userId) return;
    if (!silent) setSyncing(true);
    setSyncMessage('');
    try {
      // 1. Fetch submissions (up to 10000)
      const subsRes = await fetch(`https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=10000`);
      const subsData = await subsRes.json();
      if (subsData.status !== 'OK') throw new Error(subsData.comment || 'Failed to fetch submissions');

      // 2. Fetch rating
      const rateRes = await fetch(`https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`);
      const rateData = await rateRes.json();
      const currentRating = rateData.status === 'OK' && rateData.result.length > 0
        ? rateData.result[rateData.result.length - 1].newRating
        : 0;

      // 3. Only count ACCEPTED problems (unique per problem)
      const acceptedSet = new Set();
      const submissionsList = [];
      subsData.result.forEach(sub => {
        if (sub.verdict === 'OK') {
          const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
          acceptedSet.add(problemKey);
          // Add to submissions list (for heatmap)
          const dateStr = new Date(sub.creationTimeSeconds * 1000).toISOString().split('T')[0];
          submissionsList.push({
            date: dateStr,
            platform: 'codeforces',
            problemKey,
            problemName: sub.problem.name,
            rating: sub.problem.rating || null,
            timestamp: sub.creationTimeSeconds * 1000
          });
        }
      });

      // 4. Save unique submissions to Firebase (deduped by problemKey)
      const existingSubsRef = ref(realtimeDb, `users/${userId}/submissions`);
      const uniqueProblems = new Map();
      submissionsList.forEach(s => {
        if (!uniqueProblems.has(s.problemKey)) {
          uniqueProblems.set(s.problemKey, s);
        }
      });

      // Clear old codeforces submissions, replace with new
      const allCurrentSubs = submissions.filter(s => s.platform !== 'codeforces');
      const newCodeforcesSubs = Array.from(uniqueProblems.values());

      // Save as bulk
      const updates = {};
      // Remove old codeforces submissions
      Object.keys(submissions).forEach(k => {
        const sub = submissions.find(x => x.id === k);
        if (sub && sub.platform === 'codeforces') {
          updates[`users/${userId}/submissions/${k}`] = null;
        }
      });
      // Add new submissions with unique keys
      newCodeforcesSubs.forEach((s, i) => {
        const key = `cf_${s.problemKey.replace(/[^a-zA-Z0-9]/g, '_')}`;
        updates[`users/${userId}/submissions/${key}`] = s;
      });
      await update(ref(realtimeDb), updates);

      // 5. Update platform rating + solved count
      await update(ref(realtimeDb, `users/${userId}/cpPlatforms/codeforces`), {
        handle,
        currentRating: currentRating || platforms.codeforces?.currentRating || 0,
        solved: acceptedSet.size,
        lastSync: new Date().toISOString(),
        targetRating: platforms.codeforces?.targetRating || 1700
      });

      if (!silent) {
        setSyncMessage(`✅ Synced ${acceptedSet.size} problems, Rating: ${currentRating}`);
        setTimeout(() => setSyncMessage(''), 4000);
      }
    } catch (err) {
      console.error('Codeforces sync error:', err);
      if (!silent) {
        setSyncMessage(`❌ ${err.message}`);
        setTimeout(() => setSyncMessage(''), 5000);
      }
    }
    setSyncing(false);
  };

  /* ===== Save platform ===== */
  const savePlatform = async (e) => {
    e.preventDefault();
    if (!userId) return;
    await update(ref(realtimeDb, `users/${userId}/cpPlatforms/${platformForm.platform}`), {
      handle: platformForm.handle,
      currentRating: Number(platformForm.currentRating) || 0,
      targetRating: Number(platformForm.targetRating) || 0,
      updatedAt: new Date().toISOString()
    });
    // Auto-sync if codeforces
    if (platformForm.platform === 'codeforces' && platformForm.handle) {
      await syncCodeforces(platformForm.handle);
    }
    setShowPlatformForm(false);
    setPlatformForm({ platform: 'codeforces', handle: '', currentRating: '', targetRating: '' });
  };

  const removePlatform = async (k) => {
    if (!userId || !window.confirm('Remove this platform?')) return;
    await remove(ref(realtimeDb, `users/${userId}/cpPlatforms/${k}`));
  };

  /* ===== Projects CRUD ===== */
  const saveProject = async (e) => {
    e.preventDefault();
    if (!userId || !projectForm.name.trim()) return;
    if (editingProjectId) {
      await update(ref(realtimeDb, `users/${userId}/projects/${editingProjectId}`), { ...projectForm, updatedAt: new Date().toISOString() });
    } else {
      const newRef = push(ref(realtimeDb, `users/${userId}/projects`));
      await set(newRef, { ...projectForm, createdAt: new Date().toISOString() });
    }
    setProjectForm(emptyProject);
    setShowProjectForm(false);
    setEditingProjectId(null);
  };
  const deleteProject = async (id) => { if (!userId || !window.confirm('Delete?')) return; await remove(ref(realtimeDb, `users/${userId}/projects/${id}`)); };

  /* ===== Tech CRUD ===== */
  const saveTech = async (e) => {
    e.preventDefault();
    if (!userId || !techForm.name.trim()) return;
    if (editingTechId) {
      await update(ref(realtimeDb, `users/${userId}/technologies/${editingTechId}`), { ...techForm, updatedAt: new Date().toISOString() });
    } else {
      const newRef = push(ref(realtimeDb, `users/${userId}/technologies`));
      await set(newRef, { ...techForm, createdAt: new Date().toISOString() });
    }
    setTechForm(emptyTech);
    setShowTechForm(false);
    setEditingTechId(null);
  };
  const deleteTech = async (id) => { if (!userId || !window.confirm('Delete?')) return; await remove(ref(realtimeDb, `users/${userId}/technologies/${id}`)); };

  /* ===== Custom sections CRUD ===== */
  const addCustomSection = async (e) => {
    e.preventDefault();
    if (!userId || !customForm.title.trim()) return;
    const newRef = push(ref(realtimeDb, `users/${userId}/customSections`));
    await set(newRef, { title: customForm.title.trim(), icon: customForm.icon, items: [], createdAt: new Date().toISOString() });
    setCustomForm({ title: '', icon: '📌' });
    setShowCustomForm(false);
  };
  const deleteCustomSection = async (id) => { if (!userId || !window.confirm('Delete?')) return; await remove(ref(realtimeDb, `users/${userId}/customSections/${id}`)); };
  const addCustomItem = async (sid, title) => { if (!userId || !title.trim()) return; const r = push(ref(realtimeDb, `users/${userId}/customSections/${sid}/items`)); await set(r, { title, done: false, createdAt: new Date().toISOString() }); };
  const toggleCustomItem = async (sid, iid, done) => { if (!userId) return; await update(ref(realtimeDb, `users/${userId}/customSections/${sid}/items/${iid}`), { done: !done }); };
  const deleteCustomItem = async (sid, iid) => { if (!userId) return; await remove(ref(realtimeDb, `users/${userId}/customSections/${sid}/items/${iid}`)); };

  /* ===== Helper ===== */
  const formatTime = (secs) => {
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const totalProblems = Object.values(platforms).reduce((s, p) => s + (p.solved || 0), 0);

  // Streak calculation from submissions
  const currentStreak = (() => {
    if (!submissions.length) return 0;
    const uniqueDays = [...new Set(submissions.map(s => s.date))].sort().reverse();
    if (!uniqueDays.length) return 0;
    let streak = 0;
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    const todayStr = d.toISOString().split('T')[0];
    const yesterday = new Date(d); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    let checkDate = uniqueDays[0] === todayStr ? d : (uniqueDays[0] === yesterdayStr ? yesterday : null);
    if (!checkDate) return 0;
    for (const day of uniqueDays) {
      if (day === checkDate.toISOString().split('T')[0]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return streak;
  })();

  const PLATFORMS_LIST = [
    { id: 'codeforces', label: 'Codeforces', color: '#EF4444', url: 'https://codeforces.com', hasApi: true },
    { id: 'leetcode', label: 'LeetCode', color: '#F59E0B', url: 'https://leetcode.com', hasApi: false },
    { id: 'codechef', label: 'CodeChef', color: '#8B5CF6', url: 'https://codechef.com', hasApi: false },
    { id: 'hackerrank', label: 'HackerRank', color: '#10B981', url: 'https://hackerrank.com', hasApi: false },
    { id: 'atcoder', label: 'AtCoder', color: '#06B6D4', url: 'https://atcoder.jp', hasApi: false },
  ];

  if (loading) return <div className="card p-6 text-center text-[#6B7280]">Loading...</div>;

  return (
    <div className="space-y-4 md:space-y-6">
      
      {/* View Switcher */}
      <div className="flex gap-1 bg-[#161B2E] p-1 rounded-xl border border-[#1F2937] overflow-x-auto">
        {[
          { id: 'cp', label: 'Competitive Programming', icon: Code2 },
          { id: 'projects', label: 'Projects', icon: FolderGit2 },
          { id: 'tech', label: 'New Technologies', icon: Rocket },
          { id: 'custom', label: 'My Sections', icon: Plus },
        ].map(t => (
          <button key={t.id} onClick={() => setView(t.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              view === t.id ? 'bg-[#6366F1] text-white' : 'text-[#9CA3AF] hover:text-white'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {error && <div className="card p-3 border-red-500/40 bg-red-500/5 text-red-400 text-sm">{error}</div>}
      {syncMessage && <div className="card p-3 border-[#6366F1]/40 bg-[#6366F1]/5 text-[#A5B4FC] text-sm">{syncMessage}</div>}

      {/* ============ CP VIEW ============ */}
      {view === 'cp' && (
        <>
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-4 h-4 text-[#818CF8]" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Problems Solved</span>
              </div>
              <p className="text-2xl font-bold text-white">{totalProblems}</p>
              <p className="text-[10px] text-[#6B7280]">All platforms</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Current Streak</span>
              </div>
              <p className="text-2xl font-bold text-white">{currentStreak} day{currentStreak !== 1 ? 's' : ''}</p>
              <p className="text-[10px] text-[#6B7280]">Keep going!</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Total Submissions</span>
              </div>
              <p className="text-2xl font-bold text-white">{submissions.length}</p>
              <p className="text-[10px] text-[#6B7280]">Last 12 months</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Platforms</span>
              </div>
              <p className="text-2xl font-bold text-white">{Object.keys(platforms).length}</p>
              <p className="text-[10px] text-[#6B7280]">Connected</p>
            </div>
          </div>

          {/* Heatmap — full width */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Activity Heatmap</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Your problem-solving activity across platforms</p>
              </div>
              {platforms.codeforces?.handle && (
                <button 
                  onClick={() => syncCodeforces(platforms.codeforces.handle)}
                  disabled={syncing}
                  className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {syncing ? 'Syncing...' : 'Sync Codeforces'}
                </button>
              )}
            </div>
            <Heatmap submissions={submissions} />
          </div>

          {/* Platforms */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Connected Platforms</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Only Codeforces has auto-sync. Others need manual entry.</p>
              </div>
              <button onClick={() => setShowPlatformForm(true)} className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Add Platform
              </button>
            </div>

            {Object.keys(platforms).length === 0 ? (
              <div className="text-center py-10">
                <Code2 className="w-12 h-12 text-[#6B7280] mx-auto mb-3 opacity-40" />
                <p className="text-sm text-[#6B7280] mb-3">No platforms connected</p>
                <button onClick={() => setShowPlatformForm(true)} className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-xl font-semibold">
                  + Connect Codeforces (auto-sync)
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(platforms).map(([key, data]) => {
                  const p = PLATFORMS_LIST.find(x => x.id === key) || { label: key, color: '#6366F1', url: '#', hasApi: false };
                  const progress = data.targetRating > 0 ? Math.min(100, Math.round(((data.currentRating || 0) / data.targetRating) * 100)) : 0;
                  return (
                    <div key={key} className="p-4 bg-[#0F1420] rounded-xl border border-[#1F2937] hover:border-[#6366F1]/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" 
                            style={{ backgroundColor: `${p.color}22`, border: `1px solid ${p.color}44` }}>
                            <Code2 className="w-4 h-4" style={{ color: p.color }} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{p.label}</p>
                            <p className="text-[10px] text-[#6B7280]">{data.handle || '—'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {p.hasApi && (
                            <button onClick={() => syncCodeforces(data.handle)} className="text-[#818CF8] hover:text-white" title="Sync">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-[#818CF8] hover:text-white">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => removePlatform(key)} className="text-red-500/50 hover:text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <div>
                          <span className="text-[#9CA3AF]">Rating: </span>
                          <span className="text-white font-bold">{data.currentRating || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[#9CA3AF]">Target: </span>
                          <span className="font-bold" style={{ color: p.color }}>{data.targetRating || '—'}</span>
                        </div>
                      </div>
                      {data.solved > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-emerald-400 mb-2">
                          <CheckCircle2 className="w-3 h-3" /> {data.solved} problems solved
                        </div>
                      )}
                      <div className="h-1.5 bg-[#0A0E1A] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, backgroundColor: p.color }}></div>
                      </div>
                      {data.lastSync && (
                        <p className="text-[9px] text-[#6B7280] mt-2">
                          Last sync: {new Date(data.lastSync).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="card p-4 bg-[#6366F1]/5 border-[#6366F1]/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#818CF8] flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#A5B4FC]">
                <p className="font-semibold mb-1">How it works</p>
                <ul className="space-y-1 text-[#9CA3AF]">
                  <li>• <span className="text-white">Codeforces</span> auto-syncs your accepted submissions. Just add your handle.</li>
                  <li>• <span className="text-white">LeetCode/CodeChef/HackerRank</span> don't have public APIs — you can manually log submissions.</li>
                  <li>• Every accepted problem appears as a green square on the heatmap.</li>
                </ul>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ PROJECTS VIEW ============ */}
      {view === 'projects' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Projects</h2>
              <p className="text-xs text-[#6B7280] mt-1">Track your personal and professional projects</p>
            </div>
            <button onClick={() => { setShowProjectForm(true); setEditingProjectId(null); setProjectForm(emptyProject); }} 
              className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Project
            </button>
          </div>

          {projects.length === 0 ? (
            <div className="card p-12 text-center">
              <FolderGit2 className="w-14 h-14 text-[#6B7280] mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-white mb-2">No projects yet</h3>
              <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-4">Add your first project to start tracking progress</p>
              <button onClick={() => setShowProjectForm(true)} className="btn-primary">+ Add First Project</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {projects.map(proj => (
                <motion.div key={proj.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-semibold text-white truncate">{proj.name}</h3>
                      {proj.description && <p className="text-xs text-[#9CA3AF] mt-1 line-clamp-2">{proj.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setProjectForm(proj); setEditingProjectId(proj.id); setShowProjectForm(true); }} className="text-blue-400/60 hover:text-blue-400">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteProject(proj.id)} className="text-red-500/60 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {proj.tech && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {proj.tech.split(',').map((t, i) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#6366F1]/15 text-[#818CF8] border border-[#6366F1]/20">
                          {t.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Progress</span>
                      <span className="text-sm font-bold text-white">{proj.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0F1420] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${proj.progress}%` }} transition={{ duration: 0.6 }} 
                        className="h-full rounded-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusBadge status={proj.status} />
                    <div className="flex items-center gap-2">
                      {proj.github && (
                        <a href={proj.github} target="_blank" rel="noopener noreferrer" className="text-[#9CA3AF] hover:text-white flex items-center gap-1 text-xs">
                          <Code2 className="w-3 h-3" /> Code
                        </a>
                      )}
                      {proj.liveUrl && (
                        <a href={proj.liveUrl} target="_blank" rel="noopener noreferrer" className="text-[#9CA3AF] hover:text-white flex items-center gap-1 text-xs">
                          <ExternalLink className="w-3 h-3" /> Live
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ TECH VIEW ============ */}
      {view === 'tech' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">New Technologies</h2>
              <p className="text-xs text-[#6B7280] mt-1">Track what you're currently learning</p>
            </div>
            <button onClick={() => { setShowTechForm(true); setEditingTechId(null); setTechForm(emptyTech); }} 
              className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Technology
            </button>
          </div>

          {technologies.length === 0 ? (
            <div className="card p-12 text-center">
              <Rocket className="w-14 h-14 text-[#6B7280] mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-white mb-2">No technologies yet</h3>
              <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-4">Start tracking your learning journey</p>
              <button onClick={() => setShowTechForm(true)} className="btn-primary">+ Add First Technology</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {technologies.map(tech => (
                <motion.div key={tech.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1]/20 to-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0 border border-[#6366F1]/20">
                        <Rocket className="w-5 h-5 text-[#818CF8]" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-white truncate">{tech.name}</h3>
                        <p className="text-[10px] text-[#6B7280] capitalize">{tech.category}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => { setTechForm(tech); setEditingTechId(tech.id); setShowTechForm(true); }} className="text-blue-400/60 hover:text-blue-400">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteTech(tech.id)} className="text-red-500/60 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Learning Progress</span>
                      <span className="text-sm font-bold text-white">{tech.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0F1420] rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${tech.progress}%` }} transition={{ duration: 0.6 }} 
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" />
                    </div>
                  </div>
                  {tech.notes && <p className="text-[11px] text-[#9CA3AF] mb-3 line-clamp-2 italic">{tech.notes}</p>}
                  <div className="flex items-center justify-between">
                    <StatusBadge status={tech.status} />
                    {tech.resource && (
                      <a href={tech.resource} target="_blank" rel="noopener noreferrer" className="text-[#818CF8] hover:text-white flex items-center gap-1 text-xs">
                        <LinkIcon className="w-3 h-3" /> Resource
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ============ CUSTOM VIEW ============ */}
      {view === 'custom' && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">My Custom Sections</h2>
              <p className="text-xs text-[#6B7280] mt-1">Add your own sections to track anything</p>
            </div>
            <button onClick={() => setShowCustomForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Section
            </button>
          </div>

          {customSections.length === 0 ? (
            <div className="card p-12 text-center">
              <Layers className="w-14 h-14 text-[#6B7280] mx-auto mb-4 opacity-40" />
              <h3 className="text-lg font-semibold text-white mb-2">No custom sections yet</h3>
              <p className="text-sm text-[#6B7280] max-w-md mx-auto mb-4">Create sections for anything — books, certifications, contests, etc.</p>
              <button onClick={() => setShowCustomForm(true)} className="btn-primary">+ Create First Section</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customSections.map(section => {
                const items = section.items ? Object.keys(section.items).map(k => ({ id: k, ...section.items[k] })) : [];
                const doneCount = items.filter(i => i.done).length;
                return (
                  <div key={section.id} className="card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{section.icon}</span>
                        <div>
                          <h3 className="text-base font-semibold text-white">{section.title}</h3>
                          <p className="text-[10px] text-[#6B7280]">{doneCount}/{items.length} completed</p>
                        </div>
                      </div>
                      <button onClick={() => deleteCustomSection(section.id)} className="text-red-500/60 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <CustomSectionItems items={items} sectionId={section.id} onAdd={addCustomItem} onToggle={toggleCustomItem} onDelete={deleteCustomItem} />
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ============ MODALS ============ */}
      
      {/* Platform Form */}
      <AnimatePresence>
        {showPlatformForm && (
          <Modal onClose={() => setShowPlatformForm(false)} title="Connect Platform" icon={Code2}>
            <form onSubmit={savePlatform} className="space-y-4">
              <div>
                <label className="label">Platform</label>
                <select className="input-field" value={platformForm.platform} onChange={e => setPlatformForm({...platformForm, platform: e.target.value})}>
                  {PLATFORMS_LIST.map(p => <option key={p.id} value={p.id}>{p.label}{p.hasApi ? ' (auto-sync)' : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Handle / Username</label>
                <input type="text" className="input-field" value={platformForm.handle} onChange={e => setPlatformForm({...platformForm, handle: e.target.value})} placeholder="tourist" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Current Rating</label>
                  <input type="number" className="input-field" value={platformForm.currentRating} onChange={e => setPlatformForm({...platformForm, currentRating: e.target.value})} placeholder="1200" />
                </div>
                <div>
                  <label className="label">Target Rating</label>
                  <input type="number" className="input-field" value={platformForm.targetRating} onChange={e => setPlatformForm({...platformForm, targetRating: e.target.value})} placeholder="1700" />
                </div>
              </div>
              {platformForm.platform === 'codeforces' && (
                <p className="text-[11px] text-[#A5B4FC] bg-[#6366F1]/5 border border-[#6366F1]/20 rounded-lg p-3">
                  ✨ Codeforces handle দিলে automatically submissions sync হবে এবং heatmap-এ দেখাবে।
                </p>
              )}
              <button type="submit" className="w-full btn-primary">Save Platform</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Project Form */}
      <AnimatePresence>
        {showProjectForm && (
          <Modal onClose={() => { setShowProjectForm(false); setEditingProjectId(null); setProjectForm(emptyProject); }} title={editingProjectId ? 'Edit Project' : 'New Project'} icon={FolderGit2}>
            <form onSubmit={saveProject} className="space-y-4">
              <div>
                <label className="label">Project Name *</label>
                <input type="text" className="input-field" value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} placeholder="CareerVerse" required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea rows="2" className="input-field resize-none" value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} placeholder="What does this project do?" />
              </div>
              <div>
                <label className="label">Tech Stack</label>
                <input type="text" className="input-field" value={projectForm.tech} onChange={e => setProjectForm({...projectForm, tech: e.target.value})} placeholder="React, Firebase, Tailwind" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Status</label>
                  <select className="input-field" value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})}>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="label">Progress ({projectForm.progress}%)</label>
                  <input type="range" min="0" max="100" step="5" value={projectForm.progress} onChange={e => setProjectForm({...projectForm, progress: e.target.value})} className="w-full accent-[#6366F1] mt-3" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">GitHub URL</label>
                  <input type="url" className="input-field" value={projectForm.github} onChange={e => setProjectForm({...projectForm, github: e.target.value})} placeholder="https://github.com/..." />
                </div>
                <div>
                  <label className="label">Live URL</label>
                  <input type="url" className="input-field" value={projectForm.liveUrl} onChange={e => setProjectForm({...projectForm, liveUrl: e.target.value})} placeholder="https://..." />
                </div>
              </div>
              <button type="submit" className="w-full btn-primary">{editingProjectId ? 'Save Changes' : 'Create Project'}</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Tech Form */}
      <AnimatePresence>
        {showTechForm && (
          <Modal onClose={() => { setShowTechForm(false); setEditingTechId(null); setTechForm(emptyTech); }} title={editingTechId ? 'Edit Technology' : 'New Technology'} icon={Rocket}>
            <form onSubmit={saveTech} className="space-y-4">
              <div>
                <label className="label">Name *</label>
                <input type="text" className="input-field" value={techForm.name} onChange={e => setTechForm({...techForm, name: e.target.value})} placeholder="Docker" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="input-field" value={techForm.category} onChange={e => setTechForm({...techForm, category: e.target.value})}>
                    <option value="language">Language</option>
                    <option value="framework">Framework</option>
                    <option value="database">Database</option>
                    <option value="devops">DevOps</option>
                    <option value="tool">Tool</option>
                    <option value="concept">Concept</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input-field" value={techForm.status} onChange={e => setTechForm({...techForm, status: e.target.value})}>
                    <option value="learning">Learning</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="done">Done</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Progress ({techForm.progress}%)</label>
                <input type="range" min="0" max="100" step="5" value={techForm.progress} onChange={e => setTechForm({...techForm, progress: e.target.value})} className="w-full accent-emerald-500" />
              </div>
              <div>
                <label className="label">Resource URL</label>
                <input type="url" className="input-field" value={techForm.resource} onChange={e => setTechForm({...techForm, resource: e.target.value})} placeholder="https://docs.docker.com" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea rows="2" className="input-field resize-none" value={techForm.notes} onChange={e => setTechForm({...techForm, notes: e.target.value})} placeholder="Key learnings..." />
              </div>
              <button type="submit" className="w-full btn-primary">{editingTechId ? 'Save Changes' : 'Add Technology'}</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>

      {/* Custom Section Form */}
      <AnimatePresence>
        {showCustomForm && (
          <Modal onClose={() => setShowCustomForm(false)} title="New Custom Section" icon={Layers}>
            <form onSubmit={addCustomSection} className="space-y-4">
              <div>
                <label className="label">Section Title *</label>
                <input type="text" className="input-field" value={customForm.title} onChange={e => setCustomForm({...customForm, title: e.target.value})} placeholder="Certifications" required />
              </div>
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {['📌','📚','🏆','🎯','💡','🔥','⭐','🚀','📝','🎓','💼','🧪'].map(ic => (
                    <button key={ic} type="button" onClick={() => setCustomForm({...customForm, icon: ic})} 
                      className={`w-10 h-10 rounded-lg text-lg transition-all ${customForm.icon === ic ? 'bg-[#6366F1]/30 border-2 border-[#6366F1]' : 'bg-[#0F1420] border border-[#1F2937]'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="w-full btn-primary">Create Section</button>
            </form>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CodingHub;
