import React, { useState } from 'react';
import { motion } from 'framer-motion';

const YouTubeSection = () => {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchVideos = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const apiKey = process.env.REACT_APP_YOUTUBE_API_KEY;
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${apiKey}`
      );
      const data = await response.json();
      if (data.items) {
        setVideos(data.items);
      } else {
        setError('No videos found. Please try a different search.');
      }
    } catch (err) {
      setError('Failed to fetch videos. Please check your API key.');
    }
    setLoading(false);
  };

  return (
    <div className="bg-[#1E293B] rounded-3xl p-6 border border-white/5">
      <h3 className="text-lg font-semibold text-white/80 mb-4">🎥 YouTube Study Videos</h3>
      <form onSubmit={searchVideos} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Search for programming topics (e.g., Binary Search, OS, React)..."
          className="flex-1 bg-[#0F172A] border border-white/5 rounded-xl px-4 py-3 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#6366F1]/50"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] px-6 py-3 rounded-xl font-semibold text-sm hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {videos.length === 0 && !loading && !error && (
        <div className="text-white/30 text-center py-8">
          <p className="text-4xl mb-2">🎬</p>
          <p>Search for any topic to find relevant videos</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {videos.map((video) => (
          <motion.a
            key={video.id.videoId}
            href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="bg-[#0F172A] rounded-xl overflow-hidden border border-white/5 hover:border-[#6366F1]/30 transition-all"
          >
            <img
              src={video.snippet.thumbnails.medium.url}
              alt={video.snippet.title}
              className="w-full aspect-video object-cover"
            />
            <div className="p-3">
              <p className="text-sm font-semibold text-white/80 line-clamp-2">
                {video.snippet.title}
              </p>
              <p className="text-xs text-white/40 mt-1">{video.snippet.channelTitle}</p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};

export default YouTubeSection;
