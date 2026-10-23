import { useEffect, useState } from "react";
import {
  Search,
  MoreVertical,
  Paperclip,
  Send,
  Phone,
  Video,
  User,
  Tag,
  FileText,
  Bot,
} from "lucide-react";
import {
  useChatDetail,
  useChatMessages,
  useChats,
  useSendMessage,
  useTakeOverChat,
} from "../hooks/useChats";
import { useRealtimeChat } from "../hooks/useRealtimeChat";

export function LiveChat() {
  const chatsQuery = useChats({ page: 1, limit: 50 });
  const apiChats = chatsQuery.data?.rows || [];
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const selectedChatId = selectedChat?.id;
  const chatDetailQuery = useChatDetail(selectedChatId);
  const messagesQuery = useChatMessages(selectedChatId, {
    page: 1,
    limit: 100,
  });
  const sendMessageMutation = useSendMessage(selectedChatId);
  const takeOverMutation = useTakeOverChat();
  const [messageText, setMessageText] = useState("");
  useRealtimeChat(selectedChatId);

  useEffect(() => {
    if (
      apiChats.length &&
      !apiChats.some((chat: any) => chat.id === selectedChat?.id)
    ) {
      setSelectedChat(apiChats[0]);
    }
  }, [apiChats, selectedChat?.id]);

  const selectedContact =
    chatDetailQuery.data?.contact || selectedChat?.contact || selectedChat;
  const displayMessages = messagesQuery.data?.rows || [];
  const contactName =
    selectedContact?.name || selectedChat?.name || "Unknown Contact";
  const contactPhone = selectedContact?.phone || selectedChat?.phone || "-";
  const avatar =
    contactName
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "CT";

  const handleSend = () => {
    if (!messageText.trim() || !selectedChatId) return;
    if (!selectedContact?.phone) return;

    sendMessageMutation.mutate(
      { text: messageText, number: selectedContact.phone },
      {
        onSuccess: () => setMessageText(""),
      },
    );
  };

  const getLastMessageText = (chat: any) => {
    if (!chat?.lastMessage)
      return chat?.contact?.phone || chat?.phone || "No recent message";

    if (typeof chat.lastMessage === "string") return chat.lastMessage;

    return chat.lastMessage.content || "No recent message";
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Chat List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatsQuery.isLoading && (
            <div className="p-4 text-sm text-gray-500">Loading chats...</div>
          )}
          {chatsQuery.error && (
            <div className="p-4 text-sm text-red-600">
              {chatsQuery.error.message}
            </div>
          )}
          {!chatsQuery.isLoading &&
            apiChats.length === 0 &&
            !chatsQuery.error && (
              <div className="p-4 text-sm text-gray-500">No chats found.</div>
            )}
          {apiChats.map((conv: any) => {
            const convContact = conv.contact || conv;
            const convName = convContact.name || conv.name || "Unknown Contact";
            const convAvatar = convName
              .split(" ")
              .map((part: string) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();
            return (
              <div
                key={conv.id}
                onClick={() => setSelectedChat(conv)}
                className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  selectedChat?.id === conv.id ? "bg-[#F0FDF4]" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                    {conv.avatar || convAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 text-sm truncate">
                        {convName}
                      </h4>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conv.time || conv.last_message_at || ""}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 truncate mb-2">
                      {getLastMessageText(conv)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          conv.status === "bot"
                            ? "bg-purple-100 text-purple-700"
                            : conv.status === "open"
                              ? "bg-blue-100 text-blue-700"
                              : conv.status === "closed"
                                ? "bg-gray-100 text-gray-700"
                                : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {conv.status === "bot"
                          ? "Bot"
                          : conv.status === "open"
                            ? "Open"
                            : conv.status === "closed"
                              ? "Closed"
                              : "Pending"}
                      </span>
                      {(conv.unread || conv.unread_count) > 0 && (
                        <span className="bg-[#25D366] text-white text-xs font-medium px-2 py-0.5 rounded-full">
                          {conv.unread || conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Conversation */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white font-medium">
              {selectedChat?.avatar || avatar}
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{contactName}</h3>
              <p className="text-xs text-gray-500">{contactPhone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Video className="w-5 h-5 text-gray-600" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messagesQuery.isLoading && (
            <p className="text-sm text-gray-500">Loading messages...</p>
          )}
          {messagesQuery.error && (
            <p className="text-sm text-red-600">
              {messagesQuery.error.message}
            </p>
          )}
          {!messagesQuery.isLoading &&
            displayMessages.length === 0 &&
            !messagesQuery.error && (
              <p className="text-sm text-gray-500">
                No messages in this chat yet.
              </p>
            )}
          {displayMessages.map((message: any) => (
            <div
              key={message.id}
              className={`flex ${message.sender === "agent" || message.sender_type === "agent" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-md px-4 py-2 rounded-lg ${
                  message.sender === "agent" || message.sender_type === "agent"
                    ? "bg-[#25D366] text-white"
                    : "bg-white text-gray-900 border border-gray-200"
                }`}
              >
                {message.media_url && (
                  <a
                    href={message.media_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm underline"
                  >
                    {message.message_type || "media"}
                  </a>
                )}
                <p className="text-sm">
                  {message.text || message.content || ""}
                </p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender === "agent" ||
                    message.sender_type === "agent"
                      ? "text-green-100"
                      : "text-gray-500"
                  }`}
                >
                  {message.time ||
                    message.message_timestamp ||
                    message.created_at}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3">
            <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <Paperclip className="w-5 h-5 text-gray-600" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#25D366] focus:border-transparent"
            />
            <button
              onClick={handleSend}
              disabled={
                sendMessageMutation.isPending || !selectedContact?.phone
              }
              className="px-6 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#128C7E] transition-colors flex items-center gap-2 disabled:opacity-60"
            >
              <Send className="w-4 h-4" />
              {sendMessageMutation.isPending ? "Sending" : "Send"}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details Panel */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#25D366] to-[#128C7E] rounded-full flex items-center justify-center text-white text-2xl font-medium mb-3">
              {selectedChat?.avatar || avatar}
            </div>
            <h3 className="font-semibold text-gray-900 text-lg">
              {contactName}
            </h3>
            <p className="text-sm text-gray-500">{contactPhone}</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() =>
                selectedChatId && takeOverMutation.mutate(selectedChatId)
              }
              disabled={takeOverMutation.isPending}
              className="flex-1 px-3 py-2 bg-[#25D366] text-white rounded-lg text-sm font-medium hover:bg-[#128C7E] transition-colors disabled:opacity-60"
            >
              {takeOverMutation.isPending ? "Taking..." : "Take Over"}
            </button>
            <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              Assign
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags
          </h4>
          <div className="flex flex-wrap gap-2">
            {selectedContact?.tags?.length ? (
              selectedContact.tags.map((tag: any) => (
                <span
                  key={tag.id || tag.name}
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full"
                >
                  {tag.name}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">No tags.</p>
            )}
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Form Data
          </h4>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-gray-500 mb-1">Email</p>
              <p className="text-sm text-gray-900">
                {selectedContact?.email || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Company</p>
              <p className="text-sm text-gray-900">
                {selectedContact?.company || "-"}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Source</p>
              <p className="text-sm text-gray-900">
                {selectedContact?.source || "-"}
              </p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Suggestions
          </h4>
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              AI suggestions will appear after backend recommendations are
              available for this chat.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
