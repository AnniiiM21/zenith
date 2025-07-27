import React, { useState } from 'react';
import { BREAK_SUGGESTIONS } from '../utils/constants';

interface BreakSuggestionsProps {
  onClose: () => void;
}

const BreakSuggestions: React.FC<BreakSuggestionsProps> = ({ onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All', icon: '🌟' },
    { id: 'physical', label: 'Physical', icon: '🏃' },
    { id: 'mental', label: 'Mental', icon: '🧠' },
    { id: 'social', label: 'Social', icon: '👥' },
    { id: 'creative', label: 'Creative', icon: '🎨' }
  ];

  const filteredSuggestions = selectedCategory === 'all' 
    ? BREAK_SUGGESTIONS
    : BREAK_SUGGESTIONS.filter(s => s.category === selectedCategory);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Break Suggestions 🎉
        </h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
              selectedCategory === category.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <span>{category.icon}</span>
            <span>{category.label}</span>
          </button>
        ))}
      </div>

      {/* Suggestions Grid */}
      <div className="grid grid-cols-1 gap-3">
        {filteredSuggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow duration-200 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600"
          >
            <div className="flex items-start space-x-3">
              <div className="text-2xl">{suggestion.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white mb-1">
                  {suggestion.title}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {suggestion.description}
                </div>
                <div className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    suggestion.category === 'physical' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                    suggestion.category === 'mental' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                    suggestion.category === 'social' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                  }`}>
                    {suggestion.category}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {suggestion.duration} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Random Suggestion Button */}
      <div className="mt-6">
        <button
          onClick={() => {
            const randomSuggestion = filteredSuggestions[Math.floor(Math.random() * filteredSuggestions.length)];
            alert(`Try this: ${randomSuggestion.title}\n\n${randomSuggestion.description}\n\nDuration: ${randomSuggestion.duration} minutes`);
          }}
          className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
        >
          🎲 Surprise me with a suggestion!
        </button>
      </div>
    </div>
  );
};

export default BreakSuggestions;
