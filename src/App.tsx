import { useState } from 'react'
import Home from './pages/Home'
import ArticleDetail from './pages/ArticleDetail'
import './index.css'

type Page = 'home' | 'article'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home')
  const [selectedArticleId, setSelectedArticleId] = useState<string>('')

  const handleArticleClick = (articleId: string) => {
    // 直接显示原文章，不再进行重写
    setSelectedArticleId(articleId)
    setCurrentPage('article')
  }

  const handleBackToHome = () => {
    setCurrentPage('home')
    setSelectedArticleId('')
  }

  return (
    <div className="App">
      {currentPage === 'home' && (
        <Home onArticleClick={handleArticleClick} />
      )}
      
      {currentPage === 'article' && selectedArticleId && (
        <ArticleDetail 
          articleId={selectedArticleId} 
          onBack={handleBackToHome} 
        />
      )}
    </div>
  )
}

export default App
