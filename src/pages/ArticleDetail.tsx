import { useState, useEffect } from 'react'
import { Article, articleAPI, Word, wordAPI, unfamiliarWordAPI } from '../lib/supabase'
import { rewriteArticleWithWords } from '../lib/openai'
import { ArrowLeft, Calendar, CheckCircle, Loader2, Clock, BookOpen, Home } from 'lucide-react'
import WordPopup from '../components/WordPopup'

interface ArticleDetailProps {
  articleId: string
  onBack: () => void
}

export default function ArticleDetail({ articleId, onBack }: ArticleDetailProps) {
  const [article, setArticle] = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [sentences, setSentences] = useState<string[]>([])
  const [visibleSentenceCount, setVisibleSentenceCount] = useState(1)
  const [hoveredWord, setHoveredWord] = useState<string | null>(null)
  const [selectedWord, setSelectedWord] = useState<Word | null>(null)
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 })
  const [isPopupVisible, setIsPopupVisible] = useState(false)
  const [loadingWord, setLoadingWord] = useState(false)
  const [rewrittenContent, setRewrittenContent] = useState<string>('')
  const [isRewriting, setIsRewriting] = useState(false)
  const [rewriteError, setRewriteError] = useState<string | null>(null)
  
  // 阅读统计相关状态
  const [readingStartTime, setReadingStartTime] = useState<Date | null>(null)
  const [readingEndTime, setReadingEndTime] = useState<Date | null>(null)
  const [newWordsAdded, setNewWordsAdded] = useState<string[]>([])
  
  // 句子阅读速度统计相关状态
  const [sentenceTimings, setSentenceTimings] = useState<{
    sentenceIndex: number
    displayTime: Date
    readTime?: Date
    duration?: number
    wordCount: number
    readingSpeed?: number
  }[]>([])
  const [currentSentenceStartTime, setCurrentSentenceStartTime] = useState<Date | null>(null)
  const [showStatistics, setShowStatistics] = useState(false)

  useEffect(() => {
    loadArticle()
    // 记录阅读开始时间
    setReadingStartTime(new Date())
  }, [articleId])

  // 添加键盘事件监听
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space' && !isPopupVisible) {
        event.preventDefault()
        if (visibleSentenceCount < sentences.length) {
          const now = new Date()
          
          // 记录当前句子的阅读完成时间
          if (currentSentenceStartTime && visibleSentenceCount > 0) {
            const currentSentenceIndex = visibleSentenceCount - 1
            const duration = now.getTime() - currentSentenceStartTime.getTime()
            const wordCount = countWords(sentences[currentSentenceIndex])
            const readingSpeed = wordCount > 0 ? (wordCount / (duration / 1000 / 60)) : 0
            
            setSentenceTimings(prev => {
              const updated = [...prev]
              const existingIndex = updated.findIndex(t => t.sentenceIndex === currentSentenceIndex)
              if (existingIndex >= 0) {
                updated[existingIndex] = {
                  ...updated[existingIndex],
                  readTime: now,
                  duration,
                  readingSpeed
                }
              }
              return updated
            })
          }
          
          // 显示下一句并记录开始时间
          setVisibleSentenceCount(prev => prev + 1)
          setCurrentSentenceStartTime(now)
          
          // 记录新句子的显示时间
          if (visibleSentenceCount < sentences.length) {
            const nextSentenceIndex = visibleSentenceCount
            const wordCount = countWords(sentences[nextSentenceIndex])
            setSentenceTimings(prev => [
              ...prev,
              {
                sentenceIndex: nextSentenceIndex,
                displayTime: now,
                wordCount
              }
            ])
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [visibleSentenceCount, sentences.length, isPopupVisible, currentSentenceStartTime, sentences])

  const loadArticle = async () => {
    try {
      setLoading(true)
      setRewriteError(null)
      const data = await articleAPI.getArticleById(articleId)
      setArticle(data)
      
      if (data?.content) {
        // 获取用户不熟悉的单词列表
        const unfamiliarWords = await unfamiliarWordAPI.getUnfamiliarWords()
        const unfamiliarWordTexts = unfamiliarWords.map(word => word.word)
        
        let contentToUse = data.content
        
        // 如果有不熟悉的单词，调用ChatGPT重写文章
        if (unfamiliarWordTexts.length > 0) {
          setIsRewriting(true)
          console.log('开始重写文章，不熟悉单词:', unfamiliarWordTexts)
          
          const rewriteResult = await rewriteArticleWithWords(data.content, unfamiliarWordTexts)
          
          if (rewriteResult.success && rewriteResult.rewrittenArticle) {
            contentToUse = rewriteResult.rewrittenArticle
            setRewrittenContent(contentToUse)
            console.log('文章重写成功')
          } else {
            console.error('文章重写失败:', rewriteResult.error)
            setRewriteError(rewriteResult.error || '文章重写失败')
            // 如果重写失败，使用原文章
            contentToUse = data.content
          }
          
          setIsRewriting(false)
        }
        
        // 将文章内容按句子分割
        const sentenceArray = splitIntoSentences(contentToUse)
        setSentences(sentenceArray)
        const now = new Date()
        setCurrentSentenceStartTime(now)
        setVisibleSentenceCount(1)
        
        // 初始化第一句的时间记录
        if (sentenceArray.length > 0) {
          const wordCount = countWords(sentenceArray[0])
          setSentenceTimings([{
            sentenceIndex: 0,
            displayTime: now,
            wordCount
          }])
        }
      }
    } catch (error) {
      console.error('Failed to load article:', error)
      setRewriteError('加载文章失败')
    } finally {
      setLoading(false)
      setIsRewriting(false)
    }
  }

  // 将文本分割为句子
  const splitIntoSentences = (text: string): string[] => {
    // 移除多余的空白字符并按段落分割
    const paragraphs = text.split('\n').filter(p => p.trim())
    const sentences: string[] = []
    
    paragraphs.forEach(paragraph => {
      // 使用正则表达式按句子分割，保留句号、问号、感叹号作为句子结束标志
      const sentenceMatches = paragraph.match(/[^.!?]+[.!?]+/g)
      if (sentenceMatches) {
        sentences.push(...sentenceMatches.map(s => s.trim()))
      } else if (paragraph.trim()) {
        // 如果没有标点符号，整个段落作为一个句子
        sentences.push(paragraph.trim())
      }
    })
    
    return sentences.filter(s => s.length > 0)
  }

  // 完成阅读
  const finishReading = () => {
    const now = new Date()
    
    // 记录最后一句的阅读完成时间
    if (currentSentenceStartTime && sentences.length > 0) {
      const lastSentenceIndex = sentences.length - 1
      const duration = now.getTime() - currentSentenceStartTime.getTime()
      const wordCount = countWords(sentences[lastSentenceIndex])
      const readingSpeed = wordCount > 0 ? (wordCount / (duration / 1000 / 60)) : 0
      
      setSentenceTimings(prev => {
        const updated = [...prev]
        const existingIndex = updated.findIndex(t => t.sentenceIndex === lastSentenceIndex)
        if (existingIndex >= 0) {
          updated[existingIndex] = {
            ...updated[existingIndex],
            readTime: now,
            duration,
            readingSpeed
          }
        }
        return updated
      })
    }
    
    // 记录阅读结束时间
    setReadingEndTime(now)
    // 显示统计信息
    setShowStatistics(true)
  }

  // 处理添加新单词到生词本
  const handleAddToUnfamiliar = (word: string) => {
    if (!newWordsAdded.includes(word)) {
      setNewWordsAdded(prev => [...prev, word])
    }
  }

  // 格式化阅读时长
  const formatReadingTime = (startTime: Date, endTime: Date) => {
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    const diffSeconds = Math.floor((diffMs % 60000) / 1000)
    
    if (diffMinutes > 0) {
      return `${diffMinutes}分${diffSeconds}秒`
    } else {
      return `${diffSeconds}秒`
    }
  }

  // 计算句子中的单词数量
  const countWords = (sentence: string) => {
    // 移除HTML标签和特殊字符，只保留英文单词
    const cleanText = sentence.replace(/<[^>]*>/g, '').replace(/[^a-zA-Z\s]/g, ' ')
    const words = cleanText.trim().split(/\s+/).filter(word => word.length > 0)
    return words.length
  }

  // 计算阅读速度统计
  const calculateReadingSpeedStats = () => {
    const completedTimings = sentenceTimings.filter(t => t.readingSpeed !== undefined)
    if (completedTimings.length === 0) return null

    // 按阅读速度排序
    const sortedBySpeed = [...completedTimings].sort((a, b) => (a.readingSpeed || 0) - (b.readingSpeed || 0))
    
    // 计算分位数
    const total = sortedBySpeed.length
    const q1Index = Math.floor(total * 0.25)
    const q2Index = Math.floor(total * 0.5)
    const q3Index = Math.floor(total * 0.75)
    
    const q1Speed = sortedBySpeed[q1Index]?.readingSpeed || 0
    const q2Speed = sortedBySpeed[q2Index]?.readingSpeed || 0
    const q3Speed = sortedBySpeed[q3Index]?.readingSpeed || 0
    
    // 分级统计
    const levels = {
      slow: completedTimings.filter(t => (t.readingSpeed || 0) <= q1Speed),
      medium: completedTimings.filter(t => (t.readingSpeed || 0) > q1Speed && (t.readingSpeed || 0) <= q2Speed),
      fast: completedTimings.filter(t => (t.readingSpeed || 0) > q2Speed && (t.readingSpeed || 0) <= q3Speed),
      veryFast: completedTimings.filter(t => (t.readingSpeed || 0) > q3Speed)
    }
    
    // 计算平均速度
    const avgSpeed = completedTimings.reduce((sum, t) => sum + (t.readingSpeed || 0), 0) / completedTimings.length
    
    return {
      totalSentences: completedTimings.length,
      averageSpeed: avgSpeed,
      levels,
      unfamiliarSentences: levels.slow // 最慢的25%作为不熟悉句子
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 处理单词点击事件
  const handleWordClick = async (word: string, event: React.MouseEvent) => {
    event.preventDefault()
    
    // 调试日志：打印原始点击的单词
    console.log('=== 单词点击调试信息 ===')
    console.log('1. 原始点击的单词:', word)
    console.log('2. 单词类型:', typeof word)
    console.log('3. 单词长度:', word.length)
    
    // 清理单词，移除标点符号
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase()
    console.log('4. 清理后的单词:', cleanWord)
    console.log('5. 清理后单词长度:', cleanWord.length)
    
    if (!cleanWord) {
      console.log('6. 清理后单词为空，退出处理')
      return
    }

    setLoadingWord(true)
    console.log('7. 开始查询单词:', cleanWord)
    
    try {
      const wordData = await wordAPI.getWordByText(cleanWord)
      console.log('8. 查询结果:', wordData)
      
      if (wordData) {
        console.log('9. 找到单词数据，显示弹窗')
        setSelectedWord(wordData)
        
        // 设置弹窗位置
        const rect = (event.target as HTMLElement).getBoundingClientRect()
        setPopupPosition({
          x: rect.left + rect.width / 2,
          y: rect.top
        })
        
        setIsPopupVisible(true)
      } else {
        console.log('10. 数据库中未找到该单词:', cleanWord)
      }
    } catch (error) {
      console.error('11. 查询单词时发生错误:', error)
    } finally {
      setLoadingWord(false)
      console.log('12. 单词查询处理完成')
      console.log('========================')
    }
  }

  // 关闭弹窗
  const closePopup = () => {
    setIsPopupVisible(false)
    setSelectedWord(null)
  }

  // 将文本按单词分割并渲染为可悬停和点击的元素
  const renderTextWithWordHighlight = (text: string) => {
    // 使用正则表达式分割文本，保留标点符号、空格和方括号
    const tokens = text.split(/(\s+|[.,!?;:"'(){}]|\[[^\]]+\])/)
    
    return tokens.map((token, index) => {
      // 检查是否为方括号包围的单词（重写文章中的目标单词）
      const isBracketedWord = /^\[[^\]]+\]$/.test(token)
      
      if (isBracketedWord) {
        // 提取方括号内的单词
        const word = token.slice(1, -1)
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer transition-all duration-200 rounded px-2 py-1 mx-1 ${
              hoveredWord === word.toLowerCase() 
                ? 'bg-gray-400 text-gray-900 shadow-md transform scale-110 font-bold' 
                : 'bg-gray-300 text-gray-800 hover:bg-gray-400 font-semibold'
            } ${loadingWord ? 'pointer-events-none' : ''} border-2 border-gray-500`}
            onMouseEnter={() => setHoveredWord(word.toLowerCase())}
            onMouseLeave={() => setHoveredWord(null)}
            onTouchStart={() => setHoveredWord(word.toLowerCase())}
            onTouchEnd={() => setTimeout(() => setHoveredWord(null), 1000)}
            onClick={(e) => handleWordClick(word, e)}
            title="这是为您特别融入的不熟悉单词"
          >
            {word}
          </span>
        )
      }
      
      // 检查是否为普通单词（包含字母）
      const isWord = /[a-zA-Z]/.test(token) && !token.includes('[')
      
      if (isWord) {
        return (
          <span
            key={index}
            className={`inline-block cursor-pointer transition-all duration-200 rounded px-1 ${
              hoveredWord === token.toLowerCase() 
                ? 'bg-gray-200 text-gray-900 shadow-sm transform scale-105' 
                : 'hover:bg-gray-100'
            } ${loadingWord ? 'pointer-events-none' : ''}`}
            onMouseEnter={() => setHoveredWord(token.toLowerCase())}
            onMouseLeave={() => setHoveredWord(null)}
            onTouchStart={() => setHoveredWord(token.toLowerCase())}
            onTouchEnd={() => setTimeout(() => setHoveredWord(null), 1000)}
            onClick={(e) => handleWordClick(token, e)}
          >
            {token}
          </span>
        )
      }
      
      // 返回非单词字符（空格、标点符号等）
      return <span key={index}>{token}</span>
    })
  }

  if (loading || isRewriting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex items-center mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600 mr-3" />
            <span className="text-gray-600">
              {loading ? '加载文章中...' : '正在为您重写文章，融入不熟悉的单词...'}
            </span>
          </div>
          {isRewriting && (
            <p className="text-sm text-gray-500 text-center max-w-md">
              我们正在根据您的不熟悉单词列表重写文章，让学习更有针对性
            </p>
          )}
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg mb-4">文章未找到</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    )
  }

  const visibleSentences = sentences.slice(0, visibleSentenceCount)
  const isAllSentencesVisible = visibleSentenceCount >= sentences.length
  
  // 获取慢速句子索引用于高亮显示
  const getSlowSentenceIndices = () => {
    const speedStats = calculateReadingSpeedStats()
    if (!speedStats) return new Set()
    return new Set(speedStats.unfamiliarSentences.map(s => s.sentenceIndex))
  }
  
  const slowSentenceIndices = getSlowSentenceIndices()

  // 如果显示统计信息，渲染统计界面
  if (showStatistics && readingStartTime && readingEndTime) {
    const speedStats = calculateReadingSpeedStats()
    
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          {/* 标题 */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">阅读完成！</h2>
            <p className="text-gray-600">恭喜您完成了《{article?.title}》的阅读</p>
          </div>

          {/* 统计信息 */}
          <div className="space-y-6 mb-8">
            {/* 阅读时长 */}
            <div className="flex items-center p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4">
                <Clock className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">阅读时长</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {formatReadingTime(readingStartTime, readingEndTime)}
                </p>
              </div>
            </div>

            {/* 新添加的单词 */}
            <div className="flex items-start p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4 mt-1">
                <BookOpen className="w-6 h-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800 mb-2">新学单词</h3>
                {newWordsAdded.length > 0 ? (
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-3">
                      {newWordsAdded.length} 个
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {newWordsAdded.map((word, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500">本次阅读未添加新单词</p>
                )}
              </div>
            </div>

            {/* 阅读速度分析 */}
            {speedStats && (
              <div className="flex items-start p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mr-4 mt-1">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 mb-2">阅读速度分析</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">平均阅读速度</span>
                      <span className="text-lg font-bold text-gray-900">
                        {Math.round(speedStats.averageSpeed)} 词/分钟
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600 mb-2">速度分布：</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-red-600">● 较慢 (0-25%)</span>
                          <span className="font-medium">{speedStats.levels.slow.length}句</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-orange-600">● 一般 (25-50%)</span>
                          <span className="font-medium">{speedStats.levels.medium.length}句</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-blue-600">● 较快 (50-75%)</span>
                          <span className="font-medium">{speedStats.levels.fast.length}句</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-green-600">● 很快 (75-100%)</span>
                          <span className="font-medium">{speedStats.levels.veryFast.length}句</span>
                        </div>
                      </div>
                    </div>
                    
                    {speedStats.unfamiliarSentences.length > 0 && (
                      <div className="mt-3 p-3 bg-red-50 rounded-lg">
                        <div className="text-sm font-medium text-red-800 mb-2">
                          不熟悉的句子 ({speedStats.unfamiliarSentences.length}句)
                        </div>
                        <div className="text-xs text-red-600">
                          这些句子的阅读速度较慢，建议重点复习
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onBack}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-700 transition-colors font-medium"
            >
              <Home className="w-5 h-5 mr-2" />
              返回首页
            </button>
            <button
              onClick={() => {
                setShowStatistics(false)
                const now = new Date()
                setReadingStartTime(now)
                setReadingEndTime(null)
                setNewWordsAdded([])
                setVisibleSentenceCount(1)
                setCurrentSentenceStartTime(now)
                // 重置句子时间统计
                setSentenceTimings(sentences.length > 0 ? [{
                  sentenceIndex: 0,
                  displayTime: now,
                  wordCount: countWords(sentences[0])
                }] : [])
              }}
              className="flex-1 flex items-center justify-center px-6 py-3 bg-gray-100 text-gray-800 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              重新阅读
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              <span>返回文章列表</span>
            </button>
            
            {/* 进度指示器 */}
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {visibleSentenceCount} / {sentences.length}
              </span>
              <div className="w-32 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gray-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(visibleSentenceCount / sentences.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文章标题 */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 text-center">
            {article.title}
          </h1>
          
          {/* 重写状态提示 */}
          {rewrittenContent && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
                <CheckCircle className="w-4 h-4 mr-2 text-gray-600" />
                已为您融入不熟悉的单词，方括号标记的是重点学习词汇
              </div>
            </div>
          )}
          
          {/* 重写错误提示 */}
          {rewriteError && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-700">
                ⚠️ 文章重写失败：{rewriteError}，显示原文章
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 主要阅读区域 */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="max-w-4xl w-full">
          {/* 文章内容显示区域 */}
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-8 border border-gray-200">
            <div className="space-y-6">
              {visibleSentences.map((sentence, index) => {
                const isSlowSentence = slowSentenceIndices.has(index)
                return (
                  <p 
                    key={index} 
                    className={`text-xl md:text-2xl leading-relaxed font-medium transition-all duration-300 ${
                      isSlowSentence 
                        ? 'text-red-800 bg-red-50 p-4 rounded-lg border-l-4 border-red-300' 
                        : 'text-gray-800'
                    }`}
                  >
                    {renderTextWithWordHighlight(sentence)}
                  </p>
                )
              })}
            </div>
          </div>

          {/* 提示信息和完成按钮 */}
          <div className="flex flex-col items-center space-y-4">
            {!isAllSentencesVisible && (
              <div className="text-center">
                <p className="text-gray-500 text-lg mb-2">按空格键继续阅读</p>
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-lg">
                  <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-sm font-mono">Space</kbd>
                  <span className="ml-2 text-sm text-gray-600">显示下一句</span>
                </div>
              </div>
            )}

            {/* 完成阅读按钮 */}
            {isAllSentencesVisible && (
              <button
                onClick={finishReading}
                className="flex items-center px-8 py-3 bg-gray-800 text-white rounded-xl shadow-md hover:shadow-lg hover:bg-gray-700 transition-all duration-200 font-medium"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                完成阅读
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 单词查询弹窗 */}
      <WordPopup
        word={selectedWord}
        position={popupPosition}
        isVisible={isPopupVisible}
        onClose={closePopup}
        onAddToUnfamiliar={handleAddToUnfamiliar}
      />
    </div>
  )
}