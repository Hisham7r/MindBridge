import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { patientSessions, pastSessions } from '../data/mockData';
import { useRole } from '../context/RoleContext';
import SidebarLink from '../components/SidebarLink';

const moodColors = {
  green: 'badge-green',
  blue: 'badge-blue',
  gray: 'badge-gray',
  red: 'badge-red',
};

export default function PatientDashboard() {
  const { currentUser, role, setRole, setCurrentUser } = useRole();
  const [activeSection, setActiveSection] = useState('overview');
  const navigate = useNavigate();
  const [scheduleTab, setScheduleTab] = useState('upcoming');
  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: '+92 300 000 0000',
    language: 'English',
    notifications: true,
    sessionReminders: true,
  });
  const [profileSaved, setProfileSaved] = useState(false);

  const patientPayments = [ 
    {
      id: 1,
      therapist: 'Dr. Sarah Jenkins',
      therapistInitials: 'SJ',
      therapistColor: '#22C55E',
      date: '2026-04-10',
      amount: 'PKR 4,750',
      txnId: 'TXN-8821934',
      status: 'approved',
      sessionType: 'Mental Health Therapy',
    },
    {
      id: 2,
      therapist: 'Career Counseling',
      therapistInitials: 'CC',
      therapistColor: '#3B82F6',
      date: '2026-04-08',
      amount: 'PKR 3,450',
      txnId: 'TXN-7743821',
      status: 'pending',
      sessionType: 'Career Guidance',
    },
    {
      id: 3,
      therapist: 'Dr. Alizeh Shah',
      therapistInitials: 'AS',
      therapistColor: '#8B5CF6',
      date: '2026-03-29',
      amount: 'PKR 5,750',
      txnId: 'TXN-6612047',
      status: 'approved',
      sessionType: 'Trauma Therapy',
    },
  ];

  const sectionMeta = {
    overview: { title: 'Patient Dashboard', subtitle: 'Manage your healing journey and therapist sessions.' },
    schedule: { title: 'My Schedule', subtitle: 'All your booked therapy sessions.' },
    payments: { title: 'My Payments', subtitle: 'Track your session payments and verification status.' },
    progress: { title: 'My Progress', subtitle: 'Track your wellness journey and session milestones.' },
    settings: { title: 'Settings', subtitle: 'Manage your profile and preferences.' },
  };

  const handleProfileSave = () => {
    setProfileSaved(true);
    setCurrentUser({
      ...currentUser,
      name: profileForm.name,
      email: profileForm.email,
      initials: profileForm.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
    });
    setTimeout(() => setProfileSaved(false), 3000);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 fixed left-0 top-0 h-full z-10">
        <div className="flex items-center gap-3 mb-8 mt-2">
          <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center overflow-hidden border-2 border-white shadow">
            <span className="font-bold text-primary-700">{currentUser.initials}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Welcome back</p>
            <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-400">Your mental sanctuary</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarLink
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
            label="Overview"
            active={activeSection === 'overview'}
            onClick={() => setActiveSection('overview')}
          />
          <SidebarLink
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-90">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 18h.01"></path>
                <path d="M12 18h.01"></path>
                <path d="M16 18h.01"></path>
              </svg>
            }
            label="Schedule"
            active={activeSection === 'schedule'}
            onClick={() => setActiveSection('schedule')}
          />
          <SidebarLink
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Payments"
            active={activeSection === 'payments'}
            onClick={() => setActiveSection('payments')}
          />
          <SidebarLink
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
            label="Progress"
            active={activeSection === 'progress'}
            onClick={() => setActiveSection('progress')}
          />
          <SidebarLink
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Settings"
            active={activeSection === 'settings'}
            onClick={() => setActiveSection('settings')}
          />
        </nav>

        <div className="mt-4 space-y-3">

          <Link to="/book/1" className="btn-primary w-full text-center py-2.5 text-sm block">
            Book Session
          </Link>

          <button
            onClick={() => { setRole('guest'); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors w-full"
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 flex flex-col">
        {/* Reminder Banner */}
        <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-lg">📅</span>
            <div>
              <p className="text-sm font-semibold text-green-800">Your session is tomorrow at 5 PM</p>
              <p className="text-xs text-green-600" style={{ fontFamily: 'serif' }}>آپ کا سیشن کل شام 5 بجے ہے</p>
            </div>
          </div>
          <button className="bg-gray-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors">
            VIEW DETAILS
          </button>
        </div>

        <div className="p-8">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{sectionMeta[activeSection].title}</h1>
              <p className="text-gray-500 mt-1">{sectionMeta[activeSection].subtitle}</p>
            </div>
            {activeSection === 'overview' && (
              <div className="text-right">
                <p className="text-xs text-brand font-semibold uppercase tracking-widest">CURRENT STREAK</p>
                <div className="flex items-center gap-2 mt-1 justify-end">
                  <p className="text-3xl font-bold text-gray-900">12 Days</p>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <>
              {/* Upcoming Sessions */}
              <section className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800 text-lg">Upcoming Sessions</h2>
                  <button className="text-brand text-sm font-semibold hover:underline">View All</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patientSessions.map(session => (
                    <div key={session.id} className="card flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                        style={{ backgroundColor: session.therapistColor }}
                      >
                        {session.therapistInitials}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{session.therapist}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          ⏰ {session.status === 'upcoming' ? `Tomorrow, ${session.time}` : session.date + ' • ' + session.time}
                        </p>
                      </div>
                      {session.zoomLink ? (
                        <a href={session.zoomLink} target="_blank" rel="noreferrer" className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
                          📹 Join Session
                        </a>
                      ) : (
                        <button className="btn-outline text-xs py-2 px-3">Reschedule</button>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Past Sessions */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800 text-lg">Past Sessions History</h2>
                  <div className="flex gap-2">
                    <button className="badge badge-gray cursor-pointer hover:bg-gray-200">Filter</button>
                    <button className="badge badge-gray cursor-pointer hover:bg-gray-200">Download CSV</button>
                  </div>
                </div>
                <div className="card overflow-hidden p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="text-left px-6 py-4">Therapist</th>
                        <th className="text-left px-4 py-4">Date</th>
                        <th className="text-left px-4 py-4">Duration</th>
                        <th className="text-left px-4 py-4">Mood Post-Session</th>
                        <th className="text-left px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pastSessions.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                                {s.initials}
                              </div>
                              <span className="font-medium text-sm text-gray-800">{s.therapist}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{s.date}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{s.duration}</td>
                          <td className="px-4 py-4">
                            <span className={`badge ${moodColors[s.moodColor]}`}>
                              {s.moodColor === 'green' ? '😊' : s.moodColor === 'blue' ? '⚡' : '😴'} {s.mood}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button className="text-brand text-sm font-semibold hover:underline">Notes</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}

          {/* SECTION 2: SCHEDULE */}
          {activeSection === 'schedule' && (
            <section>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setScheduleTab('upcoming')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    scheduleTab === 'upcoming'
                      ? 'bg-brand text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setScheduleTab('past')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    scheduleTab === 'past'
                      ? 'bg-brand text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'
                  }`}
                >
                  Past
                </button>
              </div>

              {scheduleTab === 'upcoming' && (
                <div className="space-y-4">
                  {patientSessions.map(session => (
                    <div key={session.id} className="card flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                        style={{ backgroundColor: session.therapistColor }}
                      >
                        {session.therapistInitials}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{session.therapist}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{session.type}</p>
                        <p className="text-xs text-gray-500 mt-1">📅 {session.date} at {session.time}</p>
                        <p className="text-xs text-brand mt-1">Session #{session.sessionNumber}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        {session.zoomLink ? (
                          <a href={session.zoomLink} target="_blank" rel="noreferrer" className="btn-primary text-xs py-2 px-3 text-center">
                            📹 Join
                          </a>
                        ) : (
                          <span className="badge badge-gray text-xs">Zoom link pending</span>
                        )}
                        <button className="btn-outline text-xs py-1.5 px-3">Cancel</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {scheduleTab === 'past' && (
                <div className="card overflow-hidden p-0">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="text-left px-6 py-4">Therapist</th>
                        <th className="text-left px-4 py-4">Date</th>
                        <th className="text-left px-4 py-4">Duration</th>
                        <th className="text-left px-4 py-4">Mood Post-Session</th>
                        <th className="text-left px-4 py-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {pastSessions.map(s => (
                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                                {s.initials}
                              </div>
                              <span className="font-medium text-sm text-gray-800">{s.therapist}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{s.date}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{s.duration}</td>
                          <td className="px-4 py-4">
                            <span className={`badge ${moodColors[s.moodColor]}`}>
                              {s.moodColor === 'green' ? '😊' : s.moodColor === 'blue' ? '⚡' : '😴'} {s.mood}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <button className="text-brand text-sm font-semibold hover:underline">Notes</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {/* SECTION 3: PAYMENTS */}
          {activeSection === 'payments' && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">PKR 10,500</p>
                  <p className="text-xs text-gray-500 mt-1">2 approved sessions</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">1 Payment</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting admin review</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Next Session Fee</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">PKR 3,200</p>
                  <p className="text-xs text-gray-500 mt-1">Career Counseling, Apr 18</p>
                </div>
              </div>

              <div className="card overflow-hidden p-0 mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left px-6 py-4">Session</th>
                      <th className="text-left px-4 py-4">Date</th>
                      <th className="text-left px-4 py-4">Amount</th>
                      <th className="text-left px-4 py-4">Txn ID</th>
                      <th className="text-left px-4 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {patientPayments.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: p.therapistColor }}
                            >
                              {p.therapistInitials}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-800">{p.therapist}</p>
                              <p className="text-xs text-gray-400">{p.sessionType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{p.date}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-800">{p.amount}</td>
                        <td className="px-4 py-4 text-xs font-mono text-gray-500">{p.txnId}</td>
                        <td className="px-4 py-4">
                          {p.status === 'approved' && <span className="badge badge-green">✓ Approved</span>}
                          {p.status === 'pending' && <span className="badge bg-yellow-100 text-yellow-700">⏳ Pending Review</span>}
                          {p.status === 'rejected' && <span className="badge badge-red">✗ Rejected</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-800">ℹ️ Payments are verified within 2 hours during working hours. You will receive a confirmation once your session is confirmed.</p>
              </div>
            </section>
          )}

          {/* SECTION 4: PROGRESS */}
          {activeSection === 'progress' && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">12 Days 🔥</p>
                  <p className="text-xs text-gray-500 mt-1">Keep it up!</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Total Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">6</p>
                  <p className="text-xs text-gray-500 mt-1">Since joining MindBridge</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Avg. Session Mood</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">😊 Positive</p>
                  <p className="text-xs text-gray-500 mt-1">Based on last 3 sessions</p>
                </div>
              </div>

              <div className="card mb-6">
                <h3 className="font-bold text-gray-800 mb-4">Recent Mood Log</h3>
                <div className="space-y-4">
                  {pastSessions.map((s, idx) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-400">{s.date}</p>
                        <div className="flex items-center gap-4 flex-1 ml-4">
                          <p className="text-sm font-medium text-gray-800">{s.therapist}</p>
                          <span className={`badge ${moodColors[s.moodColor]}`}>
                            {s.moodColor === 'green' ? '😊' : s.moodColor === 'blue' ? '⚡' : '😴'} {s.mood}
                          </span>
                        </div>
                      </div>
                      {idx < pastSessions.length - 1 && <div className="border-b border-gray-100 mt-4"></div>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 className="font-bold text-gray-800 mb-4">Your Milestones</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-start gap-3">
                      <span className="text-lg">✅</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">First Session Completed</p>
                        <p className="text-xs text-gray-400 mt-1">You took the first step. That's the hardest part.</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-gray-100"></div>
                  <div>
                    <div className="flex items-start gap-3">
                      <span className="text-lg">✅</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">5 Sessions Milestone</p>
                        <p className="text-xs text-gray-400 mt-1">Consistency is healing. You've completed 5 sessions.</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-gray-100"></div>
                  <div>
                    <div className="flex items-start gap-3">
                      <span className="text-lg">🔒</span>
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-gray-400">10 Sessions Badge</p>
                        <p className="text-xs text-gray-400 mt-1">Complete 10 sessions to unlock this milestone.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* SECTION 5: SETTINGS */}
          {activeSection === 'settings' && (
            <section className="max-w-2xl">
              <div className="card mb-6">
                <h3 className="font-bold text-gray-800 mb-6">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Preferred Language</label>
                    <select
                      value={profileForm.language}
                      onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                      className="input-field w-full"
                    >
                      <option>English</option>
                      <option>Urdu</option>
                      <option>Punjabi</option>
                    </select>
                  </div>
                  <button onClick={handleProfileSave} className="btn-primary text-sm py-2 px-6 mt-4">
                    Save Changes
                  </button>
                  {profileSaved && <p className="text-xs text-green-600 mt-2">✅ Profile updated successfully!</p>}
                </div>
              </div>

              <div className="card">
                <h3 className="font-bold text-gray-800 mb-6">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Session Reminders</p>
                      <p className="text-xs text-gray-500 mt-1">Get notified 24 hours before your session.</p>
                    </div>
                    <button
                      onClick={() => setProfileForm({ ...profileForm, sessionReminders: !profileForm.sessionReminders })}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        profileForm.sessionReminders ? 'bg-brand' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
                          profileForm.sessionReminders ? 'right-1' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>
                  <div className="border-b border-gray-100"></div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-800">Platform Notifications</p>
                      <p className="text-xs text-gray-500 mt-1">Receive updates about MindBridge features.</p>
                    </div>
                    <button
                      onClick={() => setProfileForm({ ...profileForm, notifications: !profileForm.notifications })}
                      className={`w-11 h-6 rounded-full relative transition-colors ${
                        profileForm.notifications ? 'bg-brand' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-all ${
                          profileForm.notifications ? 'right-1' : 'left-1'
                        }`}
                      ></div>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray-100 px-8 py-6 bg-white">
          <div className="grid grid-cols-3 gap-8 text-sm">
            <div>
              <span className="font-bold text-brand">MindBridge</span>
              <p className="text-gray-500 mt-1 text-xs">Healing is a journey, not a destination. Your mental sanctuary, available 24/7.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Resources</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer">Urdu Support</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer mt-1">Crisis Resources</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer mt-1">Contact Us</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Legal</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer">Privacy Policy</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer mt-1">Terms of Service</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-400">© 2026 MindBridge. Healing is a journey, not a destination.</p>
            <div className="flex gap-2">
              <span className="text-lg cursor-pointer">🌐</span>
              <span className="text-lg cursor-pointer">💙</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
