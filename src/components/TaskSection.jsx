import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, update, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaPlus, FaCheckCircle, FaCircle, FaTrash, FaPlay, FaStop, 
  FaClock, FaBook, FaCode, FaCalendarAlt, FaHistory, FaTimes,
  FaTrophy, FaEdit, FaSave, FaProjectDiagram
} from 'react-icons/fa';

const TaskSection = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('today');

  // Add task form
  const [showAddForm, setShowAddForm] = useState(false);
  const emptyTask = {
    title: '', type: 'study',
    book: '', chapter: '',        // Study
    platform: '', problems: 0,    // Problems
    projectName: '', progress: '', // Project
    taskDate: new Date().toISOString().split('T')[0]
  };
  const [newTask, setNewTask] = useState(emptyTask);

  // Edit state
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTask, setEditTask] = useState(emptyTask);

  // Timer
  const [activeTimer, setActiveTimer] = useState(null);
  const timerRef = useRef(null);

  const userId = user?.uid;

  // Realtime tasks
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const tasksRef = ref(realtimeDb, `users/${userId}/tasks`);
    const unsubscribe = onValue(tasksRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const taskList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        taskList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setTasks(taskList);
      } else setTasks([]);
      setLoading(false);
    }, (err) => { setError('Failed: ' + err.message); setLoading(false); });
    return () => unsubscribe();
  }, [userId]);

  // Realtime history
  useEffect(() => {
    if (!userId) return;
    const historyRef = ref(realtimeDb, `users/${userId}/taskHistory`);
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const historyList = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        historyList.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
        setHistory(historyList);
      } else setHistory([]);
    });
    return () => unsubscribe();
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

  // Add task
  const addTask = async (e) => {
    e.preventDefault();
    setError('');
    if (!userId) return setError('Please login first');
    if (!newTask.title.trim()) return setError('Enter a task title');
    try {
      const tasksRef = ref(realtimeDb, `users/${userId}/tasks`);
      const newTaskRef = push(tasksRef);

      // Only save relevant fields based on type
      const baseData = {
        title: newTask.title.trim(),
        type: newTask.type,
        taskDate: newTask.taskDate,
        completed: false,
        totalTime: 0,
        createdAt: new Date().toISOString()
      };

      if (newTask.type === 'study') {
        baseData.book = newTask.book.trim();
        baseData.chapter = newTask.chapter.trim();
      } else if (newTask.type === 'problem') {
        baseData.platform = newTask.platform.trim();
        baseData.problems = Number(newTask.problems) || 0;
      } else if (newTask.type === 'project') {
        baseData.projectName = newTask.projectName.trim();
        baseData.progress = newTask.progress;
      }

      await set(newTaskRef, baseData);
      setNewTask(emptyTask);
      setShowAddForm(false);
    } catch (err) { setError('Failed: ' + err.message); }
  };

  // Start Edit
  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setEditTask({
      title: task.title || '',
      type: task.type || 'study',
      book: task.book || '',
      chapter: task.chapter || '',
      platform: task.platform || '',
      problems: task.problems || 0,
      projectName: task.projectName || '',
      progress: task.progress || '',
      taskDate: task.taskDate || new Date().toISOString().split('T')[0]
    });
  };

  // Save Edit
  const saveEdit = async () => {
    if (!userId || !editingTaskId) return;
    try {
      const baseData = {
        title: editTask.title.trim(),
        type: editTask.type,
        taskDate: editTask.taskDate,
        updatedAt: new Date().toISOString(),
        book: '', chapter: '', platform: '', problems: 0, projectName: '', progress: ''
      };

      if (editTask.type === 'study') {
        baseData.book = editTask.book.trim();
        baseData.chapter = editTask.chapter.trim();
      } else if (editTask.type === 'problem') {
        baseData.platform = editTask.platform.trim();
        baseData.problems = Number(editTask.problems) || 0;
      } else if (editTask.type === 'project') {
        baseData.projectName = editTask.projectName.trim();
        baseData.progress = editTask.progress;
      }

      await update(ref(realtimeDb, `users/${userId}/tasks/${editingTaskId}`), baseData);
      setEditingTaskId(null);
    } catch (err) { setError('Failed to update: ' + err.message); }
  };

  const cancelEdit = () => setEditingTaskId(null);

  // Timer
  const startTimer = (task) => {
    if (activeTimer) return alert('Another timer is running.');
    setActiveTimer({ taskId: task.id, task, startTime: Date.now(), elapsed: 0 });
  };

  const stopTimer = async () => {
    if (!activeTimer || !userId) return;
    const duration = Math.floor((Date.now() - activeTimer.startTime) / 1000);
    const task = activeTimer.task;
    try {
      await update(ref(realtimeDb, `users/${userId}/tasks/${task.id}`), {
        totalTime: (task.totalTime || 0) + duration,
        lastStudied: new Date().toISOString()
      });
      const historyRef = ref(realtimeDb, `users/${userId}/taskHistory`);
      const newHistoryRef = push(historyRef);
      await set(newHistoryRef, {
        taskId: task.id,
        title: task.title,
        type: task.type,
        book: task.book || '',
        chapter: task.chapter || '',
        platform: task.platform || '',
        problems: task.problems || 0,
        projectName: task.projectName || '',
        duration,
        date: new Date().toISOString().split('T')[0],
        startTime: new Date(activeTimer.startTime).toISOString(),
        endTime: new Date().toISOString()
      });
      setActiveTimer(null);
    } catch (err) { setError('Failed: ' + err.message); }
  };

  const toggleTask = async (taskId, completed) => {
    if (!userId) return;
    await update(ref(realtimeDb, `users/${userId}/tasks/${taskId}`), { completed: !completed });
  };

  const deleteTask = async (taskId) => {
    if (!userId || !window.confirm('Delete this task?')) return;
    await remove(ref(realtimeDb, `users/${userId}/tasks/${taskId}`));
  };

  const formatTime = (secs) => {
    if (!secs) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  const formatLiveTimer = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // 30-day history
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentHistory = history.filter(h => new Date(h.date) >= thirtyDaysAgo);
  const historyByDate = recentHistory.reduce((acc, item) => {
    if (!acc[item.date]) acc[item.date] = [];
    acc[item.date].push(item);
    return acc;
  }, {});
  const sortedHistoryDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a));

  const totalStudyTime = recentHistory.reduce((s, h) => s + (h.duration || 0), 0);
  const totalProblems = recentHistory.filter(h => h.type === 'problem').reduce((s, h) => s + (h.problems || 0), 0);
  const totalSessions = recentHistory.length;

  // Reusable field renderer for both Add & Edit forms
  const renderTypeFields = (data, setData) => (
    <>
      {data.type === 'study' && (
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="📕 Book name" className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={data.book} onChange={(e) => setData({ ...data, book: e.target.value })} />
          <input type="text" placeholder="📄 Chapter" className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={data.chapter} onChange={(e) => setData({ ...data, chapter: e.target.value })} />
        </div>
      )}

      {data.type === 'problem' && (
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="💻 Platform (Codeforces/LeetCode)" className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={data.platform} onChange={(e) => setData({ ...data, platform: e.target.value })} />
          <input type="number" placeholder="🔢 Problems solved" className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={data.problems} onChange={(e) => setData({ ...data, problems: e.target.value })} />
        </div>
      )}

      {data.type === 'project' && (
        <div className="grid grid-cols-2 gap-2">
          <input type="text" placeholder="🚀 Project name" className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={data.projectName} onChange={(e) => setData({ ...data, projectName: e.target.value })} />
          <select className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={data.progress} onChange={(e) => setData({ ...data, progress: e.target.value })}>
            <option value="">Progress %</option>
            <option value="25">25%</option>
            <option value="50">50%</option>
            <option value="75">75%</option>
            <option value="100">100%</option>
          </select>
        </div>
      )}
    </>
  );

  // Task type label renderer
  const renderTaskDetails = (task) => (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-white/50">
      {task.type === 'study' && (
        <>
          {task.book && <span>📕 {task.book}</span>}
          {task.chapter && <span>📄 {task.chapter}</span>}
        </>
      )}
      {task.type === 'problem' && (
        <>
          {task.platform && <span>💻 {task.platform}</span>}
          {task.problems > 0 && <span>✅ {task.problems} solved</span>}
        </>
      )}
      {task.type === 'project' && (
        <>
          {task.projectName && <span>🚀 {task.projectName}</span>}
          {task.progress && <span>📊 {task.progress}%</span>}
        </>
      )}
      {task.taskDate && <span>📅 {new Date(task.taskDate).toLocaleDateString('en-GB')}</span>}
      {task.totalTime > 0 && <span className="text-emerald-400 font-semibold flex items-center gap-1"><FaClock className="w-3 h-3" /> {formatTime(task.totalTime)}</span>}
    </div>
  );

  if (loading) return <div className="bg-[#1E293B] rounded-3xl p-6 border border-white/5 text-center text-white/30 py-8">Loading tasks...</div>;

  return (
    <div className="space-y-4 md:space-y-6">

      {/* Active Timer Banner */}
      <AnimatePresence>
        {activeTimer && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
              <div>
                <p className="text-sm font-semibold text-white">📚 {activeTimer.task.title}</p>
                <p className="text-xs text-white/60">
                  {activeTimer.task.book && activeTimer.task.book}
                  {activeTimer.task.platform && activeTimer.task.platform}
                  {activeTimer.task.projectName && activeTimer.task.projectName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-mono font-bold text-emerald-400">{formatLiveTimer(activeTimer.elapsed)}</span>
              <button onClick={stopTimer} className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-xl font-semibold text-sm flex items-center gap-2">
                <FaStop className="w-3 h-3" /> Stop & Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Card */}
      <div className="bg-[#1E293B] rounded-3xl p-4 md:p-6 border border-white/5">

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white/90">📋 My Tasks</h3>
            <span className="text-xs text-white/40 px-2 py-1 bg-white/5 rounded-lg">{tasks.filter(t => !t.completed).length} pending</span>
          </div>
          <div className="flex gap-1 bg-[#0F172A] p-1 rounded-xl">
            <button onClick={() => setActiveTab('today')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'today' ? 'bg-[#6366F1] text-white' : 'text-white/50'}`}>
              <FaBook className="w-3 h-3 inline mr-1" /> Tasks
            </button>
            <button onClick={() => setActiveTab('history')} className={`px-4 py-1.5 rounded-lg text-xs font-semibold ${activeTab === 'history' ? 'bg-[#6366F1] text-white' : 'text-white/50'}`}>
              <FaHistory className="w-3 h-3 inline mr-1" /> History (30d)
            </button>
          </div>
        </div>

        {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-xl mb-4 text-sm border border-red-500/30">{error}</div>}

        {/* TASKS TAB */}
        {activeTab === 'today' && (
          <>
            {!showAddForm ? (
              <button onClick={() => setShowAddForm(true)} className="w-full mb-4 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <FaPlus className="w-4 h-4" /> Add New Task
              </button>
            ) : (
              <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={addTask} className="bg-[#0F172A] rounded-2xl p-4 mb-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-white/80">➕ Add New Task</h4>
                  <button type="button" onClick={() => setShowAddForm(false)} className="text-white/40"><FaTimes /></button>
                </div>

                {/* Type Selector */}
                <div className="grid grid-cols-3 gap-2">
                  {[{ id: 'study', label: '📖 Study', c: 'from-blue-500 to-blue-600' },
                    { id: 'problem', label: '💻 Problems', c: 'from-purple-500 to-purple-600' },
                    { id: 'project', label: '🚀 Project', c: 'from-emerald-500 to-emerald-600' }].map(t => (
                    <button key={t.id} type="button" onClick={() => setNewTask({ ...emptyTask, type: t.id, title: newTask.title, taskDate: newTask.taskDate })}
                      className={`py-2 rounded-xl text-xs font-semibold ${newTask.type === t.id ? `bg-gradient-to-r ${t.c} text-white` : 'bg-white/5 text-white/50'}`}>
                      {t.label}
                    </button>
                  ))}
                </div>

                <input type="text" placeholder="Task title..." className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} required />

                {/* Conditional Fields */}
                {renderTypeFields(newTask, setNewTask)}

                <input type="date" className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={newTask.taskDate} onChange={(e) => setNewTask({ ...newTask, taskDate: e.target.value })} />

                <button type="submit" className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] py-3 rounded-xl font-semibold text-sm">Create Task</button>
              </motion.form>
            )}

            {tasks.length === 0 ? (
              <div className="text-center text-white/30 py-12"><p className="text-5xl mb-3">📭</p><p className="text-sm">No tasks yet.</p></div>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => (
                  <motion.div key={task.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${task.completed ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-[#0F172A]/50 border-white/5'}`}>

                    {editingTaskId === task.id ? (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-semibold text-white/80">✏️ Edit Task</h4>
                          <button onClick={cancelEdit} className="text-white/40"><FaTimes /></button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {[{ id: 'study', label: '📖 Study' }, { id: 'problem', label: '💻 Problems' }, { id: 'project', label: '🚀 Project' }].map(t => (
                            <button key={t.id} type="button" onClick={() => setEditTask({ ...emptyTask, type: t.id, title: editTask.title, taskDate: editTask.taskDate })}
                              className={`py-2 rounded-lg text-xs font-semibold ${editTask.type === t.id ? 'bg-[#6366F1] text-white' : 'bg-white/5 text-white/50'}`}>
                              {t.label}
                            </button>
                          ))}
                        </div>
                        <input type="text" placeholder="Task title..." className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={editTask.title} onChange={(e) => setEditTask({ ...editTask, title: e.target.value })} />
                        {renderTypeFields(editTask, setEditTask)}
                        <input type="date" className="w-full bg-[#1E293B] border border-white/5 rounded-xl px-4 py-3 text-sm text-white" value={editTask.taskDate} onChange={(e) => setEditTask({ ...editTask, taskDate: e.target.value })} />
                        <div className="flex gap-2">
                          <button onClick={saveEdit} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1">
                            <FaSave className="w-3 h-3" /> Save
                          </button>
                          <button onClick={cancelEdit} className="flex-1 bg-white/10 hover:bg-white/20 text-white py-2 rounded-xl text-sm font-semibold">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <button onClick={() => toggleTask(task.id, task.completed)} className="mt-1">
                          {task.completed ? <FaCheckCircle className="text-emerald-400 w-5 h-5" /> : <FaCircle className="text-white/30 w-5 h-5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className={`text-sm font-semibold ${task.completed ? 'line-through text-white/40' : 'text-white/90'}`}>
                                {task.type === 'study' && '📖 '}{task.type === 'problem' && '💻 '}{task.type === 'project' && '🚀 '}
                                {task.title}
                              </p>
                              {renderTaskDetails(task)}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button onClick={() => startEdit(task)} className="text-blue-400/60 hover:text-blue-400" title="Edit"><FaEdit className="w-3.5 h-3.5" /></button>
                              <button onClick={() => deleteTask(task.id)} className="text-red-500/40 hover:text-red-500" title="Delete"><FaTrash className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                          {!task.completed && (
                            <div className="flex items-center gap-2 mt-3">
                              {activeTimer?.taskId === task.id ? (
                                <button onClick={stopTimer} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                                  <FaStop className="w-3 h-3" /> Stop ({formatLiveTimer(activeTimer.elapsed)})
                                </button>
                              ) : (
                                <button onClick={() => startTimer(task)} disabled={!!activeTimer}
                                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 disabled:opacity-30">
                                  <FaPlay className="w-3 h-3" /> Start Timer
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#6366F1]/20 to-[#6366F1]/5 rounded-xl p-3 border border-[#6366F1]/20">
                <FaClock className="text-[#6366F1] w-4 h-4 mb-1" />
                <p className="text-xs text-white/50">Study Time</p>
                <p className="text-sm font-bold text-white">{Math.floor(totalStudyTime / 3600)}h {Math.floor((totalStudyTime % 3600) / 60)}m</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500/20 to-purple-600/5 rounded-xl p-3 border border-purple-500/20">
                <FaCode className="text-purple-400 w-4 h-4 mb-1" />
                <p className="text-xs text-white/50">Problems</p>
                <p className="text-sm font-bold text-white">{totalProblems}</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/5 rounded-xl p-3 border border-emerald-500/20">
                <FaTrophy className="text-emerald-400 w-4 h-4 mb-1" />
                <p className="text-xs text-white/50">Sessions</p>
                <p className="text-sm font-bold text-white">{totalSessions}</p>
              </div>
            </div>

            {sortedHistoryDates.length === 0 ? (
              <div className="text-center text-white/30 py-12"><p className="text-5xl mb-3">📊</p><p className="text-sm">No history yet.</p></div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {sortedHistoryDates.map(date => {
                  const dayItems = historyByDate[date];
                  const dayTotal = dayItems.reduce((s, i) => s + (i.duration || 0), 0);
                  return (
                    <div key={date}>
                      <div className="flex justify-between mb-2 px-1">
                        <span className="text-xs font-semibold text-white/70">📅 {new Date(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span className="text-xs text-emerald-400 font-semibold">Total: {formatTime(dayTotal)}</span>
                      </div>
                      <div className="space-y-2">
                        {dayItems.map(item => (
                          <div key={item.id} className="bg-[#0F172A]/50 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 flex items-center justify-center">
                                {item.type === 'study' ? '📖' : item.type === 'problem' ? '💻' : '🚀'}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-white/80 truncate">{item.title}</p>
                                <div className="flex flex-wrap gap-x-2 text-[10px] text-white/40">
                                  {item.book && <span>📕 {item.book}</span>}
                                  {item.chapter && <span>📄 {item.chapter}</span>}
                                  {item.platform && <span>💻 {item.platform}</span>}
                                  {item.problems > 0 && <span>✅ {item.problems}</span>}
                                  {item.projectName && <span>🚀 {item.projectName}</span>}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-mono text-emerald-400 font-semibold">{formatTime(item.duration)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskSection;
