import { useEffect, useState } from 'react';
import { endpoints } from '../../api/client';

export default function Notifications() {
  const [list, setList] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    endpoints.notifications.list().then((data) => setList(data.notifications || data || [])).catch((e) => setError(e.message));
  }, []);
  const markNotifRead = async (id) => {
    await endpoints.notifications.read(id);
    setList((items) => items.map((item) => (item._id === id || item.id === id ? { ...item, isRead: true } : item)));
  };
  const markAllRead = async () => { await endpoints.notifications.readAll(); setList((items) => items.map((item) => ({ ...item, isRead: true }))); };
  const deleteNotif = async (id) => { await endpoints.notifications.remove(id); setList((items) => items.filter((item) => item._id !== id && item.id !== id)); };
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Notifications</h1>
        <button type="button" style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontWeight: 600 }} onClick={markAllRead}>Mark all read</button>
      </div>
      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}
      <div className="panel" style={{ marginTop: 16 }}>
        {list.map((n) => (
          <div key={n._id || n.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }} onClick={() => markNotifRead(n._id || n.id)}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{n.title}</strong>
              <button type="button" style={{ background: 'none', border: 'none', color: 'var(--error)', fontSize: 12 }} onClick={(e) => { e.stopPropagation(); deleteNotif(n._id || n.id); }}>Delete</button>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--muted)', fontSize: 13 }}>{n.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
