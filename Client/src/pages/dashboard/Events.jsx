import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { StatusPill } from '../../components/common/StatusPill';
import { endpoints } from '../../api/client';
import { useSession } from '../../store/session';
import { CATEGORIES } from '../../data/seed';

export default function Events() {
  const role = useSession((s) => s.user?.role);
  const [events, setEvents] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draftStartDate, setDraftStartDate] = useState('');

  const loadEvents = async () => {
    setLoading(true);
    try {
      const response = role === 'exhibitor'
        ? await endpoints.events.list()
        : await endpoints.events.manage();
      setEvents(response?.events || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadEvents(); }, [role]);

  const createEvent = async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startDate = form.get('startDate');
    const endDate = form.get('endDate');
    const payload = new FormData();
    payload.append('title', form.get('title'));
    payload.append('description', form.get('description'));
    payload.append('category', form.get('category'));
    payload.append('startDate', startDate);
    payload.append('endDate', endDate);
    const registrationDeadline = form.get('registrationDeadline');
    if (registrationDeadline) payload.append('registrationDeadline', registrationDeadline);
    payload.append('capacity', form.get('capacity') || '1000');
    payload.append('tags', form.get('tags') || '');
    payload.append('location', JSON.stringify({
      venue: form.get('venue'),
      address: form.get('address'),
      city: form.get('city'),
      country: form.get('country'),
    }));
    const bannerImage = form.get('bannerImage');
    if (bannerImage instanceof File && bannerImage.size > 0) payload.append('bannerImage', bannerImage);
    try {
      await endpoints.events.create(payload);
      toast.success(role === 'organizer' ? 'Event submitted for admin approval.' : 'Event draft created.');
      setOpen(false);
      await loadEvents();
    } catch (error) {
      toast.error(error.message || 'Unable to create event.');
    }
  };

  const approve = async (id) => {
    try {
      await endpoints.events.publish(id);
      toast.success('Event approved and published.');
      await loadEvents();
    } catch (error) {
      toast.error(error.message || 'Unable to approve event.');
    }
  };

  const removeEvent = async (event) => {
    if (!window.confirm(`Delete "${event.title}"? This action cannot be undone.`)) return;
    try {
      await endpoints.events.remove(event._id);
      toast.success('Event deleted.');
      await loadEvents();
    } catch (error) {
      toast.error(error.message || 'Unable to delete event.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', marginBottom: 16 }}>
        <div><h1 style={{ margin: 0, fontSize: 22 }}>Events</h1><p style={{ color: 'var(--muted)', margin: '4px 0 0', fontSize: 13 }}>{role === 'exhibitor' ? 'Browse published events and select a booth.' : 'Organizer submissions require admin approval before publication.'}</p></div>
        {(role === 'admin' || role === 'organizer') && <button type="button" className="btn btn-primary btn-sm" onClick={() => setOpen(true)}>New event</button>}
      </div>
      <div className="panel">
        {loading ? <p style={{ color: 'var(--muted)' }}>Loading events…</p> : <table className="table">
          <thead><tr><th>Title</th><th>Organizer</th><th>Category</th><th>Date</th><th>Status</th><th /></tr></thead>
          <tbody>{events.map((event) => <tr key={event._id}>
            <td>{event.title}</td><td>{event.organizer?.name || '—'}</td><td>{event.category}</td>
            <td>{new Date(event.startDate).toLocaleDateString()}</td><td><StatusPill status={event.status} /></td>
            <td style={{ whiteSpace: 'nowrap' }}>
              {role === 'admin' && event.status === 'draft' && (
                <button type="button" className="btn btn-primary btn-sm" onClick={() => approve(event._id)}>Approve & publish</button>
              )}
              {role === 'admin' && (
                <button
                  type="button"
                  className="btn btn-sm"
                  style={{ marginLeft: 8, color: 'var(--error)' }}
                  onClick={() => removeEvent(event)}
                >
                  Delete
                </button>
              )}
            </td>
          </tr>)}</tbody>
        </table>}
      </div>
      {open && <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', display: 'grid', placeItems: 'center', zIndex: 50, padding: 16 }}>
        <form className="panel dashboard-form-modal" onSubmit={createEvent}>
          <div className="dashboard-form-modal__header"><div><span className="dashboard-form-modal__eyebrow">Event setup</span><h3>Create event</h3><p>Tell attendees what to expect and where to find it.</p></div><button type="button" className="dashboard-form-modal__close" onClick={() => setOpen(false)} aria-label="Close">×</button></div>
          <div className="dashboard-form-grid">
            <label className="dashboard-form-field dashboard-form-field--wide">Title<input className="input-light" name="title" required placeholder="e.g. Future of Technology Expo" /></label>
            <label className="dashboard-form-field">Category<select className="input-light" name="category" required defaultValue=""><option value="" disabled>Select a category</option>{CATEGORIES.map((category) => <option key={category.name} value={category.name}>{category.name}</option>)}</select></label>
            <label className="dashboard-form-field">Venue<input className="input-light" name="venue" required placeholder="Venue name" /></label>
            <label className="dashboard-form-field">Address<input className="input-light" name="address" required placeholder="Street address" /></label>
            <label className="dashboard-form-field">City<input className="input-light" name="city" required placeholder="City" /></label>
            <label className="dashboard-form-field">Country<input className="input-light" name="country" required placeholder="Country" /></label>
            <label className="dashboard-form-field">Start date<input className="input-light" name="startDate" type="datetime-local" min={new Date().toISOString().slice(0, 16)} onChange={(event) => setDraftStartDate(event.target.value)} required /></label>
            <label className="dashboard-form-field">End date<input className="input-light" name="endDate" type="datetime-local" min={draftStartDate || new Date().toISOString().slice(0, 16)} required /></label>
            <label className="dashboard-form-field">Registration deadline<input className="input-light" name="registrationDeadline" type="datetime-local" min={new Date().toISOString().slice(0, 16)} max={draftStartDate || undefined} /></label>
            <label className="dashboard-form-field">Capacity<input className="input-light" name="capacity" type="number" min="1" placeholder="Expected attendees" /></label>
            <label className="dashboard-form-field dashboard-form-field--wide">Tags<input className="input-light" name="tags" placeholder="technology, innovation" /></label>
            <label className="dashboard-form-field dashboard-form-field--wide">Banner image<input className="input-light input-file" name="bannerImage" type="file" accept="image/*" /></label>
            <label className="dashboard-form-field dashboard-form-field--wide">Description<textarea className="input-light" name="description" required placeholder="Describe the event..." /></label>
          </div>
          <div className="dashboard-form-modal__actions"><button type="button" className="btn btn-sm" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary btn-sm" type="submit">Submit event</button></div>
        </form>
      </div>}
    </div>
  );
}
