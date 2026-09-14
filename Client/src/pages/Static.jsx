import { PublicLayout } from '../components/layout/PublicLayout';

export default function Static({ title, body }) {
  return (
    <PublicLayout>
      <div className="container" style={{ paddingTop: 112, paddingBottom: 64, maxWidth: 720 }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 36, color: '#fff' }}>{title}</h1>
        <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginTop: 16 }}>{body}</p>
      </div>
    </PublicLayout>
  );
}
