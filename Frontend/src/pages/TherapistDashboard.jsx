import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../context/RoleContext';
import SidebarLink from '../components/SidebarLink';
import { THERAPIST_NAV } from '../config/sidebarConfig.jsx';

const statusBadge = {
  'in-progress': <span className="badge bg-blue-100 text-blue-700 text-xs">IN PROGRESS</span>,
  'upcoming': <span className="badge badge-gray text-xs">Upcoming</span>,
  'done': <span className="badge badge-green text-xs">Done</span>,
  'cancelled': <span className="badge badge-red text-xs">Cancelled</span>,
};

// Map backend SessionStatus enum onto the UI's badge keys.
function uiStatusOf(status) {
  if (status === 'IN_PROGRESS') return 'in-progress';
  if (status === 'COMPLETED') return 'done';
  if (status === 'CANCELLED') return 'cancelled';
  return 'upcoming'; // PENDING_PAYMENT, CONFIRMED
}

const trackLabel = (track) => (track === 'CAREER' ? 'Career Guidance' : 'Mental Health Therapy');
const fmtTime = (dt) => (dt ? new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—');
const fmtDate = (dt) => (dt ? new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Monday-based start of the week containing d.
function weekStart(d) {
  const x = new Date(d);
  const offset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

// Settings → Availability: render order Monday-first; values are JS getDay()
// numbers (0 = Sunday … 6 = Saturday) to match the backend rules.
const WEEK_DAYS = [
  { day: 1, label: 'Monday' },
  { day: 2, label: 'Tuesday' },
  { day: 3, label: 'Wednesday' },
  { day: 4, label: 'Thursday' },
  { day: 5, label: 'Friday' },
  { day: 6, label: 'Saturday' },
  { day: 0, label: 'Sunday' },
];

// Map the API's rules array into the local all-7-days form shape.
function rulesToForm(rules) {
  const form = {};
  WEEK_DAYS.forEach(({ day }) => {
    const rule = rules.find(r => r.dayOfWeek === day);
    form[day] = rule
      ? { enabled: true, start: rule.startTime, end: rule.endTime }
      : { enabled: false, start: '09:00', end: '18:00' };
  });
  return form;
}

// Map an API therapist profile into the Settings form's string fields.
// Array fields (specializations/languages) are shown as comma-separated text.
function profileToForm(p) {
  return {
    name: p.name || '',
    title: p.title || '',
    licenseNumber: p.licenseNumber || '',
    track: p.track || 'MENTAL_HEALTH',
    credentials: p.credentials || '',
    specializations: (p.specializations || []).join(', '),
    languages: (p.languages || []).join(', '),
    about: p.about || '',
    methodology: p.methodology || '',
    feePkr: p.feePkr != null ? String(p.feePkr) : '',
  };
}

export default function TherapistDashboard() {
  const { currentUser, setCurrentUser, logout } = useRole();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLinks, setZoomLinks] = useState({});
  const [zoomBusy, setZoomBusy] = useState({}); // { [sessionId]: 'saving' | 'saved' | 'error' }
  const [markBusy, setMarkBusy] = useState({}); // { [sessionId]: 'saving' | 'error' }
  const [activeSection, setActiveSection] = useState('overview');

  // ── Therapist's own editable profile (Settings tab) ──
  const [profile, setProfile] = useState(null);   // last-saved profile from the API
  const [pform, setPform] = useState(null);        // controlled form values (null while loading)
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');      // 'active' | 'incomplete' | error text | ''

  // ── Weekly availability (Settings tab) ──
  // Local shape: { [dayOfWeek]: { enabled, start, end } } for all 7 days.
  const [avail, setAvail] = useState(null);        // null while loading
  const [savingAvail, setSavingAvail] = useState(false);
  const [availMsg, setAvailMsg] = useState('');    // 'saved' | error text | ''

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    let active = true;
    api.getTherapistSessions()
      .then((data) => {
        if (!active) return;
        setSessions(data);
        const seed = {};
        data.forEach((s) => { if (s.zoomLink) seed[s.id] = s.zoomLink; });
        setZoomLinks(seed);
      })
      .catch(() => { if (active) setSessions([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  // Load the therapist's own profile for the Settings tab.
  useEffect(() => {
    let active = true;
    api.getMyTherapistProfile()
      .then((p) => {
        if (!active) return;
        setProfile(p);
        setPform(profileToForm(p));
      })
      .catch(() => { /* not a therapist / fetch failed — Settings stays empty */ });
    return () => { active = false; };
  }, []);

  // Load the weekly availability rules for the Settings tab.
  useEffect(() => {
    let active = true;
    api.getMyAvailability()
      .then((rules) => { if (active) setAvail(rulesToForm(rules)); })
      .catch(() => { if (active) setAvail(rulesToForm([])); });
    return () => { active = false; };
  }, []);

  const setDay = (day, patch) =>
    setAvail((a) => ({ ...a, [day]: { ...a[day], ...patch } }));

  async function handleSaveAvailability() {
    if (!avail) return;
    // Client-side sanity check so the therapist gets an instant, friendly error.
    for (const { day, label } of WEEK_DAYS) {
      const d = avail[day];
      if (d.enabled && d.start >= d.end) {
        setAvailMsg(`${label}: end time must be after start time.`);
        return;
      }
    }
    setSavingAvail(true);
    setAvailMsg('');
    try {
      const rules = WEEK_DAYS
        .filter(({ day }) => avail[day].enabled)
        .map(({ day }) => ({ dayOfWeek: day, startTime: avail[day].start, endTime: avail[day].end }));
      const saved = await api.updateMyAvailability(rules);
      setAvail(rulesToForm(saved));
      setAvailMsg('saved');
      setTimeout(() => setAvailMsg(''), 5000);
    } catch (err) {
      const detail = err.details?.[0]?.message;
      setAvailMsg(detail || err.message || 'Could not save availability.');
    } finally {
      setSavingAvail(false);
    }
  }

  const setField = (key, value) => setPform((f) => ({ ...f, [key]: value }));

  async function handleSaveProfile() {
    if (!pform) return;
    setSavingProfile(true);
    setSaveMsg('');
    try {
      const payload = {
        name: pform.name.trim(),
        title: pform.title.trim(),
        licenseNumber: pform.licenseNumber.trim(),
        track: pform.track,
        credentials: pform.credentials.trim(),
        about: pform.about.trim(),
        methodology: pform.methodology.trim(),
        specializations: pform.specializations.split(',').map((s) => s.trim()).filter(Boolean),
        languages: pform.languages.split(',').map((s) => s.trim()).filter(Boolean),
      };
      // Only send a fee when it's a valid positive number; otherwise leave it unchanged.
      const fee = parseInt(pform.feePkr, 10);
      if (!Number.isNaN(fee) && fee > 0) payload.feePkr = fee;

      const updated = await api.updateMyTherapistProfile(payload);
      setProfile(updated);
      setPform(profileToForm(updated));
      // Reflect a name change in the sidebar immediately.
      if (updated.name && updated.name !== currentUser?.name) {
        setCurrentUser({ ...currentUser, name: updated.name, initials: updated.initials });
      }
      setSaveMsg(updated.status); // 'DRAFT' | 'PENDING' | 'APPROVED' (message per state below)
      setTimeout(() => setSaveMsg(''), 5000);
    } catch (err) {
      const detail = err.details?.[0]?.message;
      setSaveMsg(detail || err.message || 'Could not save. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  }

  function handleZoomLink(sessionId, value) {
    setZoomLinks(prev => ({ ...prev, [sessionId]: value }));
  }

  async function handleSendZoom(sessionId) {
    const link = (zoomLinks[sessionId] || '').trim();
    if (!link) return;
    setZoomBusy(prev => ({ ...prev, [sessionId]: 'saving' }));
    try {
      await api.setSessionZoomLink(sessionId, link);
      setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, zoomLink: link } : s)));
      setZoomBusy(prev => ({ ...prev, [sessionId]: 'saved' }));
      setTimeout(() => setZoomBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2000);
    } catch {
      setZoomBusy(prev => ({ ...prev, [sessionId]: 'error' }));
      setTimeout(() => setZoomBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2500);
    }
  }

  // Therapist marks a session attended. Updates the shared `sessions` state so
  // BOTH "Today's Schedule" (overview) and "Today's Appointments" reflect it at
  // once (they derive from the same array), and the patient sees it in their
  // history on their next load.
  async function handleMarkComplete(sessionId) {
    setMarkBusy(prev => ({ ...prev, [sessionId]: 'saving' }));
    try {
      await api.updateSessionStatus(sessionId, 'COMPLETED');
      setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, status: 'COMPLETED' } : s)));
      setMarkBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    } catch {
      setMarkBusy(prev => ({ ...prev, [sessionId]: 'error' }));
      setTimeout(() => setMarkBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2500);
    }
  }

  // ── Derive views from real session data ──────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const withDate = sessions.map(s => ({ ...s, _dt: s.slot?.datetime ? new Date(s.slot.datetime) : null }));

  const todaySessions = withDate.filter(s => s._dt && sameDay(s._dt, today)).sort((a, b) => a._dt - b._dt);
  const tomorrowSessions = withDate.filter(s => s._dt && sameDay(s._dt, tomorrow)).sort((a, b) => a._dt - b._dt);
  const upcomingSessions = withDate.filter(s => s._dt && s._dt > now && !sameDay(s._dt, today)).sort((a, b) => a._dt - b._dt);

  const toCard = (s) => ({
    id: s.id,
    status: uiStatusOf(s.status),
    rawStatus: s.status,        // backend enum — gates the "Mark Complete" action
    time: fmtTime(s.slot?.datetime),
    patient: s.patient?.name || 'Patient',
    sessionNumber: s.sessionNumber,
    type: trackLabel(s.therapist?.track),
  });
  const toBrief = (s) => ({
    id: s.id,
    patient: s.patient?.name || 'Patient',
    time: fmtTime(s.slot?.datetime),
    task: `Session #${s.sessionNumber} — ${trackLabel(s.therapist?.track)}`,
  });
  const todayCards = todaySessions.map(toCard);
  // Overview "Today's Schedule" demotes completed sessions below the active ones.
  const todayActiveCards = todayCards.filter(c => c.status !== 'done');
  const todayDoneCards = todayCards.filter(c => c.status === 'done');
  const tomorrowBrief = tomorrowSessions.map(toBrief);
  const upcomingBrief = upcomingSessions.map(toBrief);

  // Stats
  const ws = weekStart(today);
  const we = new Date(ws); we.setDate(ws.getDate() + 7);
  const weeklyCount = withDate.filter(s => s._dt && s._dt >= ws && s._dt < we).length;
  const todayDone = todaySessions.filter(s => s.status === 'COMPLETED').length;
  const todayRemaining = todaySessions.filter(s => s.status !== 'COMPLETED' && s.status !== 'CANCELLED').length;
  const pendingPayAmount = sessions
    .filter(s => s.payment && String(s.payment.status).toUpperCase() === 'PENDING')
    .reduce((sum, s) => sum + Number(s.therapist?.feePkr || 0), 0);

  // My Patients — distinct patients derived from sessions
  const patientMap = {};
  withDate.forEach(s => {
    const p = s.patient;
    if (!p) return;
    if (!patientMap[p.id]) patientMap[p.id] = { name: p.name, count: 0, last: null };
    patientMap[p.id].count += 1;
    if (s._dt && (!patientMap[p.id].last || s._dt > patientMap[p.id].last)) patientMap[p.id].last = s._dt;
  });
  const thirtyAgo = new Date(today); thirtyAgo.setDate(today.getDate() - 30);
  const patientRows = Object.values(patientMap)
    .map(p => ({
      name: p.name,
      lastSession: p.last ? fmtDate(p.last) : '—',
      count: p.count,
      status: p.last && p.last >= thirtyAgo ? 'Active' : 'On Hold',
    }))
    .sort((a, b) => b.count - a.count);

  const statsRow = [
    { label: 'Total Patients Today', value: String(todayDone), sub: 'sessions done' },
    { label: 'Weekly Sessions', value: String(weeklyCount), sub: 'this week' },
    { label: 'Pending Payments', value: `PKR ${pendingPayAmount.toLocaleString()}`, sub: 'awaiting admin' },
  ];

  const zoomButtonLabel = (id) => {
    if (zoomBusy[id] === 'saving') return 'Saving…';
    if (zoomBusy[id] === 'saved') return 'Sent ✓';
    if (zoomBusy[id] === 'error') return 'Retry';
    return 'Send';
  };

  const markButtonLabel = (id) => {
    if (markBusy[id] === 'saving') return 'Saving…';
    if (markBusy[id] === 'error') return 'Retry';
    return '✓ Mark Complete';
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 fixed left-0 top-0 h-full z-10">
        <div className="mb-2 mt-1">
          <span className="text-lg font-bold text-brand">MindBridge</span>
        </div>
        <div className="flex items-center gap-2 mb-6 mt-1">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">{currentUser?.initials || '··'}</div>
          <div>
            <p className="text-xs text-gray-400">WELCOME BACK</p>
            <p className="text-sm font-bold text-gray-800">{currentUser?.name || 'Therapist'}</p>
            <p className="text-xs text-gray-400">Your mental hours.</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {THERAPIST_NAV.map((item) => (
            <SidebarLink
              key={item.section}
              icon={item.svg || item.icon}
              label={item.label}
              active={activeSection === item.section}
              onClick={() => setActiveSection(item.section)}
            />
          ))}
        </nav>

        <div className="mt-4 space-y-3">
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors w-full"
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeSection === 'overview' && 'Therapist Dashboard'}
              {activeSection === 'appointments' && 'Appointments'}
              {activeSection === 'patients' && 'My Patients'}
              {activeSection === 'settings' && 'Settings'}
            </h1>
            <p className="text-gray-500 text-sm">
              {activeSection === 'overview' && `${dayName} — You have ${todaySessions.length} sessions today.`}
              {activeSection === 'appointments' && 'Manage your professional bookings and session links.'}
              {activeSection === 'patients' && 'View your assigned patients.'}
              {activeSection === 'settings' && 'Manage your profile and availability hours.'}
            </p>
          </div>
        </div>

        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6 mt-5">
              {statsRow.map((s, i) => (
                <div key={i} className="card">
                  <p className="text-xs font-semibold text-gray-400">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${i === 2 ? 'text-brand' : 'text-gray-900'}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
               ))}
            </div>

            {/* Sessions remaining + Tomorrow */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card flex items-center gap-3 py-3">
                <span className="text-2xl">🗓</span>
                <div>
                  <p className="text-xs text-gray-400">Sessions remaining</p>
                  <p className="text-sm font-bold text-gray-800">{todayRemaining} today</p>
                </div>
              </div>
              <div className="card py-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-gray-800 text-sm">Tomorrow</h2>
                  {tomorrowBrief.length > 1 && (
                    <button onClick={() => setActiveSection('appointments')} className="text-brand text-xs font-semibold hover:underline">View All</button>
                  )}
                </div>
                {loading ? (
                  <p className="text-sm text-gray-400">Loading…</p>
                ) : tomorrowBrief.length === 0 ? (
                  <p className="text-sm text-gray-400">Nothing scheduled tomorrow.</p>
                ) : (
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{tomorrowBrief[0].patient}</p>
                    <p className="text-xs text-brand">{tomorrowBrief[0].time}</p>
                    <p className="text-xs text-gray-500 mt-1 italic">{tomorrowBrief[0].task}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Today's Schedule</h2>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-400">Loading…</p>
                ) : todayCards.length === 0 ? (
                  <div className="card shadow-none text-sm text-gray-400 text-center py-6">No sessions today.</div>
                ) : (
                  <>
                    {/* Active (upcoming / in-progress) sessions — full cards */}
                    {todayActiveCards.map(session => (
                      <div key={session.id} className={`card shadow-none ${session.status === 'in-progress' ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {statusBadge[session.status]}
                              <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                            </div>
                            <p className="font-bold text-gray-900">{session.patient}</p>
                            <p className="text-xs text-gray-500">Session #{session.sessionNumber} — {session.type}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {session.rawStatus === 'CONFIRMED' && (
                              <button
                                onClick={() => handleMarkComplete(session.id)}
                                disabled={markBusy[session.id] === 'saving'}
                                className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {markButtonLabel(session.id)}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Zoom link input */}
                        <div className="mt-3 flex gap-2">
                          <input
                            type="url"
                            placeholder="Paste Zoom link..."
                            value={zoomLinks[session.id] || ''}
                            onChange={e => handleZoomLink(session.id, e.target.value)}
                            className="input-field text-xs py-2 flex-1"
                          />
                          <button
                            onClick={() => handleSendZoom(session.id)}
                            disabled={!zoomLinks[session.id] || zoomBusy[session.id] === 'saving'}
                            className={`text-xs px-3 py-2 rounded-lg font-semibold transition-colors ${zoomLinks[session.id] && zoomBusy[session.id] !== 'saving' ? 'bg-brand text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                          >
                            {zoomButtonLabel(session.id)}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* All of today's sessions complete */}
                    {todayActiveCards.length === 0 && (
                      <div className="card shadow-none text-center py-6">
                        <p className="text-sm font-semibold text-green-600">✓ All of today's sessions are complete</p>
                      </div>
                    )}

                    {/* Completed sessions — demoted, compact, no actions */}
                    {todayDoneCards.map(session => (
                      <div key={session.id} className="card shadow-none bg-gray-50 py-3 opacity-70">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {statusBadge[session.status]}
                              <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                            </div>
                            <p className="font-semibold text-sm text-gray-700 mt-1">{session.patient}</p>
                          </div>
                          <span className="text-xs text-gray-400">Session #{session.sessionNumber}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Appointments Section */}
        {activeSection === 'appointments' && (
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Today's Appointments</h2>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-sm text-gray-400">Loading…</p>
                  ) : todayCards.length === 0 ? (
                    <div className="card shadow-none text-sm text-gray-400 text-center py-6">No sessions today.</div>
                  ) : (
                    <>
                      {/* Active (upcoming / in-progress) sessions — full cards */}
                      {todayActiveCards.map(session => (
                        <div key={session.id} className={`card shadow-none ${session.status === 'in-progress' ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {statusBadge[session.status]}
                                <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                              </div>
                              <p className="font-bold text-gray-900">{session.patient}</p>
                              <p className="text-xs text-gray-500">Session #{session.sessionNumber} — {session.type}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              {session.rawStatus === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleMarkComplete(session.id)}
                                  disabled={markBusy[session.id] === 'saving'}
                                  className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {markButtonLabel(session.id)}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Zoom link input */}
                          <div className="mt-3 flex gap-2">
                            <input
                              type="url"
                              placeholder="Paste Zoom link..."
                              value={zoomLinks[session.id] || ''}
                              onChange={e => handleZoomLink(session.id, e.target.value)}
                              className="input-field text-xs py-2 flex-1"
                            />
                            <button
                              onClick={() => handleSendZoom(session.id)}
                              disabled={!zoomLinks[session.id] || zoomBusy[session.id] === 'saving'}
                              className={`text-xs px-3 py-2 rounded-lg font-semibold transition-colors ${zoomLinks[session.id] && zoomBusy[session.id] !== 'saving' ? 'bg-brand text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                              {zoomButtonLabel(session.id)}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* All of today's sessions complete */}
                      {todayActiveCards.length === 0 && (
                        <div className="card shadow-none text-center py-6">
                          <p className="text-sm font-semibold text-green-600">✓ All of today's sessions are complete</p>
                        </div>
                      )}

                      {/* Completed sessions — demoted, compact, no actions */}
                      {todayDoneCards.map(session => (
                        <div key={session.id} className="card shadow-none bg-gray-50 py-3 opacity-70">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                {statusBadge[session.status]}
                                <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                              </div>
                              <p className="font-semibold text-sm text-gray-700 mt-1">{session.patient}</p>
                            </div>
                            <span className="text-xs text-gray-400">Session #{session.sessionNumber}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Upcoming Appointments</h2>
                  <button className="text-brand text-xs font-semibold hover:underline">View All</button>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-gray-400">Loading…</p>
                  ) : upcomingBrief.length === 0 ? (
                    <div className="card py-3 text-sm text-gray-400 text-center">No upcoming appointments.</div>
                  ) : upcomingBrief.map((s) => (
                    <div key={s.id} className="card py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{s.patient}</p>
                          <p className="text-xs text-brand">{s.time}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 italic">{s.task}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Patients Section */}
        {activeSection === 'patients' && (
          <div className="mt-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-800">Assigned Patients</h2>
                <button className="btn-primary text-sm py-2 px-4">Add Patient</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Patient Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Last Session</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Session Count</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Loading…</td></tr>
                    ) : patientRows.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No patients yet.</td></tr>
                    ) : patientRows.map((patient, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">{patient.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{patient.lastSession}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{patient.count} sessions</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${patient.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="mt-6 max-w-2xl">
            {/* Review status banner — DRAFT / PENDING / APPROVED / REJECTED */}
            {profile && profile.status === 'APPROVED' && (
              <div className="mb-4 rounded-xl border border-green-100 bg-green-50 px-4 py-3 text-sm text-green-700">
                ✓ Your profile is <span className="font-semibold">live</span> — patients can find and book you. Edits you save stay live.
              </div>
            )}
            {profile && profile.status === 'PENDING' && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                ⏳ Your profile is <span className="font-semibold">under review</span> by our team. You'll be notified by email once it's approved.
              </div>
            )}
            {profile && profile.status === 'REJECTED' && (
              <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>✗ Your application was <span className="font-semibold">not approved</span>.</p>
                {profile.rejectionReason && (
                  <p className="mt-1"><span className="font-semibold">Reason:</span> {profile.rejectionReason}</p>
                )}
                <p className="mt-1 text-red-600">You can update your profile below and submit it for review again.</p>
              </div>
            )}
            {profile && profile.status === 'DRAFT' && (
              <div className="mb-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Your profile isn't listed yet. Complete every field below (including a fee above 0) and submit it for review.
              </div>
            )}

            <div className="card mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Profile Settings</h3>
              {!pform ? (
                <p className="text-sm text-gray-400">Loading your profile…</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input type="text" value={pform.name} onChange={(e) => setField('name', e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Professional Title</label>
                    <input type="text" placeholder="e.g. Clinical Psychologist" value={pform.title} onChange={(e) => setField('title', e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                    <input type="text" placeholder="e.g. PSY-2024-001234" value={pform.licenseNumber} onChange={(e) => setField('licenseNumber', e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Track</label>
                    <select value={pform.track} onChange={(e) => setField('track', e.target.value)} className="input-field w-full">
                      <option value="MENTAL_HEALTH">Mental Health</option>
                      <option value="CAREER">Career</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <input type="text" placeholder="e.g. PhD Clinical Psychology, Aga Khan University" value={pform.credentials} onChange={(e) => setField('credentials', e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Specializations</label>
                    <input type="text" placeholder="e.g. Anxiety, Depression, CBT" value={pform.specializations} onChange={(e) => setField('specializations', e.target.value)} className="input-field w-full" />
                    <p className="text-xs text-gray-400 mt-1">Separate multiple with commas.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                    <input type="text" placeholder="e.g. English, Urdu" value={pform.languages} onChange={(e) => setField('languages', e.target.value)} className="input-field w-full" />
                    <p className="text-xs text-gray-400 mt-1">Separate multiple with commas.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fee (PKR)</label>
                    <input type="number" min="0" placeholder="e.g. 3000" value={pform.feePkr} onChange={(e) => setField('feePkr', e.target.value)} className="input-field w-full" />
                    <p className="text-xs text-gray-400 mt-1">Your per-session rate in Pakistani Rupees.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">About</label>
                    <textarea rows={4} placeholder="Tell patients about your background and approach." value={pform.about} onChange={(e) => setField('about', e.target.value)} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Methodology</label>
                    <textarea rows={3} placeholder="e.g. CBT, Mindfulness-Based Stress Reduction, Trauma-Focused therapy" value={pform.methodology} onChange={(e) => setField('methodology', e.target.value)} className="input-field w-full" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <button onClick={handleSaveProfile} disabled={savingProfile || !pform} className="btn-primary text-sm py-2 px-6 disabled:opacity-60 disabled:cursor-not-allowed">
                {savingProfile
                  ? 'Saving…'
                  : profile?.status === 'APPROVED' ? 'Save Changes' : 'Submit for Review'}
              </button>
              <button onClick={() => profile && setPform(profileToForm(profile))} disabled={savingProfile || !profile} className="btn-outline text-sm py-2 px-6 disabled:opacity-60 disabled:cursor-not-allowed">
                Cancel
              </button>
              {saveMsg === 'APPROVED' && <span className="text-sm text-green-600">Saved — your profile is live ✓</span>}
              {saveMsg === 'PENDING' && <span className="text-sm text-blue-600">Submitted — your profile is now under review.</span>}
              {saveMsg === 'DRAFT' && <span className="text-sm text-amber-600">Saved. Complete all fields (fee &gt; 0) to submit for review.</span>}
              {saveMsg && !['APPROVED', 'PENDING', 'DRAFT'].includes(saveMsg) && <span className="text-sm text-red-600">{saveMsg}</span>}
            </div>

            <div className="card mb-6">
              <h3 className="font-bold text-gray-800 mb-1">Availability Hours</h3>
              <p className="text-xs text-gray-400 mb-4">
                Set your weekly working hours. Patients can book 1-hour sessions inside them — your bookable calendar refreshes automatically.
              </p>
              {!avail ? (
                <p className="text-sm text-gray-400">Loading your availability…</p>
              ) : (
                <div className="space-y-3">
                  {WEEK_DAYS.map(({ day, label }) => (
                    <div key={day} className="flex items-center justify-between">
                      <label className="flex items-center gap-2.5 text-sm font-medium text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={avail[day].enabled}
                          onChange={(e) => setDay(day, { enabled: e.target.checked })}
                          className="w-4 h-4 accent-brand"
                        />
                        {label}
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={avail[day].start}
                          disabled={!avail[day].enabled}
                          onChange={(e) => setDay(day, { start: e.target.value })}
                          className={`input-field w-24 text-sm py-2 ${!avail[day].enabled ? 'opacity-50' : ''}`}
                        />
                        <span className="text-gray-400">—</span>
                        <input
                          type="time"
                          value={avail[day].end}
                          disabled={!avail[day].enabled}
                          onChange={(e) => setDay(day, { end: e.target.value })}
                          className={`input-field w-24 text-sm py-2 ${!avail[day].enabled ? 'opacity-50' : ''}`}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleSaveAvailability}
                      disabled={savingAvail}
                      className="btn-primary text-sm py-2 px-6 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {savingAvail ? 'Saving…' : 'Save Availability'}
                    </button>
                    {availMsg === 'saved' && <span className="text-sm text-green-600">Saved — your bookable calendar is updated ✓</span>}
                    {availMsg && availMsg !== 'saved' && <span className="text-sm text-red-600">{availMsg}</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <p className="text-xs text-gray-400">© 2024 MindBridge. Healing is a journey, not a destination.</p>
        </div>
      </main>
    </div>
  );
}
