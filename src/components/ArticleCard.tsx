import { Article } from '../lib/supabase'
import { Calendar, ArrowRight } from 'lucide-react'

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

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 p-6 cursor-pointer border border-gray-200 hover:border-gray-300"
         onClick={() => onClick(article.id)}>
      <div className="flex items-center text-gray-500 text-sm mb-3">
        <Calendar className="w-4 h-4 mr-2" />
        <span>{formatDate(article.created_at)}</span>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-800 mb-3 line-clamp-2">
        {article.title}
      </h3>
      
      <p className="text-gray-600 mb-4 line-clamp-3">
        {getPreview(article.content)}
      </p>
      
      <div className="flex items-center justify-between">
        <span className="text-gray-700 font-medium">阅读文章</span>
        <ArrowRight className="w-4 h-4 text-gray-700" />
      </div>
    </div>
  )
}