import { useState } from 'react';
import { KeyRound, Mail, Save, ShieldCheck, UserCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { endpoints } from '../../api/client';
import { useSession } from '../../store/session';

export default function Settings() {
  const user = useSession((s) => s.user);
  const updateProfile = useSession((s) => s.updateProfile);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await endpoints.profile.update({ name: name.trim(), phone: phone.trim() });
      updateProfile({ name: response?.user?.name || name.trim(), phone: response?.user?.phone || phone.trim() });
      toast.success('Profile settings saved.');
    } catch (error) {
      toast.error(error.message || 'Unable to save profile settings.');
    } finally { setSaving(false); }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setChangingPassword(true);
    try {
      await endpoints.profile.changePassword(passwords);
      setPasswords({ currentPassword: '', newPassword: '' });
      toast.success('Password updated securely.');
    } catch (error) {
      toast.error(error.message || 'Unable to update password.');
    } finally { setChangingPassword(false); }
  };

  return (
    <div>
      <div className="dashboard-page-heading"><div><h1>Settings</h1><p>Manage your account details, security, and preferences.</p></div></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, maxWidth: 900 }}>
        <form className="panel" onSubmit={saveProfile}>
          <div className="profile-card-title"><UserCircle2 size={18} /><h2>Profile details</h2></div>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Keep your contact information up to date.</p>
          <label className="settings-field"><span>Full name</span><input className="input-light" value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label className="settings-field"><span>Phone number</span><input className="input-light" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Optional" /></label>
          <div className="settings-account"><Mail size={15} />{user?.email}<ShieldCheck size={15} />{user?.role}</div>
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}><Save size={15} />{saving ? 'Saving…' : 'Save changes'}</button>
        </form>
        <form className="panel" onSubmit={changePassword}>
          <div className="profile-card-title"><KeyRound size={18} /><h2>Security</h2></div>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>Use a strong password to protect your account.</p>
          <label className="settings-field"><span>Current password</span><input className="input-light" type="password" value={passwords.currentPassword} onChange={(event) => setPasswords((value) => ({ ...value, currentPassword: event.target.value }))} required /></label>
          <label className="settings-field"><span>New password</span><input className="input-light" type="password" minLength={6} value={passwords.newPassword} onChange={(event) => setPasswords((value) => ({ ...value, newPassword: event.target.value }))} required /></label>
          <button type="submit" className="btn btn-primary btn-sm" disabled={changingPassword}><KeyRound size={15} />{changingPassword ? 'Updating…' : 'Update password'}</button>
        </form>
      </div>
    </div>
  );
}
