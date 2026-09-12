import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Brain, Mic, Trophy, Target, TrendingUp, TrendingDown,
  CheckCircle2, XCircle, Clock, Award, BookOpen, Trash2,
  BarChart3, ChevronRight, X, AlertCircle, Loader2
} from 'lucide-react';

const TestHistory = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all'); // all | quiz | viva
  const [quizHistory, setQuizHistory] = useState([]);
  const [vivaHistory, setVivaHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  const userId = user?.uid;

  // Load Quiz History
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const quizRef = ref(realtimeDb, `users/${userId}/quizHistory`);
    const unsub = onValue(quizRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
        setQuizHistory(list);
      } else setQuizHistory([]);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Load Viva History
  useEffect(() => {
    if (!userId) return;
    const vivaRef = ref(realtimeDb, `users/${userId}/vivaHistory`);
    const unsub = onValue(vivaRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        list.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
        setVivaHistory(list);
      } else setVivaHistory([]);
    });
    return () => unsub();
  }, [userId]);

  // Merge & filter
  const allItems = [...quizHistory, ...vivaHistory].sort((a, b) =>
    (b.completedAt || '').localeCompare(a.completedAt || '')
  );

  const filteredItems = activeTab === 'all' ? allItems
    : activeTab === 'quiz' ? quizHistory
    : vivaHistory;

  // Stats
  const totalTests = allItems.length;
  const avgScore = allItems.length > 0
    ? Math.round(allItems.reduce((s, i) => s + (i.percentage || 0), 0) / allItems.length)
    : 0;
  const bestScore = allItems.length > 0 ? Math.max(...allItems.map(i => i.percentage || 0)) : 0;
  
  // Subject-wise performance
  const subjectStats = allItems.reduce((acc, item) => {
    const subj = item.subject || 'Unknown';
    if (!acc[subj]) acc[subj] = { count: 0, totalScore: 0, subjects: [] };
    acc[subj].count++;
    acc[subj].totalScore += item.percentage || 0;
    acc[subj].subjects.push(item);
    return acc;
  }, {});
  const subjectList = Object.entries(subjectStats)
    .map(([name, data]) => ({
      name,
      count: data.count,
      avg: Math.round(data.totalScore / data.count),
      best: Math.max(...data.subjects.map(s => s.percentage || 0)),
      attempts: data.subjects
    }))
    .sort((a, b) => b.avg - a.avg);

  const handleDelete = async (item) => {
    if (!userId || !window.confirm('Delete this result?')) return;
    const path = item.type === 'quiz' ? 'quizHistory' : 'vivaHistory';
    await remove(ref(realtimeDb, `users/${userId}/${path}/${item.id}`));
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 80) return { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (percentage >= 60) return { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' };
    if (percentage >= 40) return { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' };
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  };

  const formatDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today, ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (diff === 1) return 'Yesterday, ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    if (diff < 7) return `${diff} days ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] flex items-center justify-center">
            <History className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Test History</h2>
            <p className="text-xs text-slate-500">Track all your quiz & viva results</p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[#4F46E5]" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Total Tests</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{totalTests}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Average</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{avgScore}%</p>
          </div>
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-amber-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Best Score</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{bestScore}%</p>
          </div>
          <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="w-4 h-4 text-pink-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600">Subjects</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{subjectList.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-5">
          {[
            { id: 'all', label: 'All', count: allItems.length },
            { id: 'quiz', label: 'Quiz', count: quizHistory.length, icon: Brain },
            { id: 'viva', label: 'Viva', count: vivaHistory.length, icon: Mic },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 ${
                activeTab === t.id ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
              {t.icon && <t.icon className="w-3.5 h-3.5" />}
              {t.label} ({t.count})
            </button>
          ))}
        </div>
      </div>

      {/* Subject-wise Performance */}
      {subjectList.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#4F46E5]" />
            <h3 className="text-sm font-bold text-slate-900">Subject Performance</h3>
          </div>
          <div className="space-y-3">
            {subjectList.slice(0, 6).map(subj => (
              <div key={subj.name}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{subj.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                      {subj.count} test{subj.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500">Best: {subj.best}%</span>
                    <span className={`font-bold ${subj.avg >= 70 ? 'text-emerald-600' : subj.avg >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                      Avg: {subj.avg}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${
                    subj.avg >= 70 ? 'bg-emerald-500' : subj.avg >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`} style={{ width: `${subj.avg}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History List */}
      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading history...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card p-12 text-center">
          <History className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No test history yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            Take your first quiz or viva to see your results here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const gc = getGradeColor(item.percentage);
            const isQuiz = item.type === 'quiz';
            return (
              <motion.div key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="card p-4 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedItem(item)}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    isQuiz ? 'bg-indigo-100' : 'bg-emerald-100'
                  }`}>
                    {isQuiz
                      ? <Brain className="w-6 h-6 text-indigo-600" />
                      : <Mic className="w-6 h-6 text-emerald-600" />
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {item.subject}
                        {item.chapter && ` · ${item.chapter}`}
                      </h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        isQuiz ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {isQuiz ? 'Quiz' : 'Viva'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatDate(item.completedAt)}
                      </span>
                      <span>Difficulty: <span className="capitalize font-medium">{item.difficulty}</span></span>
                      {isQuiz && <span>{item.mcqCount} MCQ · {item.shortCount} Short</span>}
                      {!isQuiz && <span>{item.totalQuestions} questions</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className={`px-3 py-2 rounded-xl border-2 ${gc.border} ${gc.bg}`}>
                      <div className={`text-2xl font-bold ${gc.text}`}>{item.percentage}%</div>
                      <div className={`text-[10px] font-bold uppercase text-center ${gc.text}`}>Grade {item.grade}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    selectedItem.type === 'quiz' ? 'bg-indigo-100' : 'bg-emerald-100'
                  }`}>
                    {selectedItem.type === 'quiz'
                      ? <Brain className="w-5 h-5 text-indigo-600" />
                      : <Mic className="w-5 h-5 text-emerald-600" />
                    }
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      {selectedItem.subject}{selectedItem.chapter && ` · ${selectedItem.chapter}`}
                    </h3>
                    <p className="text-xs text-slate-500">{formatDate(selectedItem.completedAt)}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Score Card */}
              <div className={`p-6 rounded-2xl border-2 ${getGradeColor(selectedItem.percentage).border} ${getGradeColor(selectedItem.percentage).bg} mb-5 text-center`}>
                <div className={`text-4xl font-bold ${getGradeColor(selectedItem.percentage).text}`}>
                  {selectedItem.percentage}%
                </div>
                <div className={`text-sm font-bold uppercase mt-1 ${getGradeColor(selectedItem.percentage).text}`}>
                  Grade {selectedItem.grade}
                </div>
                <div className="text-xs text-slate-600 mt-2">
                  {selectedItem.totalScore} / {selectedItem.maxScore} points
                </div>
              </div>

              {selectedItem.overallFeedback && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Feedback</h4>
                  <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedItem.overallFeedback}
                  </p>
                </div>
              )}

              {selectedItem.strengths?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">✨ Strengths</h4>
                  <ul className="space-y-1.5">
                    {selectedItem.strengths.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.weaknesses?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-2">⚠️ Improve</h4>
                  <ul className="space-y-1.5">
                    {selectedItem.weaknesses.map((w, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.studySuggestions?.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#4F46E5] mb-2">💡 Study Suggestions</h4>
                  <ul className="space-y-1.5">
                    {selectedItem.studySuggestions.map((s, i) => (
                      <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                        <ChevronRight className="w-4 h-4 text-[#4F46E5] flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedItem.mcqResults?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">MCQ Results</h4>
                  <div className="space-y-2">
                    {selectedItem.mcqResults.map((r, i) => (
                      <div key={i} className={`p-3 rounded-xl border ${r.isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          {r.isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                          <span className="text-sm font-semibold text-slate-900">Question {r.id}</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          Your: <span className={r.isCorrect ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>{r.userAnswer}</span>
                          {!r.isCorrect && <> · Correct: <span className="text-emerald-600 font-semibold">{r.correctAnswer}</span></>}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestHistory;
