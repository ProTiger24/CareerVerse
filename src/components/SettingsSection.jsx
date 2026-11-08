import React, { useState, useEffect } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { realtimeDb, auth } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { User, Mail, GraduationCap, Building, Save, Moon, Sun, CheckCircle2, FileText, Lock } from 'lucide-react';

const SettingsSection = ({ isDarkMode, setIsDarkMode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    university: '',
    major: '',
    bio: '',
    emailUpdates: true,
    studyReminders: true
  });

  const [passwordData, setPasswordData] = useState({ current: '', new: '' });
  const [updatingPass, setUpdatingPass] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    const profileRef = ref(realtimeDb, `users/${user.uid}/profile`);
    const unsubscribe = onValue(profileRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFormData(prev => ({ 
          ...prev, 
          ...data,
          displayName: data.displayName || user?.displayName || '',
        }));
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleToggle = (field) => {
    setFormData(prev => ({ ...prev, [field]: !prev[field] }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user?.uid) return;
    setSaving(true);
    setErrorMsg('');
    
    try {
      const profileRef = ref(realtimeDb, `users/${user.uid}/profile`);
      await update(profileRef, {
        displayName: formData.displayName,
        university: formData.university,
        major: formData.major,
        bio: formData.bio,
        emailUpdates: formData.emailUpdates,
        studyReminders: formData.studyReminders,
        updatedAt: new Date().toISOString()
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      setErrorMsg('Failed to save profile.');
      console.error(error);
    }
    setSaving(false);
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (!passwordData.new || !passwordData.current) {
      setErrorMsg('Please enter both current and new passwords.');
      return;
    }
    setUpdatingPass(true);
    setErrorMsg('');

    try {
      const credential = EmailAuthProvider.credential(user.email, passwordData.current);
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, passwordData.new);
      alert('✅ Password updated successfully!');
      setPasswordData({ current: '', new: '' });
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/wrong-password') {
        setErrorMsg('Incorrect current password.');
      } else {
        setErrorMsg('Failed to update password. Please re-login and try again.');
      }
    }
    setUpdatingPass(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-[#818CF8]">Loading settings...</div>;
  }

  return (
    <div className="w-full space-y-6 animate-fade-up pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Account Settings</h2>
          <p className="text-sm text-[#9CA3AF] mt-1">Manage your profile, preferences, and security.</p>
        </div>
        {saved && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Settings saved successfully!
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* বাম দিকের কলাম (Profile & Preferences) */}
        <div className="xl:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="premium-card p-6 flex flex-col items-center text-center">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#6366F1] to-[#8B5CF6] flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg shadow-[#6366F1]/30">
              {formData.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <h3 className="text-xl font-bold text-white">{formData.displayName || 'Student Name'}</h3>
            <p className="text-sm text-[#6B7280] mb-4">{user?.email}</p>
            <span className="badge-info px-4 py-1.5">Free Plan</span>
          </div>

          {/* Preferences Card */}
          <div className="premium-card p-6 space-y-6">
            <h3 className="text-base font-semibold text-white border-b border-[#1F2937] pb-3">Preferences</h3>
            
            {/* Theme Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                {isDarkMode ? <Moon className="w-5 h-5 text-[#818CF8]" /> : <Sun className="w-5 h-5 text-amber-500" />}
                <span>Theme Mode</span>
              </div>
              <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-12 h-6 rounded-full p-1 transition-colors ${isDarkMode ? 'bg-[#6366F1]' : 'bg-gray-500'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Email Updates Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                <Mail className="w-5 h-5 text-blue-400" />
                <span>Email Updates</span>
              </div>
              <button onClick={() => handleToggle('emailUpdates')} className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.emailUpdates ? 'bg-[#6366F1]' : 'bg-gray-500'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.emailUpdates ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>

            {/* Study Reminders Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-[#9CA3AF]">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Study Reminders</span>
              </div>
              <button onClick={() => handleToggle('studyReminders')} className={`w-12 h-6 rounded-full p-1 transition-colors ${formData.studyReminders ? 'bg-[#6366F1]' : 'bg-gray-500'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${formData.studyReminders ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* ডান দিকের কলাম (Profile Info & Security) */}
        <div className="xl:col-span-2 space-y-6">
          {/* Profile Form */}
          <form onSubmit={handleSave} className="premium-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-[#1F2937] pb-4">Profile Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-[#9CA3AF] font-semibold mb-2 block flex items-center gap-2"><User className="w-4 h-4 text-[#818CF8]" /> Full Name</label>
                <input type="text" name="displayName" value={formData.displayName} onChange={handleChange} className="input-field" placeholder="Your Name" />
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] font-semibold mb-2 block flex items-center gap-2"><Mail className="w-4 h-4 text-[#818CF8]" /> Email (Read Only)</label>
                <input type="email" value={formData.email} disabled className="input-field opacity-50 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] font-semibold mb-2 block flex items-center gap-2"><Building className="w-4 h-4 text-[#818CF8]" /> University / College</label>
                <input type="text" name="university" value={formData.university} onChange={handleChange} className="input-field" placeholder="e.g. Dhaka University" />
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] font-semibold mb-2 block flex items-center gap-2"><GraduationCap className="w-4 h-4 text-[#818CF8]" /> Major / Department</label>
                <input type="text" name="major" value={formData.major} onChange={handleChange} className="input-field" placeholder="e.g. Computer Science" />
              </div>
            </div>

            <div>
              <label className="text-xs text-[#9CA3AF] font-semibold mb-2 block">Short Bio</label>
              <textarea name="bio" value={formData.bio} onChange={handleChange} className="input-field min-h-[120px] resize-y" placeholder="Tell us a little about yourself..."></textarea>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 px-8">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : <Save className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>

          {/* Account Security */}
          <form onSubmit={handlePasswordUpdate} className="premium-card p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-semibold text-white border-b border-[#1F2937] pb-4 flex items-center gap-2"><Lock className="w-5 h-5 text-red-400"/> Account Security</h3>
            
            {errorMsg && <p className="text-sm text-red-400 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{errorMsg}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-[#9CA3AF] font-semibold mb-2 block">Current Password</label>
                <input type="password" value={passwordData.current} onChange={(e) => setPasswordData({...passwordData, current: e.target.value})} placeholder="••••••••" className="input-field" required />
              </div>
              <div>
                <label className="text-xs text-[#9CA3AF] font-semibold mb-2 block">New Password</label>
                <input type="password" value={passwordData.new} onChange={(e) => setPasswordData({...passwordData, new: e.target.value})} placeholder="••••••••" className="input-field" required minLength={6} />
              </div>
            </div>
            
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={updatingPass} className="bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all border border-[#1F2937] flex items-center gap-2">
                {updatingPass ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SettingsSection;
