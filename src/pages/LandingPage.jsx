import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket, Brain, BookOpen, Code2, BarChart3, Video, Trophy,
  CheckCircle2, ArrowRight, Users, Zap, Flame, Star,
  TrendingUp, Play, ChevronLeft, ChevronRight, Quote, Target,
  Award, Clock, Calendar, Sparkles, Shield
} from 'lucide-react';

/* =========================================================
   PALETTE
   - bg:        #F8FAFC  (slate-50)
   - card:      #FFFFFF
   - border:    #E2E8F0  (slate-200)
   - text:      #0F172A  (slate-900)
   - muted:     #64748B  (slate-500)
   - primary:   #4F46E5  (indigo-600)
   - accent:    #0EA5E9  (sky-500)
   ========================================================= */

const FEATURES = [
  {
    icon: Code2,
    title: 'CP Tracker',
    desc: 'Auto-sync Codeforces and log any other judge by hand. Every submission lands on one heatmap.',
    accent: '#4F46E5',
    bg: '#EEF2FF',
    size: 'lg',
  },
  {
    icon: Brain,
    title: 'AI Career Coach',
    desc: 'Ask it to plan your week, explain a rating stall, or review your resume against a target role.',
    accent: '#0EA5E9',
    bg: '#E0F2FE',
    size: 'md',
  },
  {
    icon: BookOpen,
    title: 'Study Planner',
    desc: 'Subjects, chapters, exam dates — one calendar that tells you what today is for.',
    accent: '#F59E0B',
    bg: '#FEF3C7',
    size: 'sm',
  },
  {
    icon: BarChart3,
    title: 'Progress Reports',
    desc: 'Weekly breakdowns of where your hours actually went.',
    accent: '#EC4899',
    bg: '#FCE7F3',
    size: 'sm',
  },
  {
    icon: Video,
    title: 'Video Library',
    desc: 'Curated lectures and editorials matched to the topic you just got stuck on.',
    accent: '#10B981',
    bg: '#D1FAE5',
    size: 'sm',
  },
  {
    icon: Trophy,
    title: 'Streaks & XP',
    desc: 'A leveling system built around consistency, not just contest rating.',
    accent: '#8B5CF6',
    bg: '#EDE9FE',
    size: 'sm',
  },
];

const STEPS = [
  {
    title: 'Connect your platforms',
    desc: 'Link Codeforces for auto-sync, add the rest manually. Your full history imports in one pass.',
    icon: Rocket,
  },
  {
    title: 'Set a weekly target',
    desc: 'Pick a problem count, a study subject, or both. CareerVerse builds the daily plan around it.',
    icon: Target,
  },
  {
    title: 'Show up and track it',
    desc: 'Solve, study, and watch the heatmap fill in — the plan adjusts as you go.',
    icon: TrendingUp,
  },
];

const TESTIMONIALS = [
  {
    quote: "I stopped juggling four tabs to know if I'd actually practiced this week. The heatmap does the nagging for me now.",
    name: 'Rafiul Islam',
    role: 'Candidate Master · CSE 2027',
    avatar: 'https://i.pravatar.cc/100?img=12',
  },
  {
    quote: 'The study planner is the first thing that made my exam prep and my CP grind live on the same calendar instead of competing.',
    name: 'Tasnim Ahmed',
    role: 'CSE Student · BUBT',
    avatar: 'https://i.pravatar.cc/100?img=45',
  },
  {
    quote: "Asked the AI coach why my rating stalled and it actually pointed at a gap in my DP practice, not a generic pep talk.",
    name: 'Mahin Chowdhury',
    role: 'Expert · Codeforces',
    avatar: 'https://i.pravatar.cc/100?img=33',
  },
];

/* =========================================================
   SUB-COMPONENTS
   ========================================================= */

const Section = ({ children, className = '', id }) => (
  <section id={id} className={`px-6 md:px-10 ${className}`}>
    <div className="max-w-6xl mx-auto">{children}</div>
  </section>
);

// Hero image mockup (dashboard preview)
const DashboardMockup = () => (
  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-2xl shadow-slate-200/60">
    <div className="flex items-center gap-1.5 px-4 py-3 bg-slate-50 border-b border-slate-200">
      <div className="w-3 h-3 rounded-full bg-red-400"></div>
      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
      <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
      <div className="ml-3 text-xs text-slate-400 font-medium">careerverse.app/dashboard</div>
    </div>
    <img
      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&q=80"
      alt="CareerVerse Dashboard"
      className="w-full"
    />
  </div>
);

/* =========================================================
   MAIN COMPONENT
   ========================================================= */

const LandingPage = () => {
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    timer.current = setInterval(() => {
      setTestimonialIndex((i) => (i + 1) % TESTIMONIALS.length);
    }, 6000);
    return () => clearInterval(timer.current);
  }, []);

  const goTestimonial = (dir) => {
    clearInterval(timer.current);
    setTestimonialIndex((i) => (i + dir + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased" style={{ fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');
        .font-display { font-family: 'Sora', ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.02em; }
      `}</style>

      {/* =================== NAVBAR =================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#F8FAFC]/85 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-3.5 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-slate-900">CareerVerse</span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#demo" className="hover:text-slate-900 transition-colors">Demo</a>
            <a href="#reviews" className="hover:text-slate-900 transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 transition-colors">
              Sign in
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-[#4F46E5] hover:bg-[#4338CA] text-white px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* =================== HERO =================== */}
      <Section className="pt-36 pb-20">
        <div className="grid lg:grid-cols-[1.05fr,1fr] gap-14 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-Powered Career Growth Platform
            </div>
            <h1 className="font-display text-5xl md:text-6xl font-bold leading-[1.05] mb-6 text-slate-900">
              Ship your career
              <br />
              <span className="text-[#4F46E5]">like you ship code.</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-lg mb-10 leading-relaxed">
              CareerVerse tracks your competitive programming, study plan, and interview prep
              in one place — and an AI coach tells you what to do with the gaps.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-10">
              <Link
                to="/register"
                className="group bg-[#4F46E5] hover:bg-[#4338CA] text-white px-7 py-3.5 rounded-xl font-semibold transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/25"
              >
                Start for free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/login"
                className="text-slate-700 hover:text-slate-900 px-6 py-3.5 font-medium transition-colors"
              >
                Sign in
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> No credit card
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Free forever plan
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Codeforces auto-sync
              </span>
            </div>
          </motion.div>

          {/* Right: dashboard preview image */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <DashboardMockup />
          </motion.div>
        </div>
      </Section>

      {/* =================== STATS STRIP =================== */}
      <Section className="py-12 border-y border-slate-200 bg-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { value: '10K+', label: 'Active users', icon: Users },
            { value: '50K+', label: 'Tasks completed', icon: CheckCircle2 },
            { value: '100K+', label: 'XP earned', icon: Zap },
            { value: '98%', label: 'Would recommend', icon: Star },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-5 h-5 text-[#4F46E5]" />
              </div>
              <div>
                <div className="font-display text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* =================== FEATURES =================== */}
      <Section id="features" className="py-24">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs font-bold tracking-widest text-[#4F46E5] uppercase mb-3">Features</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            Everything that used to live in six tabs
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            CareerVerse replaces the spreadsheet, the bookmarks folder, and the sticky notes
            with one system built for how CS students actually study.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={`rounded-2xl border border-slate-200 bg-white p-7 hover:shadow-xl hover:shadow-slate-200/50 hover:border-slate-300 transition-all ${
                f.size === 'lg' ? 'md:col-span-2 md:row-span-2 min-h-[300px] flex flex-col justify-between' : ''
              }`}
            >
              <div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: f.bg }}
                >
                  <f.icon className="w-5 h-5" style={{ color: f.accent }} />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
              {f.size === 'lg' && (
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <img
                    src="https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&q=80"
                    alt=""
                    className="rounded-xl aspect-square object-cover w-full"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&q=80"
                    alt=""
                    className="rounded-xl aspect-square object-cover w-full"
                  />
                  <img
                    src="https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=400&q=80"
                    alt=""
                    className="rounded-xl aspect-square object-cover w-full"
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </Section>

      {/* =================== HOW IT WORKS =================== */}
      <Section id="how" className="py-24 border-t border-slate-200 bg-white">
        <div className="mb-14 max-w-2xl">
          <div className="text-xs font-bold tracking-widest text-[#4F46E5] uppercase mb-3">How it works</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            Set up once, in about three minutes
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-[#4F46E5] flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <step.icon className="w-5 h-5 text-white" />
                </div>
                <div className="text-4xl font-display font-bold text-slate-200">0{i + 1}</div>
              </div>
              <h3 className="font-display text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* =================== DEMO VIDEO =================== */}
      <Section id="demo" className="py-24 border-t border-slate-200">
        <div className="mb-10 max-w-2xl">
          <div className="text-xs font-bold tracking-widest text-[#4F46E5] uppercase mb-3">Demo</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            See it running for two minutes
          </h2>
          <p className="text-slate-600 text-lg">
            A walkthrough of the dashboard, the AI coach, and how a solved problem turns into a heatmap square.
          </p>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 aspect-video bg-slate-100 shadow-2xl shadow-slate-200/50">
          {videoPlaying ? (
            <iframe
              className="w-full h-full"
              src="https://drive.google.com/file/d/12eLeFHpPGkP4zcCIhwwh_bdsZJ7bKRMK/preview"
              title="CareerVerse demo"
              allow="autoplay"
              allowFullScreen
            />
          ) : (
            <button
              onClick={() => setVideoPlaying(true)}
              className="absolute inset-0 group"
            >
              <img
                src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=1600&q=80"
                alt="Demo preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-900/50 group-hover:bg-slate-900/40 transition-colors" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 text-[#4F46E5] ml-1" fill="currentColor" />
                </div>
              </div>
              <div className="absolute bottom-6 left-6 text-white">
                <div className="text-sm font-semibold">CareerVerse Product Tour</div>
                <div className="text-xs text-white/70 mt-0.5">4:58 · Product walkthrough</div>
              </div>
            </button>
          )}
        </div>
      </Section>

      {/* =================== TESTIMONIALS =================== */}
      <Section id="reviews" className="py-24 border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs font-bold tracking-widest text-[#4F46E5] uppercase mb-3">Reviews</div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-12 text-slate-900">
            Loved by students who ship
          </h2>

          <AnimatePresence mode="wait">
            <motion.div
              key={testimonialIndex}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35 }}
              className="min-h-[180px] flex flex-col items-center justify-center"
            >
              <Quote className="w-8 h-8 text-[#4F46E5] mb-6" />
              <p className="font-display text-xl md:text-2xl text-slate-900 leading-snug mb-8 max-w-2xl">
                "{TESTIMONIALS[testimonialIndex].quote}"
              </p>
              <div className="flex items-center gap-3">
                <img
                  src={TESTIMONIALS[testimonialIndex].avatar}
                  alt={TESTIMONIALS[testimonialIndex].name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-200"
                />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-900">{TESTIMONIALS[testimonialIndex].name}</div>
                  <div className="text-xs text-slate-500">{TESTIMONIALS[testimonialIndex].role}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => goTestimonial(-1)}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { clearInterval(timer.current); setTestimonialIndex(i); }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === testimonialIndex ? 'w-6 bg-[#4F46E5]' : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => goTestimonial(1)}
              className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Section>

      {/* =================== CTA =================== */}
      <Section className="py-24">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#8B5CF6] px-8 py-16 md:py-20 text-center shadow-2xl shadow-indigo-500/30">
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}></div>
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center mx-auto mb-6 border border-white/20">
              <Rocket className="w-7 h-7 text-white" />
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold text-white mb-4">
              Start your first streak today
            </h2>
            <p className="text-white/80 text-lg mb-8 max-w-md mx-auto">
              Free forever plan, no credit card, set up in three minutes.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-[#4F46E5] px-7 py-3.5 rounded-xl font-semibold transition-all group shadow-xl"
            >
              Get started free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </Section>

      {/* =================== FOOTER =================== */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-14">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#4F46E5] flex items-center justify-center">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <span className="font-display font-bold text-lg text-slate-900">CareerVerse</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                AI-powered career growth platform for software engineers and CS students.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><Link to="/register" className="hover:text-[#4F46E5] transition-colors">Get Started</Link></li>
                <li><Link to="/login" className="hover:text-[#4F46E5] transition-colors">Sign In</Link></li>
                <li><a href="#features" className="hover:text-[#4F46E5] transition-colors">Features</a></li>
                <li><a href="#demo" className="hover:text-[#4F46E5] transition-colors">Demo</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#4F46E5] transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-[#4F46E5] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[#4F46E5] transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-[#4F46E5] transition-colors">Support</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-900 mb-4">Legal</h4>
              <ul className="space-y-2.5 text-sm text-slate-500">
                <li><a href="#" className="hover:text-[#4F46E5] transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-[#4F46E5] transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-[#4F46E5] transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">© 2026 CareerVerse. All rights reserved.</p>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-900 transition-colors">GitHub</a>
              <a href="#" className="hover:text-slate-900 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
