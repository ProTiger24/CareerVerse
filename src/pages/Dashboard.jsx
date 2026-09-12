import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, onValue, set, push, update } from 'firebase/database';
import { realtimeDb, auth } from '../firebase/config';
import { signOut } from 'firebase/auth';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { 
  LayoutDashboard, Briefcase, FileText, BookOpen, History, Code2, BarChart3, 
  Video, Lightbulb, LogOut, Rocket, Menu, X, Bell, Search, Clock, FileCheck, 
  CheckCircle2, TrendingUp, TrendingDown, Minus, Calendar, Sparkles, 
  Send, Trophy, Flame, Target, ChevronRight, Zap, GraduationCap, 
  FolderGit2, Settings, Phone, ArrowRight, Quote, ClipboardList, Bot, 
  Moon, Plus, Star, Activity, Award, User, ExternalLink, Layers, Brain, Mic
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

import YouTubeSection from '../components/YouTubeSection';
import ReportSection from '../components/ReportSection';
import TaskSection from '../components/TaskSection';
import StudyPlanner from '../components/StudyPlanner';
import CodingHub from '../components/CodingHub';
import Analytics from '../components/Analytics';
import Motivation from '../components/Motivation';
import QuizTest from '../components/QuizTest';
import VivaPractice from '../components/VivaPractice';
import DigitalLibrary from '../components/DigitalLibrary';
import CalendarIntegration from '../components/CalendarIntegration';
import TestHistory from '../components/TestHistory';
import { askAICoach } from '../services/aiService';

// ============ HELPERS ============
const islamicMotivations = [
  { type: 'Quran', text: 'And whoever puts their trust in Allah, He is sufficient for them.', reference: 'Surah At-Talaq 65:3' },
  { type: 'Quran', text: 'Indeed, with hardship comes ease.', reference: 'Surah Ash-Sharh 94:6' },
  { type: 'Quran', text: 'So remember Me; I will remember you.', reference: 'Surah Al-Baqarah 2:152' },
  { type: 'Hadith', text: 'The best of you are those who are best to their families.', reference: 'Sunan Ibn Majah' },
  { type: 'Hadith', text: 'The strong person is not the one who can wrestle, but the one who controls himself when angry.', reference: 'Sahih Bukhari' },
];

const timeAgo = (iso) => {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 604800)}w ago`;
};

const formatMinutes = (m) => {
  if (!m) return '0m';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return mm > 0 ? `${h}h ${mm}m` : `${h}h`;
};

// ============ SIDEBAR ============
const Sidebar = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const { user } = useAuth();
  const mainNav = [
    { id: 'home', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: ClipboardList },
    { id: 'study', label: 'Study Planner', icon: BookOpen },
    { id: 'aicoach', label: 'AI Coach', icon: Bot },
    { id: 'codeforces', label: 'Coding', icon: Code2, badge: 'Pro' },
    { id: 'videos', label: 'Videos', icon: Video },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'analytics', label: 'Progress', icon: BarChart3 },
    { id: 'quiz', label: 'Quiz Test', icon: Brain },
    { id: 'viva', label: 'Viva Practice', icon: Mic },
    { id: 'testhistory', label: 'Test History', icon: History },
    { id: 'library', label: 'Library', icon: BookOpen },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'motivation', label: 'Motivation', icon: Lightbulb },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    window.location.href = '/login';
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" onClick={onClose} />
        )}
      </AnimatePresence>

      <aside className={`w-[240px] h-screen bg-[#0F1420] border-r border-[#1F2937] flex flex-col fixed left-0 top-0 z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}>
        
        {/* Logo */}
        <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center shadow-lg shadow-[#6366F1]/30">
              <Rocket className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">CareerVerse</h1>
              <p className="text-[10px] text-[#6B7280] font-medium">Plan · Learn · Grow</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-[#6B7280] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => { setActiveTab(item.id); onClose?.(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
                  isActive
                    ? 'bg-[#6366F1]/15 text-[#A5B4FC] border border-[#6366F1]/30'
                    : 'text-[#9CA3AF] hover:text-white hover:bg-white/[0.03] border border-transparent'
                }`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[#1F2937]">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:text-white hover:bg-white/[0.03] transition-all text-sm font-medium mb-1">
            <Settings className="w-[18px] h-[18px]" strokeWidth={2} />
            <span>Settings</span>
          </button>
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-xs font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-[#6B7280] truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#9CA3AF] hover:text-red-400 hover:bg-red-500/5 transition-all text-sm font-medium">
            <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// ============ HEADER ============
const Header = ({ onMenuClick, activeTab }) => {
  const { user } = useAuth();
  const pageTitles = {
    home: 'Dashboard', tasks: 'Tasks', study: 'Study Planner', aicoach: 'AI Coach',
    codeforces: 'Coding', analytics: 'Progress', videos: 'Videos',
    reports: 'Reports', motivation: 'Motivation', testhistory: 'Test History'
  };

  return (
    <header className="sticky top-0 z-30 bg-[#0A0E1A]/80 backdrop-blur-xl border-b border-[#1F2937]">
      <div className="flex items-center justify-between gap-4 px-4 md:px-6 py-3.5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button onClick={onMenuClick} className="md:hidden text-[#9CA3AF] hover:text-white flex-shrink-0">
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex items-center gap-2 bg-[#161B2E] border border-[#1F2937] rounded-xl px-3.5 py-2 w-full max-w-md">
            <Search className="w-4 h-4 text-[#6B7280]" />
            <input type="text" placeholder="Search jobs, tasks, resources..." 
              className="bg-transparent flex-1 text-sm text-white placeholder-[#6B7280] focus:outline-none" />
          </div>
          <h2 className="md:hidden text-sm font-semibold text-white truncate">
            {pageTitles[activeTab] || 'Dashboard'}
          </h2>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="w-9 h-9 rounded-xl bg-[#161B2E] border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-all">
            <Moon className="w-4 h-4" />
          </button>
          <button className="relative w-9 h-9 rounded-xl bg-[#161B2E] border border-[#1F2937] flex items-center justify-center text-[#9CA3AF] hover:text-white transition-all">
            <Bell className="w-4 h-4" />
            <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
          </button>
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-[#1F2937] ml-1">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-sm font-bold">
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="hidden lg:block">
              <p className="text-xs font-semibold text-white leading-tight">
                {user?.displayName || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-[10px] text-[#6B7280]">Student</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

// ============ KPI CARD WITH SPARKLINE ============
const KPICard = ({ icon: Icon, label, value, change, trend, accent = 'indigo', sparkData }) => {
  const accents = {
    indigo: { bg: 'bg-[#6366F1]/15', text: 'text-[#818CF8]', stroke: '#6366F1' },
    emerald: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', stroke: '#10B981' },
    amber: { bg: 'bg-amber-500/15', text: 'text-amber-400', stroke: '#F59E0B' },
    pink: { bg: 'bg-pink-500/15', text: 'text-pink-400', stroke: '#EC4899' },
  };
  const c = accents[accent] || accents.indigo;
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[#6B7280]';
  const data = (sparkData && sparkData.length > 0) ? sparkData : [{ v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }, { v: 0 }];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card card-hover relative overflow-hidden">
      <div className="p-5 pb-16">
        <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-4`}>
          <Icon className={`w-5 h-5 ${c.text}`} strokeWidth={2.2} />
        </div>
        <p className="text-[11px] uppercase tracking-wider font-semibold text-[#6B7280] mb-1.5">{label}</p>
        <div className="flex items-end justify-between mb-1">
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
        {change && (
          <span className={`text-[11px] font-semibold flex items-center gap-1 ${trendColor}`}>
            <TrendIcon className="w-3 h-3" /> {change}
          </span>
        )}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-14">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`spark-${accent}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.stroke} stopOpacity={0.5} />
                <stop offset="100%" stopColor={c.stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={c.stroke} strokeWidth={2} fill={`url(#spark-${accent})`} isAnimationActive={true} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
};

// ============ MAIN DASHBOARD ============
const Dashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentMotivation, setCurrentMotivation] = useState(islamicMotivations[0]);

  // Realtime state
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);

  // Add application modal
  const [showAppForm, setShowAppForm] = useState(false);
  const [appForm, setAppForm] = useState({ company: '', role: '' });

  const userId = user?.uid;

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 768);
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const i = setInterval(() => 
      setCurrentMotivation(islamicMotivations[Math.floor(Math.random() * islamicMotivations.length)]), 30000);
    return () => clearInterval(i);
  }, []);

  // Firebase subscriptions
  useEffect(() => {
    if (!userId) return;
    const unsubs = [
      // Tasks
      onValue(ref(realtimeDb, `users/${userId}/tasks`), (s) => {
        const d = s.val();
        setTasks(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
      }),
      // Subjects
      onValue(ref(realtimeDb, `users/${userId}/studySubjects`), (s) => {
        const d = s.val();
        if (!d) return setSubjects([]);
        setSubjects(Object.keys(d).map(k => ({
          id: k, ...d[k],
          chapters: d[k].chapters ? Object.keys(d[k].chapters).map(ck => ({ id: ck, ...d[k].chapters[ck] })) : []
        })));
      }),
      // Sessions
      onValue(ref(realtimeDb, `users/${userId}/codingSessions`), (s) => {
        const d = s.val();
        setSessions(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
      }),
      // Applications
      onValue(ref(realtimeDb, `users/${userId}/applications`), (s) => {
        const d = s.val();
        setApplications(d ? Object.keys(d).map(k => ({ id: k, ...d[k] })) : []);
      }),
      // Activities
      onValue(ref(realtimeDb, `users/${userId}/activities`), (s) => {
        const d = s.val();
        if (!d) return setActivities([]);
        const list = Object.keys(d).map(k => ({ id: k, ...d[k] }));
        list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
        setActivities(list.slice(0, 6));
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, [userId]);

  // Derived values
  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => (t.taskDate || t.createdAt?.split('T')[0]) === todayStr);
  const completedToday = todayTasks.filter(t => t.completed).length;
  const totalXP = tasks.length * 10 + tasks.filter(t => t.completed).length * 5;

  // Streak from sessions
  const streak = (() => {
    if (!sessions.length) return 0;
    const uniqueDays = [...new Set(sessions.map(s => s.date))].sort().reverse();
    let s = 0;
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    for (const day of uniqueDays) {
      if (day === d.toISOString().split('T')[0]) { s++; d.setDate(d.getDate() - 1); }
      else break;
    }
    return s;
  })();

  const todayMinutes = Math.round(sessions.filter(s => s.date === todayStr).reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const weekMinutes = Math.round(sessions.filter(s => s.date >= weekAgo.toISOString().split('T')[0]).reduce((sum, s) => sum + (s.duration || 0), 0) / 60);

  // Application stats
  const appStats = {
    applied: applications.length,
    call: applications.filter(a => a.status === 'call').length,
    interview: applications.filter(a => a.status === 'interview').length,
    rejected: applications.filter(a => a.status === 'rejected').length,
  };
  const appPercent = (n) => applications.length > 0 ? Math.round((n / applications.length) * 100) : 0;

  // Learning progress
  const learningProgress = subjects.slice(0, 4).map(s => {
    const total = s.chapters?.length || 0;
    const done = s.chapters?.filter(c => c.status === 'completed').length || 0;
    return { name: s.name, done, total, color: s.color || '#6366F1' };
  });
  const totalChapters = subjects.reduce((sum, s) => sum + (s.chapters?.length || 0), 0);
  const doneChapters = subjects.reduce((sum, s) => sum + (s.chapters?.filter(c => c.status === 'completed').length || 0), 0);
  const overallProgress = totalChapters > 0 ? Math.round((doneChapters / totalChapters) * 100) : 0;

  // Upcoming tasks
  const upcoming = tasks.filter(t => !t.completed && t.taskDate)
    .sort((a, b) => a.taskDate.localeCompare(b.taskDate))
    .slice(0, 4)
    .map(t => {
      const d = new Date(t.taskDate);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase(),
        title: t.title,
        status: t.totalTime > 0 ? 'In Progress' : 'Pending'
      };
    });

  // Recent activity
  const recentActivity = activities.length > 0 ? activities.slice(0, 5).map(a => {
    const iconMap = { task: CheckCircle2, study: BookOpen, application: Briefcase, project: Code2, coding: Code2 };
    const colorMap = { task: '#10B981', study: '#6366F1', application: '#3B82F6', project: '#F59E0B', coding: '#F59E0B' };
    return {
      icon: iconMap[a.type] || Activity,
      text: a.text,
      time: timeAgo(a.timestamp),
      color: colorMap[a.type] || '#6366F1'
    };
  }) : [{ icon: Sparkles, text: 'Welcome to CareerVerse! Start by creating a task or study plan.', time: 'Just now', color: '#6366F1' }];

  // Add application
  const handleAddApplication = async (e) => {
    e.preventDefault();
    if (!userId || !appForm.company.trim()) return;
    const r = ref(realtimeDb, `users/${userId}/applications`);
    const newRef = push(r);
    await set(newRef, {
      company: appForm.company.trim(),
      role: appForm.role.trim(),
      status: 'applied',
      createdAt: new Date().toISOString(),
    });
    // Log activity
    await push(ref(realtimeDb, `users/${userId}/activities`), {
      type: 'application',
      text: `Applied to ${appForm.company} ${appForm.role ? `(${appForm.role})` : ''}`,
      timestamp: new Date().toISOString()
    });
    setAppForm({ company: '', role: '' });
    setShowAppForm(false);
  };

  // AI Chat
  const handleChatSend = async (e) => {
    e?.preventDefault();
    if (!chatMessage.trim() || isThinking) return;
    const userMsg = chatMessage.trim();
    setChatMessage('');
    setIsThinking(true);
    setChatHistory(prev => [...prev, { user: userMsg, ai: null }]);
    const aiResponse = await askAICoach(userMsg, 'career coaching');
    setChatHistory(prev => [...prev.slice(0, -1), { user: userMsg, ai: aiResponse }]);
    setIsThinking(false);
  };

  const bottomNavItems = [
    { icon: LayoutDashboard, label: 'Home', id: 'home' },
    { icon: ClipboardList, label: 'Tasks', id: 'tasks' },
    { icon: BookOpen, label: 'Study', id: 'study' },
    { icon: Bot, label: 'AI', id: 'aicoach' },
    { icon: FileText, label: 'Reports', id: 'reports' },
  ];

  const quickLinks = [
    { icon: FileText, label: 'Update Resume', href: '#' },
    { icon: ExternalLink, label: 'View Portfolio', href: '#' },
    { icon: Code2, label: 'LeetCode', href: 'https://leetcode.com' },
    { icon: Trophy, label: 'Codeforces', href: 'https://codeforces.com' },
    { icon: GraduationCap, label: 'CodeChef', href: 'https://www.codechef.com' },
    { icon: FolderGit2, label: 'GitHub', href: 'https://github.com' },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F9FAFB]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="md:ml-[240px] pb-20 md:pb-6">
        <Header onMenuClick={() => setIsSidebarOpen(true)} activeTab={activeTab} />

        <main className="p-4 md:p-6 space-y-6 max-w-[1400px] mx-auto">
          
          {/* ============ HOME ============ */}
          {activeTab === 'home' && (
            <>
              {/* Greeting */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Good Evening, {user?.displayName || user?.email?.split('@')[0] || 'Student'} 👋
                  </h1>
                  <p className="text-sm text-[#9CA3AF] mt-1">Your hard work today builds your better tomorrow.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#161B2E] border border-[#1F2937] rounded-xl px-4 py-2.5 self-start">
                  <Calendar className="w-4 h-4 text-[#818CF8]" />
                  <span className="font-semibold text-white">
                    {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className="text-[#6B7280]">·</span>
                  <span>{new Date().toLocaleDateString('en-GB', { weekday: 'long' })}</span>
                </div>
              </div>

              {/* Main grid */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* LEFT: main content (9 cols) */}
                <div className="xl:col-span-9 space-y-6">
                  
                  {/* KPI Cards with Sparklines */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <KPICard 
                      icon={Briefcase} 
                      label="Tasks Today" 
                      value={`${completedToday}/${todayTasks.length}`}
                      change={tasks.length > 0 ? `+${tasks.filter(t=>t.completed).length} done` : 'Start now'}
                      trend={tasks.length > 0 ? 'up' : 'neutral'} 
                      accent="indigo"
                      sparkData={(() => {
                        const arr = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date(); d.setDate(d.getDate() - i);
                          const ds = d.toISOString().split('T')[0];
                          arr.push({ v: tasks.filter(t => (t.taskDate || t.createdAt?.split('T')[0]) === ds && t.completed).length });
                        }
                        return arr;
                      })()}
                    />
                    <KPICard 
                      icon={Phone} 
                      label="Today's Study" 
                      value={formatMinutes(todayMinutes)}
                      change={weekMinutes > 0 ? `${formatMinutes(weekMinutes)} this week` : 'Start now'}
                      trend={todayMinutes > 0 ? 'up' : 'neutral'} 
                      accent="emerald"
                      sparkData={(() => {
                        const arr = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date(); d.setDate(d.getDate() - i);
                          const ds = d.toISOString().split('T')[0];
                          arr.push({ v: Math.round(sessions.filter(s => s.date === ds).reduce((sum, s) => sum + (s.duration || 0), 0) / 60) });
                        }
                        return arr;
                      })()}
                    />
                    <KPICard 
                      icon={FileCheck} 
                      label="Current Streak" 
                      value={`${streak} day${streak !== 1 ? 's' : ''}`}
                      change={streak > 0 ? 'Keep going!' : 'Start today'}
                      trend={streak > 0 ? 'up' : 'neutral'} 
                      accent="amber"
                      sparkData={(() => {
                        const arr = [];
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date(); d.setDate(d.getDate() - i);
                          const ds = d.toISOString().split('T')[0];
                          arr.push({ v: sessions.some(s => s.date === ds) ? 1 : 0 });
                        }
                        return arr;
                      })()}
                    />
                    <KPICard 
                      icon={CheckCircle2} 
                      label="XP Points" 
                      value={totalXP}
                      change={totalXP > 0 ? `+${totalXP}` : 'No XP yet'}
                      trend={totalXP > 0 ? 'up' : 'neutral'} 
                      accent="pink"
                      sparkData={(() => {
                        const arr = []; let cum = 0;
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date(); d.setDate(d.getDate() - i);
                          const ds = d.toISOString().split('T')[0];
                          const dayT = tasks.filter(t => (t.taskDate || t.createdAt?.split('T')[0]) === ds);
                          cum += dayT.length * 10 + dayT.filter(t => t.completed).length * 5;
                          arr.push({ v: cum });
                        }
                        return arr;
                      })()}
                    />
                  </div>

                  {/* Application Progress + Upcoming Tasks */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Application Progress */}
                    <div className="card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-base font-semibold text-white">Application Progress</h3>
                          <p className="text-xs text-[#6B7280] mt-0.5">Your journey at a glance</p>
                        </div>
                        <button onClick={() => setShowAppForm(true)} className="text-xs text-[#818CF8] hover:text-[#A5B4FC] font-medium flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      {applications.length === 0 ? (
                        <div className="text-center py-8">
                          <Briefcase className="w-10 h-10 text-[#6B7280] mx-auto mb-3 opacity-40" />
                          <p className="text-sm text-[#6B7280] mb-3">No applications yet</p>
                          <button onClick={() => setShowAppForm(true)} className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-semibold">
                            + Add First Application
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-6">
                          <div className="w-28 h-28 flex-shrink-0">
                            <CircularProgressbar value={100} text={`${applications.length}`}
                              styles={buildStyles({ textColor: '#fff', pathColor: '#6366F1', trailColor: '#1F2937', textSize: '24px' })} />
                            <p className="text-[10px] text-center text-[#6B7280] mt-1">Total Applied</p>
                          </div>
                          <div className="flex-1 space-y-2.5">
                            {[
                              { label: 'Applied', value: appStats.applied, color: '#6366F1' },
                              { label: 'Call', value: appStats.call, color: '#10B981' },
                              { label: 'Interview', value: appStats.interview, color: '#94A3B8' },
                              { label: 'Rejected', value: appStats.rejected, color: '#EF4444' },
                            ].map(s => (
                              <div key={s.label} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }}></span>
                                  <span className="text-[#9CA3AF]">{s.label}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-semibold">{s.value}</span>
                                  <span className="text-[#6B7280] text-[10px]">({appPercent(s.value)}%)</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upcoming Tasks */}
                    <div className="card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-white">Upcoming Tasks</h3>
                        <button onClick={() => setActiveTab('tasks')} className="text-xs text-[#818CF8] hover:text-[#A5B4FC] font-medium flex items-center gap-1">
                          View all <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      {upcoming.length === 0 ? (
                        <div className="text-center py-8">
                          <ClipboardList className="w-10 h-10 text-[#6B7280] mx-auto mb-3 opacity-40" />
                          <p className="text-sm text-[#6B7280] mb-3">No upcoming tasks</p>
                          <button onClick={() => setActiveTab('tasks')} className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-semibold">
                            + Add Task
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {upcoming.map((t, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-[#0F1420] rounded-xl border border-[#1F2937]">
                              <div className="w-10 h-10 rounded-lg bg-[#6366F1]/10 border border-[#6366F1]/20 flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-[8px] text-[#818CF8] font-bold uppercase">{t.date.split(' ')[0]}</span>
                                <span className="text-xs text-white font-bold">{t.date.split(' ')[1]}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white truncate">{t.title}</p>
                              </div>
                              <span className={`text-[10px] font-semibold px-2 py-1 rounded-md ${
                                t.status === 'Pending' ? 'bg-amber-500/15 text-amber-400' : 'bg-[#6366F1]/15 text-[#818CF8]'
                              }`}>{t.status}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Learning Progress + Recent Activity */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-white">Learning Progress</h3>
                        <button onClick={() => setActiveTab('study')} className="text-xs text-[#818CF8] hover:text-[#A5B4FC] font-medium flex items-center gap-1">
                          View all <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                      {learningProgress.length === 0 ? (
                        <div className="text-center py-8">
                          <BookOpen className="w-10 h-10 text-[#6B7280] mx-auto mb-3 opacity-40" />
                          <p className="text-sm text-[#6B7280] mb-3">No subjects yet</p>
                          <button onClick={() => setActiveTab('study')} className="text-xs bg-[#6366F1] hover:bg-[#4F46E5] text-white px-4 py-2 rounded-lg font-semibold">
                            + Create Study Plan
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-5">
                          <div className="w-24 h-24 flex-shrink-0">
                            <CircularProgressbar value={overallProgress} text={`${doneChapters}/${totalChapters}`}
                              styles={buildStyles({ textColor: '#fff', pathColor: '#6366F1', trailColor: '#1F2937', textSize: '22px' })} />
                            <p className="text-[10px] text-center text-[#6B7280] mt-1">Chapters Done</p>
                          </div>
                          <div className="flex-1 space-y-3">
                            {learningProgress.map(lp => (
                              <div key={lp.name}>
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-xs text-[#9CA3AF] truncate">{lp.name}</span>
                                  <span className="text-xs text-white font-semibold">{lp.done}/{lp.total}</span>
                                </div>
                                <div className="h-1.5 bg-[#0F1420] rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${lp.total > 0 ? (lp.done / lp.total) * 100 : 0}%` }}
                                    transition={{ duration: 0.8 }} className="h-full rounded-full" style={{ backgroundColor: lp.color }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="card p-5">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-semibold text-white">Recent Activity</h3>
                      </div>
                      <div className="space-y-3">
                        {recentActivity.map((a, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${a.color}22`, border: `1px solid ${a.color}44` }}>
                              <a.icon className="w-4 h-4" style={{ color: a.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white truncate">{a.text}</p>
                              <p className="text-[10px] text-[#6B7280]">{a.time}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: AI Coach + Quick Links + Motivation (3 cols) */}
                <div className="xl:col-span-3 space-y-4">
                  <div className="card p-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-[#818CF8]" />
                      <h3 className="text-sm font-semibold text-white">AI Coach</h3>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-[#6366F1]/20 text-[#818CF8] font-bold">BETA</span>
                    </div>
                    <p className="text-[11px] text-[#6B7280] mb-4">Your personal AI career assistant</p>

                    <div className="flex gap-2 mb-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
                        <Bot className="w-5 h-5 text-white" />
                      </div>
                      <div className="bg-[#0F1420] rounded-2xl rounded-tl-sm p-3 border border-[#1F2937] flex-1">
                        <p className="text-xs text-[#E5E7EB] leading-relaxed">
                          Hi {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}! 👋 I'm your AI Coach. I can help with career advice, resume tips, interview prep, and more.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      {[
                        { icon: Briefcase, q: 'Suggest best companies for me' },
                        { icon: FileText, q: 'How to improve my resume?' },
                        { icon: BookOpen, q: 'Create a study plan' },
                      ].map((s, i) => (
                        <button key={i} onClick={() => { setActiveTab('aicoach'); setChatMessage(s.q); }}
                          className="w-full flex items-center gap-2 text-left text-xs text-[#9CA3AF] hover:text-white px-3 py-2 rounded-lg bg-[#0F1420] hover:bg-[#6366F1]/10 border border-[#1F2937] hover:border-[#6366F1]/30 transition-all group">
                          <s.icon className="w-3.5 h-3.5 flex-shrink-0" />
                          <span className="flex-1 truncate">{s.q}</span>
                          <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input type="text" placeholder="Ask me anything..." className="input-field flex-1 text-xs"
                        value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSend(e)} />
                      <button onClick={handleChatSend} disabled={isThinking || !chatMessage.trim()}
                        className="w-9 h-9 rounded-xl bg-[#6366F1] hover:bg-[#4F46E5] flex items-center justify-center text-white transition-all disabled:opacity-50 flex-shrink-0">
                        {isThinking ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Send className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-white mb-3">Quick Links</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {quickLinks.map((q, i) => (
                        <a key={i} href={q.href} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2.5 bg-[#0F1420] hover:bg-[#6366F1]/10 border border-[#1F2937] hover:border-[#6366F1]/30 rounded-lg transition-all group">
                          <q.icon className="w-3.5 h-3.5 text-[#818CF8] flex-shrink-0" />
                          <span className="text-[11px] text-[#9CA3AF] group-hover:text-white truncate">{q.label}</span>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="card p-5 bg-gradient-to-br from-[#161B2E] to-[#1F1438] relative overflow-hidden">
                    <Quote className="w-8 h-8 text-[#6366F1]/20 absolute top-3 right-3" />
                    <div className="relative z-10">
                      <p className="text-sm text-white/90 italic leading-relaxed">
                        "{currentMotivation.text}"
                      </p>
                      <p className="text-[11px] text-emerald-400 mt-3">— {currentMotivation.reference}</p>
                    </div>
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[#6366F1]/10 rounded-full blur-2xl"></div>
                  </div>
                </div>
              </div>

              {/* Bottom Banner */}
              <div className="card p-5 bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 border-[#6366F1]/30 flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Your Career Goals Matter</h3>
                    <p className="text-xs text-[#9CA3AF]">Stay consistent, keep learning, and turn your dreams into reality.</p>
                  </div>
                </div>
                <button onClick={() => setActiveTab('study')}
                  className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:shadow-lg transition-all flex items-center gap-2">
                  View Career Plan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* ============ OTHER TABS ============ */}
          {activeTab === 'tasks' && <TaskSection />}
          {activeTab === 'study' && <StudyPlanner />}
          {activeTab === 'codeforces' && <CodingHub />}

          {activeTab === 'aicoach' && (
            <div className="card flex flex-col" style={{ height: 'calc(100vh - 140px)' }}>
              <div className="p-5 border-b border-[#1F2937] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">AI Coach</h3>
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span> Online
                    </span>
                  </div>
                </div>
                <button onClick={() => setChatHistory([])} className="text-xs text-[#6B7280] hover:text-white">Clear</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[#6B7280]">
                    <Bot className="w-16 h-16 mb-4 opacity-40" />
                    <p className="text-lg font-semibold mb-2">Ask AI anything</p>
                    <p className="text-sm text-center max-w-md">Get help with DSA, System Design, OS, DBMS, Interview Prep, and more.</p>
                  </div>
                ) : (
                  chatHistory.map((msg, idx) => (
                    <div key={idx} className="space-y-3">
                      <div className="flex justify-end">
                        <div className="max-w-[75%] bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm">{msg.user}</div>
                      </div>
                      {msg.ai && (
                        <div className="flex justify-start">
                          <div className="max-w-[85%] bg-[#0F1420] text-white/90 px-4 py-3 rounded-2xl rounded-tl-sm text-sm whitespace-pre-wrap leading-relaxed border border-[#1F2937]">{msg.ai}</div>
                        </div>
                      )}
                      {!msg.ai && isThinking && idx === chatHistory.length - 1 && (
                        <div className="flex justify-start">
                          <div className="bg-[#0F1420] px-4 py-3 rounded-2xl rounded-tl-sm border border-[#1F2937]">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce"></span>
                              <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                              <span className="w-2 h-2 bg-[#6366F1] rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <div className="p-4 border-t border-[#1F2937]">
                <div className="flex gap-2">
                  <input type="text" placeholder="Ask AI anything..." className="input-field flex-1"
                    value={chatMessage} onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChatSend(e)} disabled={isThinking} />
                  <button onClick={handleChatSend} disabled={isThinking || !chatMessage.trim()} className="btn-primary flex items-center gap-2">
                    {isThinking ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && <Analytics />}

          {activeTab === 'quiz' && <QuizTest />}
          {activeTab === 'viva' && <VivaPractice />}
          {activeTab === 'testhistory' && <TestHistory />}
          {activeTab === 'library' && <DigitalLibrary />}
          {activeTab === 'calendar' && <CalendarIntegration />}
          {activeTab === 'motivation' && <Motivation />}

          {activeTab === 'videos' && <YouTubeSection />}
          {activeTab === 'reports' && <ReportSection />}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0F1420]/95 backdrop-blur-xl border-t border-[#1F2937] md:hidden">
        <div className="flex items-center justify-around py-2">
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl transition-all ${isActive ? 'text-[#818CF8]' : 'text-[#6B7280]'}`}>
                <Icon className="w-5 h-5" strokeWidth={2.2} />
                <span className="text-[9px] font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Floating AI Button */}
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => setActiveTab('aicoach')}
        className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] shadow-2xl shadow-[#6366F1]/40 flex items-center justify-center text-white hover:shadow-[#6366F1]/60 transition-all">
        <Bot className="w-6 h-6" />
      </motion.button>

      {/* Add Application Modal */}
      <AnimatePresence>
        {showAppForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowAppForm(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="card p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#818CF8]" /> Add Application
              </h2>
              <form onSubmit={handleAddApplication} className="space-y-4">
                <div>
                  <label className="label">Company *</label>
                  <input type="text" className="input-field" value={appForm.company}
                    onChange={e => setAppForm({...appForm, company: e.target.value})} placeholder="Google" required />
                </div>
                <div>
                  <label className="label">Role</label>
                  <input type="text" className="input-field" value={appForm.role}
                    onChange={e => setAppForm({...appForm, role: e.target.value})} placeholder="Software Engineer Intern" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">Add Application</button>
                  <button type="button" onClick={() => setShowAppForm(false)}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white py-2.5 rounded-xl font-semibold transition-all">Cancel</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
