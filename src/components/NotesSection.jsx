import React, { useState, useEffect } from 'react';
import { ref, onValue, push, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2, FileText, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotesSection = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '' });

  useEffect(() => {
    if (!user?.uid) return;
    const notesRef = ref(realtimeDb, `users/${user.uid}/notes`);
    const unsubscribe = onValue(notesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const notesArray = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        notesArray.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setNotes(notesArray);
      } else {
        setNotes([]);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title.trim() || !newNote.content.trim() || !user?.uid) return;
    
    const notesRef = ref(realtimeDb, `users/${user.uid}/notes`);
    await push(notesRef, {
      title: newNote.title.trim(),
      content: newNote.content.trim(),
      createdAt: Date.now()
    });
    
    setNewNote({ title: '', content: '' });
    setIsAdding(false);
  };

  const handleDelete = async (id) => {
    if (!user?.uid) return;
    const noteRef = ref(realtimeDb, `users/${user.uid}/notes/${id}`);
    await remove(noteRef);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">My Notes</h2>
          <p className="text-sm text-[#9CA3AF] mt-1">Keep track of your important thoughts and tasks.</p>
        </div>
        <button onClick={() => setIsAdding(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add New Note
        </button>
      </div>

      {/* Add Note Modal */}
      <AnimatePresence>
        {isAdding && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsAdding(false)}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="card p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#818CF8]" /> Create Note
                </h3>
                <button onClick={() => setIsAdding(false)} className="text-[#6B7280] hover:text-white"><X className="w-5 h-5"/></button>
              </div>
              <form onSubmit={handleAddNote} className="space-y-4">
                <div>
                  <label className="text-xs text-[#9CA3AF] font-semibold mb-1 block">Title</label>
                  <input type="text" className="input-field" placeholder="Note Title..." 
                    value={newNote.title} onChange={e => setNewNote({...newNote, title: e.target.value})} required autoFocus />
                </div>
                <div>
                  <label className="text-xs text-[#9CA3AF] font-semibold mb-1 block">Content</label>
                  <textarea className="input-field min-h-[150px] resize-y" placeholder="Write your note here..." 
                    value={newNote.content} onChange={e => setNewNote({...newNote, content: e.target.value})} required />
                </div>
                <button type="submit" className="btn-primary w-full">Save Note</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      {notes.length === 0 ? (
        <div className="card p-12 text-center flex flex-col items-center justify-center">
          <FileText className="w-16 h-16 text-[#6B7280] mb-4 opacity-30" />
          <h3 className="text-lg font-semibold text-white mb-2">No notes yet</h3>
          <p className="text-sm text-[#9CA3AF] max-w-sm mb-6">Click the "Add New Note" button to write down your ideas, reminders, or important study materials.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notes.map(note => (
            <motion.div key={note.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="card p-5 flex flex-col h-full group hover:border-[#6366F1]/40 transition-all duration-300">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-base font-bold text-white line-clamp-1">{note.title}</h3>
                <button onClick={() => handleDelete(note.id)} className="text-[#6B7280] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#9CA3AF] whitespace-pre-wrap flex-1 line-clamp-6">{note.content}</p>
              <div className="mt-4 pt-3 border-t border-[#1F2937] text-[10px] text-[#6B7280]">
                {new Date(note.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotesSection;
