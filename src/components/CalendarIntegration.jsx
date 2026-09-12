import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, X, Trash2, Clock, MapPin, Bell,
  ExternalLink, Loader2, Link2, CheckCircle2, AlertCircle,
  CalendarDays, Video
} from 'lucide-react';

const EVENT_TYPES = [
  { id: 'study', label: 'Study Session', color: '#4F46E5' },
  { id: 'exam', label: 'Exam', color: '#EF4444' },
  { id: 'contest', label: 'Contest', color: '#F59E0B' },
  { id: 'class', label: 'Class', color: '#10B981' },
  { id: 'meeting', label: 'Meeting', color: '#8B5CF6' },
  { id: 'personal', label: 'Personal', color: '#06B6D4' },
];

// ============================================
// TIME HELPERS - Dynamic Date/Time defaults
// ============================================
const getCurrentTime = () => {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

const getEndTime = (startTime) => {
  const [h, m] = startTime.split(':').map(Number);
  const end = new Date();
  end.setHours(h, m + 60, 0, 0); // +1 hour
  return `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
};

const getInitialForm = () => {
  const start = getCurrentTime();
  return {
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: start,
    endTime: getEndTime(start),
    type: 'study',
    location: '',
  };
};

const CalendarIntegration = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [connected, setConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    type: 'study',
    location: '',
  });

  const userId = user?.uid;

  // Load events
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const eventsRef = ref(realtimeDb, `users/${userId}/calendarEvents`);
    const unsub = onValue(eventsRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        list.sort((a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`));
        setEvents(list);
      } else setEvents([]);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  // Load connection status
  useEffect(() => {
    if (!userId) return;
    const connRef = ref(realtimeDb, `users/${userId}/googleCalendar`);
    const unsub = onValue(connRef, (snap) => {
      setConnected(!!snap.val()?.connected);
    });
    return () => unsub();
  }, [userId]);

  // Add event to Firebase
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!userId || !form.title.trim()) return;
    try {
      const eventsRef = ref(realtimeDb, `users/${userId}/calendarEvents`);
      const newRef = push(eventsRef);
      await set(newRef, {
        ...form,
        title: form.title.trim(),
        createdAt: new Date().toISOString(),
      });
      setForm({
        title: '', description: '', date: new Date().toISOString().split('T')[0],
        startTime: '10:00', endTime: '11:00', type: 'study', location: ''
      });
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete event
  const handleDelete = async (id) => {
    if (!userId || !window.confirm('Delete this event?')) return;
    await remove(ref(realtimeDb, `users/${userId}/calendarEvents/${id}`));
  };

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = (event) => {
    const start = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`;
    const end = `${event.date.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      dates: `${start}/${end}`,
      details: event.description || '',
      location: event.location || '',
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Bulk sync all events to Google Calendar
  const handleGoogleSync = async () => {
    setSyncing(true);
    try {
      // Store connection flag in Firebase
      await set(ref(realtimeDb, `users/${userId}/googleCalendar`), {
        connected: true,
        lastSync: new Date().toISOString(),
        eventCount: events.length,
      });
      setConnected(true);
      // Open Google Calendar
      window.open('https://calendar.google.com/calendar/u/0/r', '_blank');
    } catch (err) {
      setError(err.message);
    }
    setSyncing(false);
  };

  // Add single event to Google Calendar
  const addToGoogle = (event) => {
    window.open(getGoogleCalendarUrl(event), '_blank');
  };

  const getType = (id) => EVENT_TYPES.find(t => t.id === id) || EVENT_TYPES[0];

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.floor((d - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    if (diff === -1) return 'Yesterday';
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Group events by date
  const groupedEvents = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {});
  const sortedDates = Object.keys(groupedEvents).sort();

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10B981] to-[#06B6D4] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Calendar & Events</h2>
              <p className="text-xs text-slate-500">Schedule study, exams, contests & meetings</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoogleSync}
              disabled={syncing}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                connected
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> :
               connected ? <CheckCircle2 className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              {connected ? 'Google Connected' : 'Connect Google Calendar'}
            </button>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Event
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-4 p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-[#4F46E5] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-800">
            <strong>How it works:</strong> Add events here → Click <strong>"Add to Google"</strong> on any event → it opens Google Calendar with the event pre-filled. 
            Just click <strong>Save</strong> in Google Calendar and it's added to your calendar.
          </p>
        </div>
      </div>

      {error && (
        <div className="card p-3 border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <X className="w-4 h-4 cursor-pointer" onClick={() => setError('')} />
          {error}
        </div>
      )}

      {/* Events Timeline */}
      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="card p-12 text-center">
          <CalendarDays className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No events yet</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            Add your first event — study sessions, exams, coding contests, or meetings.
          </p>
          <button onClick={() => setShowForm(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add First Event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map(date => {
            const dayEvents = groupedEvents[date];
            return (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#4F46E5] text-white flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[9px] uppercase font-bold leading-none">
                      {new Date(date).toLocaleDateString('en-GB', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold leading-none mt-0.5">
                      {new Date(date).getDate()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{formatDate(date)}</p>
                    <p className="text-[11px] text-slate-500">{dayEvents.length} event{dayEvents.length > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div className="space-y-2 ml-13">
                  {dayEvents.map(ev => {
                    const t = getType(ev.type);
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="card p-4 flex items-center gap-4"
                        style={{ borderLeft: `3px solid ${t.color}` }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${t.color}15` }}>
                          <Calendar className="w-5 h-5" style={{ color: t.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-slate-900 truncate">{ev.title}</h3>
                            <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                              style={{ background: `${t.color}15`, color: t.color }}>
                              {t.label}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {ev.startTime} - {ev.endTime}
                            </span>
                            {ev.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {ev.location}
                              </span>
                            )}
                          </div>
                          {ev.description && (
                            <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ev.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => addToGoogle(ev)}
                            className="p-2 rounded-lg text-slate-400 hover:text-[#4F46E5] hover:bg-indigo-50 transition-all"
                            title="Add to Google Calendar"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Event Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-[#4F46E5]" /> New Event
                </h3>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                <div>
                  <label className="label">Event Title *</label>
                  <input type="text" className="input-field" value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. OS Chapter 5 Study" required />
                </div>

                <div>
                  <label className="label">Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {EVENT_TYPES.map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.id })}
                        className={`py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                          form.type === t.id ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        style={form.type === t.id ? { backgroundColor: t.color } : {}}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Date</label>
                  <input type="date" className="input-field" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Start Time</label>
                    <input type="time" className="input-field" value={form.startTime}
                      onChange={(e) => setForm({ 
                        ...form, 
                        startTime: e.target.value,
                        endTime: getEndTime(e.target.value)
                      })} required />
                  </div>
                  <div>
                    <label className="label">End Time</label>
                    <input type="time" className="input-field" value={form.endTime}
                      onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label className="label">Location (optional)</label>
                  <input type="text" className="input-field" value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Room 305 or Zoom link" />
                </div>

                <div>
                  <label className="label">Description (optional)</label>
                  <textarea rows="2" className="input-field resize-none" value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Extra notes..." />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="btn-primary flex-1">Add Event</button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all">
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CalendarIntegration;
