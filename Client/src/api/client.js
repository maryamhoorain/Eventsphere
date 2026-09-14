import axios from 'axios';

/** EventSphere API — the Client communicates only with this backend. */
const API_URL = import.meta.env.VITE_API_URL ?? '';

const apiClient = axios.create({
  baseURL: API_URL,
  validateStatus: (status) => status >= 200 && status < 300,
});

export function getToken() {
  return localStorage.getItem('eventsphere.token') || '';
}

export function setToken(token) {
  if (token) localStorage.setItem('eventsphere.token', token);
  else localStorage.removeItem('eventsphere.token');
}

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function api(path, init = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    form,
    token,
    ...rest
  } = init;

  const config = {
    method,
    url: path,
    ...rest,
    headers: { ...headers },
  };

  const authToken = token ?? getToken();
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (body !== undefined) {
    config.data = body;
  }

  if (!form && !(config.data instanceof FormData) && !config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }

  try {
    const res = await apiClient.request(config);
    return res.data;
  } catch (error) {
    const status = error.response?.status;
    const message = error.response?.data?.message
      || (status === 401 ? 'Your session has expired. Please sign in again.'
        : status === 403 ? 'You are not authorized to perform this action.'
          : status === 404 ? 'The requested resource was not found.'
            : status === 422 ? 'Please check the submitted information.'
              : status >= 500 ? 'The server could not complete the request.'
                : error.message || 'Request failed');
    const err = new Error(message);
    err.response = error.response;
    err.status = status;
    if (status === 401) setToken(null);
    throw err;
  }
}

export const endpoints = {
  auth: {
    register: (body) => api('/api/auth/register', { method: 'POST', body: JSON.stringify(body) }),
    login: (body) => api('/api/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    me: () => api('/api/auth/me'),
    verifyEmail: (token) => api(`/api/auth/verify-email/${token}`),
    resendVerification: (email) => api('/api/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }),
    forgotPassword: (email) => api('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
    resetPassword: (token, password) =>
      api(`/api/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) }),
  },
  events: {
    list: (q = '') => api(`/api/events${q}`),
    manage: () => api('/api/events/manage'),
    get: (id) => api(`/api/events/${id}`),
    create: (form) => api('/api/events', { method: 'POST', body: form, form: true }),
    update: (id, body) => api(`/api/events/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    publish: (id) => api(`/api/events/${id}/publish`, { method: 'PATCH' }),
    remove: (id) => api(`/api/events/${id}`, { method: 'DELETE' }),
  },
  registrations: {
    mine: () => api('/api/registrations/my'),
    create: (body) => api('/api/registrations/', { method: 'POST', body: JSON.stringify(body) }),
    register: (body) => api('/api/registrations/', { method: 'POST', body: JSON.stringify(body) }),
    cancel: (id) => api(`/api/registrations/${id}/cancel`, { method: 'PUT' }),
    forEvent: (eventId) => api(`/api/registrations/event/${eventId}`),
    verifyTicket: (ticketCode) =>
      api('/api/registrations/verify-ticket', { method: 'POST', body: JSON.stringify({ ticketCode }) }),
    checkIn: (ticketCode) =>
      api('/api/registrations/check-in', { method: 'POST', body: JSON.stringify({ ticketCode }) }),
  },
  exhibitors: {
    apply: (body) => api('/api/exhibitors/apply', { method: 'POST', body: JSON.stringify(body) }),
    applications: () => api('/api/exhibitors/applications'),
    myApplication: () => api('/api/exhibitors/my'),
    approve: (id) => api(`/api/exhibitors/${id}/approve`, { method: 'PATCH' }),
    reject: (id, adminNotes) => api(`/api/exhibitors/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ adminNotes }) }),
  },
  organizerApplications: {
    submit: (body) => api('/api/organizer-applications', { method: 'POST', body: JSON.stringify(body) }),
    mine: () => api('/api/organizer-applications/my'),
    list: () => api('/api/organizer-applications'),
    approve: (id) => api(`/api/organizer-applications/${id}/approve`, { method: 'PATCH' }),
    reject: (id, adminNotes) => api(`/api/organizer-applications/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ adminNotes }) }),
  },
  participation: {
    apply: (eventId, body) =>
      api(`/api/exhibitor-participation/${eventId}`, { method: 'POST', body: JSON.stringify(body) }),
    mine: () => api('/api/exhibitor-participation/my'),
    cancel: (id) => api(`/api/exhibitor-participation/${id}/cancel`, { method: 'PATCH' }),
    forEvent: (eventId) => api(`/api/exhibitor-participation/event/${eventId}`),
    approve: (id, adminNotes) =>
      api(`/api/exhibitor-participation/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ adminNotes }) }),
    reject: (id, adminNotes) =>
      api(`/api/exhibitor-participation/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ adminNotes }) }),
  },
  dashboard: {
    admin: () => api('/api/dashboard/admin'),
    exhibitor: () => api('/api/dashboard/exhibitor'),
    attendee: () => api('/api/dashboard/attendee'),
  },
  analytics: {
    eventOverview: (eventId) => api(`/api/analytics/events/${eventId}/overview`),
    registrations: (eventId) => api(`/api/analytics/events/${eventId}/registrations`),
    exhibitors: (eventId) => api(`/api/analytics/events/${eventId}/exhibitors`),
    booths: (eventId) => api(`/api/analytics/events/${eventId}/booths`),
    visitors: (eventId) => api(`/api/analytics/events/${eventId}/visitors`),
    feedback: (eventId) => api(`/api/analytics/events/${eventId}/feedback`),
  },
  favorites: {
    addEvent: (eventId) => api(`/api/favorites/event/${eventId}`, { method: 'POST' }),
    removeEvent: (eventId) => api(`/api/favorites/event/${eventId}`, { method: 'DELETE' }),
    checkEvent: (eventId) => api(`/api/favorites/event/${eventId}`),
    addSession: (sessionId) => api(`/api/favorites/session/${sessionId}`, { method: 'POST' }),
    removeSession: (sessionId) => api(`/api/favorites/session/${sessionId}`, { method: 'DELETE' }),
    checkSession: (sessionId) => api(`/api/favorites/session/${sessionId}`),
    mine: () => api('/api/favorites/my'),
  },
  reports: {
    generate: (eventId, reportType, format) =>
      api(`/api/reports/events/${eventId}`, { method: 'POST', body: JSON.stringify({ reportType, format }) }),
    forEvent: (eventId) => api(`/api/reports/events/${eventId}`),
    download: (reportId) => api(`/api/reports/${reportId}/download`),
    downloadFile: async (reportId) => {
      const response = await fetch(`${API_URL}/api/reports/${reportId}/download`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!response.ok) {
        let message = 'Unable to download report.';
        try {
          const body = await response.json();
          message = body.message || message;
        } catch {
          // Keep the generic message when the server returns a non-JSON error.
        }
        throw new Error(message);
      }
      return response;
    },
    remove: (reportId) => api(`/api/reports/${reportId}`, { method: 'DELETE' }),
  },
  notifications: {
    list: () => api('/api/notifications'),
    unreadCount: () => api('/api/notifications/unread/count'),
    read: (id) => api(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    readAll: () => api('/api/notifications/read-all', { method: 'PATCH' }),
    remove: (id) => api(`/api/notifications/${id}`, { method: 'DELETE' }),
  },
  booths: {
    create: (eventId, body) => api(`/api/booths/event/${eventId}`, { method: 'POST', body: JSON.stringify(body) }),
    forEvent: (eventId) => api(`/api/booths/event/${eventId}`),
    available: (eventId) => api(`/api/booths/event/${eventId}/available`),
    map: (eventId) => api(`/api/booths/event/${eventId}/map`),
    request: (id) => api(`/api/booths/${id}/request`, { method: 'POST' }),
    pending: () => api('/api/booths/pending'),
    approveRequest: (id) => api(`/api/booths/${id}/approve-request`, { method: 'PATCH' }),
    rejectRequest: (id) => api(`/api/booths/${id}/reject-request`, { method: 'PATCH' }),
    assign: (id, exhibitorId) =>
      api(`/api/booths/${id}/assign`, { method: 'PATCH', body: JSON.stringify({ exhibitorId }) }),
    release: (id) => api(`/api/booths/${id}/release`, { method: 'PATCH' }),
    mine: () => api('/api/booths/my'),
    myRequests: () => api('/api/booths/my/requests'),
    remove: (id) => api(`/api/booths/${id}`, { method: 'DELETE' }),
  },
  sessions: {
    create: (eventId, body) => api(`/api/sessions/event/${eventId}`, { method: 'POST', body: JSON.stringify(body) }),
    forEvent: (eventId) => api(`/api/sessions/event/${eventId}`),
    update: (id, body) => api(`/api/sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    remove: (id) => api(`/api/sessions/${id}`, { method: 'DELETE' }),
  },
  sessionRegistrations: {
    create: (sessionId) => api(`/api/session-registrations/session/${sessionId}`, { method: 'POST' }),
    mine: () => api('/api/session-registrations/my'),
    status: (sessionId) => api(`/api/session-registrations/status/${sessionId}`),
    cancel: (id) => api(`/api/session-registrations/${id}/cancel`, { method: 'PUT' }),
  },
  boothVisits: {
    record: (boothId, ticketCode) =>
      api(`/api/booth-visits/${boothId}`, { method: 'POST', body: JSON.stringify({ ticketCode }) }),
    managed: () => api('/api/booth-visits/managed'),
    mine: () => api('/api/booth-visits/my'),
  },
  feedback: {
    public: () => api('/api/feedback/public'),
    mine: () => api('/api/feedback/my'),
    website: (rating, comment) =>
      api('/api/feedback/website', { method: 'POST', body: JSON.stringify({ rating, comment }) }),
    event: (eventId, payload) =>
      api(`/api/feedback/event/${eventId}`, { method: 'POST', body: JSON.stringify(payload) }),
    session: (sessionId, payload) =>
      api(`/api/feedback/session/${sessionId}`, { method: 'POST', body: JSON.stringify(payload) }),
    booth: (boothVisitId, payload) =>
      api(`/api/feedback/booth-visit/${boothVisitId}`, { method: 'POST', body: JSON.stringify(payload) }),
    create: (boothVisitId, body) =>
      api(`/api/feedback/booth-visit/${boothVisitId}`, { method: 'POST', body: JSON.stringify(body) }),
  },
  profile: {
    get: () => api('/api/profile/'),
    update: (body) => api('/api/profile/', { method: 'PUT', body: JSON.stringify(body) }),
    changePassword: (body) => api('/api/profile/password', { method: 'PUT', body: JSON.stringify(body) }),
    changeImage: (imageUrl) => api('/api/profile/image', { method: 'PUT', body: JSON.stringify({ imageUrl }) }),
    changeEmail: (body) => api('/api/profile/email', { method: 'PUT', body: JSON.stringify(body) }),
  },
  ai: {
    chat: (message) => api('/api/ai/chat', { method: 'POST', body: JSON.stringify({ message }) }),
  },
  chat: {
    contacts: () => api('/api/chat/contacts'),
    conversations: () => api('/api/chat/conversations'),
    createConversation: (participantId) =>
      api('/api/chat/conversations', { method: 'POST', body: JSON.stringify({ participantId }) }),
    messages: (conversationId) => api(`/api/chat/conversations/${conversationId}/messages`),
    sendImage: (conversationId, file) => {
      const form = new FormData();
      form.append('image', file);
      return api(`/api/chat/conversations/${conversationId}/images`, { method: 'POST', body: form, form: true });
    },
    sendAudio: (conversationId, file) => {
      const form = new FormData();
      form.append('audio', file);
      return api(`/api/chat/conversations/${conversationId}/audio`, { method: 'POST', body: form, form: true });
    },
    edit: (conversationId, messageId, text) =>
      api(`/api/chat/conversations/${conversationId}/messages/${messageId}`, {
        method: 'PUT',
        body: JSON.stringify({ text }),
      }),
    remove: (conversationId, messageId) =>
      api(`/api/chat/conversations/${conversationId}/messages/${messageId}`, { method: 'DELETE' }),
  },
};
