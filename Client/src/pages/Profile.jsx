import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, CalendarDays, Camera, Check, ChevronRight, Edit3, KeyRound, Mail, Phone,
  Save, ShieldCheck, Star, Ticket, UserCircle2, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession } from '../store/session';
import { endpoints } from '../api/client';
import { PublicLayout } from '../components/layout/PublicLayout';
import { Link } from 'react-router-dom';
import FavoritesList from '../components/common/FavoritesList';

const REASONS = {
  booth: {
    poor_interaction: 'Poor interaction',
    staff_unavailable: 'Staff unavailable',
    unclear_information: 'Unclear information',
    poor_booth_setup: 'Poor booth setup',
    product_or_service_issue: 'Product or service issue',
    other: 'Other',
  },
  session: {
    poor_content: 'Poor content',
    speaker_issue: 'Speaker issue',
    too_long: 'Too long',
    too_short: 'Too short',
    technical_issue: 'Technical issue',
    topic_not_as_expected: 'Topic not as expected',
    other: 'Other',
  },
  event: {
    poor_organization: 'Poor organization',
    unclear_information: 'Unclear information',
    technical_issue: 'Technical issue',
    other: 'Other',
  },
};

const EMPTY_RATING = { type: '', item: null, rating: 0, reason: '', reasonDetails: '', comment: '' };

function idOf(value) {
  return value?._id || value?.id || value || '';
}

function itemTitle(type, item) {
  if (type === 'booth') return item?.booth?.boothNumber ? `Booth ${item.booth.boothNumber}` : 'Booth visit';
  if (type === 'session') return item?.session?.title || item?.sessionTitle || item?.title || 'Session';
  return item?.event?.title || item?.eventTitle || item?.title || 'Event';
}

function feedbackTarget(type, feedback) {
  if (feedback?.feedbackType !== type) return '';
  if (type === 'booth') return idOf(feedback.boothVisit);
  if (type === 'session') return idOf(feedback.session);
  return idOf(feedback.event);
}

export default function Profile() {
  const user = useSession((s) => s.user);
  const updateSession = useSession((s) => s.updateProfile);
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [email, setEmail] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [history, setHistory] = useState({ booths: [], events: [], sessions: [] });
  const [feedback, setFeedback] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [activeHistory, setActiveHistory] = useState(null);
  const [rating, setRating] = useState(EMPTY_RATING);
  const [ratingSaving, setRatingSaving] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const profileImage = profile?.profileImage || user?.profileImage || '';
  const displayName = profile?.name || user?.name || '';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';

  const loadProfile = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const attendeeData = user.role === 'attendee'
        ? Promise.all([
          endpoints.boothVisits.mine(),
          endpoints.registrations.mine(),
          endpoints.sessionRegistrations.mine(),
          endpoints.feedback.mine(),
          endpoints.favorites.mine(),
        ])
        : Promise.resolve([{}, {}, {}, {}, {}]);
      const [profileRes, [boothRes, registrationRes, sessionRes, feedbackRes, favoritesRes]] = await Promise.all([
        endpoints.profile.get(),
        attendeeData,
      ]);
      const next = profileRes.user || {};
      const events = (registrationRes?.registrations || []).filter((item) => item.status === 'attended');
      const sessions = (sessionRes?.registrations || []).filter((item) => item.status === 'attended');
      setProfile(next);
      setForm({ name: next.name || '', phone: next.phone || '' });
      setEmail(next.email || user.email || '');
      setImageUrl(next.profileImage || '');
      setHistory({
        booths: boothRes?.visits || [],
        events,
        sessions,
      });
      setFeedback(feedbackRes?.feedback || []);
      setFavorites(favoritesRes?.favorites || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load your profile');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const saveNameAndPhone = async () => {
    const payload = {};
    if (form.name.trim() !== (profile?.name || '')) payload.name = form.name.trim();
    if (form.phone.trim() !== (profile?.phone || '')) payload.phone = form.phone.trim();
    if (!Object.keys(payload).length) {
      toast.info('No profile changes to save.');
      return;
    }
    setSaving(true);
    try {
      const response = await endpoints.profile.update(payload);
      const next = response.user || { ...profile, ...payload };
      setProfile(next);
      updateSession({ name: next.name, phone: next.phone });
      toast.success(response.message || 'Profile updated');
    } catch (error) {
      toast.error(error.message || 'Unable to update profile');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (field, value) => {
    setEditing(field);
    setEditValue(field === 'image' ? '' : (value || ''));
    setEditPassword('');
  };

  const handleImageFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please choose an image smaller than 5 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const maxSize = 640;
        const scale = Math.min(1, maxSize / Math.max(source.width, source.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        canvas.getContext('2d').drawImage(source, 0, 0, canvas.width, canvas.height);
        setEditValue(canvas.toDataURL('image/jpeg', 0.72));
      };
      source.onerror = () => toast.error('Unable to process that image.');
      source.src = typeof reader.result === 'string' ? reader.result : '';
    };
    reader.onerror = () => toast.error('Unable to read that image.');
    reader.readAsDataURL(file);
  };

  const saveEdit = async () => {
    if (!editValue.trim()) {
      toast.error(`${editing === 'email' ? 'Email' : editing === 'image' ? 'A picture' : 'Value'} is required.`);
      return;
    }
    setSaving(true);
    try {
      let response;
      if (editing === 'email') {
        response = await endpoints.profile.changeEmail({ currentPassword: editPassword, newEmail: editValue.trim() });
      } else if (editing === 'image') {
        response = await endpoints.profile.changeImage(editValue.trim());
      } else {
        response = await endpoints.profile.update({ [editing]: editValue.trim() });
      }
      const next = response.user || { ...profile, [editing === 'email' ? 'email' : editing === 'image' ? 'profileImage' : editing]: editValue.trim() };
      setProfile(next);
      if (editing === 'email') {
        setEmail(next.email);
        updateSession({ email: next.email });
      } else if (editing === 'image') {
        setImageUrl(next.profileImage);
        updateSession({ profileImage: next.profileImage });
      } else {
        setForm((current) => ({ ...current, [editing]: next[editing] }));
        updateSession({ [editing]: next[editing] });
      }
      setEditing(null);
      toast.success(response.message || 'Updated successfully');
    } catch (error) {
      toast.error(error.message || 'Unable to save this change');
    } finally {
      setSaving(false);
    }
  };

  const submitRating = async (event) => {
    event.preventDefault();
    const { type, item, rating: score, reason, reasonDetails, comment } = rating;
    if (!score) {
      toast.error('Choose a rating from 1 to 5.');
      return;
    }
    if (score < 3 && !reason) {
      toast.error('Please choose a reason for this low rating.');
      return;
    }
    setRatingSaving(true);
    try {
      const payload = { rating: score, reason: reason || undefined, reasonDetails: reasonDetails || undefined, comment: comment || undefined };
      if (type === 'booth') await endpoints.feedback.booth(idOf(item), payload);
      if (type === 'session') await endpoints.feedback.session(idOf(item.session), payload);
      if (type === 'event') await endpoints.feedback.event(idOf(item.event), payload);
      setFeedback((items) => [...items, { feedbackType: type, rating: score, reason, reasonDetails, comment, boothVisit: type === 'booth' ? item : null, session: type === 'session' ? item.session : null, event: item.event }]);
      setRating(EMPTY_RATING);
      toast.success('Thanks for sharing your feedback.');
    } catch (error) {
      toast.error(error.message || 'Unable to submit feedback');
    } finally {
      setRatingSaving(false);
    }
  };

  const activeItems = useMemo(() => {
    if (activeHistory === 'booth') return history.booths;
    if (activeHistory === 'session') return history.sessions;
    return history.events;
  }, [activeHistory, history]);

  if (!user) {
    return <PublicLayout><div className="container profile-page"><div className="panel"><h1>Profile</h1><p>Please sign in to view your profile.</p></div></div></PublicLayout>;
  }

  return (
    <PublicLayout>
      <div className="container profile-page">
      <div className="profile-back-home"><Link to="/"><ArrowLeft size={16} /> Back to home</Link></div>
      <section className="profile-hero panel">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{profileImage ? <img src={profileImage} alt={displayName} /> : initial}</div>
          <button type="button" className="profile-avatar-edit" onClick={() => openEdit('image', imageUrl)} aria-label="Edit profile picture"><Camera size={15} /></button>
        </div>
        <div className="profile-hero__identity">
          <div className="profile-hero__name"><h1>{displayName}</h1><ShieldCheck size={18} /></div>
          <span>{user.role}</span>
          <p>Manage your identity, contact details, and EventSphere activity.</p>
        </div>
      </section>

      <div className="profile-layout">
        <section className="profile-details panel">
          <div className="profile-section-heading"><div><span className="profile-eyebrow">Personal details</span><h2>Your information</h2></div><button type="button" className="btn btn-primary btn-sm" onClick={saveNameAndPhone} disabled={saving || loading}><Save size={14} /> Save</button></div>
          <EditableRow label="Full name" icon={UserCircle2}><input className="input-light" value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} /></EditableRow>
          <EditableRow label="Phone number" icon={Phone} action={() => openEdit('phone', form.phone)}><span className="profile-value">{form.phone || 'Add your phone number'}</span></EditableRow>
          <EditableRow label="Email address" icon={Mail} action={() => openEdit('email', email)}><span className="profile-value">{email}</span></EditableRow>
          <div className="profile-photo-row"><div><strong>Profile picture</strong><small>Use a public image URL</small></div><button type="button" className="btn btn-sm" onClick={() => openEdit('image', imageUrl)}><Edit3 size={14} /> Edit picture</button></div>
        </section>

        <aside className="profile-side">
          <form className="panel" onSubmit={async (event) => {
            event.preventDefault();
            setPasswordSaving(true);
            try {
              const response = await endpoints.profile.changePassword(passwordForm);
              toast.success(response.message || 'Password updated');
              setPasswordForm({ currentPassword: '', newPassword: '' });
            } catch (error) { toast.error(error.message || 'Unable to update password'); } finally { setPasswordSaving(false); }
          }}>
            <div className="profile-card-title"><KeyRound size={16} /><h2>Change password</h2></div>
            <input className="input-light" type="password" required placeholder="Current password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, currentPassword: e.target.value }))} />
            <input className="input-light" type="password" required placeholder="New password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((current) => ({ ...current, newPassword: e.target.value }))} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={passwordSaving}>{passwordSaving ? 'Updating…' : 'Update password'}</button>
          </form>
          <div className="panel profile-account"><div className="profile-card-title"><UserCircle2 size={16} /><h2>Account</h2></div><p><strong>Role</strong>{user.role}</p><p><strong>Member since</strong>{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Recently'}</p></div>
        </aside>
      </div>

      {user.role === 'attendee' && !activeHistory ? (
        <section className="profile-activity">
          <div className="profile-section-heading"><div><span className="profile-eyebrow">Your journey</span><h2>Activity history</h2></div><span className="profile-history__hint">Select a category to view and rate each item.</span></div>
          <div className="profile-history__grid">
            <HistoryCard icon={Ticket} title="Visited events" count={history.events.length} onClick={() => setActiveHistory('event')} />
            <HistoryCard icon={CalendarDays} title="Visited sessions" count={history.sessions.length} onClick={() => setActiveHistory('session')} />
            <HistoryCard icon={UserCircle2} title="Visited booths" count={history.booths.length} onClick={() => setActiveHistory('booth')} />
          </div>
        </section>
      ) : user.role === 'attendee' ? (
        <HistoryList type={activeHistory} items={activeItems} feedback={feedback} onBack={() => setActiveHistory(null)} onRate={(item) => setRating({ ...EMPTY_RATING, type: activeHistory, item })} />
      ) : null}
      {user.role === 'attendee' && <section className="profile-activity"><div className="profile-section-heading"><div><span className="profile-eyebrow">Saved for later</span><h2>Favorites</h2></div></div><div className="panel"><FavoritesList favorites={favorites} onChange={setFavorites} /></div></section>}

      {editing && <EditModal field={editing} value={editValue} password={editPassword} setValue={setEditValue} setPassword={setEditPassword} onFile={handleImageFile} onClose={() => setEditing(null)} onSave={saveEdit} saving={saving} />}
      {rating.type && <RatingModal state={rating} setState={setRating} onClose={() => setRating(EMPTY_RATING)} onSubmit={submitRating} saving={ratingSaving} />}
      </div>
    </PublicLayout>
  );
}

function EditableRow({ label, icon: Icon, action, children }) {
  return <div className="profile-edit-row"><div className="profile-edit-row__label"><Icon size={16} /><span>{label}</span></div><div className="profile-edit-row__control">{children}</div>{action && <button type="button" className="icon-button" onClick={action} aria-label={`Edit ${label}`}><Edit3 size={15} /></button>}</div>;
}

function HistoryCard({ icon: Icon, title, count, onClick }) {
  return <button type="button" className="profile-history__card" onClick={onClick}><span className="profile-history__card-icon"><Icon size={19} /></span><span><strong>{title}</strong><small>{count ? `${count} item${count === 1 ? '' : 's'} to review` : 'No items yet'}</small></span><ChevronRight size={18} /></button>;
}

function HistoryList({ type, items, feedback, onBack, onRate }) {
  return <section className="profile-list panel"><button type="button" className="profile-back" onClick={onBack}><ArrowLeft size={16} /> Activity history</button><div className="profile-list__heading"><div><span className="profile-eyebrow">Your journey</span><h2>{type === 'booth' ? 'Visited booths' : type === 'session' ? 'Visited sessions' : 'Visited events'}</h2></div><span>{items.length} item{items.length === 1 ? '' : 's'}</span></div>{items.length ? <div className="profile-list__items">{items.map((item, index) => { const target = type === 'booth' ? idOf(item) : type === 'session' ? idOf(item.session) : idOf(item.event); const review = feedback.find((entry) => feedbackTarget(type, entry) === target); return <div className="profile-list__item" key={idOf(item) || index}><div><strong>{itemTitle(type, item)}</strong><small>{item.visitedAt || item.attendedAt || item.createdAt ? new Date(item.visitedAt || item.attendedAt || item.createdAt).toLocaleDateString() : 'Recently'}</small></div><div className="profile-list__rating">{review ? <Stars value={review.rating} /> : <button type="button" className="rating-trigger" onClick={() => onRate(item)}><Stars value={0} /><span>Rate</span></button>}</div></div>; })}</div> : <div className="profile-list__empty">Your attended {type}s will appear here.</div>}</section>;
}

function Stars({ value }) {
  return <span className="stars" aria-label={`${value} out of 5 stars`}>{[1, 2, 3, 4, 5].map((star) => <Star key={star} size={17} fill={star <= value ? 'currentColor' : 'none'} />)}</span>;
}

function EditModal({ field, value, password, setValue, setPassword, onClose, onSave, saving, onFile }) {
  const label = field === 'image' ? 'Profile picture' : field === 'email' ? 'Email address' : 'Phone number';
  return <div className="profile-modal-backdrop"><form className="profile-modal panel" onSubmit={(event) => { event.preventDefault(); onSave(); }}><button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><span className="profile-eyebrow">Edit profile</span><h2>{label}</h2>{field === 'image' ? <><label className="profile-file-picker"><Camera size={20} /><span>{value ? 'Choose a different picture' : 'Choose from device'}</span><small>JPG, PNG or WEBP up to 5 MB</small><input type="file" accept="image/*" onChange={onFile} /></label>{value && <img className="profile-image-preview" src={value} alt="Selected profile preview" />}</> : <input className="input-light" autoFocus type={field === 'email' ? 'email' : 'tel'} value={value} onChange={(e) => setValue(e.target.value)} placeholder={label} />}{field === 'email' && <input className="input-light" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Current password" />}<div className="profile-modal-actions"><button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary btn-sm" disabled={saving || (field === 'image' && !value)}>{saving ? 'Saving…' : <><Check size={14} /> Save change</>}</button></div></form></div>;
}

function RatingModal({ state, setState, onClose, onSubmit, saving }) {
  const options = REASONS[state.type] || {};
  const needsReason = state.rating > 0 && state.rating < 3;
  return <div className="profile-modal-backdrop"><form className="profile-modal panel rating-modal" onSubmit={onSubmit}><button type="button" className="profile-modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><span className="profile-eyebrow">Share feedback</span><h2>Rate this {state.type}</h2><p className="rating-modal__item">{itemTitle(state.type, state.item)}</p><div className="rating-picker">{[1, 2, 3, 4, 5].map((value) => <button type="button" key={value} className={value <= state.rating ? 'is-selected' : ''} onClick={() => setState((current) => ({ ...current, rating: value }))} aria-label={`${value} stars`}><Star size={28} fill={value <= state.rating ? 'currentColor' : 'none'} /></button>)}</div>{needsReason && <select className="input-light" required value={state.reason} onChange={(e) => setState((current) => ({ ...current, reason: e.target.value }))}><option value="">Why was your experience poor?</option>{Object.entries(options).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select>}<textarea className="input-light rating-textarea" value={state.reasonDetails} onChange={(e) => setState((current) => ({ ...current, reasonDetails: e.target.value }))} placeholder={needsReason ? 'Tell us a little more (optional)' : 'Add a comment (optional)'} /><div className="profile-modal-actions"><button type="button" className="btn btn-sm" onClick={onClose}>Cancel</button><button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving ? 'Sending…' : 'Submit rating'}</button></div></form></div>;
}
