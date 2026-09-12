import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { ref, onValue, push, set, remove } from 'firebase/database';
import { realtimeDb } from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Upload, X, Trash2, Download, FileText, Search,
  Plus, Loader2, Book, ExternalLink, Grid3x3, List, Link2,
  AlertCircle, CheckCircle2
} from 'lucide-react';

const CATEGORIES = [
  { id: 'cs', label: 'Computer Science', color: '#4F46E5' },
  { id: 'math', label: 'Mathematics', color: '#F59E0B' },
  { id: 'bangla', label: 'Bangla Literature', color: '#10B981' },
  { id: 'english', label: 'English', color: '#EC4899' },
  { id: 'physics', label: 'Physics', color: '#06B6D4' },
  { id: 'chemistry', label: 'Chemistry', color: '#8B5CF6' },
  { id: 'islamic', label: 'Islamic Studies', color: '#22C55E' },
  { id: 'other', label: 'Other', color: '#64748B' },
];

const DigitalLibrary = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeBook, setActiveBook] = useState(null);
  const [uploadMode, setUploadMode] = useState('link'); // 'link' | 'file'
  const fileInputRef = useRef();

  const [uploadForm, setUploadForm] = useState({
    title: '',
    author: '',
    category: 'cs',
    description: '',
    url: '',
    file: null,
  });

  const userId = user?.uid;

  // Load books
  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    const booksRef = ref(realtimeDb, `users/${userId}/library`);
    const unsub = onValue(booksRef, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.keys(data).map(k => ({ id: k, ...data[k] }));
        list.sort((a, b) => (b.uploadedAt || '').localeCompare(a.uploadedAt || ''));
        setBooks(list);
      } else setBooks([]);
      setLoading(false);
    });
    return () => unsub();
  }, [userId]);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setError('Only PDF files allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File too large (max 5MB). For bigger files, use "Link" mode.');
      return;
    }
    setError('');
    setUploadForm({
      ...uploadForm,
      file,
      title: uploadForm.title || file.name.replace('.pdf', '')
    });
  };

  // Handle Upload (link or base64 file)
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!userId) return;

    if (uploadMode === 'link') {
      // === Link mode ===
      if (!uploadForm.title.trim()) { setError('Enter a title'); return; }
      if (!uploadForm.url.trim()) { setError('Paste a PDF link'); return; }

      setUploading(true);
      try {
        const booksRef = ref(realtimeDb, `users/${userId}/library`);
        const newRef = push(booksRef);
        await set(newRef, {
          title: uploadForm.title.trim(),
          author: uploadForm.author.trim() || 'Unknown',
          category: uploadForm.category,
          description: uploadForm.description.trim(),
          url: uploadForm.url.trim(),
          source: 'link',
          uploadedAt: new Date().toISOString(),
        });

        setSuccess('✅ Book added to library!');
        setTimeout(() => setSuccess(''), 3000);
        resetForm();
      } catch (err) {
        setError('Failed: ' + err.message);
      }
      setUploading(false);

    } else {
      // === File mode (base64) ===
      if (!uploadForm.file) { setError('Select a PDF file'); return; }
      if (!uploadForm.title.trim()) { setError('Enter a title'); return; }

      setUploading(true);
      try {
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
        });
        reader.readAsDataURL(uploadForm.file);
        const base64 = await base64Promise;

        // Save to Firebase
        const booksRef = ref(realtimeDb, `users/${userId}/library`);
        const newRef = push(booksRef);
        await set(newRef, {
          title: uploadForm.title.trim(),
          author: uploadForm.author.trim() || 'Unknown',
          category: uploadForm.category,
          description: uploadForm.description.trim(),
          dataUrl: base64, // base64 PDF data
          fileSize: uploadForm.file.size,
          source: 'base64',
          uploadedAt: new Date().toISOString(),
        });

        setSuccess('✅ PDF uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
        resetForm();
      } catch (err) {
        setError('Upload failed: ' + err.message);
      }
      setUploading(false);
    }
  };

  const resetForm = () => {
    setUploadForm({
      title: '', author: '', category: 'cs',
      description: '', url: '', file: null,
    });
    setShowUploadForm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDelete = async (book) => {
    if (!userId || !window.confirm(`Delete "${book.title}"?`)) return;
    await remove(ref(realtimeDb, `users/${userId}/library/${book.id}`));
  };

  const filteredBooks = books.filter(b => {
    const matchCat = selectedCategory === 'all' || b.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      b.title?.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.description?.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getCategory = (id) => CATEGORIES.find(c => c.id === id) || CATEGORIES[7];

  const openBook = (book) => {
    const url = book.dataUrl || book.url;
    if (url) {
      // For base64 PDF, open in new tab
      if (book.source === 'base64') {
        const w = window.open();
        if (w) {
          w.document.write(`<iframe src="${url}" style="width:100%;height:100vh;border:none;"></iframe>`);
          w.document.title = book.title;
        }
      } else {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="space-y-5">
      
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4F46E5] to-[#8B5CF6] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Digital Library</h2>
              <p className="text-xs text-slate-500">Your personal book collection</p>
            </div>
          </div>
          <button onClick={() => setShowUploadForm(true)} className="btn-primary flex items-center gap-2 self-start md:self-center">
            <Plus className="w-4 h-4" /> Add Book
          </button>
        </div>

        {/* Search + View Toggle */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books..."
              className="bg-transparent flex-1 text-sm text-slate-900 placeholder-slate-400 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 rounded-xl p-1">
            <button onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#4F46E5]' : 'text-slate-500'}`}>
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#4F46E5]' : 'text-slate-500'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
          <button onClick={() => setSelectedCategory('all')}
            className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              selectedCategory === 'all' ? 'bg-[#4F46E5] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            All ({books.length})
          </button>
          {CATEGORIES.map(cat => {
            const count = books.filter(b => b.category === cat.id).length;
            if (count === 0 && selectedCategory !== cat.id) return null;
            return (
              <button key={cat.id} onClick={() => setSelectedCategory(cat.id)}
                className={`flex-shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCategory === cat.id ? 'text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                style={selectedCategory === cat.id ? { backgroundColor: cat.color } : {}}>
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="card p-3 border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <X className="w-4 h-4 ml-auto cursor-pointer" onClick={() => setError('')} />
        </div>
      )}
      {success && (
        <div className="card p-3 border-emerald-200 bg-emerald-50 text-emerald-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> {success}
        </div>
      )}

      {/* Books */}
      {loading ? (
        <div className="card p-12 text-center">
          <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading library...</p>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {books.length === 0 ? 'Your library is empty' : 'No books found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-5">
            {books.length === 0
              ? 'Add PDF links (Google Drive, Dropbox) or upload small PDF files.'
              : 'Try different search terms.'}
          </p>
          {books.length === 0 && (
            <button onClick={() => setShowUploadForm(true)} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add First Book
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBooks.map((book, i) => {
            const cat = getCategory(book.category);
            return (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                whileHover={{ y: -4 }}
                className="card p-4 group cursor-pointer"
                onClick={() => openBook(book)}
              >
                <div className="w-full aspect-[3/4] rounded-xl flex items-center justify-center mb-3 relative overflow-hidden"
                  style={{ background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}30)` }}>
                  <Book className="w-12 h-12" style={{ color: cat.color }} />
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] px-2 py-0.5 rounded-md bg-white/80 backdrop-blur font-bold uppercase"
                      style={{ color: cat.color }}>
                      {cat.label.split(' ')[0]}
                    </span>
                  </div>
                  <div className="absolute top-2 left-2">
                    {book.source === 'link' ? (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500 text-white font-bold">LINK</span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500 text-white font-bold">PDF</span>
                    )}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 group-hover:text-[#4F46E5] transition-colors">
                  {book.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-1 truncate">{book.author}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    {book.fileSize ? formatFileSize(book.fileSize) : 'External Link'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(book); }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="card divide-y divide-slate-100">
          {filteredBooks.map(book => {
            const cat = getCategory(book.category);
            return (
              <div key={book.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => openBook(book)}>
                <div className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${cat.color}15` }}>
                  <Book className="w-6 h-6" style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-900 truncate">{book.title}</h3>
                  <p className="text-[11px] text-slate-500 truncate">{book.author}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-1 rounded-md font-bold uppercase"
                    style={{ background: `${cat.color}15`, color: cat.color }}>
                    {book.source === 'link' ? '🔗 Link' : '📄 PDF'}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(book); }}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !uploading && setShowUploadForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="card p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#4F46E5]" /> Add Book
                </h3>
                <button onClick={() => setShowUploadForm(false)} disabled={uploading}
                  className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-5">
                <button type="button" onClick={() => setUploadMode('link')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    uploadMode === 'link' ? 'bg-white shadow-sm text-[#4F46E5]' : 'text-slate-500'
                  }`}>
                  <Link2 className="w-3.5 h-3.5" /> Link (Recommended)
                </button>
                <button type="button" onClick={() => setUploadMode('file')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                    uploadMode === 'file' ? 'bg-white shadow-sm text-[#4F46E5]' : 'text-slate-500'
                  }`}>
                  <Upload className="w-3.5 h-3.5" /> Small PDF (≤5MB)
                </button>
              </div>

              <form onSubmit={handleUpload} className="space-y-4">
                {uploadMode === 'link' ? (
                  <div>
                    <label className="label">PDF Link *</label>
                    <input type="url" className="input-field"
                      value={uploadForm.url}
                      onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                      placeholder="https://drive.google.com/... or dropbox.com/..."
                      required disabled={uploading} />
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      💡 Google Drive: Upload PDF → Right click → Share → Anyone with link → Copy link
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="label">PDF File (max 5MB) *</label>
                    <div onClick={() => !uploading && fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-[#4F46E5] rounded-2xl p-6 text-center cursor-pointer transition-all">
                      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf"
                        onChange={handleFileSelect} className="hidden" />
                      {uploadForm.file ? (
                        <div className="flex items-center justify-center gap-3">
                          <FileText className="w-8 h-8 text-[#4F46E5]" />
                          <div className="text-left">
                            <p className="text-sm font-semibold text-slate-900">{uploadForm.file.name}</p>
                            <p className="text-[11px] text-slate-500">{formatFileSize(uploadForm.file.size)}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-600 font-medium">Click to select PDF</p>
                          <p className="text-[11px] text-slate-400 mt-1">Max 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="label">Book Title *</label>
                  <input type="text" className="input-field" value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    placeholder="e.g. Operating System Concepts" required disabled={uploading} />
                </div>

                <div>
                  <label className="label">Author</label>
                  <input type="text" className="input-field" value={uploadForm.author}
                    onChange={(e) => setUploadForm({ ...uploadForm, author: e.target.value })}
                    placeholder="e.g. Silberschatz" disabled={uploading} />
                </div>

                <div>
                  <label className="label">Category</label>
                  <select className="input-field" value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
                    disabled={uploading}>
                    {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea rows="2" className="input-field resize-none" value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    placeholder="Short description..." disabled={uploading} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={uploading} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : <><Plus className="w-4 h-4" /> Add to Library</>}
                  </button>
                  <button type="button" onClick={() => setShowUploadForm(false)} disabled={uploading}
                    className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-all disabled:opacity-50">
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

export default DigitalLibrary;
