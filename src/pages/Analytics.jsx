import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const Analytics = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const taskList = [];
      querySnapshot.forEach((doc) => {
        taskList.push({ id: doc.id, ...doc.data() });
      });
      setTasks(taskList);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    }
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const pendingTasks = tasks.filter(t => !t.completed).length;

  const pieData = [
    { name: 'Completed', value: completedTasks },
    { name: 'Pending', value: pendingTasks }
  ];

  const COLORS = ['#10B981', '#F59E0B'];

  // Weekly data (mock)
  const weeklyData = [
    { day: 'Mon', tasks: 5, completed: 3 },
    { day: 'Tue', tasks: 7, completed: 5 },
    { day: 'Wed', tasks: 4, completed: 4 },
    { day: 'Thu', tasks: 6, completed: 2 },
    { day: 'Fri', tasks: 8, completed: 6 },
    { day: 'Sat', tasks: 3, completed: 3 },
    { day: 'Sun', tasks: 2, completed: 1 },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6">📊 Analytics</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-gray-500 text-sm">Total Tasks</p>
            <p className="text-2xl font-bold">{tasks.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-gray-500 text-sm">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedTasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-gray-500 text-sm">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{pendingTasks}</p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-4">
            <p className="text-gray-500 text-sm">Completion Rate</p>
            <p className="text-2xl font-bold text-blue-600">
              {tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Weekly Progress */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">📈 Weekly Progress</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tasks" fill="#4F46E5" name="Total Tasks" />
                <Bar dataKey="completed" fill="#10B981" name="Completed" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Task Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Task Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Insights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200"
        >
          <h3 className="text-lg font-semibold text-purple-800">💡 Insights</h3>
          <ul className="mt-2 space-y-1 text-purple-700">
            {tasks.length === 0 ? (
              <li>Start adding tasks to see your progress!</li>
            ) : (
              <>
                <li>• You've completed {completedTasks} out of {tasks.length} tasks</li>
                <li>• Your completion rate is {Math.round((completedTasks / tasks.length) * 100)}%</li>
                <li>• {pendingTasks > 0 ? `You have ${pendingTasks} tasks pending` : '🎉 All tasks completed!'}</li>
              </>
            )}
          </ul>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Analytics;
