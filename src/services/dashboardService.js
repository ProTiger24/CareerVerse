import { ref, onValue } from 'firebase/database';
import { realtimeDb } from '../firebase/config';

// 🔥 Subscribe to user's tasks
export const subscribeTasks = (userId, callback) => {
  const r = ref(realtimeDb, `users/${userId}/tasks`);
  return onValue(r, (snap) => {
    const data = snap.val();
    callback(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
  });
};

// 🔥 Subscribe to study subjects (from StudyPlanner)
export const subscribeStudySubjects = (userId, callback) => {
  const r = ref(realtimeDb, `users/${userId}/studySubjects`);
  return onValue(r, (snap) => {
    const data = snap.val();
    if (!data) return callback([]);
    const list = Object.keys(data).map(k => ({
      id: k,
      ...data[k],
      chapters: data[k].chapters ? Object.keys(data[k].chapters).map(ck => ({ id: ck, ...data[k].chapters[ck] })) : []
    }));
    callback(list);
  });
};

// 🔥 Subscribe to study sessions (for study hours)
export const subscribeStudySessions = (userId, callback) => {
  const r = ref(realtimeDb, `users/${userId}/studySessions`);
  return onValue(r, (snap) => {
    const data = snap.val();
    callback(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
  });
};

// 🔥 Subscribe to applications
export const subscribeApplications = (userId, callback) => {
  const r = ref(realtimeDb, `users/${userId}/applications`);
  return onValue(r, (snap) => {
    const data = snap.val();
    callback(data ? Object.keys(data).map(k => ({ id: k, ...data[k] })) : []);
  });
};

// 🔥 Subscribe to activity log
export const subscribeActivities = (userId, callback) => {
  const r = ref(realtimeDb, `users/${userId}/activities`);
  return onValue(r, (snap) => {
    const data = snap.val();
    if (!data) return callback([]);
    const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    callback(list.slice(0, 10));
  });
};

// 🧮 Calculate streak from sessions
export const calculateStreak = (sessions) => {
  if (!sessions.length) return 0;
  const uniqueDays = [...new Set(sessions.map(s => s.date))].sort().reverse();
  if (!uniqueDays.length) return 0;

  let streak = 0;
  let today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStr = today.toISOString().split('T')[0];
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Allow streak to start from today or yesterday
  let checkDate = uniqueDays[0] === todayStr ? today : (uniqueDays[0] === yesterdayStr ? yesterdayDate : null);
  if (!checkDate) return 0;

  for (const dayStr of uniqueDays) {
    const expected = checkDate.toISOString().split('T')[0];
    if (dayStr === expected) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }
  return streak;
};

// 🧮 Calculate today's study hours
export const getTodayStudyMinutes = (sessions) => {
  const today = new Date().toISOString().split('T')[0];
  return Math.round(sessions.filter(s => s.date === today).reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
};

// 🧮 Calculate this week's study hours
export const getWeekStudyMinutes = (sessions) => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];
  return Math.round(sessions.filter(s => s.date >= weekAgoStr).reduce((sum, s) => sum + (s.duration || 0), 0) / 60);
};
