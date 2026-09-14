import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CalendarCheck2, MessageSquareText, Send, Star, X } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { useSession } from '../store/session';
import { endpoints } from '../api/client';

const FEEDBACK_TYPE_OPTIONS = [
  { value: 'website', label: 'Website' },
  { value: 'event', label: 'Event' },
  { value: 'session', label: 'Session' },
  { value: 'booth', label: 'Booth' },
];

const BOOTH_REASONS = {
  poor_interaction: 'Poor interaction',
  staff_unavailable: 'Staff unavailable',
  unclear_information: 'Unclear information',
  poor_booth_setup: 'Poor booth setup',
  product_or_service_issue: 'Product/service issue',
  other: 'Other',
};

const SESSION_REASONS = {
  poor_content: 'Poor content',
  speaker_issue: 'Speaker issue',
  too_long: 'Too long',
  too_short: 'Too short',
  technical_issue: 'Technical issue',
  topic_not_as_expected: 'Topic not as expected',
  other: 'Other',
};

const reasonOptions = {
  booth: BOOTH_REASONS,
  session: SESSION_REASONS,
};

const emptyForm = {
  feedbackType: 'website',
  eventId: '',
  sessionId: '',
  boothVisitId: '',
  rating: 5,
  reason: '',
  reasonDetails: '',
  comment: '',
};

const starLabels = ['', 'Very poor', 'Poor', 'Okay', 'Good', 'Excellent'];

export default function Feedback() {
  const user = useSession((s) => s.user);
  const [rows, setRows] = useState([]);
  const [publicRows, setPublicRows] = useState([]);
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [boothVisits, setBoothVisits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const fetchFeedback = async () => {
    if (!user) {
      setRows([]);
      setEvents([]);
      setSessions([]);
      setBoothVisits([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [feedbackRes, eventRes, sessionRes, boothRes] = await Promise.all([
        endpoints.feedback.mine(),
        endpoints.registrations.mine(),
        endpoints.sessionRegistrations.mine(),
        endpoints.boothVisits.mine(),
      ]);

      const attendedEvents = (eventRes?.registrations || [])
        .filter((registration) => registration?.status === 'attended')
        .map((registration) => registration.event)
        .filter(Boolean)
        .filter((event, index, all) => (event._id || event.id) && all.findIndex((item) => (item._id || item.id) === (event._id || event.id)) === index);

      const attendedSessions = (sessionRes?.registrations || [])
        .filter((registration) => registration?.status === 'attended')
        .map((registration) => ({
          ...(registration.session || {}),
          event: registration.event || registration.session?.event,
        }))
        .filter((session) => session?._id || session?.id)
        .filter((session, index, all) => (session._id || session.id) && all.findIndex((item) => (item._id || item.id) === (session._id || session.id)) === index);

      setRows(feedbackRes?.feedback || []);
      setEvents(attendedEvents);
      setSessions(attendedSessions);
      setBoothVisits((boothRes?.visits || [])
        .filter((visit) => visit?._id && visit.booth && visit.event)
        .filter((visit, index, all) => all.findIndex((item) => item._id === visit._id) === index));
    } catch (err) {
      setError(err.message || 'Unable to load your feedback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    endpoints.feedback.public()
      .then((response) => setPublicRows(response?.feedback || []))
      .catch(() => setPublicRows([]));
    fetchFeedback();
  }, [user?.id]);

  const resetModal = () => {
    setForm(emptyForm);
    setValidationError('');
    setShowModal(false);
  };

  const openModal = () => {
    setValidationError('');
    setShowModal(true);
  };

  const canRequireReason = form.feedbackType === 'booth' || form.feedbackType === 'session';
  const requiresReason = canRequireReason && form.rating > 0 && form.rating < 3;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!user) {
      setValidationError('You must sign in to submit feedback.');
      return;
    }

    if (form.feedbackType === 'event' && !form.eventId) {
      setValidationError('Select an event before submitting feedback.');
      return;
    }

    if (form.feedbackType === 'session' && !form.sessionId) {
      setValidationError('Select a session before submitting feedback.');
      return;
    }

    if (form.feedbackType === 'booth' && !form.boothVisitId) {
      setValidationError('Select a booth visit before submitting feedback.');
      return;
    }

    if (!form.rating) {
      setValidationError('Choose a rating from 1 to 5.');
      return;
    }

    if (requiresReason && !form.reason) {
      setValidationError('Please select a reason for this low rating.');
      return;
    }

    try {
      setSubmitLoading(true);
      const payload = {
        rating: Number(form.rating),
        reason: form.reason || undefined,
        reasonDetails: form.reasonDetails || undefined,
        comment: form.comment || undefined,
      };

      if (form.feedbackType === 'website') {
        await endpoints.feedback.website(payload.rating, payload.comment);
      } else if (form.feedbackType === 'event') {
        await endpoints.feedback.event(form.eventId, payload);
      } else if (form.feedbackType === 'session') {
        await endpoints.feedback.session(form.sessionId, payload);
      } else {
        await endpoints.feedback.booth(form.boothVisitId, payload);
      }

      await fetchFeedback();
      setForm(emptyForm);
      setShowModal(false);
    } catch (err) {
      setValidationError(err.message || 'Unable to submit feedback.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderContextLabel = (item) => {
    if (!item) return 'General';
    if (item.feedbackType === 'website') return 'Website';
    if (item.feedbackType === 'event') return item.event?.title || 'Event';
    if (item.feedbackType === 'session') return item.session?.title || 'Session';
    if (item.feedbackType === 'booth') return item.booth ? `Booth ${item.booth.boothNumber || item.booth._id}` : 'Booth';
    return 'General';
  };

  return (
    <PublicLayout>
      <section className="container" style={{ paddingTop: 112, paddingBottom: 16 }}>
        <div style={{ maxWidth: 760 }}>
          <div style={{ display: 'inline-block', border: '1px solid rgba(56,189,248,0.3)', background: 'rgba(37,99,235,0.15)', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 20 }}>Feedback</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 2.75rem)', color: '#fff', margin: 0, lineHeight: 1.1 }}>
            Review the experience and share what matters.
          </h1>
          <p style={{ marginTop: 20, color: 'rgba(255,255,255,0.65)', fontSize: 17, lineHeight: 1.6 }}>
            EventSphere feedback is tied to real attendee activity: website, event, session, and booth interactions. Submit one review at a time and see what you have already shared below.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '24px 16px 48px' }}>
        <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#fff', fontSize: 20 }}>Your feedback</h2>
            <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              {user ? 'View your submitted reviews and add another.' : 'Sign in to access feedback submission.'}
            </p>
          </div>
          {user ? (
            <button type="button" className="btn btn-primary" onClick={openModal}><Send size={15} /> Submit Feedback</button>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/login" className="btn btn-primary">Sign in</Link>
              <Link to="/register" className="btn btn-ghost">Create an account</Link>
            </div>
          )}
        </div>
      </section>

      <section className="container" style={{ padding: '0 16px 64px' }}>
        <div className="grid-3" style={{ marginBottom: 24 }}>
          <div className="card info-card--centered" style={{ padding: 24 }}>
            <CalendarCheck2 size={26} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: '14px 0 0', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 18 }}>Event feedback</h3>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>Rate an event you attended after it ended.</p>
          </div>
          <div className="card info-card--centered" style={{ padding: 24 }}>
            <Building2 size={26} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: '14px 0 0', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 18 }}>Booth feedback</h3>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>Leave a rating for a booth visit you actually completed.</p>
          </div>
          <div className="card info-card--centered" style={{ padding: 24 }}>
            <MessageSquareText size={26} style={{ color: 'var(--accent)' }} />
            <h3 style={{ margin: '14px 0 0', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 18 }}>Session feedback</h3>
            <p style={{ margin: '8px 0 0', color: 'rgba(255,255,255,0.6)', lineHeight: 1.55 }}>Rate sessions you attended with backend-validated context.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: 16, marginBottom: user ? 32 : 0 }}>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14 }}>What attendees are saying</div>
          {publicRows.length ? publicRows.map((item) => (
            <article key={item._id} className="card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
                <strong style={{ color: '#fff' }}>{item.user?.name || 'EventSphere attendee'}</strong>
                <span style={{ color: 'var(--accent)' }}>{'★'.repeat(item.rating)}<span style={{ color: 'rgba(148,163,184,.4)' }}>{'★'.repeat(5 - item.rating)}</span></span>
              </div>
              <p style={{ color: 'rgba(255,255,255,.72)', lineHeight: 1.6, marginBottom: 0 }}>{item.comment}</p>
              <small style={{ color: 'rgba(255,255,255,.45)' }}>{renderContextLabel(item)} · {new Date(item.createdAt).toLocaleDateString()}</small>
            </article>
          )) : (
            <div className="card" style={{ padding: 28 }}>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>No public feedback has been submitted yet.</p>
            </div>
          )}
        </div>

        {!user ? (
          <div className="card" style={{ padding: 28 }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Sign in to submit a review and share your experience.</p>
          </div>
        ) : loading ? (
          <div className="card" style={{ padding: 28 }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>Loading your feedback…</p>
          </div>
        ) : error ? (
          <div className="card" style={{ padding: 28 }}>
            <p style={{ margin: 0, color: '#fca5a5' }}>{error}</p>
          </div>
        ) : rows.length === 0 ? (
          <div className="card" style={{ padding: 28 }}>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)' }}>No feedback yet. Submit your first review to get started.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {rows.map((item) => (
              <article key={item._id} className="card" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--accent)' }}>{item.feedbackType}</div>
                    <h3 style={{ margin: '8px 0 0', color: '#fff', fontSize: 20 }}>{renderContextLabel(item)}</h3>
                  </div>
                  <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} aria-label={`Rated ${item.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={`${item._id}-${index}`}
                        size={15}
                        style={{
                          color: index < item.rating ? 'var(--accent)' : 'rgba(148,163,184,0.35)',
                          fill: index < item.rating ? 'var(--accent)' : 'transparent',
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.7)', fontSize: 14, lineHeight: 1.6 }}>
                  {item.comment || 'No written comment provided.'}
                </div>
                {item.reason && (
                  <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    Reason: {reasonOptions[item.feedbackType]?.[item.reason] || item.reason}
                  </div>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                  <span>{item.user?.name || 'You'}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.7)', display: 'grid', placeItems: 'center', zIndex: 70, padding: 16 }}>
          <div className="card" style={{ width: '100%', maxWidth: 620, padding: 24, position: 'relative' }}>
            <button type="button" aria-label="Close modal" onClick={resetModal} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
              <X size={18} />
            </button>

            <h2 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-display)', fontSize: 28 }}>Submit Feedback</h2>
            <p style={{ marginTop: 8, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Choose a feedback type and tell us how it went.</p>

            <form onSubmit={handleSubmit} style={{ marginTop: 18, display: 'grid', gap: 16 }}>
              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Feedback Type</label>
                <select
                  className="input-light"
                  value={form.feedbackType}
                  onChange={(e) => setForm((prev) => ({ ...prev, feedbackType: e.target.value, eventId: '', sessionId: '', boothVisitId: '', reason: '', reasonDetails: '', comment: '' }))}
                >
                  {FEEDBACK_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              {form.feedbackType === 'event' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Event</label>
                  <select className="input-light" value={form.eventId} onChange={(e) => setForm((prev) => ({ ...prev, eventId: e.target.value }))}>
                    <option value="">Select an event</option>
                    {events.map((event) => (
                      <option key={event._id} value={event._id}>{event.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.feedbackType === 'session' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Session</label>
                  <select className="input-light" value={form.sessionId} onChange={(e) => setForm((prev) => ({ ...prev, sessionId: e.target.value }))}>
                    <option value="">Select a session</option>
                    {sessions.map((session) => (
                      <option key={session._id} value={session._id}>{session.title} · {session.event?.title || 'Event'}</option>
                    ))}
                  </select>
                </div>
              )}

              {form.feedbackType === 'booth' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Booth visit</label>
                  <select className="input-light" value={form.boothVisitId} onChange={(e) => setForm((prev) => ({ ...prev, boothVisitId: e.target.value }))}>
                    <option value="">Select a booth visit</option>
                    {boothVisits.map((visit) => (
                      <option key={visit._id} value={visit._id}>
                        {visit.booth?.boothNumber ? `Booth ${visit.booth.boothNumber}` : visit.booth?._id || 'Booth'} · {visit.event?.title || 'Event'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Rating</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {Array.from({ length: 5 }).map((_, index) => {
                    const value = index + 1;
                    return (
                      <button
                        key={value}
                        type="button"
                        aria-label={`Rate ${value} out of 5`}
                        onClick={() => setForm((prev) => ({ ...prev, rating: value }))}
                        style={{ background: 'transparent', border: '1px solid rgba(148,163,184,0.3)', borderRadius: 999, width: 36, height: 36, display: 'grid', placeItems: 'center', cursor: 'pointer', color: value <= form.rating ? 'var(--accent)' : 'rgba(148,163,184,0.5)', fill: value <= form.rating ? 'var(--accent)' : 'transparent' }}
                      >
                        <Star size={16} />
                      </button>
                    );
                  })}
                  <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{starLabels[form.rating]}</span>
                </div>
              </div>

              {requiresReason && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Reason</label>
                  <select
                    className="input-light"
                    value={form.reason}
                    onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))}
                  >
                    <option value="">Select a reason</option>
                    {Object.entries(reasonOptions[form.feedbackType] || {}).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              )}

              {canRequireReason && form.reason === 'other' && (
                <div style={{ display: 'grid', gap: 8 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Reason details</label>
                  <textarea
                    className="input-light"
                    rows={3}
                    value={form.reasonDetails}
                    onChange={(e) => setForm((prev) => ({ ...prev, reasonDetails: e.target.value }))}
                    placeholder="Tell us more about the issue"
                  />
                </div>
              )}

              <div style={{ display: 'grid', gap: 8 }}>
                <label style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>Comment</label>
                <textarea
                  className="input-light"
                  rows={4}
                  value={form.comment}
                  onChange={(e) => setForm((prev) => ({ ...prev, comment: e.target.value }))}
                  placeholder="Optional comments"
                />
              </div>

              {validationError && (
                <div style={{ padding: '10px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: 13 }}>
                  {validationError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
                <button type="button" className="btn btn-ghost" onClick={resetModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Submitting…' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PublicLayout>
  );
}
