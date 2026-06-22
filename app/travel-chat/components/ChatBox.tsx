'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ChatBox({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [selectedMedia, setSelectedMedia] = useState<{ url: string, type: string, name: string } | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user));
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select(`*`)
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel('realtime:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` }, 
      (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [roomId]);

  // Logic for Displaying Name
  const getDisplayName = (m: any) => {
    if (m.user_id === currentUser?.id) return "You";
    return m.sender_name || 'User';
  };

  // Logic for Timestamp: "Today 12:51 pm" / "22 Jun 12:01 am"
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateLabel = isToday ? "Today" : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    
    return `${dateLabel} ${time}`;
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    const content = newMessage;
    const sender_name = currentUser.user_metadata?.full_name || 'User';
    setNewMessage('');
    await supabase.from('messages').insert([{ 
      room_id: roomId, 
      user_id: currentUser.id, 
      content, 
      sender_name 
    }]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    const filePath = `${roomId}/${Date.now()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from('chat-media').upload(filePath, file);

    if (!uploadError) {
      await supabase.from('messages').insert([{ 
        room_id: roomId, user_id: currentUser.id, content: file.name, 
        file_path: filePath, file_type: file.type.startsWith('image') ? 'image' : 'video',
        sender_name: currentUser.user_metadata?.full_name || 'User'
      }]);
    }
  };

  const downloadFile = async (url: string, fileName: string) => {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="flex flex-col h-[400px] border rounded-lg p-4 bg-gray-50 relative">
      <div ref={scrollRef} className="flex-grow overflow-y-auto mb-4 space-y-4">
        {messages.map((m) => (
          <div key={m.id} className={`flex flex-col ${m.user_id === currentUser?.id ? 'items-end' : 'items-start'}`}>
            <div className="flex items-baseline gap-2 px-1">
              <span className="text-[10px] text-gray-500 font-bold">{getDisplayName(m)}</span>
              <span className="text-[9px] text-gray-400">{m.created_at ? formatDateTime(m.created_at) : 'Just now'}</span>
            </div>
            
            <div className={`p-3 rounded-2xl shadow-sm text-sm max-w-[80%] cursor-pointer ${m.user_id === currentUser?.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'}`}>
              {m.file_path ? (
                // ... (existing media rendering)
                m.file_type === 'image' ? (
                  <img src={signedUrls[m.id]} className="max-w-xs rounded" onClick={() => setSelectedMedia({ url: signedUrls[m.id], type: 'image', name: m.content })} />
                ) : (
                  <video src={signedUrls[m.id]} className="max-w-xs rounded" onClick={() => setSelectedMedia({ url: signedUrls[m.id], type: 'video', name: m.content })} />
                )
              ) : <p>{m.content}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ... (rest of the file remains the same) */}
      <div className="flex gap-2">
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-500">📎</button>
        <input className="flex-grow p-2 border rounded-full px-4" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." />
        <button onClick={sendMessage} className="bg-blue-600 text-white px-4 py-2 rounded-full">Send</button>
      </div>
    </div>
  );
}