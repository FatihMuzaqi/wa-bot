import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Bot, 
  ClipboardList, 
  Radio, 
  Calendar,
  BrainCircuit,
  Workflow,
  FileText,
  BarChart3,
  Settings,
  Bell,
  Search,
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: MessageSquare, label: 'Live Chat', path: '/live-chat', badge: '12' },
  { icon: Bot, label: 'Bot Rules', path: '/bot-rules' },
  { icon: ClipboardList, label: 'Forms', path: '/forms' },
  { icon: Radio, label: 'Broadcast', path: '/broadcast' },
  { icon: Calendar, label: 'Scheduler', path: '/scheduler' },
  { icon: BrainCircuit, label: 'AI Chatbot', path: '/ai-chatbot' },
  { icon: Workflow, label: 'Automation', path: '/automation' },
  { icon: FileText, label: 'Documents', path: '/documents' },
  { icon: BarChart3, label: 'Analytics', path: '/analytics' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function DashboardLayout() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/login');
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center mr-3">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm text-gray-900">WhatsApp AI</div>
            <div className="text-xs text-gray-500">Automation</div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-3 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors relative ${
                    isActive
                      ? 'bg-emerald-50 text-[#25D366]'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'text-[#25D366]' : 'text-gray-500'}`} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="ml-auto bg-[#25D366] text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center space-x-3 px-2 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-[#25D366] text-white">JD</AvatarFallback>
                </Avatar>
                <div className="flex-1 text-left">
                  <div className="text-sm text-gray-900">John Doe</div>
                  <div className="text-xs text-gray-500">Admin</div>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile Settings</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6">
          {/* Search */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="search"
                placeholder="Search conversations, contacts, rules..."
                className="pl-10 bg-gray-50 border-gray-200"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4 ml-6">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
