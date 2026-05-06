import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1">
            <span className="text-xl font-bold text-brand">MindBridge</span>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Healing is a journey, not a destination. Your mental sanctuary, available 24/7.
            </p>
            <p className="text-xs text-gray-400 mt-4">© 2024 MindBridge</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Resources</h4>
            <ul className="space-y-2">
              <li><Link to="/therapists" className="text-sm text-gray-500 hover:text-brand transition-colors">Therapists</Link></li>
              <li><Link to="/career-therapy" className="text-sm text-gray-500 hover:text-brand transition-colors">Career Therapy</Link></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand transition-colors">Urdu Support</a></li>
              <li><a href="#" className="text-sm text-danger hover:text-red-700 transition-colors">Crisis Resources</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand transition-colors">Contact Us</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand transition-colors">How It Works</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-sm text-gray-500 hover:text-brand transition-colors">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-4">Contact</h4>
            <ul className="space-y-2">
              <li className="text-sm text-gray-500">info@mindbridge.com</li>
              <li className="text-sm text-gray-500">+92 300 123 4567</li>
              <li>
                <a href="#" className="inline-flex items-center gap-2 mt-3 bg-red-50 text-red-600 px-4 py-2 rounded-full text-sm font-semibold hover:bg-red-100 transition-colors">
                  ✦ Crisis Helpline
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-100 mt-8 pt-6 flex items-center justify-between">
          <p className="text-xs text-gray-400">MindBridge — Pakistan's Mental Health Platform</p>
          <div className="flex items-center gap-3">
            <span className="text-xl cursor-pointer hover:opacity-70 transition-opacity">🌐</span>
            <span className="text-xl cursor-pointer hover:opacity-70 transition-opacity">💙</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
