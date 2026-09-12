import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, query, where, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { motion } from 'framer-motion';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

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
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    
    setLoading(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTask,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        completed: false,
        priority: 'medium'
      });
      setNewTask('');
      fetchTasks();
    } catch (error) {
      console.error('Error adding task:', error);
    }
    setLoading(false);
  };

  const toggleComplete = async (id, completed) => {
    try {
      await updateDoc(doc(db, 'tasks', id), {
        completed: !completed
      });
      fetchTasks();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (id) => {
    if (window.confirm('Delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
        fetchTasks();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'pending') return !task.completed;
    return true;
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-gray-800 mb-6">✅ Task Manager</h1>

        {/* Add Task Form */}
        <form onSubmit={addTask} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            Add Task
          </button>
        </form>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'pending' ? 'bg-yellow-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg transition-all ${filter === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Completed
          </button>
        </div>

        {/* Task List */}
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <p className="text-gray-500 text-lg">No tasks yet. Add your first task!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition-all ${
                  task.completed ? 'border-l-4 border-green-500' : 'border-l-4 border-yellow-500'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.id, task.completed)}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className={task.completed ? 'line-through text-gray-400' : 'text-gray-700'}>
                    {task.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {new Date(task.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-600">
            Total: <strong>{tasks.length}</strong> | 
            Completed: <strong className="text-green-600">{tasks.filter(t => t.completed).length}</strong> | 
            Pending: <strong className="text-yellow-600">{tasks.filter(t => !t.completed).length}</strong>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Tasks;
