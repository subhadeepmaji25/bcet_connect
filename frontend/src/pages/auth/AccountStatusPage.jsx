import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, AlertOctagon, Clock, XCircle, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AccountStatusPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user || user.accountStatus === 'active') {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold text-slate-100 mb-4">Your account is active.</h2>
        <button onClick={() => navigate('/jobs')} className="btn-primary">Go to Dashboard</button>
      </div>
    );
  }

  const statusConfig = {
    pending: {
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      title: 'Account Pending Approval',
      message: 'Your account is currently under review by our administration team. This process usually takes 24-48 hours. You will receive an email once approved.',
    },
    rejected: {
      icon: XCircle,
      color: 'text-red-500',
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      title: 'Account Request Declined',
      message: 'Unfortunately, your account request has been declined. Please contact the administration if you believe this was a mistake.',
    },
    suspended: {
      icon: AlertOctagon,
      color: 'text-orange-500',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
      title: 'Account Suspended',
      message: 'Your account has been temporarily suspended due to a violation of our terms of service or unusual activity. Please contact support.',
    }
  };

  const config = statusConfig[user.accountStatus] || {
    icon: ShieldAlert,
    color: 'text-slate-400',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
    title: 'Account Restricted',
    message: 'Your account is currently restricted. Please contact support.',
  };

  const Icon = config.icon;

  return (
    <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`max-w-md w-full glass-card p-8 text-center border-2 ${config.border} ${config.bg}`}
      >
        <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 bg-[#0f0f1a] shadow-inner`}>
          <Icon className={`w-10 h-10 ${config.color}`} />
        </div>
        <h1 className="text-2xl font-black text-slate-100 mb-3 tracking-tight">
          {config.title}
        </h1>
        <p className="text-slate-400 font-medium leading-relaxed mb-8">
          {config.message}
        </p>
        <div className="flex flex-col gap-3">
          <button onClick={() => window.location.href = 'mailto:support@bcetconnect.com'} className="btn-primary w-full shadow-lg">
            Contact Support
          </button>
          <button onClick={handleLogout} className="btn-ghost w-full flex items-center justify-center gap-2 hover:bg-white/5">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
}
