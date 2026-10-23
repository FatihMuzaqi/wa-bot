import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './pages/Login';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './pages/Dashboard';
import { LiveChat } from './pages/LiveChat';
import { BotRules } from './pages/BotRules';
import { MenuBuilder } from './pages/MenuBuilder';
import { Forms } from './pages/Forms';
import { Broadcast } from './pages/Broadcast';
import { Scheduler } from './pages/Scheduler';
import { AIChatbot } from './pages/AIChatbot';
import { Automation } from './pages/Automation';
import { Documents } from './pages/Documents';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/live-chat" element={<LiveChat />} />
            <Route path="/bot-rules" element={<BotRules />} />
            <Route path="/menu-builder" element={<MenuBuilder />} />
            <Route path="/forms" element={<Forms />} />
            <Route path="/broadcast" element={<Broadcast />} />
            <Route path="/scheduler" element={<Scheduler />} />
            <Route path="/ai-chatbot" element={<AIChatbot />} />
            <Route path="/automation" element={<Automation />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
