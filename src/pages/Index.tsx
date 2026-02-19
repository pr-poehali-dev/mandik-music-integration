import { useState, useEffect, useRef, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User, Conversation, Message } from "@/lib/api";
import * as api from "@/lib/api";

type Screen = "auth" | "chats" | "chat" | "users";

const Index = () => {
  const [screen, setScreen] = useState<Screen>("auth");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEnd = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("bg_user");
    if (raw) {
      const u = JSON.parse(raw);
      setUser(u);
      setScreen("chats");
    }
  }, []);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const data = await api.getConversations();
    if (data.conversations) setConversations(data.conversations);
  }, [user]);

  useEffect(() => {
    if (user && screen === "chats") {
      loadConversations();
      const interval = setInterval(loadConversations, 5000);
      return () => clearInterval(interval);
    }
  }, [user, screen, loadConversations]);

  const loadMessages = useCallback(async () => {
    if (!activeConv) return;
    const data = await api.getMessages(activeConv.id);
    if (data.messages) setMessages(data.messages);
  }, [activeConv]);

  useEffect(() => {
    if (activeConv && screen === "chat") {
      loadMessages();
      pollRef.current = setInterval(loadMessages, 3000);
      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [activeConv, screen, loadMessages]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleAuth = async () => {
    setError("");
    setLoading(true);
    let data;
    if (authMode === "register") {
      data = await api.register(username, displayName || username, password);
    } else {
      data = await api.login(username, password);
    }
    setLoading(false);
    if (data.error) {
      setError(data.error);
      return;
    }
    localStorage.setItem("bg_user", JSON.stringify(data.user));
    setUser(data.user);
    setScreen("chats");
  };

  const handleLogout = () => {
    localStorage.removeItem("bg_user");
    setUser(null);
    setScreen("auth");
    setConversations([]);
    setMessages([]);
    setActiveConv(null);
  };

  const openChat = async (conv: Conversation) => {
    setActiveConv(conv);
    setScreen("chat");
    const data = await api.getMessages(conv.id);
    if (data.messages) setMessages(data.messages);
  };

  const startChat = async (otherUser: User) => {
    setLoading(true);
    const data = await api.startConversation(otherUser.id);
    setLoading(false);
    if (data.conversation_id) {
      const conv: Conversation = {
        id: data.conversation_id,
        is_group: false,
        group_name: null,
        other_user: otherUser,
        last_message: null,
        unread_count: 0,
      };
      setActiveConv(conv);
      setScreen("chat");
      const msgs = await api.getMessages(data.conversation_id);
      if (msgs.messages) setMessages(msgs.messages);
    }
  };

  const handleSend = async () => {
    if (!newMsg.trim() || !activeConv) return;
    const text = newMsg.trim();
    setNewMsg("");
    const tempMsg: Message = {
      id: Date.now(),
      text,
      sender_id: user!.id,
      is_read: false,
      created_at: new Date().toISOString(),
      sender_name: user!.display_name,
      sender_color: user!.avatar_color,
    };
    setMessages((prev) => [...prev, tempMsg]);
    await api.sendMessage(activeConv.id, text);
  };

  const openUsers = async () => {
    setScreen("users");
    setLoading(true);
    const data = await api.getUsers();
    setLoading(false);
    if (data.users) setAllUsers(data.users.filter((u) => u.id !== user?.id));
  };

  const filteredUsers = allUsers.filter(
    (u) =>
      u.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  // AUTH SCREEN
  if (screen === "auth") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-cyan-950 flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-violet-500/10 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px]" />
        </div>
        <div className="relative w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-violet-500/20">
              <Icon name="MessageCircle" size={32} className="text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">БумагаGram</h1>
            <p className="text-slate-400 text-sm mt-1">Мессенджер нового поколения</p>
          </div>

          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 shadow-2xl">
            <div className="flex bg-slate-800/50 rounded-xl p-1 mb-6">
              <button
                onClick={() => { setAuthMode("login"); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${authMode === "login" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Вход
              </button>
              <button
                onClick={() => { setAuthMode("register"); setError(""); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${authMode === "register" ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-white"}`}
              >
                Регистрация
              </button>
            </div>

            <div className="space-y-4">
              <Input
                placeholder="Логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-11"
              />
              {authMode === "register" && (
                <Input
                  placeholder="Имя для отображения"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-11"
                />
              )}
              <Input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-11"
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <Button
                onClick={handleAuth}
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 text-white font-medium"
              >
                {loading ? (
                  <Icon name="Loader2" size={18} className="animate-spin" />
                ) : authMode === "login" ? "Войти" : "Создать аккаунт"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // USERS LIST SCREEN
  if (screen === "users") {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
          <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
            <button onClick={() => setScreen("chats")} className="p-2 -ml-2 hover:bg-slate-800 rounded-xl transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            <h2 className="font-semibold text-lg flex-1">Новый чат</h2>
          </div>
          <div className="max-w-lg mx-auto px-4 pb-3">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input
                placeholder="Поиск пользователей..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 pl-9 h-10"
              />
            </div>
          </div>
        </div>

        <div className="max-w-lg mx-auto">
          {loading ? (
            <div className="flex justify-center py-12">
              <Icon name="Loader2" size={24} className="animate-spin text-violet-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Icon name="UserX" size={40} className="mx-auto mb-3 opacity-50" />
              <p>Пользователи не найдены</p>
            </div>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => startChat(u)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 transition-colors border-b border-slate-800/50"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-semibold text-sm shrink-0"
                  style={{ backgroundColor: u.avatar_color }}
                >
                  {getInitials(u.display_name)}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-sm">{u.display_name}</p>
                  <p className="text-xs text-slate-500">@{u.username}</p>
                </div>
                {u.is_online && <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />}
              </button>
            ))
          )}
        </div>
      </div>
    );
  }

  // CHAT SCREEN
  if (screen === "chat" && activeConv) {
    const other = activeConv.other_user;
    return (
      <div className="h-screen bg-slate-950 text-white flex flex-col">
        <div className="bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 shrink-0">
          <div className="max-w-lg mx-auto flex items-center gap-3 px-4 py-3">
            <button onClick={() => { setScreen("chats"); loadConversations(); }} className="p-2 -ml-2 hover:bg-slate-800 rounded-xl transition-colors">
              <Icon name="ArrowLeft" size={20} />
            </button>
            {other && (
              <>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-xs shrink-0 relative"
                  style={{ backgroundColor: other.avatar_color }}
                >
                  {getInitials(other.display_name)}
                  {other.is_online && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{other.display_name}</p>
                  <p className="text-xs text-slate-500">{other.is_online ? "онлайн" : "был(а) недавно"}</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600">
              <Icon name="MessageCircle" size={48} className="mb-3 opacity-30" />
              <p className="text-sm">Начните общение!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${
                        isMine
                          ? "bg-violet-600 text-white rounded-br-md"
                          : "bg-slate-800 text-slate-100 rounded-bl-md"
                      }`}
                    >
                      <p className="break-words">{msg.text}</p>
                      <p className={`text-[10px] mt-1 ${isMine ? "text-violet-300" : "text-slate-500"} text-right`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEnd} />
            </div>
          )}
        </div>

        <div className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 shrink-0">
          <div className="max-w-lg mx-auto flex items-center gap-2 px-4 py-3">
            <Input
              placeholder="Сообщение..."
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 flex-1 h-10"
            />
            <Button
              onClick={handleSend}
              disabled={!newMsg.trim()}
              size="icon"
              className="bg-violet-600 hover:bg-violet-500 h-10 w-10 shrink-0"
            >
              <Icon name="Send" size={18} />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // CHATS LIST SCREEN
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Icon name="MessageCircle" size={16} className="text-white" />
            </div>
            <h1 className="font-bold text-lg">БумагаGram</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={openUsers} className="p-2 hover:bg-slate-800 rounded-xl transition-colors" title="Новый чат">
              <Icon name="PenSquare" size={20} />
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded-xl transition-colors text-slate-400" title="Выход">
              <Icon name="LogOut" size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {user && (
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-800/50">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
              style={{ backgroundColor: user.avatar_color }}
            >
              {getInitials(user.display_name)}
            </div>
            <div>
              <p className="font-medium text-sm">{user.display_name}</p>
              <p className="text-xs text-slate-500">@{user.username}</p>
            </div>
          </div>
        )}

        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-600">
            <Icon name="MessagesSquare" size={48} className="mb-3 opacity-30" />
            <p className="text-sm mb-4">Пока нет диалогов</p>
            <Button onClick={openUsers} variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              <Icon name="Plus" size={16} />
              <span className="ml-2">Начать чат</span>
            </Button>
          </div>
        ) : (
          conversations.map((conv) => {
            const other = conv.other_user;
            if (!other) return null;
            return (
              <button
                key={conv.id}
                onClick={() => openChat(conv)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-900/50 transition-colors border-b border-slate-800/50"
              >
                <div className="relative shrink-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                    style={{ backgroundColor: other.avatar_color }}
                  >
                    {getInitials(other.display_name)}
                  </div>
                  {other.is_online && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-950" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{other.display_name}</p>
                    {conv.last_message && (
                      <span className="text-[11px] text-slate-500 shrink-0 ml-2">
                        {formatTime(conv.last_message.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-500 truncate">
                      {conv.last_message
                        ? conv.last_message.sender_id === user?.id
                          ? `Вы: ${conv.last_message.text}`
                          : conv.last_message.text
                        : "Нет сообщений"}
                    </p>
                    {conv.unread_count > 0 && (
                      <span className="ml-2 shrink-0 bg-violet-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Index;
