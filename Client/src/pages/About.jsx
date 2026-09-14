import { Link } from 'react-router-dom';
import { BarChart3, Building2, CalendarDays, QrCode, Ticket, Users } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';

const CAPABILITIES = [
  { icon: Ticket, title: 'Event discovery & tickets', body: 'Browse published expos, register in a click, and check in with a QR ticket code at the door.' },
  { icon: Building2, title: 'Exhibitor booths', body: 'Brands apply to participate, get assigned a booth, and manage it for the length of the event.' },
  { icon: CalendarDays, title: 'Sessions & scheduling', body: 'Attendees register for individual talks and workshops alongside the main event.' },
  { icon: BarChart3, title: 'Live floor operations', body: 'Organizers get real-time dashboards for check-ins, booth visits, and attendance analytics.' },
];

const ROLES = [
  { icon: Users, title: 'Attendees', body: 'Discover events, register for sessions, favorite what matters, and rate the booths and talks you visit.' },
  { icon: Building2, title: 'Exhibitors', body: 'Apply to participate, manage your booth for each event, and see visits as they happen on the floor.' },
  { icon: QrCode, title: 'Organizers & admins', body: 'Publish events, approve exhibitors, run check-in at the door, and track it all from one console.' },
];

export default function About() {
  return (
    <PublicLayout>
      <section className="container about-page" style={{ position: 'relative', overflow: 'hidden', paddingTop: 112, paddingBottom: 32 }}>
        <div style={{ maxWidth: 640, position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-block', border: '1px solid rgba(56,189,248,0.3)', background: 'rgba(37,99,235,0.15)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}>About EventSphere</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.25rem, 6vw, 3.5rem)', lineHeight: 1.05, fontWeight: 800, color: '#fff', margin: 0 }}>
            One console for the whole expo floor.
          </h1>
          <p style={{ marginTop: 20, color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.6, maxWidth: 540 }}>
            EventSphere is a full-stack event management platform — discovery and registration for attendees, booths and applications for exhibitors, and floor operations for organizers, all in one place.
          </p>
        </div>
      </section>

      <section className="container about-page" style={{ paddingBottom: 48 }}>
        <div className="card" style={{ height: 320, overflow: 'hidden' }}>
          <img
            src="https://images.unsplash.com/photo-1560439514-4e9645039924?w=1600&q=80"
            alt="Attendees moving through a busy expo hall between exhibitor booths"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      </section>

      <section className="container about-page" style={{ padding: '16px 16px 48px' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: 28, color: '#fff', marginBottom: 32 }}>What EventSphere powers</h2>
        <div className="grid-4">
          {CAPABILITIES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="card info-card--centered" style={{ padding: 24 }}>
              <Icon size={26} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: '14px 0 0', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 16 }}>{title}</h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container about-page" style={{ padding: '16px 16px 48px' }}>
        <div className="about-page__roles" style={{ display: 'grid', gap: 32, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', alignItems: 'center' }}>
          <div className="card" style={{ height: 280, overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1762028892701-692dc360db08?w=1200&q=80"
              alt="An exhibitor presenting equipment at their trade show booth"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: '#fff', margin: 0 }}>Built for every role on the floor</h2>
            <p style={{ marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              Every account on EventSphere gets a dashboard shaped around what they actually need to do — no digging through settings built for someone else's job.
            </p>
            <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
              {ROLES.map(({ icon: Icon, title, body }) => (
                <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: 'rgba(37,99,235,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{title}</div>
                    <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.5, marginTop: 2 }}>{body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container about-page" style={{ padding: '16px 16px 64px' }}>
        <div className="card" style={{ padding: 32, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
          <div style={{ maxWidth: 480 }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 22, color: '#fff' }}>Ready to see it in action?</h2>
            <p style={{ margin: '8px 0 0', fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>
              Browse what's coming up, or create a free account to register, apply as an exhibitor, or start organizing.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/events" className="btn btn-primary">Browse events</Link>
            <Link to="/register" className="btn btn-ghost">Get started free</Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
