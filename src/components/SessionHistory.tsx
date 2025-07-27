import React, { useState, useEffect } from 'react';
import { SessionData } from '../types';
import { getStoredSessions, formatTime } from '../utils/constants';

const SessionHistory: React.FC = () => {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [filter, setFilter] = useState<'all' | 'focus' | 'break'>('all');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'all'>('today');

  useEffect(() => {
    setSessions(getStoredSessions());
  }, []);

  const filteredSessions = sessions.filter(session => {
    // Type filter
    if (filter !== 'all' && session.type !== filter) {
      return false;
    }

    // Date filter
    const sessionDate = new Date(session.startTime);
    const now = new Date();
    
    switch (dateFilter) {
      case 'today':
        return sessionDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return sessionDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return sessionDate >= monthAgo;
      default:
        return true;
    }
  });

  const stats = {
    totalSessions: filteredSessions.length,
    completedSessions: filteredSessions.filter(s => s.completed).length,
    totalTime: filteredSessions.reduce((acc, s) => {
      const duration = s.endTime 
        ? Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)
        : s.duration;
      return acc + duration;
    }, 0),
    focusTime: filteredSessions
      .filter(s => s.type === 'focus')
      .reduce((acc, s) => {
        const duration = s.endTime 
          ? Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000)
          : s.duration;
        return acc + duration;
      }, 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalSessions}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Sessions
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
            {stats.completedSessions}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Completed
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {formatTime(stats.totalTime)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total Time
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
            {formatTime(stats.focusTime)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Focus Time
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Session History
          </h2>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
            {/* Type Filter */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="focus">Focus Sessions</option>
              <option value="break">Break Sessions</option>
            </select>

            {/* Date Filter */}
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Sessions List */}
        <div className="mt-6 space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No sessions found for the selected filters.
            </div>
          ) : (
            filteredSessions
              .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
              .map((session) => {
                const duration = session.endTime 
                  ? Math.floor((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000)
                  : session.duration;

                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        session.type === 'focus' ? 'bg-blue-500' : 'bg-green-500'
                      }`} />
                      
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {session.type === 'focus' ? '🎯 Focus Session' : '☕ Break Session'}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {session.preset.name} • {new Date(session.startTime).toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatTime(duration)}
                      </div>
                      <div className={`text-sm ${
                        session.completed 
                          ? 'text-green-600 dark:text-green-400' 
                          : session.interrupted
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}>
                        {session.completed ? 'Completed' : session.interrupted ? 'Interrupted' : 'In Progress'}
                      </div>
                    </div>
                  </div>
                );
              })
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionHistory;
