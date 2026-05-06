import { useState, useRef } from 'react';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

export default function Payment() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const therapistName = searchParams.get('therapist') || 'Dr. Sarah Ahmed';
  const fee = parseInt(searchParams.get('fee') || '4500');
  const slot = searchParams.get('slot') || '2:00 PM';
  const date = searchParams.get('date') || '2026-04-14';

  const serviceFee = 250;
  const total = fee + serviceFee;

  const [txnId, setTxnId] = useState('');
  const [file, setFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="card max-w-md w-full text-center p-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-5">✅</div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Submitted!</h2>
          <p className="text-gray-500 mt-2">Your payment is awaiting verification. Sessions are confirmed within 2 hours during working hours.</p>
          <div className="bg-gray-50 rounded-xl p-4 mt-5 text-left space-y-2">
            <p className="text-sm text-gray-600"><span className="text-gray-400">Therapist:</span> <strong>{therapistName}</strong></p>
            <p className="text-sm text-gray-600"><span className="text-gray-400">Date & Time:</span> <strong>{date} at {slot}</strong></p>
            <p className="text-sm text-gray-600"><span className="text-gray-400">Amount:</span> <strong className="text-brand">PKR {total.toLocaleString()}</strong></p>
          </div>
          <p className="text-xs text-gray-400 mt-4">You'll receive an SMS confirmation once your payment is approved.</p>
          <button onClick={() => navigate('/dashboard/patient')} className="btn-primary w-full mt-6 py-3.5">
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Breadcrumb */}
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-2">
        <p className="text-sm text-gray-400">
          <span className="hover:text-brand cursor-pointer" onClick={() => navigate(-1)}>Sessions</span>
          <span className="mx-2">›</span>
          <span className="text-brand font-medium">Payment</span>
        </p>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Secure Payment</h1>
        <p className="text-gray-500 text-sm mt-1">Complete your booking for a session with <strong>{therapistName}</strong>.</p>
      </div>

      <div className="max-w-4xl mx-auto px-4 pb-12">
        {/* Booking Summary + Status */}
        <div className="card mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">💳</span>
                <h2 className="font-semibold text-gray-700">Booking Summary</h2>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Therapy Session (60 min)</span>
                  <span>PKR {fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Service Fee</span>
                  <span>PKR {serviceFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-900 pt-3 border-t border-gray-100 text-base">
                  <span>Total Amount</span>
                  <span className="text-brand">PKR {total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-lg">ℹ️</span>
                <h2 className="font-semibold text-gray-700">Current Status</h2>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <p className="font-semibold text-green-700">Payment Pending</p>
                </div>
                <p className="text-xs text-green-600 mt-1">Awaiting verification</p>
              </div>
              <p className="text-xs text-gray-400 mt-3">Sessions are confirmed within 2 hours of payment verification during working hours.</p>
            </div>
          </div>
        </div>

        {/* Main form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
            {/* Instructions */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">EP</div>
                <h3 className="font-semibold text-gray-700">Easypaisa Instructions</h3>
              </div>
              <div className="space-y-5">
                {[
                  { n: 1, title: 'Send Payment', desc: `Open Easypaisa App and send exactly PKR ${total.toLocaleString()} to the number below:` },
                  { n: 2, title: 'Get Transaction ID', desc: 'After payment, you will receive an SMS from 3737 with a Transaction ID.' },
                  { n: 3, title: 'Verify Here', desc: 'Enter the ID and upload the screenshot in the form to your right.' },
                ].map(step => (
                  <div key={step.n} className="flex gap-3">
                    <div className="w-7 h-7 rounded-full bg-primary-100 text-brand font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {step.n}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{step.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                      {step.n === 1 && (
                        <div className="flex items-center gap-2 mt-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 w-fit">
                          <span className="font-mono font-bold text-brand text-sm">0301-1234567</span>
                          <button type="button" onClick={() => navigator.clipboard.writeText('03011234567')} className="text-gray-400 hover:text-brand text-xs transition-colors">📋</button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Upload form */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Transaction ID</label>
                  <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>ٹرانزیکشن آئی ڈی درج کریں</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 12345678901"
                  value={txnId}
                  onChange={e => setTxnId(e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Upload Screenshot</label>
                  <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>پیمنٹ اسکرین شاٹ اپلوڈ کریں</span>
                </div>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
                    ${dragging ? 'border-brand bg-primary-50' : 'border-gray-200 hover:border-brand hover:bg-gray-50'}
                    ${file ? 'bg-green-50 border-green-300' : ''}`}
                >
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden" onChange={e => setFile(e.target.files[0])} required />
                  {file ? (
                    <>
                      <div className="text-3xl mb-2">✅</div>
                      <p className="text-sm font-medium text-green-700">{file.name}</p>
                      <p className="text-xs text-gray-400 mt-1">Click to replace</p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl mb-2">☁️</div>
                      <p className="text-sm font-medium text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-400 mt-1">PNG, JPG or PDF (max. 5MB)</p>
                    </>
                  )}
                </div>
              </div>
              <button type="submit" className="btn-primary w-full py-4 text-base">
                Submit Payment →
              </button>
              <p className="text-center text-xs text-gray-400">🔒 Encrypted & Secure Payment</p>
            </div>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
