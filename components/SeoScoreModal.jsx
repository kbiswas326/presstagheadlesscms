import React, { useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaChevronDown, FaChevronUp } from 'react-icons/fa';

const SeoScoreModal = ({ 
  content,  // Editor content
  title,    // Article title
  slug,     // English title/permalink
  summary,  // Article summary
  seoDesc,  // Meta description
  formData  // Rest of the properties (categories, tags, etc.)
}) => {
  const [showSeoDetails, setShowSeoDetails] = useState(false);
  const [showReadabilityDetails, setShowReadabilityDetails] = useState(false);

  

  // Dummy data for demonstration
  const seoScore = 75;
  const readabilityScore = 85;
  
  const seoSuggestions = [
    {
      type: 'warning',
      message: 'Meta description length is not optimal (should be 120-160 characters).',
      current: 'Current length: 90 characters'
    },
    {
      type: 'error',
      message: 'Content is too short. Aim for at least 300 words.',
      current: 'Current word count: 250'
    }
  ];

  const readabilitySuggestions = [
    {
      type: 'warning',
      message: 'Sentences are too long. Try to keep them shorter for better readability.'
    },
    {
      type: 'warning',
      message: 'Some paragraphs are too long. Break them into smaller chunks.'
    }
  ];

  const dummyKeywords = [
    { keyword: 'react', density: 2.5 },
    { keyword: 'javascript', density: 1.8 },
    { keyword: 'development', density: 1.2 },
    { keyword: 'web', density: 1.0 },
  ];

  const dummyMetrics = {
    readingTime: { text: '3 min read' },
    sentenceCount: 25,
    avgWordsPerSentence: 15,
    fleschScore: 65
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreText = (score) => {
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
      <div className="sticky top-0 bg-white border-b border-gray-100 shadow-sm z-20">
        <div className="flex items-center justify-between p-3">
          <h3 className="text-base font-semibold text-gray-800">Content Analysis</h3>
        </div>
      </div>

      <div className="p-3 space-y-4">
        {/* SEO Score Section */}
        <div>
          <button
            onClick={() => setShowSeoDetails(!showSeoDetails)}
            className="w-full flex items-center justify-between hover:bg-gray-50 rounded-md p-2 -ml-2"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 text-center text-lg font-semibold ${getScoreColor(seoScore)}`}>
                {seoScore}
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-medium leading-none mb-1">SEO Score</div>
                <div className={`text-xs ${getScoreColor(seoScore)} leading-none`}>{getScoreText(seoScore)}</div>
              </div>
            </div>
            {showSeoDetails ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
          </button>
          {showSeoDetails && (
            <div className="mt-2 space-y-2 bg-gray-50 p-3 rounded-md">
              {seoSuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  {suggestion.type === 'error' ? (
                    <FaExclamationCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : suggestion.type === 'warning' ? (
                    <FaExclamationCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FaCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 break-words">{suggestion.message}</p>
                    {suggestion.current && (
                      <p className="text-xs text-gray-500 mt-1 break-words">{suggestion.current}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Readability Score Section */}
        <div>
          <button
            onClick={() => setShowReadabilityDetails(!showReadabilityDetails)}
            className="w-full flex items-center justify-between hover:bg-gray-50 rounded-md p-2 -ml-2"
          >
            <div className="flex items-center gap-3">
              <div className={`w-12 text-center text-lg font-semibold ${getScoreColor(readabilityScore)}`}>
                {readabilityScore}
              </div>
              <div className="flex flex-col">
                <div className="text-sm font-medium leading-none mb-1">Readability Score</div>
                <div className={`text-xs ${getScoreColor(readabilityScore)} leading-none`}>{getScoreText(readabilityScore)}</div>
              </div>
            </div>
            {showReadabilityDetails ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
          </button>
          {showReadabilityDetails && (
            <div className="mt-2 space-y-4 bg-gray-50 p-3 rounded-md">
              {readabilitySuggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start gap-2">
                  {suggestion.type === 'error' ? (
                    <FaExclamationCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  ) : suggestion.type === 'warning' ? (
                    <FaExclamationCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <FaCheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 break-words">{suggestion.message}</p>
                  </div>
                </div>
              ))}

              {/* New Keyword Analysis Section */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {dummyKeywords.map((keyword, index) => (
                    <span 
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {keyword.keyword} ({keyword.density.toFixed(1)}%)
                    </span>
                  ))}
                </div>
              </div>

              {/* Reading Metrics */}
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Reading Metrics:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Reading time: {dummyMetrics.readingTime.text}</div>
                  <div>Sentences: {dummyMetrics.sentenceCount}</div>
                  <div>Avg. words per sentence: {Math.round(dummyMetrics.avgWordsPerSentence)}</div>
                  <div>Flesch score: {Math.round(dummyMetrics.fleschScore)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tips Section */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Tips for improvement:</h4>
          <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4">
            <li>Use relevant keywords naturally</li>
            <li>Add H1, H2, H3 headings</li>
            <li>Include relevant images</li>
            <li>Add internal/external links</li>
            <li>Write clear meta descriptions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SeoScoreModal; 