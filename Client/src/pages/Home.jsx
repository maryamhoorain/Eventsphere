import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Briefcase, CalendarDays, Camera, Globe, GraduationCap, HeartPulse, Monitor, Music, PenTool, ShieldCheck, Sparkles, Ticket } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { EventCard } from '../components/events/EventCard';
import { ClientOnly } from '../components/effects/ClientOnly';
import SpecularButton from '../components/effects/SpecularButton';
import { CATEGORIES } from '../data/seed';
import { endpoints } from '../api/client';
import { useSession } from '../store/session';

const ICONS = { Technology: Monitor, Healthcare: HeartPulse, Business: Briefcase, Education: GraduationCap, Design: PenTool, Science: Globe, Entertainment: Music, Media: Camera };

export default function Home() {
  const navigate = useNavigate();
  const user = useSession((state) => state.user);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const featuredEvent = events[0];
  useEffect(() => {
    endpoints.events.list().then(async (response) => {
      const rows = response?.events || [];
      setEvents(rows.filter((event) => event.status === 'published' || event.status === 'ongoing').slice(0, 6));
      const sessionRows = await Promise.all(rows.slice(0, 3).map((event) => endpoints.sessions.forEvent(event._id || event.id)
        .then((result) => (result?.sessions || []).map((session) => ({ ...session, event })))
        .catch(() => [])));
      setSessions(sessionRows.flat().slice(0, 3));
    }).catch(() => {
      setEvents([]);
      setSessions([]);
    });
  }, []);

  return (
    <PublicLayout>
      <section className="home-hero container">
        <div className="home-hero__copy">
          <div className="home-hero__eyebrow"><Sparkles size={14} /> Your next experience starts here</div>
          <h1>Find the events<br /><span>worth showing up for.</span></h1>
          <p>Discover inspiring expos, intimate workshops, and unforgettable sessions. Save your spot, meet your people, and make every event count.</p>
          <div className="home-hero__actions">
            <ClientOnly fallback={<Link to="/events" className="btn btn-primary">Explore Events</Link>}>
              <SpecularButton size="md" radius={16} textColor="#f8fafc" lineColor="#38BDF8" baseColor="#2563EB" followMouse onClick={() => navigate('/events')}>
                Explore events <ArrowRight size={16} />
              </SpecularButton>
            </ClientOnly>
            <Link to="/schedule" className="btn btn-ghost"><CalendarDays size={16} /> Browse sessions</Link>
          </div>
          <div className="home-hero__trust"><span className="home-hero__avatars"><b>J</b><b>M</b><b>A</b><b>+</b></span><span><strong>2,000+</strong> people are already discovering more</span></div>
          {user?.role === 'attendee' && (
            <div className="home-hero__role-actions">
              <Link to="/register/exhibitor" className="btn btn-primary btn-sm"><Briefcase size={15} /> Become an exhibitor</Link>
              <Link to="/register/organizer" className="btn btn-ghost btn-sm"><ShieldCheck size={15} /> Host an event</Link>
            </div>
          )}
        </div>
        <div className="home-hero__visual" aria-label="Featured event">
          <div className="home-hero__glow" />
          <div className="home-hero__ticket">
            <div className="home-hero__ticket-image" style={featuredEvent?.bannerImage ? { backgroundImage: `url(${featuredEvent.bannerImage})` } : undefined}>
              <span className="home-hero__live"><span /> Featured event</span>
            </div>
            <div className="home-hero__ticket-body">
              <span className="home-hero__category">{featuredEvent?.category || 'EventSphere experience'}</span>
              <h2>{featuredEvent?.title || 'Ideas, people, and experiences in one place.'}</h2>
              <div className="home-hero__ticket-meta"><span><CalendarDays size={14} /> {featuredEvent?.startDate ? new Date(featuredEvent.startDate).toLocaleDateString() : 'Coming soon'}</span><span><Ticket size={14} /> Reserve your spot</span></div>
              <Link to={featuredEvent ? `/events/${featuredEvent._id || featuredEvent.id}` : '/events'}>View event <ArrowRight size={15} /></Link>
            </div>
          </div>
          <div className="home-hero__float home-hero__float--one"><Sparkles size={15} /> New experiences weekly</div>
          <div className="home-hero__float home-hero__float--two"><span className="home-hero__pulse" /> Live events</div>
        </div>
      </section>

      <section className="container" style={{ position: 'relative', overflow: 'hidden', padding: '48px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, textAlign: 'center' }}>
        {[
          ['10k+', 'Total Events'],
          ['50+', 'Countries'],
          ['2k+', 'Organizations'],
          ['1M+', 'Attendees'],
        ].map(([v, l]) => (
          <div key={l} style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: '#fff' }}>{v}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>{l}</div>
          </div>
        ))}
      </section>

      <section className="container home-section" style={{ padding: '48px 16px' }}>
        <h2 className="home-section-reveal home-section-reveal__text">Upcoming expos</h2>
        <div className="grid-3">
          {events.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
        <div style={{ textAlign: 'center', marginTop: 32 }}>
          <Link to="/events" className="btn btn-primary">View all events</Link>
        </div>
      </section>

      <section className="container home-section" style={{ padding: '48px 16px' }}>
        <h2 className="home-section-reveal home-section-reveal__text">Explore by category</h2>
        <div className="grid-4">
          {CATEGORIES.map((c) => {
            const Icon = ICONS[c.name] || Globe;
            return (
              <ClientOnly
                key={c.name}
                fallback={
                  <button type="button" onClick={() => navigate(`/events?category=${encodeURIComponent(c.name)}`)} className="card" style={{ padding: 28, textAlign: 'center', color: '#fff', width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 18 }}>
                    <Icon size={28} style={{ color: 'var(--accent)', margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: 600, fontSize: 17 }}>{c.name}</div>
                    <div style={{ fontSize: 13, opacity: 0.5, marginTop: 6 }}>{c.count}</div>
                  </button>
                }
              >
                <SpecularButton
                  size="lg"
                  radius={18}
                  tint="#ffffff"
                  tintOpacity={0.04}
                  blur={8}
                  textColor="#f8fafc"
                  lineColor="#38BDF8"
                  baseColor="#2563EB"
                  intensity={1.15}
                  followMouse
                  proximity={280}
                  className="specular-button--card"
                  onClick={() => navigate(`/events?category=${encodeURIComponent(c.name)}`)}
                >
                  <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Icon size={28} style={{ color: 'var(--accent)' }} />
                    <span style={{ fontSize: 17, fontWeight: 600 }}>{c.name}</span>
                    <span style={{ fontSize: 13, opacity: 0.55 }}>{c.count}</span>
                  </span>
                </SpecularButton>
              </ClientOnly>
            );
          })}
        </div>
      </section>

      <section className="container home-section" style={{ padding: '48px 16px' }}>
        <h2 className="home-section-reveal home-section-reveal__text">Popular sessions</h2>
        <div className="grid-3">
          {sessions.map((s) => (
            <Link to={`/events/${s.event?._id || s.event?.id}`} key={s.id || s._id} className="card schedule-card info-card--centered" style={{ padding: 20 }}>
              <h3 style={{ margin: 0, color: '#fff', fontSize: 16 }}>{s.title}</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s.startTime} – {s.endTime} · {s.location}</p>
              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
                {s.speaker?.image && <img src={s.speaker.image} alt="" style={{ height: 32, width: 32, borderRadius: '50%' }} />}
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{s.speaker?.name}</span>
              </div>
              <span className="btn btn-primary btn-sm" style={{ marginTop: 14 }}>View & register</span>
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
