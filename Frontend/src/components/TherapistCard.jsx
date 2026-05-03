import { Link } from 'react-router-dom';

function Avatar({ therapist }) {
  return (
    <div
      className="w-full h-48 flex items-center justify-center text-4xl font-bold text-white rounded-t-2xl"
      style={{ backgroundColor: therapist.color }}
    >
      {therapist.initials}
    </div>
  );
}

export default function TherapistCard({ therapist }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
      {/* Photo / Avatar */}
      <div className="relative">
        <Avatar therapist={therapist} />
        <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
          Available
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-base">{therapist.name}</h3>
            <p className="text-gray-500 text-sm">{therapist.title} · {therapist.credentials}</p>
          </div>
          <div className="text-right">
            <p className="text-brand font-bold text-sm">PKR {therapist.fee.toLocaleString()}</p>
            <p className="text-gray-400 text-xs">/session</p>
          </div>
        </div>

        {/* Specializations */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {therapist.specializations.slice(0, 3).map((s) => (
            <span key={s} className="badge badge-blue text-xs">{s}</span>
          ))}
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between mt-4 pb-4 border-b border-gray-50">
          <div className="flex items-center gap-1.5">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm font-semibold text-gray-800">{therapist.rating}</span>
            <span className="text-gray-400 text-xs">({therapist.reviews})</span>
          </div>
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-gray-700">{therapist.sessionsCount}</span> sessions
          </div>
          <div className="flex gap-1">
            {therapist.languages.map((l) => (
              <span key={l} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{l.slice(0, 2)}</span>
            ))}
          </div>
        </div>

        {/* Book button */}
        <div className="mt-4 flex gap-2">
          <Link
            to={`/therapist/${therapist.id}`}
            className="flex-1 text-center btn-outline text-sm py-2"
          >
            View Profile
          </Link>
          <Link
            to={`/book/${therapist.id}`}
            className="flex-1 text-center btn-primary text-sm py-2"
          >
            Book Now
          </Link>
        </div>
        {/* Urdu CTA */}
        <p className="text-center text-xs text-gray-400 mt-2" style={{fontFamily: 'serif'}}>بُکنگ کریں</p>
      </div>
    </div>
  );
}
