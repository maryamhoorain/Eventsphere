import { useEffect, useState } from 'react';
import { endpoints } from '../../api/client';
import FavoritesList from '../../components/common/FavoritesList';
import { useSession } from '../../store/session';

export default function Favorites() {
  const user = useSession((s) => s.user);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    if (user?.role !== 'attendee') return;
    endpoints.favorites.mine().then((response) => setFavorites(response?.favorites || []))
      .catch((err) => setError(err.message || 'Unable to load favorites.'));
  }, [user?.role]);
  return <div><h1 style={{ margin: 0, fontSize: 22 }}>Favorites</h1><div className="panel" style={{ marginTop: 16 }}>{error ? <p>{error}</p> : <FavoritesList favorites={favorites} onChange={setFavorites} />}</div></div>;
}
