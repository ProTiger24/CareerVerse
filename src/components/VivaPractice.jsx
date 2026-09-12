import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Sparkles, Loader2, Send, Trophy, RotateCcw,
  Volume2, Bot, User, CheckCircle2, AlertCircle, Award, Target
} from 'lucide-react';
import { startViva, respondViva, gradeViva } from '../services/aiService';
import { ref, push, set } from 'firebase/database';
import { realtimeDb } from '../firebase/config';

const VivaPractice = () => {
  const [step, setStep] = useState('setup'); // setup | viva | grading | result
  const [config, setConfig] = useState({
    subject: '', chapter: '', topic: '', difficulty: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [conversation, setConversation] = useState([]); // [{role, text}]
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [result, setResult] = useState(null);
  const [voiceSupported, setVoiceSupported] = useState(true);

  const recognitionRef = useRef(null);
  const MAX_QUESTIONS = 5;

  // ============ Web Speech API ============
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceSupported(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setUserAnswer(prev => prev + ' ' + finalTranscript);
      }
    };
    recognition.onerror = (e) => {
      console.error('Speech error:', e);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error(e);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  // ============ START VIVA ============
  const handleStart = async () => {
    if (!config.subject.trim()) {
      setError('Please enter a subject');
      return;
    }
    setError('');
    setLoading(true);
    const res = await startViva(config.subject, config.chapter, config.topic, config.difficulty);
    setLoading(false);
    if (res.success) {
      setCurrentQuestion(res.data.question);
      setQuestionNumber(res.data.questionNumber || 1);
      setConversation([{ role: 'examiner', text: res.data.question }]);
      setStep('viva');
      speakText(res.data.question);
    } else {
      setError('Failed to start viva: ' + res.error);
    }
  };

  // ============ SUBMIT ANSWER ============
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    const newConv = [...conversation, { role: 'student', text: userAnswer.trim() }];
    setConversation(newConv);
    setUserAnswer('');
    setLoading(true);

    if (questionNumber >= MAX_QUESTIONS) {
      // End session and grade
      const res = await gradeViva(config.subject, newConv);
      setLoading(false);
      if (res.success) {
        setResult(res.result);
        setStep('result');
        // Save to Firebase
        await saveVivaResultToFirebase(res.result, newConv);
      } else {
        setError('Failed to grade: ' + res.error);
      }
    } else {
      // Ask next question
      const res = await respondViva(config.subject, newConv, userAnswer, questionNumber);
      setLoading(false);
      if (res.success) {
        const { acknowledgement, question, questionNumber: nextNum } = res.data;
        // Add acknowledgement to conversation
        setConversation([...newConv, { role: 'examiner', text: acknowledgement }]);
        setCurrentQuestion(question);
        setQuestionNumber(nextNum);
        // Add next question after short delay
        setTimeout(() => {
          setConversation(prev => [...prev, { role: 'examiner', text: question }]);
          speakText(question);
        }, 1500);
      } else {
        setError('Failed to get next question: ' + res.error);
      }
    }
  };

  const saveVivaResultToFirebase = async (resultData, conversationData) => {
    if (!user?.uid) return;
    try {
      const historyRef = ref(realtimeDb, `users/${user.uid}/vivaHistory`);
      const newRef = push(historyRef);
      await set(newRef, {
        subject: config.subject || 'Unknown',
        chapter: config.chapter || '',
        topic: config.topic || '',
        difficulty: config.difficulty,
        totalScore: resultData.totalScore || 0,
        maxScore: resultData.maxScore || 0,
        percentage: resultData.percentage || 0,
        grade: resultData.grade || 'F',
        totalQuestions: Math.ceil(conversationData.filter(t => t.role === 'examiner').length / 2),
        overallFeedback: resultData.overallFeedback || '',
        strengths: resultData.strengths || [],
        weaknesses: resultData.weaknesses || [],
        studySuggestions: resultData.studySuggestions || [],
        questionBreakdown: resultData.questionBreakdown || [],
        completedAt: new Date().toISOString(),
        type: 'viva'
      });
      console.log('✅ Viva result saved to Firebase');
    } catch (err) {
      console.error('Failed to save viva result:', err);
    }
  };

  const handleReset = () => {
    setStep('setup');
    setConversation([]);
    setCurrentQuestion(null);
    setQuestionNumber(1);
    setUserAnswer('');
    setResult(null);
    setError('');
    window.speechSynthesis?.cancel();
  };

  useEffect(() => {
    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // ============ SETUP ============
  if (step === 'setup') {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Viva Practice</h2>
              <p className="text-xs text-[#6B7280]">Voice-based oral exam with Gemini AI</p>
            </div>
          </div>

          {!voiceSupported && (
            <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Voice not supported in your browser. Please use Chrome/Edge for voice input.
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">Subject *</label>
              <input type="text" className="input-field" value={config.subject}
                onChange={e => setConfig({...config, subject: e.target.value})}
                placeholder="e.g. Operating System, DBMS, Java, React" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="label">Chapter (optional)</label>
                <input type="text" className="input-field" value={config.chapter}
                  onChange={e => setConfig({...config, chapter: e.target.value})}
                  placeholder="e.g. Chapter 5" />
              </div>
              <div>
                <label className="label">Topic (optional)</label>
                <input type="text" className="input-field" value={config.topic}
                  onChange={e => setConfig({...config, topic: e.target.value})}
                  placeholder="e.g. Deadlock" />
              </div>
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

            <button onClick={handleStart} disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition-all">
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting viva...</>
              ) : (
                <><Mic className="w-4 h-4" /> Start Viva Session</>
              )}
            </button>
          </div>
        </div>

        <div className="card p-4 bg-emerald-500/5 border-emerald-500/20">
          <p className="text-xs text-emerald-400 font-semibold mb-2">🎤 How it works</p>
          <ul className="text-xs text-[#9CA3AF] space-y-1">
            <li>• AI examiner asks you 5 questions one by one</li>
            <li>• Answer using your voice (mic) or type</li>
            <li>• AI listens, evaluates, and asks next question</li>
            <li>• At the end you get a full grading report</li>
          </ul>
        </div>
      </div>
    );
  }

  // ============ VIVA IN PROGRESS ============
  if (step === 'viva') {
    return (
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Progress */}
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">
                Question {questionNumber} of {MAX_QUESTIONS}
              </p>
              <p className="text-xs text-[#6B7280]">{config.subject}{config.chapter && ` · ${config.chapter}`}</p>
            </div>
            <div className="flex items-center gap-2">
              {[1,2,3,4,5].map(n => (
                <div key={n} className={`w-2 h-2 rounded-full ${
                  n < questionNumber ? 'bg-emerald-400' :
                  n === questionNumber ? 'bg-[#6366F1] animate-pulse' : 'bg-[#374151]'
                }`} />
              ))}
            </div>
          </div>
        </div>

        {/* Conversation */}
        <div className="card p-5 max-h-[500px] overflow-y-auto space-y-3">
          {conversation.map((turn, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${turn.role === 'student' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                turn.role === 'examiner' 
                  ? 'bg-gradient-to-br from-emerald-500 to-teal-600' 
                  : 'bg-gradient-to-br from-[#6366F1] to-[#8B5CF6]'
              }`}>
                {turn.role === 'examiner' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[75%] p-3 rounded-2xl ${
                turn.role === 'examiner'
                  ? 'bg-[#0F1420] border border-[#1F2937] rounded-tl-sm'
                  : 'bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-tr-sm'
              }`}>
                <p className={`text-sm ${turn.role === 'examiner' ? 'text-white/90' : 'text-white'}`}>
                  {turn.text}
                </p>
                {turn.role === 'examiner' && (
                  <button onClick={() => speakText(turn.text)}
                    className="mt-2 text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Replay
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-[#0F1420] border border-[#1F2937] rounded-2xl rounded-tl-sm p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Answer Input */}
        <div className="card p-5">
          <label className="label">Your Answer {isListening && <span className="text-red-400 animate-pulse">● Recording...</span>}</label>
          <textarea rows="3" className="input-field resize-none mb-3"
            placeholder="Speak using mic or type your answer..."
            value={userAnswer} onChange={(e) => setUserAnswer(e.target.value)} disabled={loading} />
          
          <div className="flex gap-2">
            {voiceSupported && (
              <button onClick={isListening ? stopListening : startListening} disabled={loading}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400'
                } disabled:opacity-50`}>
                {isListening ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Voice</>}
              </button>
            )}
            <button onClick={handleSubmitAnswer} disabled={!userAnswer.trim() || loading}
              className="flex-1 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {questionNumber >= MAX_QUESTIONS ? (
                <><Trophy className="w-4 h-4" /> Finish & Grade</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Answer</>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ GRADING ============
  if (step === 'grading') {
    return (
      <div className="card p-12 text-center max-w-2xl mx-auto">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-6 animate-pulse">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">AI is grading your viva</h2>
        <p className="text-sm text-[#6B7280]">Analyzing all your answers...</p>
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
        <div className="card p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-600/5" />
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-emerald-500/40">
              <Award className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">{result.percentage}%</h2>
            <p className={`text-2xl font-bold ${gradeColor} mb-2`}>Grade: {result.grade}</p>
            <p className="text-sm text-[#9CA3AF]">{result.totalScore} / {result.maxScore} points</p>
          </div>
        </div>

        {result.overallFeedback && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-3">📋 Overall Feedback</h3>
            <p className="text-sm text-[#9CA3AF] leading-relaxed">{result.overallFeedback}</p>
          </div>
        )}

        {result.questionBreakdown?.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Question Breakdown</h3>
            <div className="space-y-3">
              {result.questionBreakdown.map((q, i) => (
                <div key={i} className="p-4 rounded-xl bg-[#0F1420] border border-[#1F2937]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-white">Q{i + 1}</span>
                    <span className={`text-sm font-bold ${
                      q.score >= (q.maxScore * 0.7) ? 'text-emerald-400' :
                      q.score >= (q.maxScore * 0.4) ? 'text-amber-400' : 'text-red-400'
                    }`}>{q.score}/{q.maxScore}</span>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mb-2">{q.question}</p>
                  {q.feedback && <p className="text-xs text-[#6B7280] italic">{q.feedback}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.strengths?.length > 0 && (
            <div className="card p-5 border-emerald-500/20">
              <h3 className="text-sm font-bold text-emerald-400 mb-3">✨ Strengths</h3>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li key={i} className="text-xs text-[#9CA3AF] flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {result.weaknesses?.length > 0 && (
            <div className="card p-5 border-amber-500/20">
              <h3 className="text-sm font-bold text-amber-400 mb-3">⚠️ Improve</h3>
              <ul className="space-y-2">
                {result.weaknesses.map((w, i) => (
                  <li key={i} className="text-xs text-[#9CA3AF] flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />{w}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {result.studySuggestions?.length > 0 && (
          <div className="card p-5 bg-emerald-500/5 border-emerald-500/20">
            <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4" /> Study Suggestions
            </h3>
            <ul className="space-y-2">
              {result.studySuggestions.map((s, i) => (
                <li key={i} className="text-xs text-[#A5B4FC] flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />{s}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button onClick={handleReset} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          <RotateCcw className="w-4 h-4" /> Start New Viva
        </button>
      </div>
    );
  }

  return null;
};

export default VivaPractice;
