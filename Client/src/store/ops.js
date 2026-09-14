import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SEED_BOOTHS, SEED_EVENTS, SEED_SESSIONS } from '../data/seed';

function ticket() {
  return `ES-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

export const useOps = create(
  persist(
    (set, get) => ({
      events: SEED_EVENTS,
      registrations: [
        {
          id: 'reg-1',
          attendeeId: 'u-attendee',
          attendeeName: 'Jordan Lee',
          email: 'attendee@eventsphere.com',
          eventId: 'evt-001',
          eventTitle: 'Global Tech Expo 2026',
          status: 'registered',
          ticketType: 'Standard',
          ticketCode: 'ES-DEMO-0001',
          registrationDate: new Date().toISOString(),
          checkedInAt: null,
        },
      ],
      applications: [
        {
          id: 'app-1',
          exhibitorId: 'u-exhibitor',
          companyName: 'TechNova Solutions',
          businessName: 'TechNova Solutions',
          eventId: 'evt-001',
          eventTitle: 'Global Tech Expo 2026',
          status: 'approved',
          boothPreference: 'A1',
          appliedAt: '2026-02-01',
          category: 'Technology',
          boothRequired: true,
        },
      ],
      exhibitorApplies: [],
      booths: SEED_BOOTHS,
      talkSessions: SEED_SESSIONS,
      sessionRegs: [
        { id: 'sr-1', attendeeId: 'u-attendee', sessionId: 'sess-001', eventId: 'evt-001', status: 'registered', createdAt: new Date().toISOString() },
      ],
      favorites: [{ attendeeId: 'u-attendee', eventId: 'evt-001' }],
      boothVisits: [
        {
          id: 'bv-1',
          boothId: 'booth-a1',
          eventId: 'evt-001',
          attendeeId: 'u-attendee',
          attendeeName: 'Jordan Lee',
          ticketCode: 'ES-DEMO-0001',
          visitedAt: new Date().toISOString(),
        },
      ],
      feedback: [],
      notifications: [
        {
          id: 'n-1',
          recipientId: 'u-attendee',
          title: 'Welcome to EventSphere',
          message: 'Your demo account is ready. Explore events and register.',
          type: 'system',
          timestamp: new Date().toISOString(),
          isRead: false,
        },
      ],

      createEvent: (input) => {
        const id = `evt-${Date.now()}`;
        const slug = input.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || id;
        const event = {
          id,
          title: input.title,
          slug,
          category: input.category,
          description: input.description || `${input.title} draft.`,
          organizer: 'EventSphere',
          location: { city: input.city, country: input.country || 'TBD', venue: input.venue || 'TBA' },
          startDate: input.startDate,
          endDate: input.endDate || input.startDate,
          bannerImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
          capacity: input.capacity || 1000,
          attendeeCount: 0,
          tags: input.tags || [input.category],
          status: 'draft',
          isPublished: false,
          ticketPrice: 0,
        };
        set({ events: [event, ...get().events] });
        return event;
      },
      publishEvent: (id) =>
        set({ events: get().events.map((e) => (e.id === id ? { ...e, status: 'published', isPublished: true } : e)) }),
      registerForEvent: (input) => {
        const event = get().events.find((e) => e.id === input.eventId);
        if (!event) return { ok: false, error: 'Event not found' };
        if (event.status !== 'published' && event.status !== 'ongoing') return { ok: false, error: 'Event not open for registration' };
        if (get().registrations.some((r) => r.eventId === input.eventId && r.email === input.email && r.status !== 'cancelled')) {
          return { ok: false, error: 'Already registered' };
        }
        const registration = {
          id: `reg-${Date.now()}`,
          attendeeId: input.attendeeId,
          attendeeName: input.attendeeName,
          email: input.email,
          eventId: event.id,
          eventTitle: event.title,
          status: 'registered',
          ticketType: 'Standard',
          ticketCode: ticket(),
          registrationDate: new Date().toISOString(),
          checkedInAt: null,
        };
        set({
          registrations: [registration, ...get().registrations],
          events: get().events.map((e) => (e.id === event.id ? { ...e, attendeeCount: e.attendeeCount + 1 } : e)),
        });
        return { ok: true, registration };
      },
      cancelRegistration: (id) => {
        const row = get().registrations.find((r) => r.id === id);
        if (!row || row.status !== 'registered') return;
        set({
          registrations: get().registrations.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r)),
          events: get().events.map((e) =>
            e.id === row.eventId ? { ...e, attendeeCount: Math.max(0, e.attendeeCount - 1) } : e,
          ),
        });
      },
      verifyTicket: (code) => {
        const row = get().registrations.find((r) => r.ticketCode.toUpperCase() === code.trim().toUpperCase());
        if (!row) return { ok: false, error: 'Ticket not found' };
        if (row.status === 'cancelled') return { ok: false, error: 'Registration was cancelled' };
        return { ok: true, registration: row };
      },
      checkIn: (code) => {
        const v = get().verifyTicket(code);
        if (!v.ok) return v;
        if (v.registration.status === 'attended') return { ok: false, error: 'Already checked in' };
        set({
          registrations: get().registrations.map((r) =>
            r.id === v.registration.id ? { ...r, status: 'attended', checkedInAt: new Date().toISOString() } : r,
          ),
        });
        return { ok: true, name: v.registration.attendeeName };
      },
      applyForEvent: (input) => {
        const event = get().events.find((e) => e.id === input.eventId);
        if (!event) return { ok: false, error: 'Event not found' };
        if (get().applications.some((a) => a.exhibitorId === input.exhibitorId && a.eventId === input.eventId && a.status !== 'cancelled')) {
          return { ok: false, error: 'Already applied' };
        }
        const app = {
          id: `app-${Date.now()}`,
          exhibitorId: input.exhibitorId,
          companyName: input.companyName,
          businessName: input.companyName,
          businessDescription: input.description,
          eventId: event.id,
          eventTitle: event.title,
          status: 'pending',
          boothPreference: input.boothPreference || 'Any',
          appliedAt: new Date().toISOString(),
          category: input.category,
          boothRequired: input.boothRequired ?? true,
        };
        set({ applications: [app, ...get().applications] });
        return { ok: true };
      },
      setApplicationStatus: (id, status) =>
        set({ applications: get().applications.map((a) => (a.id === id ? { ...a, status } : a)) }),
      applyAsExhibitor: (input) => {
        if (get().exhibitorApplies.some((a) => a.userId === input.userId && a.status !== 'rejected')) {
          return { ok: false, error: 'You already submitted an exhibitor application' };
        }
        set({
          exhibitorApplies: [
            { ...input, id: `exapp-${Date.now()}`, status: 'pending', createdAt: new Date().toISOString() },
            ...get().exhibitorApplies,
          ],
        });
        return { ok: true };
      },
      setExhibitorApplyStatus: (id, status) => {
        const row = get().exhibitorApplies.find((a) => a.id === id);
        if (!row) return undefined;
        set({ exhibitorApplies: get().exhibitorApplies.map((a) => (a.id === id ? { ...a, status } : a)) });
        return { ...row, status };
      },
      createBooth: (input) => {
        if (get().booths.some((b) => b.eventId === input.eventId && b.boothNumber === input.boothNumber)) {
          return { ok: false, error: 'Booth number already exists' };
        }
        const booth = {
          id: `booth-${Date.now()}`,
          eventId: input.eventId,
          boothNumber: input.boothNumber,
          size: input.size || '3x3',
          location: input.location,
          price: input.price || 0,
          exhibitor: null,
          exhibitorId: null,
          status: 'available',
        };
        set({ booths: [booth, ...get().booths] });
        return { ok: true, booth };
      },
      assignBooth: (boothId, exhibitorName, exhibitorId) => {
        const booth = get().booths.find((b) => b.id === boothId);
        if (!booth) return { ok: false, error: 'Booth not found' };
        if (booth.status !== 'available') return { ok: false, error: 'Booth not available' };
        set({
          booths: get().booths.map((b) =>
            b.id === boothId ? { ...b, exhibitor: exhibitorName, exhibitorId: exhibitorId || null, status: 'occupied' } : b,
          ),
        });
        return { ok: true };
      },
      releaseBooth: (boothId) =>
        set({
          booths: get().booths.map((b) =>
            b.id === boothId ? { ...b, exhibitor: null, exhibitorId: null, status: 'available' } : b,
          ),
        }),
      deleteBooth: (id) => {
        const b = get().booths.find((x) => x.id === id);
        if (b?.exhibitor) return;
        set({ booths: get().booths.filter((x) => x.id !== id) });
      },
      toggleFavorite: (attendeeId, eventId) => {
        const has = get().favorites.some((f) => f.attendeeId === attendeeId && f.eventId === eventId);
        set({
          favorites: has
            ? get().favorites.filter((f) => !(f.attendeeId === attendeeId && f.eventId === eventId))
            : [...get().favorites, { attendeeId, eventId }],
        });
      },
      createTalkSession: (input) => {
        const session = { ...input, id: `sess-${Date.now()}`, isActive: true };
        set({ talkSessions: [session, ...get().talkSessions] });
        return { ok: true, session };
      },
      deleteTalkSession: (id) => set({ talkSessions: get().talkSessions.filter((s) => s.id !== id) }),
      registerSession: (attendeeId, sessionId) => {
        const session = get().talkSessions.find((s) => s.id === sessionId);
        if (!session) return { ok: false, error: 'Session not found' };
        const eventReg = get().registrations.find(
          (r) => r.attendeeId === attendeeId && r.eventId === session.eventId && r.status === 'registered',
        );
        if (!eventReg) return { ok: false, error: 'You must be registered for this event first' };
        if (get().sessionRegs.some((s) => s.attendeeId === attendeeId && s.sessionId === sessionId && s.status === 'registered')) {
          return { ok: false, error: 'Already registered for this session' };
        }
        set({
          sessionRegs: [
            { id: `sr-${Date.now()}`, attendeeId, sessionId, eventId: session.eventId, status: 'registered', createdAt: new Date().toISOString() },
            ...get().sessionRegs,
          ],
        });
        return { ok: true };
      },
      cancelSession: (id) =>
        set({ sessionRegs: get().sessionRegs.map((s) => (s.id === id ? { ...s, status: 'cancelled' } : s)) }),
      recordBoothVisit: ({ boothId, ticketCode, exhibitorId }) => {
        const booth = get().booths.find((b) => b.id === boothId);
        if (!booth) return { ok: false, error: 'Booth not found' };
        if (!booth.exhibitor) return { ok: false, error: 'Booth not assigned' };
        const registration = get().registrations.find((r) => r.ticketCode.toUpperCase() === ticketCode.trim().toUpperCase());
        if (!registration) return { ok: false, error: 'Ticket not found' };
        if (registration.eventId !== booth.eventId) return { ok: false, error: 'Ticket not valid for this event' };
        if (get().boothVisits.some((v) => v.boothId === boothId && v.attendeeId === registration.attendeeId)) {
          return { ok: false, error: 'Already visited this booth' };
        }
        const visit = {
          id: `bv-${Date.now()}`,
          boothId,
          eventId: booth.eventId,
          attendeeId: registration.attendeeId,
          attendeeName: registration.attendeeName,
          ticketCode: registration.ticketCode,
          visitedAt: new Date().toISOString(),
        };
        set({ boothVisits: [visit, ...get().boothVisits] });
        return { ok: true, visit };
      },
      createFeedback: ({ userId, boothVisitId, rating, comment }) => {
        if (rating < 1 || rating > 5) return { ok: false, error: 'Rating must be 1–5' };
        const visit = get().boothVisits.find((v) => v.id === boothVisitId && v.attendeeId === userId);
        if (!visit) return { ok: false, error: 'Visit not found' };
        if (get().feedback.some((f) => f.boothVisitId === boothVisitId && f.userId === userId)) {
          return { ok: false, error: 'Feedback already submitted' };
        }
        const row = {
          id: `fb-${Date.now()}`,
          userId,
          eventId: visit.eventId,
          boothId: visit.boothId,
          boothVisitId,
          rating,
          comment: comment || null,
          createdAt: new Date().toISOString(),
        };
        set({ feedback: [row, ...get().feedback] });
        return { ok: true, feedback: row };
      },
      markNotifRead: (id) =>
        set({ notifications: get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) }),
      markAllRead: () => set({ notifications: get().notifications.map((n) => ({ ...n, isRead: true })) }),
      deleteNotif: (id) => set({ notifications: get().notifications.filter((n) => n.id !== id) }),
    }),
    { name: 'eventsphere.ops' },
  ),
);
