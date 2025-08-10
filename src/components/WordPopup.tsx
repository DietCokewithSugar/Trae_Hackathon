import React, { useEffect, useState } from 'react'
import { X, BookmarkPlus } from 'lucide-react'
import { Word, unfamiliarWordAPI } from '../lib/supabase'

interface WordPopupProps {
  word: Word | null
  position: { x: number; y: number }
  isVisible: boolean
  onClose: () => void
}

const WordPopup: React.FC<WordPopupProps> = ({ word, position, isVisible, onClose }) => {
  const [adjustedPosition, setAdjustedPosition] = useState(position)
  const [isAddingToUnfamiliar, setIsAddingToUnfamiliar] = useState(false)

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
        // 可以添加一个成功提示
        console.log('Successfully added to unfamiliar words:', word.word)
        // 可选：显示成功消息或关闭弹窗
        setTimeout(() => {
          onClose()
        }, 500)
      } else {
        console.error('Failed to add word to unfamiliar list')
      }
    } catch (error) {
      console.error('Error adding word to unfamiliar list:', error)
    } finally {
      setIsAddingToUnfamiliar(false)
    }
  }

  useEffect(() => {
    if (!isVisible) return

    // 智能调整弹窗位置，避免超出视窗
    const adjustPosition = () => {
      const popupWidth = 320 // max-w-sm w-80 对应的宽度
      const popupHeight = 200 // 估算的弹窗高度
      const margin = 20 // 边距

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
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* 弹窗内容 */}
      <div
        className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm w-80 transition-all duration-200"
        style={{
          left: `${adjustedPosition.x}px`,
          top: `${adjustedPosition.y}px`,
          transform: adjustedPosition.y > position.y ? 'translate(-50%, 10px)' : 'translate(-50%, -100%)',
        }}
      >
        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>

        {/* 单词标题 */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-800 capitalize">
            {word.word}
          </h3>
          {word.phonetic && (
            <p className="text-sm text-gray-600 mt-1">
              [{word.phonetic}]
            </p>
          )}
        </div>

        {/* 英文释义 */}
        {word.definition && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              English Definition:
            </h4>
            <div className="text-sm text-gray-600 leading-relaxed">
              {formatDefinitions(word.definition)}
            </div>
          </div>
        )}

        {/* 中文翻译 */}
        {word.translation && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">
              中文释义:
            </h4>
            <div className="text-sm text-gray-600 leading-relaxed">
              {formatDefinitions(word.translation)}
            </div>
          </div>
        )}

        {/* 不熟悉按钮 */}
        <div className="flex justify-center pt-2 border-t border-gray-200">
          <button
            onClick={handleAddToUnfamiliar}
            disabled={isAddingToUnfamiliar}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <BookmarkPlus size={16} />
            {isAddingToUnfamiliar ? '添加中...' : '不熟悉'}
          </button>
        </div>
      </div>
    </>
  )
}

export default WordPopup