import { useState } from 'react'
import { Search, X, Sparkles } from 'lucide-react'

interface SearchBarProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export default function SearchBar({ onSearch, placeholder = "搜索文章..." }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query.trim())
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className="relative max-w-2xl mx-auto animate-slide-up">
      <form onSubmit={handleSubmit} className="relative">
        <div className={`relative transition-all duration-300 ${
          isFocused ? 'scale-105' : 'scale-100'
        }`}>
          {/* 背景光晕效果 */}
          <div className={`absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl blur-xl transition-opacity duration-300 ${
            isFocused ? 'opacity-100' : 'opacity-0'
          }`}></div>
          
          {/* 搜索图标 */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
            <Search className={`w-5 h-5 transition-colors duration-200 ${
              isFocused ? 'text-primary-600' : 'text-neutral-400'
            }`} />
          </div>
          
          {/* 输入框 */}
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`relative w-full pl-12 pr-12 py-4 rounded-2xl border-2 transition-all duration-200 bg-white/90 backdrop-blur-sm placeholder-neutral-400 text-neutral-900 font-medium ${
              isFocused 
                ? 'border-primary-300 ring-4 ring-primary-100 shadow-strong' 
                : 'border-neutral-200 shadow-soft hover:border-neutral-300 hover:shadow-medium'
            }`}
          />
          
          {/* 清除按钮 */}
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all duration-200 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          
          {/* AI提示标签 */}
          {!query && !isFocused && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center px-2 py-1 rounded-lg bg-gradient-to-r from-accent-50 to-primary-50 border border-accent-200/50">
              <Sparkles className="w-3 h-3 text-accent-600 mr-1" />
              <span className="text-xs font-medium text-accent-700">AI搜索</span>
            </div>
          )}
        </div>
      </form>
      
      {/* 搜索建议 */}
      {isFocused && !query && (
        <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-2xl shadow-strong border border-neutral-200/50 animate-scale-in">
          <p className="text-sm text-neutral-600 mb-3">热门搜索:</p>
          <div className="flex flex-wrap gap-2">
            {['商务英语', '日常对话', '学术文章', '新闻阅读'].map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setQuery(tag)
                  onSearch(tag)
                }}
                className="px-3 py-1.5 text-sm bg-neutral-100 hover:bg-primary-50 text-neutral-700 hover:text-primary-700 rounded-lg transition-colors duration-200"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}