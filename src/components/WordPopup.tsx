import React, { useEffect, useState } from 'react'
import { X, BookmarkPlus, Volume2, Sparkles, CheckCircle, Book } from 'lucide-react'
import { Word, unfamiliarWordAPI } from '../lib/supabase'

interface WordPopupProps {
  word: Word | null
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
  onAddToUnfamiliar?: (word: string) => void
}

const WordPopup: React.FC<WordPopupProps> = ({ word, position, isVisible, onClose, onAddToUnfamiliar }) => {
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const [isAddingToUnfamiliar, setIsAddingToUnfamiliar] = useState(false)

  const [isAdded, setIsAdded] = useState(false)

  // 处理添加到不熟悉单词列表
  const handleAddToUnfamiliar = async () => {
    if (!word || isAddingToUnfamiliar) return

    setIsAddingToUnfamiliar(true)
    try {
      const success = await unfamiliarWordAPI.addUnfamiliarWord({
        word: word.word,
        phonetic: word.phonetic || null,
        definition: word.definition || null,
        translation: word.translation || null
      })

      if (success) {
        console.log('Successfully added to unfamiliar words:', word.word)
        onAddToUnfamiliar?.(word.word)
        setIsAdded(true)
        // 显示成功状态后自动关闭
        setTimeout(() => {
          onClose()
          setIsAdded(false)
        }, 1500)
      } else {
        console.error('Failed to add word to unfamiliar list')
      }
    } catch (error) {
      console.error('Error adding word to unfamiliar list:', error)
    } finally {
      setIsAddingToUnfamiliar(false)
    }
  }

  // 发音功能
  const handlePronounce = () => {
    if (word?.word && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.word)
      utterance.lang = 'en-US'
      utterance.rate = 0.8
      speechSynthesis.speak(utterance)
    }
  }

  useEffect(() => {
    if (!isVisible) return

    // 智能调整弹窗位置，避免超出视窗
    const adjustPosition = () => {
      const isMobile = window.innerWidth < 640
      const popupWidth = isMobile ? Math.min(320, window.innerWidth - 32) : 384 // 响应式宽度
      const popupHeight = 280 // 估算的弹窗高度
      const margin = isMobile ? 16 : 20 // 移动端更小的边距

      let newX = position.x
      let newY = position.y

      // 水平位置调整
      if (newX + popupWidth / 2 > window.innerWidth - margin) {
        newX = window.innerWidth - popupWidth / 2 - margin
      }
      if (newX - popupWidth / 2 < margin) {
        newX = popupWidth / 2 + margin
      }

      // 垂直位置调整
      if (newY - popupHeight < margin) {
        // 如果上方空间不足，显示在下方
        newY = position.y + 30
      }
      if (newY + popupHeight > window.innerHeight - margin) {
        // 如果下方空间也不足，显示在上方
        newY = position.y - 10
      }

      setAdjustedPosition({ x: newX, y: newY })
    }

    adjustPosition()
    window.addEventListener('resize', adjustPosition)
    return () => window.removeEventListener('resize', adjustPosition)
  }, [position, isVisible])

  if (!isVisible || !word) return null

  // 格式化释义文本（按行分割）
  const formatDefinitions = (text: string) => {
    return text.split('\n').filter(line => line.trim()).map((line, index) => (
      <div key={index} className="mb-1">
        {index + 1}. {line.trim()}
      </div>
    ))
  }

  return (
    <>
      {/* 背景遮罩 */}
      <div 
        className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div
        className="fixed z-50 bg-white/98 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl max-w-sm w-80 sm:w-96 transition-all duration-500 ease-out animate-scale-in overflow-hidden"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          transform: adjustedPosition.y > position.y ? 'translate(-50%, 10px)' : 'translate(-50%, -100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          maxWidth: 'calc(100vw - 2rem)'
        }}
      >
        {/* 顶部装饰条 */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        
        {/* 内容区域 */}
        <div className="p-4 sm:p-6">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/80 rounded-full transition-all duration-300 hover:rotate-90"
          >
            <X size={16} />
          </button>

          {/* 单词标题区域 */}
          <div className="mb-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Book className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-800 capitalize tracking-tight">
                    {word.word}
                  </h3>
                </div>
                {word.phonetic && (
                  <div className="flex items-center gap-2 ml-13">
                    <p className="text-neutral-500 font-mono text-base bg-neutral-50 px-3 py-1 rounded-lg border">
                      /{word.phonetic}/
                    </p>
                    <button
                      onClick={handlePronounce}
                      className="w-8 h-8 flex items-center justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200 hover:scale-110"
                      title="点击发音"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 释义内容区域 */}
          <div className="space-y-5">
            {/* 英文释义 */}
            {word.definition && (
              <div className="group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">
                    Definition
                  </h4>
                </div>
                <div className="text-sm text-neutral-700 leading-relaxed bg-gradient-to-br from-blue-50/50 to-indigo-50/50 p-4 rounded-xl border border-blue-100/50 backdrop-blur-sm">
                  {formatDefinitions(word.definition)}
                </div>
              </div>
            )}

            {/* 中文翻译 */}
            {word.translation && (
              <div className="group">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <h4 className="text-sm font-semibold text-neutral-600 uppercase tracking-wider">
                    中文释义
                  </h4>
                </div>
                <div className="text-sm text-neutral-700 leading-relaxed bg-gradient-to-br from-purple-50/50 to-pink-50/50 p-4 rounded-xl border border-purple-100/50 backdrop-blur-sm">
                  {formatDefinitions(word.translation)}
                </div>
              </div>
            )}
          </div>

          {/* 操作按钮区域 */}
          <div className="mt-6 pt-5 border-t border-neutral-100">
            <button
              onClick={handleAddToUnfamiliar}
              disabled={isAddingToUnfamiliar || isAdded}
              className={`w-full flex items-center justify-center gap-3 px-6 py-3.5 text-sm font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] ${
                isAdded 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25'
                  : isAddingToUnfamiliar
                  ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30'
              }`}
            >
              {isAdded ? (
                <>
                  <CheckCircle size={18} />
                  <span>已添加到生词本</span>
                </>
              ) : isAddingToUnfamiliar ? (
                <>
                  <div className="w-4 h-4 border-2 border-neutral-500 border-t-transparent rounded-full animate-spin" />
                  <span>添加中...</span>
                </>
              ) : (
                <>
                  <BookmarkPlus size={18} />
                  <span>添加到生词本</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default WordPopup