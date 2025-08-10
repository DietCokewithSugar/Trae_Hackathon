import { BookOpen } from 'lucide-react'

interface NavbarProps {
  onLogoClick: () => void
}

export default function Navbar({ onLogoClick }: NavbarProps) {
  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onLogoClick}
          >
            <BookOpen className="w-8 h-8 mr-3" />
            <h1 className="text-xl font-bold">英语学习网站</h1>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button 
                onClick={onLogoClick}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                首页
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}