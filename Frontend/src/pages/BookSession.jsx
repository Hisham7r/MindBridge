import { useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { therapists } from '../data/mockData';
import Footer from '../components/Footer';

const DAYS = ['S','M','T','W','T','F','S'];

function getMonthData(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevDays - i, current: false });
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, current: true });
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 2, current: false });
  return cells;
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function BookSession() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const therapist = therapists.find(t => t.id === parseInt(id));

  const today = new Date(2026, 3, 12);
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(3); // April
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(searchParams.get('slot') || null);
  const [showIntake, setShowIntake] = useState(false);
  const [outsideHoursMsg, setOutsideHoursMsg] = useState(false);

  if (!therapist) return <div className="p-10 text-center text-gray-500">Therapist not found.</div>;

  const cells = getMonthData(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDate(cell) {
    if (!cell.current) return;
    const d = new Date(viewYear, viewMonth, cell.day);
    if (d < today) return;
    setSelectedDate(d);
    setSelectedSlot(null);
    setOutsideHoursMsg(false);
  }

  const dateKey = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`
    : null;
  const availableSlots = dateKey && therapist.availableSlots[dateKey] ? therapist.availableSlots[dateKey] : [];
  const allDemoSlots = ['09:00 AM','10:00 AM','11:00 AM','12:00 PM','01:00 PM','02:00 PM','03:00 PM','04:00 PM'];

  function handleSlotClick(slot) {
    const hour = parseInt(slot.split(':')[0]);
    const isPM = slot.includes('PM');
    const h = isPM && hour !== 12 ? hour + 12 : (!isPM && hour === 12 ? 0 : hour);
    if (h < 9 || h >= 18) { setOutsideHoursMsg(true); setSelectedSlot(null); return; }
    setOutsideHoursMsg(false);
    setSelectedSlot(slot);
  }

  function handleProceed() {
    if (!selectedDate || !selectedSlot) return;
    navigate(`/payment/${therapist.id}?date=${dateKey}&slot=${encodeURIComponent(selectedSlot)}&therapist=${encodeURIComponent(therapist.name)}&fee=${therapist.fee}`);
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar + Slots */}
          <div className="lg:col-span-2">
            <div className="card">
              <h1 className="text-2xl font-bold text-gray-900">Schedule Session</h1>
              <p className="text-gray-500 text-sm mt-1">Choose a moment for your mental clarity.</p>

              {/* Calendar */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 mt-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{MONTH_NAMES[viewMonth]} {viewYear}</h3>
                  <div className="flex gap-2">
                    <button onClick={prevMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">‹</button>
                    <button onClick={nextMonth} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 transition-colors">›</button>
                  </div>
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {DAYS.map((d, i) => <div key={i} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {cells.map((cell, i) => {
                    const d = new Date(viewYear, viewMonth, cell.day);
                    const isPast = d < today;
                    const dk = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(cell.day).padStart(2,'0')}`;
                    const isSelected = selectedDate && cell.current && selectedDate.toDateString() === d.toDateString();
                    return (
                      <button
                        key={i}
                        onClick={() => selectDate(cell)}
                        disabled={!cell.current || isPast}
                        className={`py-2 rounded-full text-sm transition-all
                          ${!cell.current ? 'text-gray-300 cursor-default' : ''}
                          ${cell.current && isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                          ${isSelected ? 'bg-brand text-white font-bold shadow' : ''}
                          ${cell.current && !isPast && !isSelected ? 'text-gray-700 hover:bg-primary-50 hover:text-brand' : ''}
                        `}
                      >
                        {cell.day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Outside hours warning */}
              {outsideHoursMsg && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-red-600 text-sm">
                  ⚠️ Please select a time within working hours (9 AM – 6 PM).
                </div>
              )}

              {/* Time Slots */}
              {selectedDate && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Time Slots — {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {(availableSlots.length > 0 ? availableSlots : allDemoSlots).map(slot => {
                      const isBooked = !availableSlots.includes(slot) && availableSlots.length > 0;
                      return (
                        <button
                          key={slot}
                          onClick={() => !isBooked && handleSlotClick(slot)}
                          disabled={isBooked}
                          className={`${selectedSlot === slot ? 'slot-btn-selected' : isBooked ? 'slot-btn-disabled' : 'slot-btn'}`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {!selectedDate && (
                <p className="text-sm text-gray-400 text-center py-5">Select a date from the calendar above.</p>
              )}
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="space-y-4">
            <div className="card">
              <h3 className="font-bold text-gray-800 mb-4">Booking Summary</h3>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                  style={{ backgroundColor: therapist.color }}
                >
                  {therapist.initials}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{therapist.name}</p>
                  <p className="text-sm text-gray-500">{therapist.title}</p>
                </div>
              </div>
              <div className="border-t border-gray-50 pt-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">📅 Date</span>
                  <span className="font-semibold text-gray-800">
                    {selectedDate ? selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">⏰ Time</span>
                  <span className="font-semibold text-gray-800">{selectedSlot ? `${selectedSlot} (1 hr)` : '—'}</span>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-4 pt-4 flex items-center justify-between">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="text-xl font-bold text-brand">PKR {therapist.fee.toLocaleString()}</span>
              </div>
              <button
                onClick={handleProceed}
                disabled={!selectedDate || !selectedSlot}
                className={`w-full mt-4 py-3.5 rounded-xl font-semibold text-sm transition-all ${selectedDate && selectedSlot ? 'btn-primary' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                Proceed to Payment
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">🔒 Secure checkout via EasyPaisa</p>
            </div>

            <div className="card bg-green-50 border border-green-100">
              <div className="flex items-center gap-2 mb-2">
                <span>💡</span>
                <p className="font-semibold text-green-800 text-sm">Healing is a journey</p>
              </div>
              <p className="text-xs text-green-700">We recommend finding a quiet, private space with a stable internet connection for your session. Feel free to have a journal nearby.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
