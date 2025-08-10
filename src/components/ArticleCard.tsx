import { Article } from '../lib/supabase'
import { Calendar, ArrowRight, Clock, BookOpen } from 'lucide-react'

interface ArticleCardProps {
  article: Article
  onClick: (id: string) => void
}

export default function ArticleCard({ article, onClick }: ArticleCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getPreview = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  const getReadingTime = (content: string) => {
    const wordsPerMinute = 200
    const wordCount = content.split(' ').length
    const readingTime = Math.ceil(wordCount / wordsPerMinute)
    return readingTime
  }

  return (
    <div 
      className="card card-hover cursor-pointer p-6 group animate-fade-in"
      onClick={() => onClick(article.id)}
    >
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-neutral-500 text-sm">
          <Calendar className="w-4 h-4 mr-2" />
          <span>{formatDate(article.created_at)}</span>
        </div>
        <div className="flex items-center text-neutral-500 text-sm">
          <Clock className="w-4 h-4 mr-1" />
          <span>{getReadingTime(article.content)} 分钟</span>
        </div>
      </div>
      
      {/* 标题 */}
      <h3 className="text-xl font-bold text-neutral-900 mb-3 line-clamp-2 group-hover:text-primary-700 transition-colors duration-200">
        {article.title}
      </h3>
      
      {/* 内容预览 */}
      <p className="text-neutral-600 mb-6 line-clamp-3 leading-relaxed">
        {getPreview(article.content)}
      </p>
      
      {/* 底部操作区 */}
      <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
        <div className="flex items-center text-primary-600 font-medium group-hover:text-primary-700 transition-colors duration-200">
          <BookOpen className="w-4 h-4 mr-2" />
          <span>开始阅读</span>
        </div>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-50 group-hover:bg-primary-100 transition-colors duration-200">
          <ArrowRight className="w-4 h-4 text-primary-600 group-hover:translate-x-0.5 transition-transform duration-200" />
        </div>
      </div>
      
      {/* 悬浮效果装饰 */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-accent-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  )
}