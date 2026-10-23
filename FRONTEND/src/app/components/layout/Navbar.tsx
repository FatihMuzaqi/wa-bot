import { Bell, Search, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export function Navbar() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations, contacts, or settings..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-6">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">New message from Customer</p>
                  <p className="text-xs text-gray-500 mt-1">5 minutes ago</p>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">Bot rule triggered</p>
                  <p className="text-xs text-gray-500 mt-1">1 hour ago</p>
                </div>
                <div className="p-4 hover:bg-gray-50 cursor-pointer">
                  <p className="text-sm font-medium text-gray-900">Broadcast sent successfully</p>
                  <p className="text-xs text-gray-500 mt-1">3 hours ago</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-8 w-px bg-gray-200"></div>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white font-medium text-sm">
            AD
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">Admin User</p>
            <p className="text-xs text-gray-500">admin@company.com</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
