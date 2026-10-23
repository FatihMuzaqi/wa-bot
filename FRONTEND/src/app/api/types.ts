export type Role = {
  id: number;
  name: 'admin' | 'agent' | string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  role?: Role;
  status?: string;
};

export type Contact = {
  id: number;
  name?: string;
  phone: string;
  email?: string;
  company?: string;
  source?: string;
  tags?: Array<{ id: number; name: string; color?: string }>;
};

export type ChatMessage = {
  id: number;
  chat_id: number;
  sender_type: 'contact' | 'agent' | 'bot' | 'ai' | 'system';
  message_type?: 'text' | 'image' | 'document' | 'audio' | 'video' | string;
  content: string;
  media_url?: string;
  status: string;
  created_at: string;
  message_timestamp?: string;
};

export type Chat = {
  id: number;
  contact?: Contact;
  messages?: ChatMessage[];
  status: 'open' | 'pending' | 'closed' | 'bot';
  assigned_agent_id?: number;
  unread_count?: number;
  last_message_at?: string;
};

export type Paginated<T> = {
  rows: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
