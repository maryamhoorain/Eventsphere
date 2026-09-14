import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { endpoints } from '../../api/client';
import { useSession } from '../../store/session';

const REPORT_TYPES = [
  ['event_overview', 'Event overview'],
  ['registration', 'Registrations'],
  ['exhibitor', 'Exhibitors'],
  ['booth', 'Booths'],
  ['visitor', 'Visitors'],
  ['feedback', 'Feedback'],
  ['complete_event', 'Complete event'],
];
const PERSONAL_REPORT_TYPES = [
  ['my_exhibitor_overview', 'My exhibitor overview'],
  ['my_booth', 'My booths'],
  ['my_visitors', 'My visitors'],
  ['my_feedback', 'My feedback'],
];

export default function Reports() {
  const user = useSession((s) => s.user);
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [reports, setReports] = useState([]);
  const [reportType, setReportType] = useState('event_overview');
  const [format, setFormat] = useState('pdf');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const loadReports = async (id = eventId) => {
    if (!id) {
      setReports([]);
      return;
    }
    const response = await endpoints.reports.forEvent(id);
    setReports(response?.reports || []);
  };

  useEffect(() => {
    if (!user || !['admin', 'organizer', 'exhibitor'].includes(user.role)) return;
    (user.role === 'admin' ? endpoints.events.list() : endpoints.events.manage())
      .then((response) => {
        const rows = response?.events || [];
        setEvents(rows);
        const first = rows[0]?._id || rows[0]?.id || '';
        setEventId((current) => current || first);
        return first ? loadReports(first) : undefined;
      })
      .catch((error) => toast.error(error.message || 'Unable to load events.'))
      .finally(() => setLoading(false));
  }, [user?.role]);

  const generate = async (event) => {
    event.preventDefault();
    if (!eventId) return;
    setWorking(true);
    try {
      await endpoints.reports.generate(eventId, reportType, format);
      toast.success('Report generated.');
      await loadReports();
    } catch (error) {
      toast.error(error.message || 'Unable to generate report.');
    } finally {
      setWorking(false);
    }
  };

  const download = async (report) => {
    try {
      const response = await endpoints.reports.downloadFile(report._id || report.id);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.headers.get('content-disposition')?.match(/filename="([^"]+)"/)?.[1] || 'eventsphere-report';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Report download started.');
    } catch (error) {
      toast.error(error.message || 'Unable to download report.');
    }
  };

  const remove = async (id) => {
    try {
      await endpoints.reports.remove(id);
      setReports((current) => current.filter((report) => (report._id || report.id) !== id));
      toast.success('Report deleted.');
    } catch (error) {
      toast.error(error.message || 'Unable to delete report.');
    }
  };

  if (!user || !['admin', 'organizer', 'exhibitor'].includes(user.role)) {
    return <div className="card" style={{ padding: 24 }}>You are not authorized to view reports.</div>;
  }

  return (
    <div>
      <div className="dashboard-page-heading">
        <div><h1>Reports</h1><p>Generate and download event analytics.</p></div>
        <select className="input-light analytics-event-select" value={eventId} onChange={(e) => { const id = e.target.value; setEventId(id); loadReports(id).catch((error) => toast.error(error.message || 'Unable to load reports.')); }}>
          <option value="">Select an event</option>
          {events.map((event) => <option key={event._id || event.id} value={event._id || event.id}>{event.title}</option>)}
        </select>
      </div>
      <form className="card" style={{ display: 'flex', gap: 12, alignItems: 'end', flexWrap: 'wrap', padding: 18 }} onSubmit={generate}>
        <label style={{ display: 'grid', gap: 6, flex: 1, minWidth: 220 }}>Report type
          <select className="input-light" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {REPORT_TYPES.concat(user.role === 'exhibitor' ? PERSONAL_REPORT_TYPES : []).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label style={{ display: 'grid', gap: 6, minWidth: 140 }}>Format
          <select className="input-light" value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="pdf">PDF</option><option value="xlsx">Excel</option><option value="docx">Word</option>
          </select>
        </label>
        <button className="btn btn-primary" type="submit" disabled={!eventId || working}>{working ? 'Generating…' : 'Generate report'}</button>
      </form>
      <div className="card" style={{ marginTop: 16, padding: 18, overflowX: 'auto' }}>
        {loading ? <p>Loading reports…</p> : reports.length === 0 ? <p style={{ color: 'var(--muted)' }}>No reports generated for this event.</p> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Format</th><th>Created</th><th /></tr></thead>
            <tbody>{reports.map((report) => {
              const id = report._id || report.id;
              return <tr key={id}>
                <td>{report.fileName || report.reportType || 'Report'}</td>
                <td>{String(report.format || '').toUpperCase()}</td>
                <td>{report.createdAt ? new Date(report.createdAt).toLocaleString() : '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}><button className="btn btn-sm btn-primary" type="button" onClick={() => download(report)}>Download file</button> <button className="btn btn-sm" type="button" onClick={() => remove(id)}>Delete</button></td>
              </tr>;
            })}</tbody>
          </table>
        )}
      </div>
    </div>
  );
}
