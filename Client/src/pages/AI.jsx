import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { endpoints } from '../api/client';
import { useSession } from '../store/session';
import { PublicLayout } from '../components/layout/PublicLayout';

export default function AI() {
  const user = useSession((s) => s.user);
  const [messages, setMessages] = useState([]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function submit(e) {
    e.preventDefault();
    const text = value.trim();
    if (!text || loading) return;
    if (!user) { toast.error('Please log in to use the assistant.'); return; }
    setValue('');
    setMessages((items) => [...items, { id: `u-${Date.now()}`, role: 'user', text }]);
    setLoading(true);
    try {
      const response = await endpoints.ai.chat(text);
      const answer = response?.data?.answer;
      if (!answer) throw new Error('The assistant returned an empty response.');
      setMessages((items) => [...items, { id: `a-${Date.now()}`, role: 'assistant', text: answer }]);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="ai-page">
        <section className="ai-card">
          <header className="ai-header">
            <div className="ai-icon"><Sparkles size={22} /></div>
            <div><h1>EventSphere Assistant</h1><p>Ask about events, sessions, registrations, and your EventSphere experience.</p></div>
          </header>
          <div className="ai-messages" aria-live="polite">
            {!messages.length && <div className="ai-empty"><Bot size={40} /><strong>How can I help?</strong><span>Sign in and ask a question to get a server-powered answer.</span></div>}
            {messages.map((message) => (
              <div className={`ai-message ai-message--${message.role}`} key={message.id}>
                <div className="ai-avatar">{message.role === 'assistant' ? <Bot size={16} /> : (user?.name?.[0] || 'Y')}</div>
                <div className="ai-bubble">{message.text}</div>
              </div>
            ))}
            {loading && <div className="ai-message ai-message--assistant"><div className="ai-avatar"><Bot size={16} /></div><div className="ai-bubble ai-typing"><i /><i /><i /></div></div>}
            <div ref={endRef} />
          </div>
          <form className="ai-composer" onSubmit={submit}>
            <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="Ask the EventSphere Assistant…" aria-label="Message assistant" />
            <button className="btn btn-primary" type="submit" disabled={loading || !value.trim()}><Send size={16} /> Send</button>
          </form>
        </section>
      </div>
    </PublicLayout>
  );
}
