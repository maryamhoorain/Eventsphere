import { useState } from 'react';
import { toast } from 'sonner';
import { useOps } from '../../store/ops';

export default function CheckIn() {
  const verifyTicket = useOps((s) => s.verifyTicket);
  const checkIn = useOps((s) => s.checkIn);
  const [code, setCode] = useState('');
  return (
    <div>
      <h1 style={{ margin: 0, fontSize: 22 }}>Check-in</h1>
      <div className="panel" style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="input-light" style={{ flex: 1, fontFamily: 'monospace' }} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ticket code" />
        <button type="button" className="btn btn-sm" onClick={() => { const r = verifyTicket(code); if (!r.ok) toast.error(r.error); else toast.success(r.registration.attendeeName); }}>Verify</button>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => { const r = checkIn(code); if (!r.ok) toast.error(r.error); else { toast.success(`Checked in ${r.name}`); setCode(''); } }}>Check in</button>
      </div>
    </div>
  );
}
