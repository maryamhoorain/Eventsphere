import { useEffect, useState } from 'react';
import { endpoints } from '../../api/client';
import { useSession } from '../../store/session';

export default function Users() {
  const currentUser = useSession((s) => s.user);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    endpoints.chat.contacts()
      .then((data) => setUsers([{ _id: currentUser.id, name: currentUser.name, email: currentUser.email, role: currentUser.role }, ...(data.contacts || [])]))
      .catch((err) => setError(err.message || 'Unable to load users.'));
  }, [currentUser.id, currentUser.name, currentUser.email, currentUser.role]);
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22 }}>Users</h1>
      {error && <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>}
      <div className="panel" style={{ marginTop: 16 }}>
        <table className="table">
          <thead><tr><th>Name</th><th>Email</th><th>Role</th></tr></thead>
          <tbody>{users.map((u) => <tr key={u._id || u.id}><td>{u.name}</td><td>{u.email}</td><td style={{ textTransform: 'capitalize' }}>{u.role}</td></tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
