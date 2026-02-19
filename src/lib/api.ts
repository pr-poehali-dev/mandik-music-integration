const API = {
  auth: "https://functions.poehali.dev/4c4dac4f-f5b5-496c-8dfe-21ca3a65dae6",
  conversations: "https://functions.poehali.dev/215804d6-e146-4c33-ba3b-25745b204d8b",
  messages: "https://functions.poehali.dev/a61d9748-e077-4a86-b1f7-c4cd6d82be42",
};

export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_color: string;
  is_online?: boolean;
}

export interface Conversation {
  id: number;
  is_group: boolean;
  group_name: string | null;
  other_user: User | null;
  last_message: { text: string; sender_id: number; created_at: string } | null;
  unread_count: number;
}

export interface Message {
  id: number;
  text: string;
  sender_id: number;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_color?: string;
}

function getUser(): User | null {
  const raw = localStorage.getItem("bg_user");
  return raw ? JSON.parse(raw) : null;
}

function headers() {
  const user = getUser();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (user) h["X-User-Id"] = String(user.id);
  return h;
}

export async function register(username: string, display_name: string, password: string) {
  const res = await fetch(`${API.auth}?action=register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, display_name, password }),
  });
  return res.json();
}

export async function login(username: string, password: string) {
  const res = await fetch(`${API.auth}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
}

export async function getUsers(): Promise<{ users: User[] }> {
  const res = await fetch(`${API.auth}?action=users`, { headers: headers() });
  return res.json();
}

export async function getConversations(): Promise<{ conversations: Conversation[] }> {
  const res = await fetch(API.conversations, { headers: headers() });
  return res.json();
}

export async function startConversation(other_user_id: number) {
  const res = await fetch(`${API.conversations}?action=start`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ other_user_id }),
  });
  return res.json();
}

export async function getMessages(conversation_id: number): Promise<{ messages: Message[] }> {
  const res = await fetch(`${API.messages}?conversation_id=${conversation_id}`, {
    headers: headers(),
  });
  return res.json();
}

export async function sendMessage(conversation_id: number, text: string) {
  const res = await fetch(API.messages, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ conversation_id, text }),
  });
  return res.json();
}

export default API;
