import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { therapistSchedule } from '../data/mockData';
import { useRole } from '../context/RoleContext';
import SidebarLink from '../components/SidebarLink';
import { THERAPIST_NAV } from '../config/sidebarConfig.jsx';

const statusBadge = {
  'in-progress': <span className="badge bg-blue-100 text-blue-700 text-xs">IN PROGRESS</span>,
  'upcoming': <span className="badge badge-gray text-xs">Upcoming</span>,
  'done': <span className="badge badge-green text-xs">Done</span>,
};

export default function TherapistDashboard() {
  const { setRole } = useRole();
  const navigate = useNavigate();
  const [zoomLinks, setZoomLinks] = useState({});
  const [activeSection, setActiveSection] = useState('overview');

  const today = new Date(2026, 3, 12); // April 12
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  function handleZoomLink(sessionId, value) {
    setZoomLinks(prev => ({ ...prev, [sessionId]: value }));
  }

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 fixed left-0 top-0 h-full z-10">
        <div className="mb-2 mt-1">
          <span className="text-lg font-bold text-brand">MindBridge</span>
        </div>
        <div className="flex items-center gap-2 mb-6 mt-1">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">AK</div>
          <div>
            <p className="text-xs text-gray-400">WELCOME BACK</p>
            <p className="text-sm font-bold text-gray-800">Dr. Arsalan Khan</p>
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
            onClick={() => { setRole('guest'); navigate('/'); }}
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
              {activeSection === 'earnings' && 'Earnings & Withdrawals'}
              {activeSection === 'resources' && 'Clinical Resources'}
              {activeSection === 'settings' && 'Settings'}
            </h1>
            <p className="text-gray-500 text-sm">
              {activeSection === 'overview' && `${dayName} — You have ${therapistSchedule.length} sessions today.`}
              {activeSection === 'appointments' && 'Manage your professional bookings and session links.'}
              {activeSection === 'patients' && 'View your assigned patients and their session notes.'}
              {activeSection === 'earnings' && 'Track your earnings and pending payments.'}
              {activeSection === 'resources' && 'Access guidelines, templates, and clinical tools.'}
              {activeSection === 'settings' && 'Manage your profile and availability hours.'}
            </p>
          </div>
          {activeSection === 'overview' && (
            <button className="btn-outline text-sm py-2">Weekly Report</button>
          )}
        </div>

        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6 mt-5">
              {[
                { label: 'Total Patients Today', value: '0', sub: 'sessions done' },
                { label: 'Weekly Sessions', value: '32', sub: 'this week' },
                { label: 'Pending Payments', value: 'PKR 14,250', sub: 'awaiting admin' },
              ].map((s, i) => (
                <div key={i} className="card">
                  <p className="text-xs font-semibold text-gray-400">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${i === 2 ? 'text-brand' : 'text-gray-900'}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
               ))}
            </div>

            {/* Small stat badges */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card flex items-center gap-3 py-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="text-xs text-gray-400">Pending patients in</p>
                  <p className="text-sm font-bold text-gray-800">45 mins</p>
                </div>
              </div>
              <div className="card flex items-center gap-3 py-3">
                <span className="text-2xl">🗓</span>
                <div>
                  <p className="text-xs text-gray-400">Sessions remaining</p>
                  <p className="text-sm font-bold text-gray-800">{therapistSchedule.filter(s => s.status !== 'done').length} today</p>
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Today's Schedule</h2>
                </div>
                <div className="space-y-3">
                  {therapistSchedule.map(session => (
                    <div key={session.id} className={`card border-l-4 ${session.status === 'in-progress' ? 'border-blue-400 bg-blue-50 border-blue-100' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {statusBadge[session.status]}
                            <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                          </div>
                          <p className="font-bold text-gray-900">{session.patient}</p>
                          <p className="text-xs text-gray-500">Session #{session.sessionNumber} — {session.type}</p>
                          {session.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">📝 {session.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button className="text-xs text-brand hover:underline font-medium">Open Notes</button>
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
                          disabled={!zoomLinks[session.id]}
                          className={`text-xs px-3 py-2 rounded-lg font-semibold transition-colors ${zoomLinks[session.id] ? 'bg-brand text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tomorrow + Notes */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Tomorrow</h2>
                  <button className="text-brand text-xs font-semibold hover:underline">View All</button>
                </div>
                <div className="space-y-2 mb-6">
                  {[
                    { patient: 'Sara Jelphed', time: '10:00 AM', task: 'Therapist Insight: review the journal entries.' },
                    { patient: 'Omar Session #2', time: '12:00 PM', task: 'I\'m noted has increased stress levels yesterday.' },
                  ].map((s, i) => (
                    <div key={i} className="card py-3">
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

                {/* Urdu notes block */}
                <div className="card bg-gray-50 border-dashed">
                  <p className="text-xs font-semibold text-gray-400 mb-2">Session Notes (English)</p>
                  <p className="text-sm leading-loose text-gray-700" style={{ fontFamily: 'serif', direction: 'ltr', textAlign: 'left' }}>
                    This session was very productive. The patient opened up about their concerns. We will focus on their career challenges in the next session.
                  </p>
                </div>
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
                  {therapistSchedule.map(session => (
                    <div key={session.id} className={`card border-l-4 ${session.status === 'in-progress' ? 'border-blue-400 bg-blue-50 border-blue-100' : 'border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {statusBadge[session.status]}
                            <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                          </div>
                          <p className="font-bold text-gray-900">{session.patient}</p>
                          <p className="text-xs text-gray-500">Session #{session.sessionNumber} — {session.type}</p>
                          {session.notes && (
                            <p className="text-xs text-gray-400 mt-1 italic">📝 {session.notes}</p>
                          )}
                        </div>
                        <div className="flex flex-col gap-1">
                          <button className="text-xs text-brand hover:underline font-medium">Open Notes</button>
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
                          disabled={!zoomLinks[session.id]}
                          className={`text-xs px-3 py-2 rounded-lg font-semibold transition-colors ${zoomLinks[session.id] ? 'bg-brand text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Upcoming Appointments</h2>
                  <button className="text-brand text-xs font-semibold hover:underline">View All</button>
                </div>
                <div className="space-y-2">
                  {[
                    { patient: 'Sara Jelphed', time: '10:00 AM', task: 'Therapist Insight: review the journal entries.' },
                    { patient: 'Omar Session #2', time: '12:00 PM', task: 'I\'m noted has increased stress levels yesterday.' },
                  ].map((s, i) => (
                    <div key={i} className="card py-3">
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
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: 'Michael Aris', lastSession: 'Oct 12, 2024', count: 5, status: 'Active' },
                      { name: 'Dr. Sarah Jenkins', lastSession: 'Oct 05, 2024', count: 8, status: 'Active' },
                      { name: 'Fatima Batool', lastSession: 'Oct 03, 2024', count: 3, status: 'On Hold' },
                    ].map((patient, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">{patient.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{patient.lastSession}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{patient.count} sessions</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${patient.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {patient.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <button className="text-brand hover:underline font-medium">View Notes</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Earnings Section */}
        {activeSection === 'earnings' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <p className="text-xs font-semibold text-gray-400">Total Earnings (This Month)</p>
              <p className="text-3xl font-bold mt-2 text-gray-900">PKR 45,750</p>
              <p className="text-xs text-gray-400 mt-1">From 18 sessions</p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold text-gray-400">Pending Payments</p>
              <p className="text-3xl font-bold mt-2 text-brand">PKR 14,250</p>
              <p className="text-xs text-gray-400 mt-1">Awaiting admin approval</p>
            </div>
            <div className="card">
              <p className="text-xs font-semibold text-gray-400">Withdrawn (YTD)</p>
              <p className="text-3xl font-bold mt-2 text-gray-900">PKR 180,000</p>
              <p className="text-xs text-gray-400 mt-1">4 successful withdrawals</p>
            </div>
            <div className="card lg:col-span-3">
              <h3 className="font-bold text-gray-800 mb-4">Withdrawal History</h3>
              <div className="space-y-2">
                {[
                  { date: 'Oct 15, 2024', amount: 'PKR 50,000', status: 'Completed', bank: 'HBL Account ***1234' },
                  { date: 'Sep 20, 2024', amount: 'PKR 45,000', status: 'Completed', bank: 'Easypaisa Wallet' },
                  { date: 'Aug 30, 2024', amount: 'PKR 40,000', status: 'Completed', bank: 'HBL Account ***1234' },
                ].map((tx, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{tx.date}</p>
                      <p className="text-xs text-gray-400">{tx.bank}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm text-gray-800">{tx.amount}</p>
                      <p className="text-xs text-green-600 font-medium">{tx.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Resources Section */}
        {activeSection === 'resources' && (
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[
                {
                  title: 'Session Templates',
                  desc: 'Pre-designed session structures for common issues.',
                  icon: (
                    <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01" />
                    </svg>
                  )
                },
                {
                  title: 'Clinical Guidelines',
                  desc: 'Internal protocols and best practices documentation.',
                  icon: (
                    <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  )
                },
                {
                  title: 'Emergency Procedures',
                  desc: 'Crisis intervention protocols and contacts.',
                  icon: (
                    <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )
                },
                {
                  title: 'Patient Psychology Tools',
                  desc: 'Assessments, worksheets, and diagnostic tools.',
                  icon: (
                    <svg className="w-8 h-8 text-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 011-1h1a2 2 0 100-4H7a1 1 0 01-1-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                  )
                },
              ].map((resource, i) => (
                <div key={i} className="card cursor-pointer hover:shadow-md hover:border-brand transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-3">{resource.icon}</div>
                      <p className="font-bold text-gray-800">{resource.title}</p>
                      <p className="text-sm text-gray-500 mt-1">{resource.desc}</p>
                    </div>
                  </div>
                  <button className="text-brand text-sm font-medium mt-4 flex items-center gap-1 hover:underline">
                    Access Resource
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="mt-6 max-w-2xl">
            <div className="card mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" defaultValue="Dr. Arsalan Khan" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input type="text" defaultValue="PSY-2024-001234" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input type="text" defaultValue="Cognitive Behavioral Therapy, Career Counseling" className="input-field w-full" />
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Availability Hours</h3>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{day}</span>
                    <div className="flex items-center gap-2">
                      <input type="time" defaultValue="09:00" className="input-field w-24 text-sm py-2" />
                      <span className="text-gray-400">—</span>
                      <input type="time" defaultValue="18:00" className="input-field w-24 text-sm py-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary text-sm py-2 px-6">Save Changes</button>
              <button className="btn-outline text-sm py-2 px-6">Cancel</button>
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
