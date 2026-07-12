import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, checkInWithToken, manualCheckIn, getEventAttendance, getEventRegistrations } from '../../api/events.api';
import { ArrowLeft, Loader2, ScanLine, ListChecks, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventCheckIn() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'manual'
  
  // Manual Check-in State
  const [registrations, setRegistrations] = useState([]);
  const [attendanceUserIds, setAttendanceUserIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [loadingRegs, setLoadingRegs] = useState(false);
  const [checkingIn, setCheckingIn] = useState(null); // userId being checked in

  // Token Scan State
  const [tokenInput, setTokenInput] = useState('');
  const [scanning, setScanning] = useState(false);

  async function fetchEvent() {
    try {
      const res = await getEventById(id);
      setEvent(res.data?.event);
    } catch {
      toast.error('Failed to load event');
    }
  }

  async function fetchConfirmedRegistrations() {
    try {
      setLoadingRegs(true);
      // Fetching all confirmed registrations to allow manual checkin
      // Ideally backend supports searching by name, but for now we fetch a batch
      const [regRes, attendanceRes] = await Promise.allSettled([
        getEventRegistrations(id, { status: 'confirmed', limit: 100 }),
        getEventAttendance(id, { limit: 500 })
      ]);
      if (regRes.status !== 'fulfilled') throw regRes.reason;
      setRegistrations(regRes.value.data?.registrations || []);
      const attendance = attendanceRes.status === 'fulfilled' ? attendanceRes.value.data?.attendance || [] : [];
      setAttendanceUserIds(new Set(attendance.map((row) => String(row.userId?._id || row.userId))));
    } catch {
      toast.error('Failed to load registrations');
    } finally {
      setLoadingRegs(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvent();
    if (activeTab === 'manual') {
      fetchConfirmedRegistrations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, activeTab]);

  const handleManualCheckIn = async (userId) => {
    try {
      setCheckingIn(userId);
      await manualCheckIn(id, { userId });
      toast.success('Check-in successful!');
      fetchConfirmedRegistrations(); // refresh
    } catch (err) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleTokenCheckIn = async (e) => {
    e.preventDefault();
    if (!tokenInput) return;
    
    try {
      setScanning(true);
      await checkInWithToken(id, { token: tokenInput });
      toast.success('Check-in successful');
      setTokenInput('');
      if (activeTab === 'manual') fetchConfirmedRegistrations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid or expired token');
    } finally {
      setScanning(false);
    }
  };

  // In a real app, integrate Html5QrcodeScanner here for camera scanning
  // For this prototype, we simulate a scanner with an input box where a hardware scanner would type.

  const filteredRegs = registrations.filter(r => 
    (r.userId?.fullName || r.userId?.username || r.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.userId?.email || r.user?.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/events/my-events')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to My Events
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-800">Event Check-in</h1>
        <p className="text-slate-500 mt-1">{event?.title || 'Loading...'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'scan' ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ScanLine className="w-5 h-5" /> QR Scan
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`flex-1 py-4 text-center font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === 'manual' ? 'bg-teal-50 text-teal-700 border-b-2 border-teal-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <ListChecks className="w-5 h-5" /> Manual Roll-call
          </button>
        </div>

        <div className="p-6 md:p-8">
          {activeTab === 'scan' && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-64 h-64 border-4 border-dashed border-slate-300 rounded-2xl mb-8 flex items-center justify-center bg-slate-50 relative overflow-hidden group">
                 {/* Placeholder for actual camera component */}
                 <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <p className="text-teal-700 font-bold px-4 text-center">Camera Scanner would mount here</p>
                 </div>
                 <ScanLine className="w-16 h-16 text-slate-300" />
              </div>

              <form onSubmit={handleTokenCheckIn} className="w-full max-w-sm">
                <label className="block text-sm font-medium text-slate-700 mb-2 text-center">Or use Hardware Scanner / Manual Token</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Scan or type token here"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={scanning || !tokenInput}
                    className="px-6 py-2 bg-teal-600 text-white rounded-lg font-bold hover:bg-teal-700 transition-colors disabled:opacity-50"
                  >
                    {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check In'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'manual' && (
            <div>
              <div className="mb-6">
                <input
                  type="text"
                  placeholder="Search attendee by name or email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {loadingRegs ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRegs.map(reg => {
                    const person = reg.userId || reg.user || {};
                    const personId = person._id || person.id || person;
                    const displayName = person.fullName || person.username || person.name || 'User';
                    const isCheckedIn = attendanceUserIds.has(String(personId));
                    return (
                      <div key={reg._id} className={`flex items-center justify-between p-4 rounded-xl border ${isCheckedIn ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-3">
                          {person.avatarUrl ? (
                            <img src={person.avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-800">{displayName}</p>
                            <p className="text-sm text-slate-500">{person.email}</p>
                          </div>
                        </div>
                        
                        <div>
                          {isCheckedIn ? (
                            <div className="flex items-center gap-1.5 text-green-700 font-bold px-4 py-2 bg-green-100 rounded-lg">
                              <CheckCircle2 className="w-5 h-5" /> Checked In
                            </div>
                          ) : (
                            <button
                              onClick={() => handleManualCheckIn(personId)}
                              disabled={checkingIn === personId}
                              className="px-6 py-2 bg-white border border-teal-200 text-teal-700 font-bold rounded-lg hover:bg-teal-50 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[120px]"
                            >
                              {checkingIn === personId ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check In'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  
                  {filteredRegs.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                      No confirmed attendees match your search.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
