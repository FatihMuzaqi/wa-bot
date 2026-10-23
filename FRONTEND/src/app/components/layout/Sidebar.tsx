import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  MessageSquare,
  Bot,
  ListOrdered,
  FileText,
  Send,
  Clock,
  Brain,
  Workflow,
  FolderOpen,
  BarChart3,
  Settings,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: MessageSquare, label: "Live Chat", path: "/live-chat" },
  { icon: Bot, label: "Bot Rules", path: "/bot-rules" },
  { icon: ListOrdered, label: "Menu Builder", path: "/menu-builder" },
  { icon: FileText, label: "Forms", path: "/forms" },
  { icon: Send, label: "Broadcast", path: "/broadcast" },
  { icon: Clock, label: "Scheduler", path: "/scheduler" },
  { icon: Brain, label: "AI Chatbot", path: "/ai-chatbot" },
  // { icon: Workflow, label: "Automation", path: "/automation" },
  // { icon: FolderOpen, label: 'Documents', path: '/documents' },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#25D366] rounded-lg flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900">WhatsApp Bot</h1>
            <p className="text-xs text-gray-500">Automation Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[#25D366] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-lg p-4 text-white">
          <p className="text-sm font-medium mb-1">Upgrade to Pro</p>
          <p className="text-xs opacity-90 mb-3">Unlock advanced features</p>
          <button className="w-full bg-white text-[#25D366] text-xs font-medium py-2 rounded-md hover:bg-gray-50 transition-colors">
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
