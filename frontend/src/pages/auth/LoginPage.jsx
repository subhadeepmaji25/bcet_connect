// src/pages/auth/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye, EyeOff, LogIn, Zap, CheckCircle,
  Briefcase, Users, BookOpen, Star, Shield
} from "lucide-react";
import toast from "react-hot-toast";
import { loginUser } from "../../api/auth.api";
import { useAuth } from "../../hooks/useAuth";

const FEATURES = [
  {
    icon: Briefcase,
    title: "Career Ecosystem",
    desc: "Explore internships, placements & opportunities curated for BCET.",
    color: "text-blue-500",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  {
    icon: BookOpen,
    title: "Mentorship",
    desc: "Connect one-on-one with faculty & senior alumni mentors.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
    border: "border-indigo-100",
  },
  {
    icon: Users,
    title: "Networking",
    desc: "Build meaningful connections across all batches and departments.",
    color: "text-purple-500",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // If navigated from Register, show success banner + pre-fill identifier
  const fromRegister = location.state?.registered;
  const prefillIdentifier = location.state?.identifier || "";

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm({
    defaultValues: { identifier: prefillIdentifier },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await loginUser(data);
      if (res.success) {
        await login(res);
        toast.success("Welcome back!");
        const userRole = res?.data?.user?.role || 'student';
        const status = res?.data?.user?.accountStatus || 'active';
        
        if (status !== 'active') {
          navigate("/account-status", { replace: true });
        } else if (userRole === 'admin') {
          navigate("/admin", { replace: true });
        } else if (userRole === 'student') {
          navigate("/jobs", { replace: true });
        } else {
          navigate("/jobs", { replace: true });
        }
      }
    } catch (err) {
      const msg = err?.message || "Login failed";
      setError("root", { message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-stretch bg-slate-50">
      
      {/* ── Left Hero Panel (md+) ── */}
      <div className="hidden md:flex flex-col justify-between w-[45%] lg:w-[40%] bg-slate-900 text-white p-10 xl:p-14 relative overflow-hidden">
        {/* Subtle background patterns */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-600 rounded-full blur-[100px] opacity-30 pointer-events-none" />
        
        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 border border-white/20 backdrop-blur-sm">
              <Zap className="w-5 h-5 text-primary-400" />
            </div>
            <span className="font-display text-xl font-bold tracking-tight">BCET Connect</span>
          </div>

          <div className="space-y-6 max-w-sm">
            <h2 className="font-display text-4xl xl:text-5xl font-bold leading-tight">
              Empowering your <br />
              <span className="text-primary-400">Career Journey</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed">
              The premier professional network for BCET students, faculty, and alumni.
            </p>
          </div>
        </div>

        {/* Social proof */}
        <div className="relative z-10 mt-12 flex items-center gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5">
          <div className="flex -space-x-3">
             <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-800">A</div>
             <div className="w-10 h-10 rounded-full bg-slate-300 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-800">S</div>
             <div className="w-10 h-10 rounded-full bg-slate-400 border-2 border-slate-900 flex items-center justify-center text-xs font-bold text-slate-800">R</div>
          </div>
          <div>
            <p className="text-sm font-medium text-white">Join 500+ members</p>
            <p className="text-xs text-slate-300 mt-0.5">Already accelerating their careers</p>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-10 xl:p-14 relative z-10 bg-slate-50">
        
        {/* Logo – mobile only */}
        <div className="md:hidden text-center mb-8 flex flex-col items-center">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 border border-primary-200 mb-3">
            <Zap className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">BCET Connect</h1>
        </div>

        <div className="w-full max-w-[420px] animate-slide-up">
          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-slate-200">
            {/* Header */}
            <div className="mb-8 text-center sm:text-left">
              <h2 className="font-display text-2xl font-bold text-slate-900">Welcome back</h2>
              <p className="text-slate-500 text-sm mt-1.5">Please enter your details to sign in</p>
            </div>

            {/* Success banner from Register */}
            {fromRegister && (
              <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 mb-6">
                <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <p className="text-emerald-800 text-sm font-medium">Account created successfully! Sign in to continue.</p>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              {/* Identifier */}
              <div>
                <label className="label">Email or Username</label>
                <input
                  id="identifier"
                  type="text"
                  placeholder="Enter your email or username"
                  autoComplete="username"
                  className={`input-field ${errors.identifier ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                  {...register("identifier", { required: "This field is required" })}
                />
                {errors.identifier && (
                  <p className="form-error">{errors.identifier.message}</p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="label !mb-0">Password</label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    className={`input-field pr-11 ${errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                    {...register("password", { required: "Password is required" })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    tabIndex={-1}
                  >
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="form-error">{errors.password.message}</p>
                )}
              </div>

              {/* Root error */}
              {errors.root && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <p className="text-red-600 text-sm font-medium text-center">{errors.root.message}</p>
                </div>
              )}

              {/* Submit */}
              <button
                id="login-submit"
                type="submit"
                disabled={loading}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-5 h-5" />
                )}
                {loading ? "Signing in..." : "Sign in to account"}
              </button>
            </form>
          </div>
          
          <p className="text-sm text-slate-500 text-center mt-8">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
