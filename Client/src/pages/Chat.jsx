import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { AudioLines, ImagePlus, LoaderCircle, MessageCircle, Paperclip, Send, Smile, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker from 'emoji-picker-react';
import { endpoints, getToken } from '../api/client';
import { useSession } from '../store/session';
import { PublicLayout } from '../components/layout/PublicLayout';

const API_ROOT = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/api\/?$/, '');

function emojiFromPicker(data) {
  if (data?.emoji) return data.emoji;
  if (!data?.unified) return '';
  return data.unified.split('-').map((codePoint) => String.fromCodePoint(parseInt(codePoint, 16))).join('');
}

export default function Chat() {
  const user = useSession((s) => s.user);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [preview, setPreview] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [showContacts, setShowContacts] = useState(false);
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const fileRef = useRef(null);
  const audioRef = useRef(null);

  const canChat = user && ['admin', 'organizer', 'exhibitor', 'attendee'].includes(user.role);
  const selectedId = selected?._id || selected?.id;
  const other = useMemo(() => selected?.participants?.find((p) => String(p._id) !== String(user?.id)), [selected, user]);

  useEffect(() => {
    if (!canChat) { setLoading(false); return undefined; }
    let active = true;
    Promise.all([endpoints.chat.conversations(), endpoints.chat.contacts()]).then(([conversationResponse, contactsResponse]) => {
      if (active) {
        setConversations(conversationResponse?.data || []);
        setContacts(contactsResponse?.contacts || []);
      }
    }).catch((error) => toast.error(error.message)).finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [canChat]);

  async function startConversation(contact) {
    try {
      const response = await endpoints.chat.createConversation(contact._id);
      const conversation = response?.conversation;
      if (!conversation) throw new Error('The conversation could not be created.');
      setConversations((items) => items.some((item) => item._id === conversation._id) ? items : [conversation, ...items]);
      setSelected(conversation);
      setShowContacts(false);
    } catch (error) {
      toast.error(error.message);
    }
  }

  useEffect(() => {
    if (!canChat || !selectedId) return undefined;
    let active = true;
    setMessagesLoading(true);
    endpoints.chat.messages(selectedId).then((response) => {
      if (active) setMessages(response?.messages || []);
    }).catch((error) => toast.error(error.message)).finally(() => active && setMessagesLoading(false));
    const socket = io(API_ROOT, { auth: { token: getToken() } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_conversation', selectedId));
    socket.on('new_message', (message) => {
      if (String(message.conversation) === String(selectedId)) setMessages((items) => items.some((item) => item._id === message._id) ? items : [...items, message]);
    });
    socket.on('message_edited', (message) => setMessages((items) => items.map((item) => item._id === message._id ? message : item)));
    socket.on('message_deleted', (message) => setMessages((items) => items.map((item) => item._id === message._id ? { ...item, ...message } : item)));
    socket.on('user_typing', (event) => { if (String(event.conversationId) === String(selectedId)) setTyping(event.isTyping); });
    socket.on('chat_error', (event) => toast.error(event.message));
    socket.on('message_error', (event) => {
      setSending(false);
      toast.error(event.message || 'Unable to send message.');
    });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [canChat, selectedId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  async function sendText(e) {
    e.preventDefault();
    const text = value.trim();
    if ((!text && !preview) || !selectedId || sending) return;
    if (preview) await upload(preview.file, preview.type);
    if (!text) return;
    const socket = socketRef.current;
    if (!socket?.connected) { toast.error('Chat connection is unavailable.'); return; }
    setSending(true);
    socket.emit('send_message', { conversationId: selectedId, text });
    setValue('');
    setSending(false);
  }

  function updateTyping(text) {
    setValue(text);
    if (selectedId && socketRef.current?.connected) {
      socketRef.current.emit(text.trim() ? 'typing_start' : 'typing_stop', { conversationId: selectedId });
    }
  }

  async function upload(file, type) {
    if (!file || !selectedId) return;
    setSending(true);
    try {
      const response = type === 'image'
        ? await endpoints.chat.sendImage(selectedId, file)
        : await endpoints.chat.sendAudio(selectedId, file);
      const message = response?.data;
      if (message) setMessages((items) => items.some((item) => item._id === message._id) ? items : [...items, message]);
      setPreview(null);
    } catch (error) { toast.error(error.message); }
    finally { setSending(false); }
  }

  if (!user) return <PublicLayout><div className="chat-gate"><MessageCircle size={42} /><h1>Sign in to open chat</h1><p>Sign in to message the EventSphere team.</p></div></PublicLayout>;
  if (!canChat) return <PublicLayout><div className="chat-gate"><MessageCircle size={42} /><h1>Chat access is restricted</h1><p>Your account is not enabled for conversations.</p></div></PublicLayout>;

  return (
    <PublicLayout>
      <div className="chat-page">
        <aside className="chat-list">
          <div className="chat-list__header"><div><span>Messages</span><small>{conversations.length} conversations</small></div><button type="button" className="chat-new-button" onClick={() => setShowContacts((value) => !value)} aria-label="New conversation"><UserPlus size={18} /></button></div>
          {showContacts && <div className="chat-contacts">{contacts.length ? contacts.map((contact) => <button type="button" key={contact._id} onClick={() => startConversation(contact)}><span className="chat-avatar">{contact.name?.[0] || '?'}</span><span><strong>{contact.name}</strong><small>{contact.role}</small></span></button>) : <small>No available contacts.</small>}</div>}
          {loading && <LoaderCircle className="spin" />}
          {!loading && !conversations.length && <div className="chat-list__empty">No conversations yet.</div>}
          {conversations.map((conversation) => {
            const id = conversation._id;
            const participant = conversation.participants?.find((p) => String(p._id) !== String(user.id));
            return <button type="button" className={`chat-conversation${id === selectedId ? ' is-active' : ''}`} key={id} onClick={() => setSelected(conversation)}>
              <span className="chat-avatar">{participant?.name?.[0] || '?'}</span><span><strong>{participant?.name || 'Conversation'}</strong><small>{conversation.lastMessage?.text || 'Start a conversation'}</small></span>
              {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
            </button>;
          })}
        </aside>
        <section className="chat-window">
          {!selected ? <div className="chat-window__empty"><MessageCircle size={42} /><h2>Select a conversation</h2><p>Your authorized conversations will appear here.</p></div> : <>
            <header className="chat-header"><span className="chat-avatar">{other?.name?.[0] || '?'}</span><div><strong>{other?.name || 'Conversation'}</strong><small>{other?.role || 'Participant'}</small></div><span className="chat-online">Secure chat</span></header>
            <div className="chat-messages">
              {messagesLoading && <LoaderCircle className="spin" />}
              {!messagesLoading && !messages.length && <div className="chat-window__empty"><MessageCircle size={32} /><span>No messages yet. Say hello.</span></div>}
              {messages.map((message) => {
                const own = String(message.sender?._id || message.sender) === String(user.id);
                return <div className={`chat-message ${own ? 'is-own' : ''}`} key={message._id}>
                  <div className="chat-bubble">
                    {message.isDeleted ? <em>Message deleted</em> : message.messageType === 'image' ? <button className="chat-image-button" type="button" onClick={() => setLightbox(message.fileUrl)}><img src={message.fileUrl} alt="Attached image" /></button> : message.messageType === 'audio' ? <audio controls src={message.fileUrl} /> : <span>{message.text}</span>}
                    {!message.isDeleted && message.isEdited && <small>edited</small>}
                  </div>
                  <time>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</time>
                </div>;
              })}
              {typing && <div className="chat-typing">Typing…</div>}<div ref={endRef} />
            </div>
            <div className="chat-composer-wrap">
              {showEmojis && <div className="emoji-picker" role="dialog" aria-label="Emoji picker">
                <EmojiPicker onEmojiClick={(emojiData) => {
                  setValue((text) => `${text}${emojiFromPicker(emojiData)}`);
                  setShowEmojis(false);
                }} width="100%" height={360} previewConfig={{ showPreview: false }} />
              </div>}
              {preview && <div className="chat-preview">{preview.type === 'image' ? <img src={preview.url} alt="Preview" /> : <AudioLines size={18} />}<span>{preview.file.name}</span><button type="button" onClick={() => setPreview(null)}><X size={15} /></button></div>}
              <form className="chat-composer" onSubmit={sendText}>
                <button type="button" aria-label="Emoji" onClick={() => setShowEmojis((value) => !value)}><Smile size={19} /></button>
                <button type="button" aria-label="Attach image" onClick={() => { fileRef.current.accept = 'image/jpeg,image/png,image/webp,image/gif'; fileRef.current.click(); }}><ImagePlus size={19} /></button>
                <button type="button" aria-label="Attach audio" onClick={() => { audioRef.current.click(); }}><Paperclip size={19} /></button>
                <input value={value} onChange={(e) => updateTyping(e.target.value)} placeholder="Write a message…" />
                <button className="chat-send" type="submit" disabled={(!value.trim() && !preview) || sending}><Send size={17} /></button>
              </form>
              <input ref={fileRef} hidden type="file" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPreview({ type: 'image', file, url: URL.createObjectURL(file) }); e.target.value = ''; }} />
              <input ref={audioRef} hidden type="file" accept="audio/mpeg,audio/wav,audio/ogg,audio/webm,audio/mp4,audio/aac" onChange={(e) => { const file = e.target.files?.[0]; if (file) setPreview({ type: 'audio', file }); e.target.value = ''; }} />
            </div>
          </>}
        </section>
      </div>
      {lightbox && <button className="chat-lightbox" type="button" onClick={() => setLightbox(null)}><img src={lightbox} alt="Full-size attachment" /></button>}
    </PublicLayout>
  );
}
