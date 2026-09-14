const STATUS_COLORS = {
  available: '#34d399',
  pending: '#fbbf24',
  reserved: '#fbbf24',
  occupied: '#f87171',
  rejected: '#94a3b8',
  booked: '#f87171',
};

export default function BoothMap({ booths = [], floor, eventTitle = 'Event booths', onSelect }) {
  const safeBooths = (Array.isArray(booths) ? booths : []).filter((booth) => !floor || Number(booth.floor || 1) === Number(floor));
  return (
    <div className="card" style={{ padding: 18, background: 'linear-gradient(145deg, #0b1733, #12264a)', border: '1px solid rgba(56,189,248,.2)', color: '#fff', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ display: 'block', color: '#67e8f9', fontSize: 11, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase' }}>Live booth layout</span>
          <h3 style={{ margin: '4px 0 0', color: '#fff', fontFamily: 'var(--font-display)', fontSize: 20 }}>{eventTitle}</h3>
        </div>
        <span style={{ alignSelf: 'end', color: 'rgba(255,255,255,.7)', fontSize: 12 }}>{safeBooths.length} booth{safeBooths.length === 1 ? '' : 's'}</span>
      </div>
      <div style={{ position: 'relative', minHeight: 360, border: '1px solid rgba(125,211,252,.2)', borderRadius: 16, padding: 12, background: 'radial-gradient(circle at 50% 0%, rgba(37,99,235,.2), transparent 45%), linear-gradient(rgba(148,163,184,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,.08) 1px, transparent 1px)', backgroundSize: 'auto, 10% 20%, 10% 20%' }}>
        {safeBooths.length ? safeBooths.map((booth, index) => {
          const id = booth._id || booth.id || booth.boothNumber;
          const status = String(booth.status || 'available').toLowerCase();
          const color = STATUS_COLORS[status] || STATUS_COLORS.rejected;
          const coordinates = booth.mapCoordinates;
          const hasPosition = (booth.positionX !== null && booth.positionX !== undefined && booth.positionY !== null && booth.positionY !== undefined)
            || (coordinates?.x !== null && coordinates?.x !== undefined && coordinates?.y !== null && coordinates?.y !== undefined);
          const column = index % 5;
          const row = Math.floor(index / 5);
          const x = booth.positionX ?? (Number(coordinates?.x) / 700) * 82;
          const y = booth.positionY ?? (Number(coordinates?.y) / 500) * 88;
          const style = hasPosition
            // Keep the booth's full width inside the map when coordinates are
            // based on the source floor-plan canvas rather than this container.
            ? { left: `${Math.max(0, Math.min(82, x))}%`, top: `${Math.max(0, Math.min(88, y))}%` }
            : { left: `${8 + column * 18}%`, top: `${8 + row * 25}%` };
          const selectable = status === 'available' && onSelect;
          return <button key={id} type="button" disabled={!selectable} onClick={() => onSelect(id)} style={{ position: 'absolute', ...style, width: '15%', maxWidth: 190, minWidth: 74, minHeight: 62, boxSizing: 'border-box', padding: 8, borderRadius: 10, border: `2px solid ${color}`, boxShadow: booth.isSelected ? '0 0 0 3px #38bdf8, 0 0 18px rgba(56,189,248,.6)' : `0 0 12px ${color}44`, background: `${color}22`, color: '#fff', cursor: selectable ? 'pointer' : 'not-allowed', textAlign: 'center' }}>
            <strong style={{ display: 'block', fontSize: 13 }}>{booth.boothNumber || 'Booth'}</strong>
            <small style={{ color, textTransform: 'capitalize' }}>{status}</small>
          </button>;
        }) : <span style={{ color: 'rgba(255,255,255,.6)' }}>No booths available for this floor.</span>}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, color: 'rgba(255,255,255,.75)', fontSize: 12 }}>
        {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => <span key={status}><i style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, marginRight: 5 }} />{status}</span>)}
      </div>
    </div>
  );
}
