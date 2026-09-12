import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Heart, Share2, Bookmark, ChevronLeft, ChevronRight, 
  Quote, Sun, Moon, Star, Flame
} from 'lucide-react';

const motivations = [
  {
    type: 'Quran',
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ',
    text: 'And whoever puts their trust in Allah, He is sufficient for them.',
    reference: 'Surah At-Talaq 65:3',
    bg: 'https://images.unsplash.com/photo-1585036156171-384164a8c675?w=1200&q=80',
  },
  {
    type: 'Quran',
    arabic: 'فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا',
    text: 'Indeed, with hardship comes ease.',
    reference: 'Surah Ash-Sharh 94:6',
    bg: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&q=80',
  },
  {
    type: 'Quran',
    arabic: 'فَٱذْكُرُونِى أَذْكُرْكُمْ',
    text: 'So remember Me; I will remember you.',
    reference: 'Surah Al-Baqarah 2:152',
    bg: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=1200&q=80',
  },
  {
    type: 'Quran',
    arabic: 'إِنَّ ٱللَّهَ مَعَ ٱلصَّٰبِرِينَ',
    text: 'Indeed, Allah is with the patient.',
    reference: 'Surah Al-Baqarah 2:153',
    bg: 'https://images.unsplash.com/photo-1543373014-cfe4f4bc1cdf?w=1200&q=80',
  },
  {
    type: 'Quran',
    arabic: 'وَٱللَّهُ خَيْرُ ٱلْحَٰفِظِينَ',
    text: 'And Allah is the best of protectors.',
    reference: 'Surah Yusuf 12:64',
    bg: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80',
  },
  {
    type: 'Quran',
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    text: 'Our Lord, give us good in this world and good in the Hereafter.',
    reference: 'Surah Al-Baqarah 2:201',
    bg: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'The best of you are those who are best to their families.',
    reference: 'Sunan Ibn Majah',
    bg: 'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'Whoever believes in Allah and the Last Day, let him speak good or remain silent.',
    reference: 'Sahih Bukhari',
    bg: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'The strong person is not the one who can wrestle, but the one who controls himself when angry.',
    reference: 'Sahih Bukhari',
    bg: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'The best of deeds are those done consistently, even if they are small.',
    reference: 'Sahih Bukhari & Muslim',
    bg: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'A good word is charity.',
    reference: 'Sahih Bukhari',
    bg: 'https://images.unsplash.com/photo-1516156008625-3a9d6067fab5?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'Whoever treads a path seeking knowledge, Allah will make easy for him the path to Paradise.',
    reference: 'Sahih Muslim',
    bg: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'The seeking of knowledge is obligatory upon every Muslim.',
    reference: 'Sunan Ibn Majah',
    bg: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=1200&q=80',
  },
  {
    type: 'Hadith',
    text: 'Verily, Allah is Beautiful and He loves beauty.',
    reference: 'Sahih Muslim',
    bg: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80',
  },
];

const Motivation = () => {
  const [index, setIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [progress, setProgress] = useState(0);
  const [saved, setSaved] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  const current = motivations[index];

  useEffect(() => {
    setSavedCount(JSON.parse(localStorage.getItem('savedMotivations') || '[]').length);
  }, []);

  useEffect(() => {
    if (!autoRotate) return;
    setProgress(0);
    const startTime = Date.now();
    const duration = 30000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setProgress(Math.min((elapsed / duration) * 100, 100));
    }, 100);

    const rotateTimeout = setTimeout(() => {
      setIndex(prev => (prev + 1) % motivations.length);
      setSaved(false);
    }, duration);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(rotateTimeout);
    };
  }, [index, autoRotate]);

  const nextQuote = () => {
    setIndex(prev => (prev + 1) % motivations.length);
    setSaved(false);
  };

  const prevQuote = () => {
    setIndex(prev => (prev - 1 + motivations.length) % motivations.length);
    setSaved(false);
  };

  const handleSave = () => {
    const savedItems = JSON.parse(localStorage.getItem('savedMotivations') || '[]');
    if (!saved) {
      savedItems.push({ ...current, savedAt: new Date().toISOString() });
      localStorage.setItem('savedMotivations', JSON.stringify(savedItems));
      setSaved(true);
      setSavedCount(savedItems.length);
    } else {
      const filtered = savedItems.filter(s => s.reference !== current.reference);
      localStorage.setItem('savedMotivations', JSON.stringify(filtered));
      setSaved(false);
      setSavedCount(filtered.length);
    }
  };

  const handleShare = async () => {
    const text = `"${current.text}" — ${current.reference}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Motivation', text });
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(text);
      alert('✅ Copied to clipboard!');
    }
  };

  const isHadith = current.type === 'Hadith';

  return (
    <div className="space-y-4 md:space-y-6">
      
      <div className="relative rounded-3xl overflow-hidden border border-[#1F2937] min-h-[500px] md:min-h-[600px]">
        
        <AnimatePresence mode="wait">
          <motion.div
            key={current.bg}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${current.bg})` }}
          />
        </AnimatePresence>

        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/75" />
        <div className="absolute inset-0 bg-gradient-to-tr from-[#6366F1]/20 via-transparent to-[#8B5CF6]/20" />

        {autoRotate && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-20">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="relative z-10 p-6 md:p-12 h-full flex flex-col justify-center min-h-[500px] md:min-h-[600px]">
          
          <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-3 py-1.5 rounded-full font-bold uppercase tracking-wider backdrop-blur-md ${
                isHadith 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-[#6366F1]/20 text-[#A5B4FC] border border-[#6366F1]/30'
              }`}>
                {current.type}
              </span>
              <span className="text-[10px] text-white/40 font-medium">
                {index + 1} / {motivations.length}
              </span>
            </div>
            <button 
              onClick={() => setAutoRotate(!autoRotate)}
              className={`w-9 h-9 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all ${
                autoRotate 
                  ? 'bg-[#6366F1]/20 border-[#6366F1]/40 text-[#818CF8]' 
                  : 'bg-white/10 border-white/20 text-white/60'
              }`}
            >
              {autoRotate ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
            
            <motion.div
              key={`icon-${index}`}
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center mb-8 shadow-2xl shadow-[#6366F1]/50"
            >
              {isHadith ? <Star className="w-8 h-8 text-white" /> : <Sparkles className="w-8 h-8 text-white" />}
            </motion.div>

            {current.arabic && (
              <motion.p
                key={`arabic-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-2xl md:text-4xl text-white/95 mb-6 leading-loose"
                style={{ 
                  fontFamily: '"Amiri", serif',
                  direction: 'rtl',
                  textShadow: '0 2px 20px rgba(0,0,0,0.5)'
                }}
              >
                {current.arabic}
              </motion.p>
            )}

            <div className="mb-4">
              <Quote className="w-8 h-8 md:w-10 md:h-10 text-[#818CF8]/40 mx-auto" />
            </div>

            <motion.p
              key={`text-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: current.arabic ? 0.4 : 0.2 }}
              className="text-xl md:text-3xl lg:text-4xl text-white font-medium italic leading-relaxed max-w-4xl mx-auto"
              style={{ textShadow: '0 2px 30px rgba(0,0,0,0.6)' }}
            >
              "{current.text}"
            </motion.p>

            <motion.p
              key={`ref-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.6 }}
              className={`text-sm md:text-base mt-6 font-semibold tracking-wide ${
                isHadith ? 'text-emerald-300' : 'text-[#A5B4FC]'
              }`}
            >
              — {current.reference}
            </motion.p>
          </div>

          <div className="flex items-center justify-between gap-4 mt-6">
            <button onClick={prevQuote}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <button onClick={handleSave}
                className={`w-11 h-11 rounded-xl backdrop-blur-md border flex items-center justify-center transition-all ${
                  saved 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
                    : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
                }`}>
                <Bookmark className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
              </button>
              <button onClick={handleShare}
                className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all">
                <Share2 className="w-5 h-5" />
              </button>
            </div>

            <button onClick={nextQuote}
              className="w-11 h-11 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 flex-wrap">
        {motivations.map((m, i) => (
          <button key={i} onClick={() => { setIndex(i); setSaved(false); }}
            className={`h-2 rounded-full transition-all ${
              i === index 
                ? 'w-8 bg-gradient-to-r from-[#6366F1] to-[#8B5CF6]' 
                : 'w-2 bg-white/20 hover:bg-white/40'
            }`} />
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-[#818CF8]" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">Quran Ayahs</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {motivations.filter(m => m.type === 'Quran').length}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">Hadith</span>
          </div>
          <p className="text-2xl font-bold text-white">
            {motivations.filter(m => m.type === 'Hadith').length}
          </p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">Auto Rotate</span>
          </div>
          <p className="text-2xl font-bold text-white">{autoRotate ? '30s' : 'Off'}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-pink-400" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-[#6B7280]">Saved</span>
          </div>
          <p className="text-2xl font-bold text-white">{savedCount}</p>
        </div>
      </div>

      <div className="card p-5 bg-gradient-to-r from-[#6366F1]/15 to-[#8B5CF6]/15 border-[#6366F1]/30">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-white fill-current" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white mb-1">Stay Consistent</h3>
            <p className="text-sm text-[#9CA3AF]">
              Reading a little every day is better than reading a lot once a week. 
              Keep going — your future self will thank you. 💪
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Motivation;
