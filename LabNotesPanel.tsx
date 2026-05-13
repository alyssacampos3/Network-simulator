import { useState } from 'react'
import { educationalContent, getAllTopics } from '../engine/educational'
import type { EducationalTopic } from '../types'

interface Props {
  onClose: () => void
}

export function EducationalPanel({ onClose }: Props) {
  const topics = getAllTopics()
  const [selectedTopic, setSelectedTopic] = useState<EducationalTopic>(topics[0])
  const content = educationalContent[selectedTopic]

  return (
    <div className="fixed inset-y-0 right-0 w-[520px] bg-gray-900 border-l border-gray-700 shadow-2xl z-40 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-950">
        <div className="flex items-center gap-2">
          <span className="text-lg">📚</span>
          <h2 className="text-sm font-semibold text-white">Educational Mode</h2>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white text-lg">✕</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Topic Sidebar */}
        <div className="w-36 border-r border-gray-800 overflow-y-auto py-2">
          {topics.map(topic => (
            <button
              key={topic}
              onClick={() => setSelectedTopic(topic)}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                selectedTopic === topic
                  ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {topic.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h3 className="text-lg font-bold text-white mb-1">{content.title}</h3>
          <p className="text-sm text-blue-300 mb-4">{content.summary}</p>

          <div className="prose prose-invert prose-sm max-w-none">
            {content.details.split('\n\n').map((paragraph, idx) => (
              <div key={idx} className="mb-3">
                {paragraph.split('\n').map((line, lineIdx) => {
                  if (line.startsWith('•')) {
                    return (
                      <p key={lineIdx} className="text-xs text-gray-300 pl-3 py-0.5">
                        {line}
                      </p>
                    )
                  }
                  if (line.endsWith(':') && line.length < 40) {
                    return (
                      <p key={lineIdx} className="text-xs font-semibold text-gray-200 mt-2 mb-1">
                        {line}
                      </p>
                    )
                  }
                  return (
                    <p key={lineIdx} className="text-xs text-gray-300 leading-relaxed">
                      {line}
                    </p>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Related Commands */}
          <div className="mt-6 pt-4 border-t border-gray-800">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">Related Commands</p>
            <div className="space-y-1">
              {content.relatedCommands.map((cmd, i) => (
                <code key={i} className="block text-xs text-green-400 bg-gray-800 px-3 py-1.5 rounded font-mono">
                  {cmd}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
