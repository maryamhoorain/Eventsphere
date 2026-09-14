import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { EventCard } from '../components/events/EventCard';
import { ClientOnly } from '../components/effects/ClientOnly';
import SpecularButton from '../components/effects/SpecularButton';
import { endpoints } from '../api/client';
import { CATEGORIES } from '../data/seed';

export default function Events() {
  const [params] = useSearchParams();
  const searchQuery = params.get('q') || '';
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const query = searchQuery ? `?search=${encodeURIComponent(searchQuery)}&limit=50` : '?limit=50';
    endpoints.events.list(query).then((response) => setEvents(response?.events || []))
      .catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, [searchQuery]);
  const [q, setQ] = useState(searchQuery);
  const [cat, setCat] = useState(params.get('category') || 'All');
  useEffect(() => { setQ(searchQuery); }, [searchQuery]);
  const published = events.filter((e) => e.status === 'published' || e.status === 'ongoing');
  const liveCategories = published
    .map((event) => String(event.category || '').trim())
    .filter(Boolean);
  const cats = ['All', ...Array.from(new Set([
    ...CATEGORIES.map((category) => category.name),
    ...liveCategories,
  ])).sort((a, b) => a.localeCompare(b))];
  const filtered = useMemo(() => {
    return published.filter((e) => {
      const tags = Array.isArray(e.tags) ? e.tags.join(' ') : (e.tags || '');
      const hay = `${e.title || ''} ${e.category || ''} ${tags} ${e.location?.city || ''} ${e.location?.country || ''}`.toLowerCase();
      const okQ = !q.trim() || hay.includes(q.trim().toLowerCase());
      const okC = cat === 'All' || e.category === cat;
      return okQ && okC;
    });
  }, [published, q, cat]);

  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 112, paddingBottom: 64 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#fff', margin: 0 }}>Explore events</h1>
        <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 8 }}>Published expos from EventSphere.</p>
        <input className="input" style={{ display: 'block', width: 'min(100%, 480px)', boxSizing: 'border-box', marginTop: 24 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, city, topic or tag…" />
        <div
          className="event-category-filter"
          style={{
            marginTop: 16,
            display: 'inline-flex',
            width: 'fit-content',
            maxWidth: '100%',
            flexWrap: 'nowrap',
            gap: 6,
            padding: 6,
            boxSizing: 'border-box',
            borderRadius: 999,
            background: 'rgba(15,23,42,0.55)',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            overflowX: 'auto',
            overflowY: 'hidden',
          }}
        >
          {cats.map((c) => (
            <ClientOnly
              key={c}
              fallback={
                <button
                  type="button"
                  onClick={() => setCat(c)}
                  className="btn btn-sm"
                  style={{
                    borderRadius: 999,
                    background: cat === c ? 'linear-gradient(135deg,#2563eb,#1d4ed8)' : 'transparent',
                    border: cat === c ? '1px solid rgba(56,189,248,0.4)' : '1px solid transparent',
                    color: cat === c ? '#fff' : 'rgba(255,255,255,0.7)',
                    flex: '0 0 auto',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c}
                </button>
              }
            >
              <SpecularButton
                size="sm"
                radius={999}
                tint={cat === c ? '#2563eb' : '#ffffff'}
                tintOpacity={cat === c ? 0.5 : 0}
                textColor={cat === c ? '#fff' : 'rgba(255,255,255,0.7)'}
                lineColor={cat === c ? '#38BDF8' : 'rgba(255,255,255,0.6)'}
                baseColor={cat === c ? '#38BDF8' : '#525252'}
                intensity={cat === c ? 1 : 0.8}
                followMouse
                proximity={140}
                className="specular-button--chip"
                onClick={() => setCat(c)}
              >
                {c}
              </SpecularButton>
            </ClientOnly>
          ))}
        </div>
        {loading && <p style={{ color: 'rgba(255,255,255,0.55)' }}>Loading events…</p>}
        {error && <p style={{ color: '#fb7185' }}>{error}</p>}
        {!loading && !error && !filtered.length && <p style={{ color: 'rgba(255,255,255,0.55)' }}>No events are available.</p>}
        <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{filtered.length} events</p>
        <div className="grid-3" style={{ marginTop: 16 }}>
          {filtered.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      </div>
    </PublicLayout>
  );
}
