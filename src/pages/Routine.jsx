import React, { useState } from 'react';
import { motion } from 'framer-motion';

const Routine = () => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const routineData = {
    'Monday': ['Codeforces Practice', 'OS/DBMS Study', 'LeetCode Problems'],
    'Tuesday': ['Math Practice', 'Project Development', 'Resume Update'],
    'Wednesday': ['Codeforces Practice', 'OOP/CN Study', 'LeetCode Problems'],
    'Thursday': ['Math Practice', 'New Technology', 'Project Development'],
    'Friday': ['Weekly Revision', 'Codeforces', 'LeetCode'],
    'Saturday': ['Codeforces Practice', 'CPS Academy', 'OS/DBMS Study'],
    'Sunday': ['Math Practice', 'LeetCode', 'New Technology']
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6">📅 Weekly Routine</h1>

        {/* Day Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-4 py-2 rounded-lg transition-all ${
                selectedDay === day 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Routine Display */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            📋 {selectedDay}'s Schedule
          </h2>
          
          <div className="space-y-3">
            {routineData[selectedDay]?.map((task, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-2xl">📌</span>
                <span className="text-gray-700">{task}</span>
              </motion.div>
            )) || (
              <p className="text-gray-500">No tasks for this day</p>
            )}
          </div>
        </div>

        {/* Quick Tips */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800">💡 Study Tips</h3>
          <ul className="mt-2 space-y-1 text-blue-700">
            <li>• Start with the hardest subject first</li>
            <li>• Take 5-minute breaks every 25 minutes</li>
            <li>• Review what you learned at the end of the day</li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
};

export default Routine;
