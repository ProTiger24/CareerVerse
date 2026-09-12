import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Loader2, CheckCircle2, XCircle, Trophy,
  ChevronRight, RotateCcw, AlertCircle, Target, Award, BookOpen,
  Send, Lightbulb, TrendingUp
} from 'lucide-react';
import { generateQuiz, gradeQuiz } from '../services/aiService';
import { useAuth } from '../context/AuthContext';
import { ref, push, set } from 'firebase/database';
import { realtimeDb } from '../firebase/config';

const QuizTest = () => {
  const { user } = useAuth();
  const [step, setStep] = useState('setup'); // setup | quiz | grading | result
  const [config, setConfig] = useState({
    subject: '', chapter: '', topic: '',
    numMcq: 5, numShort: 3, difficulty: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!config.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    setError('');
    setLoading(true);
    const res = await generateQuiz(
      config.subject, config.chapter, config.topic,
      config.numMcq, config.numShort, config.difficulty
    );
    setLoading(false);
    if (res.success) {
      setQuiz(res.quiz);
      setAnswers({});
      setStep('quiz');
    } else {
      setError('Failed to generate quiz: ' + res.error);
    }
  };

  const handleSubmitQuiz = async () => {
    setLoading(true);
    setStep('grading');
    const res = await gradeQuiz(quiz, answers);
    setLoading(false);
    if (res.success) {
      setResult(res.result);
      setStep('result');
      // Save to Firebase
      await saveResultToFirebase(quiz, res.result);
    } else {
      setError('Failed to grade quiz: ' + res.error);
      setStep('quiz');
    }
  };

  const saveResultToFirebase = async (quizData, resultData) => {
    if (!user?.uid) return;
    try {
      const historyRef = ref(realtimeDb, `users/${user.uid}/quizHistory`);
      const newRef = push(historyRef);
      await set(newRef, {
        subject: quizData.subject || 'Unknown',
        chapter: quizData.chapter || '',
        topic: quizData.topic || '',
        difficulty: config.difficulty,
        totalScore: resultData.totalScore || 0,
        maxScore: resultData.maxScore || 0,
        percentage: resultData.percentage || 0,
        grade: resultData.grade || 'F',
        mcqCount: quizData.mcqs?.length || 0,
        shortCount: quizData.shorts?.length || 0,
        strengths: resultData.strengths || [],
        weaknesses: resultData.weaknesses || [],
        studySuggestions: resultData.studySuggestions || [],
        mcqResults: (resultData.mcqResults || []).map(r => ({
          id: r.id,
          userAnswer: r.userAnswer || '',
          correctAnswer: r.correctAnswer || '',
          isCorrect: r.isCorrect || false
        })),
        completedAt: new Date().toISOString(),
        type: 'quiz'
      });
      console.log('✅ Quiz result saved to Firebase');
    } catch (err) {
      console.error('Failed to save quiz result:', err);
    }
  };

  const handleReset = () => {
    setStep('setup');
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setError('');
  };

  // ============ SETUP ============
  if (step === 'setup') {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Quiz Test</h2>
              <p className="text-xs text-[#6B7280]">Powered by Gemini AI · Get instant marking & feedback</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Subject *</label>
              <input type="text" className="input-field" value={config.subject}
                onChange={e => setConfig({...config, subject: e.target.value})}
                placeholder="e.g. Operating System, Physics, Bangla Literature" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Chapter (optional)</label>
                <input type="text" className="input-field" value={config.chapter}
                  onChange={e => setConfig({...config, chapter: e.target.value})}
                  placeholder="e.g. Chapter 5 - Process Scheduling" />
              </div>
              <div>
                <label className="label">Topic (optional)</label>
                <input type="text" className="input-field" value={config.topic}
                  onChange={e => setConfig({...config, topic: e.target.value})}
                  placeholder="e.g. Deadlock" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">MCQs</label>
                <select className="input-field" value={config.numMcq}
                  onChange={e => setConfig({...config, numMcq: Number(e.target.value)})}>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                  <option value={8}>8</option>
                  <option value={10}>10</option>
                </select>
              </div>
              <div>
                <label className="label">Short Qs</label>
                <select className="input-field" value={config.numShort}
                  onChange={e => setConfig({...config, numShort: Number(e.target.value)})}>
                  <option value={0}>0</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>
              <div>
                <label className="label">Difficulty</label>
                <select className="input-field" value={config.difficulty}
                  onChange={e => setConfig({...config, difficulty: e.target.value})}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 py-3">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Generating quiz...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Quiz</>
              )}
            </button>
          </div>
        </div>

        <div className="card p-4 bg-[#6366F1]/5 border-[#6366F1]/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#818CF8] flex-shrink-0 mt-0.5" />
            <div className="text-xs text-[#A5B4FC]">
              <p className="font-semibold mb-1">How it works</p>
              <ul className="space-y-1 text-[#9CA3AF]">
                <li>• AI generates customized MCQ + Short questions for your topic</li>
                <li>• You answer them (no time limit)</li>
                <li>• AI grades each answer and highlights mistakes</li>
                <li>• You get detailed feedback + study suggestions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ QUIZ ============
  if (step === 'quiz' && quiz) {
    const totalQuestions = (quiz.mcqs?.length || 0) + (quiz.shorts?.length || 0);
    const answeredCount = Object.keys(answers).length;
    const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-white">{quiz.subject}{quiz.chapter && ` · ${quiz.chapter}`}</h2>
              <p className="text-xs text-[#6B7280]">{totalQuestions} questions · {answeredCount} answered</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#818CF8]">{progress}%</p>
            </div>
          </div>
          <div className="h-1.5 bg-[#0F1420] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] transition-all duration-300"
              style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* MCQs */}
        {quiz.mcqs?.map((mcq, idx) => (
          <motion.div key={`mcq-${mcq.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }} className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-[#6366F1]/15 text-[#818CF8] font-bold text-sm flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <p className="text-sm md:text-base font-medium text-white pt-1">{mcq.question}</p>
            </div>
            <div className="space-y-2 ml-11">
              {mcq.options?.map((opt, optIdx) => {
                const letter = String.fromCharCode(65 + optIdx);
                const isSelected = answers[`mcq_${mcq.id}`] === letter;
                return (
                  <button key={optIdx}
                    onClick={() => setAnswers({ ...answers, [`mcq_${mcq.id}`]: letter })}
                    className={`w-full text-left p-3 rounded-xl border transition-all text-sm ${
                      isSelected
                        ? 'bg-[#6366F1]/15 border-[#6366F1]/50 text-white'
                        : 'bg-[#0F1420] border-[#1F2937] text-[#9CA3AF] hover:border-[#6366F1]/30 hover:text-white'
                    }`}>
                    <span className={`inline-block w-6 h-6 rounded-md text-center text-xs font-bold leading-6 mr-2 ${
                      isSelected ? 'bg-[#6366F1] text-white' : 'bg-[#1F2937] text-[#6B7280]'
                    }`}>{letter}</span>
                    {opt.replace(/^[A-D]\)\s*/, '')}
                  </button>
                );
              })}
            </div>
          </motion.div>
        ))}

        {/* Short questions */}
        {quiz.shorts?.map((s, idx) => (
          <motion.div key={`short-${s.id}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (quiz.mcqs?.length || 0 + idx) * 0.05 }} className="card p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {(quiz.mcqs?.length || 0) + idx + 1}
              </span>
              <div>
                <p className="text-sm md:text-base font-medium text-white">{s.question}</p>
                <p className="text-[10px] text-[#6B7280] mt-1">Short answer · 1-3 sentences</p>
              </div>
            </div>
            <textarea rows="4" className="input-field resize-none ml-11 w-[calc(100%-2.75rem)]"
              placeholder="Type your answer here..."
              value={answers[`short_${s.id}`] || ''}
              onChange={(e) => setAnswers({ ...answers, [`short_${s.id}`]: e.target.value })} />
          </motion.div>
        ))}

        {/* Submit */}
        <div className="card p-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-white">
              {answeredCount === totalQuestions ? '✅ All questions answered!' : `${totalQuestions - answeredCount} remaining`}
            </p>
            <p className="text-xs text-[#6B7280]">Click Submit to get AI grading</p>
          </div>
          <button onClick={handleSubmitQuiz} disabled={answeredCount === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Send className="w-4 h-4" /> Submit for AI Grading
          </button>
        </div>
      </div>
    );
  }

  // ============ GRADING ============
  if (step === 'grading') {
    return (
      <div className="card p-12 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">AI is grading your answers</h2>
        <p className="text-sm text-[#6B7280]">Analyzing each response for accuracy and completeness...</p>
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce"></span>
          <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
          <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
        </div>
      </div>
    );
  }

  // ============ RESULT ============
  if (step === 'result' && result) {
    const gradeColor = result.percentage >= 80 ? 'text-emerald-400' :
                       result.percentage >= 60 ? 'text-amber-400' :
                       result.percentage >= 40 ? 'text-orange-400' : 'text-red-400';
    
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Score Header */}
        <div className="card p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/5" />
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-[#6366F1]/40">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {result.percentage}%
            </h2>
            <p className={`text-2xl font-bold ${gradeColor} mb-2`}>
              Grade: {result.grade}
            </p>
            <p className="text-sm text-[#9CA3AF]">
              {result.totalScore} / {result.maxScore} points
            </p>
          </div>
        </div>

        {/* Overall Feedback */}
        {result.overallFeedback && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#818CF8]" /> AI Feedback
            </h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{result.overallFeedback}</p>
          </div>
        )}

        {/* MCQ Results */}
        {result.mcqResults?.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Multiple Choice Results</h3>
            <div className="space-y-3">
              {result.mcqResults.map((r, i) => (
                <div key={i} className={`p-3 rounded-xl border ${
                  r.isCorrect ? 'bg-emerald-500/5 border-emerald-500/30' : 'bg-red-500/5 border-red-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {r.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                    <span className="text-sm font-semibold text-white">Question {r.id}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] ml-6">
                    Your answer: <span className={r.isCorrect ? 'text-emerald-400' : 'text-red-400'}>{r.userAnswer}</span>
                    {!r.isCorrect && (
                      <> · Correct: <span className="text-emerald-400">{r.correctAnswer}</span></>
                    )}
                  </p>
                  {r.explanation && (
                    <p className="text-xs text-[#6B7280] ml-6 mt-1 italic">{r.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Short Results */}
        {result.shortResults?.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Short Answer Results</h3>
            <div className="space-y-3">
              {result.shortResults.map((r, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0F1420] border border-[#1F2937]">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-white">Question {r.id}</span>
                    <span className={`text-sm font-bold ${
                      r.score >= (r.maxScore * 0.7) ? 'text-emerald-400' :
                      r.score >= (r.maxScore * 0.4) ? 'text-amber-400' : 'text-red-400'
                    }`}>{r.score}/{r.maxScore}</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[#6B7280] mb-1">Your answer:</p>
                      <p className="text-[#9CA3AF] bg-[#0A0E1A] p-2 rounded">{r.userAnswer}</p>
                    </div>
                    {r.expectedAnswer && (
                      <div>
                        <p className="text-[#6B7280] mb-1">Expected:</p>
                        <p className="text-emerald-400/80 bg-[#0A0E1A] p-2 rounded">{r.expectedAnswer}</p>
                      </div>
                    )}
                    {r.feedback && (
                      <div>
                        <p className="text-[#6B7280] mb-1">Feedback:</p>
                        <p className="text-[#9CA3AF] italic">{r.feedback}</p>
                      </div>
                    )}
                    {r.missingPoints?.length > 0 && (
                      <div>
                        <p className="text-amber-400 mb-1">Missing points:</p>
                        <ul className="list-disc list-inside text-[#9CA3AF]">
                          {r.missingPoints.map((mp, j) => <li key={j}>{mp}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.strengths?.length > 0 && (
            <div className="card p-5 border-emerald-500/20">
              <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-3">✨ Strengths</h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-[#9CA3AF] flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.weaknesses?.length > 0 && (
            <div className="card p-5 border-amber-500/20">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-3">⚠️ Areas to Improve</h3>
              <ul className="space-y-2">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-[#9CA3AF] flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Study Suggestions */}
        {result.studySuggestions?.length > 0 && (
          <div className="card p-5 bg-[#6366F1]/5 border-[#6366F1]/20">
            <h3 className="text-sm font-bold text-[#818CF8] uppercase tracking-wider mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Study Suggestions
            </h3>
            <ul className="space-y-2">
              {result.studySuggestions.map((s, i) => (
                <li key={i} className="text-xs text-[#A5B4FC] flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={handleReset} className="flex-1 btn-primary flex items-center justify-center gap-2 py-3">
            <RotateCcw className="w-4 h-4" /> Take Another Quiz
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default QuizTest;
