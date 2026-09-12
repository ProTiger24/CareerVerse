import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, X, Trash2, Edit3, Save, Play, StopCircle, Clock, 
  CheckCircle2, Circle, Target, ChevronRight, Calendar, AlertCircle,
  TrendingUp, Trophy, Sparkles, Send, RefreshCw, Flame, ListChecks,
  ChevronLeft, Layers, GraduationCap, Timer, Award
} from 'lucide-react';

// Default subject colors (user can pick from these)
const COLOR_OPTIONS = [
  '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#EC4899', '#22C55E', '#3B82F6', '#A855F7'
];

const ICON_OPTIONS = ['📘', '📗', '📙', '📕', '💻', '🧮', '📐', '🔬', '🎨', '🌐', '⚗️', '🩺', '💼', '✍️', '🎯', '🏛️'];

const StudyPlanner = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('plans'); // plans | calendar | report | revisions
  const [activeSubjectId, setActiveSubjectId] = useState(null);

  // Modal states
  const [showSubjectForm, setShowSubjectForm] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState(null);
  const [showChapterForm, setShowChapterForm] = useState(false);

  // Subject form
  const emptySubject = {
    name: '',
    icon: '📘',
    color: '#6366F1',
    examDate: '',
    dailyMinutes: 120,
    priority: 'medium', // low | medium | high
    createdAt: new Date().toISOString()
  };
  const [subjectForm, setSubjectForm] = useState(emptySubject);

  // Chapter form
  const emptyChapter = {
    title: '',
    estMinutes: 60,
    notes: ''
  };
  const [chapterForm, setChapterForm] = useState(emptyChapter);

  // Timer
  const [activeTimer, setActiveTimer] = useState(null);
  const timerRef = useRef(null);

  // AI plan
  const [aiInput, setAiInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const userId = user?.uid;

  // Load subjects
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const subRef = ref(realtimeDb, `users/${userId}/studySubjects`);
    const unsub = onValue(subRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k], chapters: data[k].chapters ? Object.keys(data[k].chapters).map(ck => ({ id: ck, ...data[k].chapters[ck] })) : [] }));
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setSubjects(list);
      } else setSubjects([]);
      setLoading(false);
    }, (err) => { setError(err.message); setLoading(false); });
    return () => unsub();
  }, [userId]);

  // Load sessions
  useEffect(() => {
    if (!userId) return;
    const sRef = ref(realtimeDb, `users/${userId}/studySessions`);
    const unsub = onValue(sRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        list.sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''));
        setSessions(list);
      } else setSessions([]);
    });
    return () => unsub();
  }, [userId]);

  // Timer tick
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setActiveTimer(prev => prev ? { ...prev, elapsed: Math.floor((Date.now() - prev.startTime) / 1000) } : null);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeTimer]);

  /* ============= SUBJECTS ============= */
  const saveSubject = async (e) => {
    e.preventDefault();
    if (!userId) return;
    if (!subjectForm.name.trim()) { setError('Enter subject name'); return; }
    try {
      if (editingSubjectId) {
        // Update
        await update(ref(realtimeDb, `users/${userId}/studySubjects/${editingSubjectId}`), {
          name: subjectForm.name.trim(),
          icon: subjectForm.icon,
          color: subjectForm.color,
          examDate: subjectForm.examDate,
          dailyMinutes: Number(subjectForm.dailyMinutes) || 120,
          priority: subjectForm.priority,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Create new
        const subRef = ref(realtimeDb, `users/${userId}/studySubjects`);
        const newRef = push(subRef);
        await set(newRef, { ...subjectForm, name: subjectForm.name.trim() });
      }
      setSubjectForm(emptySubject);
      setShowSubjectForm(false);
      setEditingSubjectId(null);
      setError('');
    } catch (err) { setError('Failed: ' + err.message); }
  };

  const deleteSubject = async (id) => {
    if (!userId || !window.confirm('Delete this subject and all its chapters?')) return;
    await remove(ref(realtimeDb, `users/${userId}/studySubjects/${id}`));
  };

  const startEditSubject = (subj) => {
    setSubjectForm({
      name: subj.name, icon: subj.icon, color: subj.color,
      examDate: subj.examDate || '', dailyMinutes: subj.dailyMinutes || 120,
      priority: subj.priority || 'medium'
    });
    setEditingSubjectId(subj.id);
    setShowSubjectForm(true);
  };

  /* ============= CHAPTERS ============= */
  const addChapter = async (e) => {
    e.preventDefault();
    if (!userId || !activeSubjectId) return;
    if (!chapterForm.title.trim()) return;
    try {
      const chRef = ref(realtimeDb, `users/${userId}/studySubjects/${activeSubjectId}/chapters`);
      const newRef = push(chRef);
      await set(newRef, {
        title: chapterForm.title.trim(),
        estMinutes: Number(chapterForm.estMinutes) || 60,
        notes: chapterForm.notes || '',
        status: 'not-started', // not-started | in-progress | completed
        totalTime: 0,
        completedAt: null,
        revisions: {
          r1: null, // tomorrow
          r2: null, // 3 days
          r3: null  // 7 days
        },
        createdAt: new Date().toISOString()
      });
      setChapterForm(emptyChapter);
      setShowChapterForm(false);
    } catch (err) { setError('Failed: ' + err.message); }
  };

  const updateChapter = async (subjectId, chapterId, data) => {
    if (!userId) return;
    await update(ref(realtimeDb, `users/${userId}/studySubjects/${subjectId}/chapters/${chapterId}`), {
      ...data,
      updatedAt: new Date().toISOString()
    });
  };

  const toggleChapterStatus = async (subjectId, chapter) => {
    const next = chapter.status === 'completed' ? 'not-started'
      : chapter.status === 'not-started' ? 'in-progress' : 'completed';

    const data = { status: next };
    if (next === 'completed') {
      data.completedAt = new Date().toISOString();
      // Schedule revisions
      const today = new Date();
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const in3days = new Date(today); in3days.setDate(today.getDate() + 3);
      const in7days = new Date(today); in7days.setDate(today.getDate() + 7);
      data.revisions = {
        r1: tomorrow.toISOString().split('T')[0],
        r2: in3days.toISOString().split('T')[0],
        r3: in7days.toISOString().split('T')[0]
      };
    }
    await updateChapter(subjectId, chapter.id, data);
  };

  const deleteChapter = async (subjectId, chapterId) => {
    if (!userId || !window.confirm('Delete this chapter?')) return;
    await remove(ref(realtimeDb, `users/${userId}/studySubjects/${subjectId}/chapters/${chapterId}`));
  };

  /* ============= TIMER ============= */
  const startTimer = (subjectId, chapter) => {
    if (activeTimer) return alert('Another timer is running. Stop it first.');
    setActiveTimer({ subjectId, chapterId: chapter.id, chapter, startTime: Date.now(), elapsed: 0 });
  };

  const stopTimer = async () => {
    if (!activeTimer || !userId) return;
    const duration = Math.floor((Date.now() - activeTimer.startTime) / 1000);
    const { subjectId, chapterId, chapter } = activeTimer;
    try {
      // Update chapter
      const chRef = ref(realtimeDb, `users/${userId}/studySubjects/${subjectId}/chapters/${chapterId}`);
      await update(chRef, {
        totalTime: (chapter.totalTime || 0) + duration,
        status: chapter.status === 'not-started' ? 'in-progress' : chapter.status,
        lastStudied: new Date().toISOString()
      });

      // Save session
      const sRef = ref(realtimeDb, `users/${userId}/studySessions`);
      const newRef = push(sRef);
      await set(newRef, {
        subjectId,
        chapterId,
        chapterTitle: chapter.title,
        duration,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(activeTimer.startTime).toISOString(),
        endTime: new Date().toISOString()
      });

      // Also push to taskHistory for unified report
      const hRef = ref(realtimeDb, `users/${userId}/taskHistory`);
      const hNew = push(hRef);
      await set(hNew, {
        taskId: chapterId,
        title: chapter.title,
        type: 'study',
        subject: subjectId,
        duration,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(activeTimer.startTime).toISOString(),
        endTime: new Date().toISOString()
      });

      setActiveTimer(null);
    } catch (err) { setError('Failed: ' + err.message); }
  };

  /* ============= AI PLAN ============= */
  const generateAIPlan = async () => {
    if (!aiInput.trim() || !userId) return;
    setAiLoading(true);
    try {
      // TODO: call Python backend /api/ai/plan endpoint
      // Placeholder — parse simple user input
      const resp = await fetch('http://localhost:8000/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Create a study plan: ${aiInput}. Return a JSON list of subjects with chapter names and suggested minutes per chapter.`,
          context: 'study planning'
        })
      });
      const data = await resp.json();
      // Just show response (full auto-parse could be added later)
      alert('AI Response:\n\n' + (data.response || 'No response'));
    } catch (err) { setError('AI unavailable'); }
    setAiLoading(false);
  };

  /* ============= HELPERS ============= */
  const getSubjectStats = (subj) => {
    const total = subj.chapters?.length || 0;
    const completed = subj.chapters?.filter(c => c.status === 'completed').length || 0;
    const inProgress = subj.chapters?.filter(c => c.status === 'in-progress').length || 0;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    const totalTime = subj.chapters?.reduce((s, c) => s + (c.totalTime || 0), 0) || 0;
    const examDaysLeft = subj.examDate
      ? Math.ceil((new Date(subj.examDate) - new Date()) / (1000 * 60 * 60 * 24))
      : null;
    return { total, completed, inProgress, progress, totalTime, examDaysLeft };
  };

  const formatTime = (secs) => {
    if (!secs) return '0m';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const formatLive = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const activeSubject = activeSubjectId ? subjects.find(s => s.id === activeSubjectId) : null;

  const getStatusBadge = (status) => {
    if (status === 'completed') return <span className="badge-success">✓ Done</span>;
    if (status === 'in-progress') return <span className="badge-info">In Progress</span>;
    return <span className="badge-warning">Not Started</span>;
  };

  const isRevisionDue = (chapter) => {
    if (!chapter.revisions) return false;
    const today = new Date().toISOString().split('T')[0];
    return chapter.revisions.r1 === today || chapter.revisions.r2 === today || chapter.revisions.r3 === today;
  };

  const priorityBadge = (p) => {
    if (p === 'high') return <span className="badge-danger">High</span>;
    if (p === 'low') return <span className="badge-success">Low</span>;
    return <span className="badge-warning">Medium</span>;
  };

  if (loading) return <div className="card p-6 text-center text-[#6B7280]">Loading study plan...</div>;

  /* ============= RENDER ============= */
  return (
    <div className="space-y-4 md:space-y-6">

      {/* Active Timer Banner */}
      <AnimatePresence>
        {activeTimer && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="card p-4 border-emerald-500/40 bg-emerald-500/5 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {activeSubject?.icon} {activeTimer.chapter.title}
                </p>
                <p className="text-xs text-[#9CA3AF]">{activeSubject?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xl md:text-2xl font-mono font-bold text-emerald-400">{formatLive(activeTimer.elapsed)}</span>
              <button onClick={stopTimer} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2">
                <StopCircle className="w-4 h-4" /> Stop & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Switcher */}
      <div className="flex gap-1 bg-[#161B2E] p-1 rounded-xl border border-[#1F2937] w-fit">
        {[
          { id: 'plans', label: 'Plans', icon: BookOpen },
          { id: 'revisions', label: 'Revision', icon: RefreshCw },
          { id: 'calendar', label: 'Calendar', icon: Calendar },
          { id: 'report', label: 'Report', icon: TrendingUp },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setView(t.id); setActiveSubjectId(null); }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              view === t.id ? 'bg-[#6366F1] text-white' : 'text-[#9CA3AF] hover:text-white'
            }`}
          >
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {error && <div className="card p-3 border-red-500/40 bg-red-500/5 text-red-400 text-sm">{error}</div>}

      {/* ============ PLANS VIEW ============ */}
      {view === 'plans' && !activeSubject && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-[#818CF8]" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Subjects</span>
              </div>
              <p className="text-xl font-bold text-white">{subjects.length}</p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <ListChecks className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Chapters Done</span>
              </div>
              <p className="text-xl font-bold text-white">
                {subjects.reduce((s, sub) => s + (sub.chapters?.filter(c => c.status === 'completed').length || 0), 0)}
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Timer className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Study Time</span>
              </div>
              <p className="text-xl font-bold text-white">
                {formatTime(subjects.reduce((s, sub) => s + (sub.chapters?.reduce((ss, c) => ss + (c.totalTime || 0), 0) || 0), 0))}
              </p>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="w-4 h-4 text-orange-400" />
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Revision Due</span>
              </div>
              <p className="text-xl font-bold text-white">
                {subjects.reduce((s, sub) => s + (sub.chapters?.filter(c => isRevisionDue(c)).length || 0), 0)}
              </p>
            </div>
          </div>

          {/* Add Subject Button */}
          {!showSubjectForm ? (
            <button
              onClick={() => { setShowSubjectForm(true); setEditingSubjectId(null); setSubjectForm(emptySubject); }}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3"
            >
              <Plus className="w-4 h-4" /> Create Study Plan
            </button>
          ) : (
            <motion.form
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              onSubmit={saveSubject} className="card p-5 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#818CF8]" />
                  {editingSubjectId ? 'Edit Subject' : 'New Subject / Course'}
                </h3>
                <button type="button" onClick={() => { setShowSubjectForm(false); setEditingSubjectId(null); }} className="text-[#6B7280] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="label">Subject / Course Name</label>
                <input
                  type="text" placeholder="e.g. Mathematics, Physics, English, Accounting..."
                  className="input-field" value={subjectForm.name}
                  onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })} required
                />
              </div>

              {/* Icon Picker */}
              <div>
                <label className="label">Icon</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map(ic => (
                    <button
                      key={ic} type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, icon: ic })}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                        subjectForm.icon === ic ? 'bg-[#6366F1]/30 border-2 border-[#6366F1]' : 'bg-[#0F1420] border border-[#1F2937] hover:bg-[#1F2937]'
                      }`}
                    >
                      {ic}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="label">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c} type="button"
                      onClick={() => setSubjectForm({ ...subjectForm, color: c })}
                      className={`w-8 h-8 rounded-lg transition-all ${subjectForm.color === c ? 'ring-2 ring-offset-2 ring-offset-[#161B2E] ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Exam Date (optional)</label>
                  <input
                    type="date" className="input-field"
                    value={subjectForm.examDate}
                    onChange={e => setSubjectForm({ ...subjectForm, examDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Daily Target (minutes)</label>
                  <input
                    type="number" min="15" step="15" className="input-field"
                    value={subjectForm.dailyMinutes}
                    onChange={e => setSubjectForm({ ...subjectForm, dailyMinutes: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select
                    className="input-field"
                    value={subjectForm.priority}
                    onChange={e => setSubjectForm({ ...subjectForm, priority: e.target.value })}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full btn-primary">
                {editingSubjectId ? 'Save Changes' : 'Create Subject'}
              </button>
            </motion.form>
          )}

          {/* Subject Cards */}
          {subjects.length === 0 ? (
            <div className="card p-12 text-center">
              <BookOpen className="w-14 h-14 text-[#6B7280] mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No study plans yet</h3>
              <p className="text-sm text-[#6B7280] max-w-md mx-auto">
                Create your first subject — Maths, Physics, English, or any course you're studying.
                Add chapters, set target dates, and track your progress.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subjects.map(subj => {
                const st = getSubjectStats(subj);
                return (
                  <motion.div
                    key={subj.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -2 }}
                    className="card p-5 cursor-pointer hover:border-[#6366F1]/40 transition-all"
                    onClick={() => setActiveSubjectId(subj.id)}
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ backgroundColor: `${subj.color}22`, border: `1px solid ${subj.color}44` }}
                      >
                        {subj.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-base font-bold text-white truncate">{subj.name}</h3>
                            <p className="text-[11px] text-[#9CA3AF] mt-0.5">
                              {st.total} chapters · {formatTime(st.totalTime)} studied
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {priorityBadge(subj.priority)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-[#6B7280]">Progress</span>
                        <span className="text-sm font-bold text-white">{st.progress}%</span>
                      </div>
                      <div className="h-2 bg-[#0F1420] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${st.progress}%` }} transition={{ duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: subj.color }}
                        />
                      </div>
                    </div>

                    {/* Stats footer */}
                    <div className="flex items-center justify-between text-[11px] pt-3 border-t border-[#1F2937]">
                      <div className="flex items-center gap-3">
                        {st.examDaysLeft !== null && (
                          <span className={`flex items-center gap-1 font-semibold ${
                            st.examDaysLeft <= 7 ? 'text-red-400' : st.examDaysLeft <= 21 ? 'text-amber-400' : 'text-[#9CA3AF]'
                          }`}>
                            <Calendar className="w-3 h-3" />
                            {st.examDaysLeft > 0 ? `${st.examDaysLeft}d left` : 'Exam passed'}
                          </span>
                        )}
                        <span className="text-[#9CA3AF]">
                          {st.completed}/{st.total} done
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); startEditSubject(subj); }}
                          className="text-blue-400/60 hover:text-blue-400"
                        ><Edit3 className="w-3.5 h-3.5" /></button>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteSubject(subj.id); }}
                          className="text-red-500/60 hover:text-red-500"
                        ><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* AI Planner */}
          <div className="card p-5 bg-gradient-to-br from-[#161B2E] to-[#1F1438]">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">AI Study Planner</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#6366F1]/20 text-[#818CF8] font-bold">BETA</span>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-3">Tell AI your exam date and syllabus — it will auto-plan</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder='e.g. "Math exam in 15 days, 10 chapters, 3 hours daily"'
                className="input-field flex-1"
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && generateAIPlan()}
              />
              <button
                onClick={generateAIPlan}
                disabled={aiLoading}
                className="btn-primary flex items-center gap-2"
              >
                {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ============ SUBJECT DETAIL (Chapters) ============ */}
      {view === 'plans' && activeSubject && (
        <>
          <button
            onClick={() => setActiveSubjectId(null)}
            className="text-sm text-[#9CA3AF] hover:text-white flex items-center gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" /> Back to all subjects
          </button>

          <div className="card p-5">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl flex-shrink-0"
                  style={{ backgroundColor: `${activeSubject.color}22`, border: `1px solid ${activeSubject.color}44` }}
                >
                  {activeSubject.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{activeSubject.name}</h2>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#9CA3AF]">
                    {activeSubject.examDate && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Exam: {new Date(activeSubject.examDate).toLocaleDateString('en-GB')}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Daily: {activeSubject.dailyMinutes} min
                    </span>
                    {priorityBadge(activeSubject.priority)}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowChapterForm(!showChapterForm)}
                className="btn-primary flex items-center gap-2 text-sm flex-shrink-0"
              >
                <Plus className="w-4 h-4" /> Chapter
              </button>
            </div>

            {/* Add chapter form */}
            <AnimatePresence>
              {showChapterForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  onSubmit={addChapter}
                  className="bg-[#0F1420] rounded-xl p-4 mb-4 space-y-3 border border-[#1F2937]"
                >
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-semibold text-white">Add Chapter</h4>
                    <button type="button" onClick={() => setShowChapterForm(false)} className="text-[#6B7280] hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text" placeholder="Chapter / Topic name" className="input-field md:col-span-2"
                      value={chapterForm.title}
                      onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })} required
                    />
                    <input
                      type="number" placeholder="Est. minutes" className="input-field"
                      value={chapterForm.estMinutes}
                      onChange={e => setChapterForm({ ...chapterForm, estMinutes: e.target.value })}
                    />
                  </div>
                  <input
                    type="text" placeholder="Notes (optional)" className="input-field"
                    value={chapterForm.notes}
                    onChange={e => setChapterForm({ ...chapterForm, notes: e.target.value })}
                  />
                  <button type="submit" className="w-full btn-primary">Add Chapter</button>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Chapters list */}
            {(!activeSubject.chapters || activeSubject.chapters.length === 0) ? (
              <div className="text-center py-10 text-[#6B7280] text-sm">
                <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
                No chapters yet. Click "Add Chapter" to begin.
              </div>
            ) : (
              <div className="space-y-2">
                {activeSubject.chapters.map((ch, idx) => {
                  const isTimerForThis = activeTimer?.chapterId === ch.id;
                  const revDue = isRevisionDue(ch);
                  return (
                    <motion.div
                      key={ch.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className={`p-3.5 rounded-xl border transition-all ${
                        ch.status === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20'
                        : ch.status === 'in-progress' ? 'bg-[#6366F1]/5 border-[#6366F1]/30'
                        : 'bg-[#0F1420] border-[#1F2937]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleChapterStatus(activeSubject.id, ch)}
                          className="mt-0.5 flex-shrink-0"
                        >
                          {ch.status === 'completed'
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            : ch.status === 'in-progress'
                              ? <div className="w-5 h-5 rounded-full border-2 border-[#6366F1] flex items-center justify-center"><div className="w-2 h-2 bg-[#6366F1] rounded-full"></div></div>
                              : <Circle className="w-5 h-5 text-[#6B7280]" />
                          }
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className={`text-sm font-semibold ${ch.status === 'completed' ? 'text-[#9CA3AF] line-through' : 'text-white'}`}>
                                {idx + 1}. {ch.title}
                              </p>
                              {ch.notes && <p className="text-[11px] text-[#6B7280] mt-0.5 italic">{ch.notes}</p>}
                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[10px] text-[#9CA3AF]">
                                {ch.estMinutes && <span>⏱ {ch.estMinutes}m est</span>}
                                {ch.totalTime > 0 && <span className="text-emerald-400 font-semibold">✓ {formatTime(ch.totalTime)} studied</span>}
                                {revDue && <span className="badge-warning">Revision due</span>}
                                {ch.revisions?.r1 && ch.status === 'completed' && (
                                  <span className="text-[#6B7280]">
                                    📅 Rev: {new Date(ch.revisions.r1).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})} → {new Date(ch.revisions.r3).toLocaleDateString('en-GB', {day: '2-digit', month: 'short'})}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isTimerForThis ? (
                                <button onClick={stopTimer} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1">
                                  <StopCircle className="w-3 h-3" /> Stop
                                </button>
                              ) : (
                                <button
                                  onClick={() => startTimer(activeSubject.id, ch)}
                                  disabled={!!activeTimer}
                                  className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-30"
                                >
                                  <Play className="w-3 h-3" /> Start
                                </button>
                              )}
                              <button onClick={() => deleteChapter(activeSubject.id, ch.id)} className="text-red-500/50 hover:text-red-500">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ============ REVISION VIEW ============ */}
      {view === 'revisions' && (
        <div className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Spaced Revision Schedule</h3>
            </div>
            <p className="text-xs text-[#9CA3AF] mb-4">
              After completing a chapter: Review 1 (tomorrow), Review 2 (3 days), Review 3 (7 days)
            </p>

            {(() => {
              const allChapters = subjects.flatMap(s => (s.chapters || []).map(c => ({ ...c, subjectName: s.name, subjectIcon: s.icon, subjectColor: s.color })));
              const dueChapters = allChapters.filter(c => isRevisionDue(c));

              return dueChapters.length === 0 ? (
                <div className="text-center py-10 text-[#6B7280] text-sm">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-emerald-400/40" />
                  No revisions due today 🎉
                </div>
              ) : (
                <div className="space-y-2">
                  {dueChapters.map(ch => (
                    <div key={ch.id} className="p-3 bg-[#0F1420] rounded-xl border border-amber-500/30 flex items-center gap-3">
                      <span className="text-2xl">{ch.subjectIcon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{ch.title}</p>
                        <p className="text-[11px] text-[#9CA3AF]">{ch.subjectName}</p>
                      </div>
                      <span className="badge-warning">Due</span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* ============ CALENDAR VIEW ============ */}
      {view === 'calendar' && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#818CF8]" /> Monthly Study Calendar
          </h3>
          <div className="grid grid-cols-7 gap-1.5 text-center mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="text-[10px] text-[#6B7280] font-semibold">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = today.getMonth();
              const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
              const daysInMonth = new Date(year, month + 1, 0).getDate();
              const offset = firstDay === 0 ? 6 : firstDay - 1; // make Monday first

              const cells = [];
              for (let i = 0; i < offset; i++) cells.push(<div key={`e${i}`}></div>);
              for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const daySessions = sessions.filter(s => s.date === dateStr);
                const isToday = d === today.getDate();
                const totalMin = Math.round(daySessions.reduce((sum, s) => sum + s.duration, 0) / 60);

                cells.push(
                  <div
                    key={d}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
                      isToday ? 'bg-[#6366F1] text-white' :
                      daySessions.length > 0 ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      'text-[#9CA3AF] hover:bg-white/5'
                    }`}
                  >
                    <span>{d}</span>
                    {daySessions.length > 0 && (
                      <span className="text-[8px] mt-0.5">{totalMin}m</span>
                    )}
                  </div>
                );
              }
              return cells;
            })()}
          </div>
        </div>
      )}

      {/* ============ REPORT VIEW ============ */}
      {view === 'report' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {(() => {
              const last7 = sessions.filter(s => {
                const d = new Date(s.date);
                const diff = (new Date() - d) / (1000 * 60 * 60 * 24);
                return diff <= 7;
              });
              const totalTime7 = last7.reduce((s, x) => s + x.duration, 0);
              const uniqueDays = new Set(last7.map(s => s.date)).size;
              return (
                <>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-[#818CF8]" />
                      <span className="text-[10px] uppercase font-semibold text-[#6B7280]">This Week</span>
                    </div>
                    <p className="text-xl font-bold text-white">{formatTime(totalTime7)}</p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Flame className="w-4 h-4 text-orange-400" />
                      <span className="text-[10px] uppercase font-semibold text-[#6B7280]">Active Days</span>
                    </div>
                    <p className="text-xl font-bold text-white">{uniqueDays}/7</p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] uppercase font-semibold text-[#6B7280]">Sessions</span>
                    </div>
                    <p className="text-xl font-bold text-white">{last7.length}</p>
                  </div>
                  <div className="card p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] uppercase font-semibold text-[#6B7280]">Avg/Day</span>
                    </div>
                    <p className="text-xl font-bold text-white">
                      {uniqueDays > 0 ? formatTime(Math.round(totalTime7 / uniqueDays)) : '0m'}
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Subject-wise breakdown */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Subject-wise Progress</h3>
            {subjects.length === 0 ? (
              <p className="text-center text-[#6B7280] text-sm py-6">No subjects yet</p>
            ) : (
              <div className="space-y-3">
                {subjects.map(subj => {
                  const st = getSubjectStats(subj);
                  return (
                    <div key={subj.id}>
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{subj.icon}</span>
                          <span className="text-sm text-white">{subj.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="text-[#9CA3AF]">{formatTime(st.totalTime)}</span>
                          <span className="text-white font-semibold">{st.progress}%</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-[#0F1420] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${st.progress}%` }} transition={{ duration: 0.6 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: subj.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent sessions */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Recent Sessions</h3>
            {sessions.length === 0 ? (
              <p className="text-center text-[#6B7280] text-sm py-6">No sessions yet</p>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {sessions.slice(0, 20).map(s => {
                  const subj = subjects.find(x => x.id === s.subjectId);
                  return (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 bg-[#0F1420] rounded-lg border border-[#1F2937]">
                      <span className="text-lg">{subj?.icon || '📘'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{s.chapterTitle}</p>
                        <p className="text-[10px] text-[#6B7280]">{new Date(s.startTime).toLocaleDateString('en-GB')}</p>
                      </div>
                      <span className="text-xs text-emerald-400 font-mono font-semibold">{formatTime(s.duration)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyPlanner;
