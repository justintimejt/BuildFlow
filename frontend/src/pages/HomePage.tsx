import { useNavigate } from 'react-router-dom';
import { FaChevronDown, FaProjectDiagram } from 'react-icons/fa';

export function HomePage() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  const handleSeeInAction = () => {
    // Scroll to bottom or could navigate to a demo page
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-indigo-50">
      {/* Header/Logo */}
      <header className="px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg blur-sm opacity-50"></div>
              <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-lg">
                <FaProjectDiagram className="text-white text-2xl" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">BuildFlow</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-16 text-center">
        {/* Headline */}
        <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          <span className="text-gray-900">Turn Ideas into</span>
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Stunning
          </span>
          <span className="bg-gradient-to-r from-sky-500 to-blue-500 bg-clip-text text-transparent text-6xl md:text-7xl lg:text-8xl">
            {' '}Architecture Diagrams
          </span>
        </h2>

        {/* Descriptive Text */}
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
          BuildFlow is <span className="text-blue-600 font-semibold">Figma + React Flow</span> for architecture diagrams. 
          Create beautiful system designs from your roughest sketches in seconds.
        </p>

        {/* Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <button
            onClick={handleGetStarted}
            className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            Get Started
          </button>
          <button
            onClick={handleSeeInAction}
            className="px-8 py-4 bg-white text-blue-600 border-2 border-blue-600 rounded-lg font-semibold text-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
          >
            See It In Action
            <FaChevronDown className="text-sm" />
          </button>
        </div>

        {/* Sub-text */}
        <p className="text-gray-500 text-sm md:text-base">
          No design experience required.
        </p>
      </main>

      {/* Bottom Section - Preview/Demo Area */}
      <div className="mt-20 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Tab Bar */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium transition-colors">
                Canvas
              </button>
              <button className="px-4 py-2 text-gray-600 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors">
                Preview
              </button>
            </div>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
          </div>

          {/* Canvas Preview */}
          <div className="bg-white rounded-xl shadow-xl p-8 border border-gray-200">
            <div className="relative h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg overflow-hidden">
              {/* Decorative architecture diagram elements */}
              <svg className="w-full h-full" viewBox="0 0 800 400">
                {/* Sample diagram elements */}
                <rect x="50" y="50" width="120" height="80" rx="8" fill="#3B82F6" opacity="0.2" stroke="#3B82F6" strokeWidth="2" />
                <rect x="250" y="50" width="120" height="80" rx="8" fill="#8B5CF6" opacity="0.2" stroke="#8B5CF6" strokeWidth="2" />
                <rect x="450" y="50" width="120" height="80" rx="8" fill="#10B981" opacity="0.2" stroke="#10B981" strokeWidth="2" />
                <rect x="650" y="50" width="120" height="80" rx="8" fill="#F59E0B" opacity="0.2" stroke="#F59E0B" strokeWidth="2" />
                
                <rect x="150" y="200" width="120" height="80" rx="8" fill="#EC4899" opacity="0.2" stroke="#EC4899" strokeWidth="2" />
                <rect x="350" y="200" width="120" height="80" rx="8" fill="#06B6D4" opacity="0.2" stroke="#06B6D4" strokeWidth="2" />
                <rect x="550" y="200" width="120" height="80" rx="8" fill="#6366F1" opacity="0.2" stroke="#6366F1" strokeWidth="2" />

                {/* Connection lines */}
                <line x1="110" y1="90" x2="250" y2="90" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4,4" />
                <line x1="310" y1="90" x2="450" y2="90" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4,4" />
                <line x1="510" y1="90" x2="650" y2="90" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4,4" />
                
                <line x1="110" y1="130" x2="210" y2="200" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4,4" />
                <line x1="310" y1="130" x2="410" y2="200" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4,4" />
                <line x1="510" y1="130" x2="610" y2="200" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4,4" />

                {/* Labels */}
                <text x="110" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">Frontend</text>
                <text x="310" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">API</text>
                <text x="510" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">Database</text>
                <text x="710" y="45" textAnchor="middle" fontSize="12" fontWeight="600" fill="#374151">Cache</text>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
