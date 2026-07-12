import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Loader2 } from 'lucide-react';
import { generateAttendanceToken } from '../../../api/events.api';
import toast from 'react-hot-toast';

export default function QRCodeModal({ isOpen, onClose, eventId, eventTitle }) {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);

  async function fetchToken() {
    try {
      setLoading(true);
      const res = await generateAttendanceToken(eventId);
      setToken(res.data?.token || null);
    } catch (err) {
      console.error('Failed to generate token', err);
      toast.error('Failed to load QR code for check-in');
      onClose();
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isOpen && eventId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchToken();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, eventId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Your Check-in QR Code</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 flex flex-col items-center">
          <p className="text-sm font-medium text-slate-500 mb-6 text-center line-clamp-2">
            {eventTitle}
          </p>
          
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-6 flex justify-center items-center min-h-[200px] min-w-[200px]">
            {loading ? (
              <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
            ) : token ? (
              <QRCodeSVG 
                value={token} 
                size={200}
                level="M"
                includeMargin={true}
                fgColor="#0f172a" 
              />
            ) : (
              <p className="text-slate-400 text-sm">Failed to load QR</p>
            )}
          </div>
          
          <p className="text-sm text-center text-slate-500">
            Show this QR code to the event organizer at the venue to check-in.
          </p>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-100">
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-white border border-slate-200 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
