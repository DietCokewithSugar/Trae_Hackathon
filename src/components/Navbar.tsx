import { BookOpen } from 'lucide-react'

interface NavbarProps {
  onLogoClick: () => void
}

export default function Navbar({ onLogoClick }: NavbarProps) {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center cursor-pointer hover:opacity-70 transition-opacity"
            onClick={onLogoClick}
          >
            <BookOpen className="w-8 h-8 mr-3 text-gray-600" />
            <h1 className="text-xl font-semibold text-gray-800">PassExam</h1>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <button 
                onClick={onLogoClick}
                className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
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