import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { ImagePlus, LoaderCircle, MessageCircle, Mic, Send, Smile, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import EmojiPicker from 'emoji-picker-react';
import { endpoints, getToken } from '../../api/client';
import { useSession } from '../../store/session';

const API_ROOT = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/api\/?$/, '');
const CHAT_ROLES = ['admin', 'organizer', 'exhibitor', 'attendee'];

function emojiFromPicker(data) {
  if (data?.emoji) return data.emoji;
  if (!data?.unified) return '';
  return data.unified.split('-').map((codePoint) => String.fromCodePoint(parseInt(codePoint, 16))).join('');
}

export function AssistantWidget() {
  const user = useSession((s) => s.user);
  const [open, setOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [preview, setPreview] = useState(null);
  const socketRef = useRef(null);
  const endRef = useRef(null);
  const imageRef = useRef(null);
  const audioRef = useRef(null);
  const selectedId = selected?._id || selected?.id;
  const canChat = Boolean(user && CHAT_ROLES.includes(user.role));

  useEffect(() => {
    if (!open || !canChat) return undefined;
    let active = true;
    setLoading(true);
    Promise.all([endpoints.chat.conversations(), endpoints.chat.contacts()])
      .then(([conversationResponse, contactsResponse]) => {
        if (!active) return;
        setConversations(conversationResponse?.data || []);
        setContacts(contactsResponse?.contacts || []);
      })
      .catch((error) => toast.error(error.message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, canChat]);

  useEffect(() => {
    if (!open || !selectedId) return undefined;
    let active = true;
    setMessagesLoading(true);
    endpoints.chat.messages(selectedId)
      .then((response) => active && setMessages(response?.messages || []))
      .catch((error) => toast.error(error.message))
      .finally(() => active && setMessagesLoading(false));

    const socket = io(API_ROOT, { auth: { token: getToken() } });
    socketRef.current = socket;
    socket.on('connect', () => socket.emit('join_conversation', selectedId));
    socket.on('new_message', (message) => {
      if (String(message.conversation) === String(selectedId)) {
        setMessages((items) => items.some((item) => item._id === message._id) ? items : [...items, message]);
      }
    });
    socket.on('chat_error', (event) => toast.error(event.message));
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [open, selectedId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function startConversation(contact) {
    try {
      const response = await endpoints.chat.createConversation(contact._id);
      if (!response?.conversation) throw new Error('The conversation could not be created.');
      setConversations((items) => items.some((item) => item._id === response.conversation._id) ? items : [response.conversation, ...items]);
      setSelected(response.conversation);
      setShowContacts(false);
    } catch (error) { toast.error(error.message); }
  }

  async function upload(file, type) {
    if (!file || !selectedId) return;
    setSending(true);
    try {
      const response = type === 'image'
        ? await endpoints.chat.sendImage(selectedId, file)
        : await endpoints.chat.sendAudio(selectedId, file);
      if (response?.data) setMessages((items) => items.some((item) => item._id === response.data._id) ? items : [...items, response.data]);
      setPreview(null);
    } catch (error) { toast.error(error.message); }
    finally { setSending(false); }
  }

  async function submit(event) {
    event.preventDefault();
    const text = value.trim();
    if (preview) await upload(preview.file, preview.type);
    if (!text || !selectedId || sending) return;
    if (!socketRef.current?.connected) { toast.error('Chat connection is unavailable.'); return; }
    setSending(true);
    socketRef.current.emit('send_message', { conversationId: selectedId, text });
    setValue('');
    setSending(false);
  }

  if (!canChat) return null;

  return (
    <>
      <button type="button" className="assistant-fab" onClick={() => setOpen(true)} aria-label="Open conversations"><MessageCircle size={24} /></button>
      {open && (
        <div className="assistant-modal assistant-chat-modal" role="dialog" aria-modal="true" aria-label="Conversations">
          <div className="assistant-modal__header">
            <span><MessageCircle size={18} /> Conversations</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button>
          </div>
          {!selected ? (
            <div className="assistant-chat-list">
              <button type="button" className="assistant-new-chat" onClick={() => setShowContacts((current) => !current)}><UserPlus size={16} /> New conversation</button>
              {showContacts && <div className="assistant-contacts">{contacts.map((contact) => <button type="button" key={contact._id} onClick={() => startConversation(contact)}><span className="chat-avatar">{contact.name?.[0] || '?'}</span><span><strong>{contact.name}</strong><small>{contact.role}</small></span></button>)}</div>}
              {loading && <LoaderCircle className="spin" />}
              {!loading && !conversations.length && <div className="assistant-modal__empty"><MessageCircle size={30} /><span>No conversations yet.</span></div>}
              {conversations.map((conversation) => {
                const participant = conversation.participants?.find((item) => String(item._id) !== String(user.id));
                return <button type="button" className="assistant-conversation" key={conversation._id} onClick={() => setSelected(conversation)}><span className="chat-avatar">{participant?.name?.[0] || '?'}</span><span><strong>{participant?.name || 'Conversation'}</strong><small>{conversation.lastMessage?.text || 'Start a conversation'}</small></span></button>;
              })}
            </div>
          ) : (
            <>
              <div className="assistant-chat-peer"><button type="button" onClick={() => setSelected(null)} aria-label="Back to conversations">‹</button><strong>{selected.participants?.find((item) => String(item._id) !== String(user.id))?.name || 'Conversation'}</strong></div>
              <div className="assistant-modal__messages">
                {messagesLoading && <LoaderCircle className="spin" />}
                {!messagesLoading && !messages.length && <div className="assistant-modal__empty"><MessageCircle size={30} /><span>No messages yet. Say hello.</span></div>}
                {messages.map((message) => {
                  const own = String(message.sender?._id || message.sender) === String(user.id);
                  return <div className={`assistant-modal__message ${own ? 'user' : 'assistant'}`} key={message._id}>{message.messageType === 'image' ? <img className="assistant-chat-image" src={message.fileUrl} alt="Attached" /> : message.messageType === 'audio' ? <audio controls src={message.fileUrl} /> : <span>{message.text}</span>}</div>;
                })}
                <div ref={endRef} />
              </div>
              <form className="assistant-modal__composer" onSubmit={submit}>
                {showEmojis && <div className="assistant-emoji-picker"><EmojiPicker onEmojiClick={(emojiData) => { setValue((current) => `${current}${emojiFromPicker(emojiData)}`); setShowEmojis(false); }} width="100%" height={330} searchDisabled={false} previewConfig={{ showPreview: false }} /></div>}
                {preview && <div className="assistant-preview"><span>{preview.file.name}</span><button type="button" onClick={() => setPreview(null)} aria-label="Remove attachment"><X size={14} /></button></div>}
                <div className="assistant-modal__tools">
                  <button type="button" aria-label="Emoji" onClick={() => setShowEmojis((current) => !current)}><Smile size={16} /></button>
                  <button type="button" aria-label="Attach image" onClick={() => imageRef.current.click()}><ImagePlus size={16} /></button>
                  <button type="button" aria-label="Attach voice" onClick={() => audioRef.current.click()}><Mic size={16} /></button>
                </div>
                <input value={value} onChange={(event) => setValue(event.target.value)} placeholder="Write a message…" aria-label="Message" />
                <button className="btn btn-primary btn-sm" type="submit" disabled={sending || (!value.trim() && !preview)}><Send size={15} /></button>
                <input ref={imageRef} hidden type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview({ file, type: 'image' }); event.target.value = ''; }} />
                <input ref={audioRef} hidden type="file" accept="audio/*" onChange={(event) => { const file = event.target.files?.[0]; if (file) setPreview({ file, type: 'audio' }); event.target.value = ''; }} />
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
