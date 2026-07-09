// src/pages/auth/RegisterPage.jsx
import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  Eye, EyeOff, UserPlus, Zap, GraduationCap, BookOpen, Users,
  CheckCircle2, User, KeyRound, BadgeCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import { registerUser } from "../../api/auth.api";
import { USERNAME_REGEX } from "../../constants/appConstants";

/* ─── Role cards ─── */
const ROLES = [
  {
    value: "student",
    label: "Student",
    description: "For ongoing students",
    icon: GraduationCap,
    hint: "Roll number as Identity ID",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-slate-200",
    activeBorder: "border-blue-500",
    activeBg: "bg-blue-50/50",
  },
  {
    value: "faculty",
    label: "Faculty",
    description: "For BCET faculty members",
    icon: BookOpen,
    hint: "Employee ID as Identity ID",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-slate-200",
    activeBorder: "border-indigo-500",
    activeBg: "bg-indigo-50/50",
  },
  {
    value: "alumni",
    label: "Alumni",
    description: "For BCET graduates",
    icon: Users,
    hint: "Graduation roll number",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-slate-200",
    activeBorder: "border-purple-500",
    activeBg: "bg-purple-50/50",
  },
];

/* ─── Progress steps ─── */
const STEPS = [
  { label: "Role", icon: BadgeCheck },
  { label: "Profile", icon: User },
  { label: "Credentials", icon: KeyRound },
  { label: "Done", icon: CheckCircle2 },
];

/* ─── Password strength ─── */
function getPasswordStrength(password = "") {
  if (!password) return { level: 0, label: "", color: "" };
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSpecial = /[^a-zA-Z0-9]/.test(password);
  const longEnough = password.length >= 8;
  const score = [hasLower, hasUpper, hasDigit, hasSpecial, longEnough].filter(Boolean).length;

  if (score <= 2) return { level: 1, label: "Weak", color: "bg-red-500", textColor: "text-red-600" };
  if (score === 3) return { level: 2, label: "Medium", color: "bg-amber-500", textColor: "text-amber-600" };
  return { level: 3, label: "Strong", color: "bg-emerald-500", textColor: "text-emerald-600" };
}

/* ─── Step indicator ─── */
function StepIndicator({ currentStep }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-8 select-none">
      {STEPS.map((step, idx) => {
        const StepIcon = step.icon;
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        return (
          <div key={step.label} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted
                    ? "bg-primary-600 border-primary-600"
                    : isActive
                    ? "bg-white border-primary-500"
                    : "bg-slate-50 border-slate-200"
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-white" />
                ) : (
                  <StepIcon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-semibold transition-colors duration-300 uppercase tracking-wider
                  ${isCompleted || isActive ? "text-primary-700" : "text-slate-400"}`}
              >
                {step.label}
              </span>
            </div>
            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-10 sm:w-14 h-px mx-1 -mt-4 transition-all duration-500 ${
                  idx < currentStep ? "bg-primary-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Clean up identityId if empty
      if (!data.identityId?.trim()) delete data.identityId;
      const res = await registerUser(data);
      if (res.success) {
        toast.success("Account created! Please sign in to continue 🎉");
        navigate("/login", {
          state: { registered: true, identifier: data.email },
        });
      }
    } catch (err) {
      const msg = err?.message || "Registration failed";
      setError("root", { message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const currentRole = selectedRole || watch("role");
  const roleInfo = ROLES.find((r) => r.value === currentRole);

  const passwordValue = watch("password") || "";
  const strength = useMemo(() => getPasswordStrength(passwordValue), [passwordValue]);

  // Derive current step for progress indicator
  const fullName = watch("fullName") || "";
  const username = watch("username") || "";
  const email = watch("email") || "";
  const currentStep = useMemo(() => {
    if (!currentRole) return 0;
    if (!fullName || !username || !email) return 1;
    if (!passwordValue || passwordValue.length < 6) return 2;
    return 3;
  }, [currentRole, fullName, username, email, passwordValue]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 py-12 relative bg-[radial-gradient(circle_at_top_left,_rgba(15,118,110,0.08),_transparent_26%),linear-gradient(180deg,_#f8fbfd_0%,_#eef4fb_100%)]">
      
      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 mb-4">
          <Zap className="w-6 h-6 text-teal-700" />
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Join BCET Connect</h1>
        <p className="text-slate-500 text-sm mt-1.5 font-medium">Create your account to get started</p>
      </div>

      <div className="w-full max-w-lg relative z-10 animate-slide-up">
        {/* Progress indicator */}
        <StepIndicator currentStep={currentStep} />

        {/* Card */}
        <div className="page-shell p-8 sm:p-10">
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">

            {/* ── Role Selection ── */}
            <div>
              <label className="label">I am a...</label>
              <div className="grid grid-cols-3 gap-3">
                {ROLES.map(({ value, label, icon: Icon, color, bg, activeBorder, activeBg }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setSelectedRole(value);
                      setValue("role", value, { shouldValidate: true });
                    }}
                    className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 text-left
                      ${currentRole === value
                        ? `${activeBorder} ${activeBg} shadow-sm`
                        : `border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50`
                      }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all duration-200
                        ${currentRole === value ? bg : "bg-slate-100"}`}
                    >
                      <Icon className={`w-5 h-5 ${currentRole === value ? color : "text-slate-500"}`} />
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold ${currentRole === value ? color : "text-slate-700"}`}>
                        {label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
              <input type="hidden" {...register("role", { required: "Please select a role" })} />
              {errors.role && <p className="form-error">{errors.role.message}</p>}
            </div>

            {/* ── Full Name ── */}
            <div>
              <label className="label">Full Name</label>
              <input
                id="fullName"
                type="text"
                placeholder="Your full name"
                className={`input-field ${errors.fullName ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                {...register("fullName", {
                  required: "Full name is required",
                  minLength: { value: 2, message: "Name must be at least 2 characters" },
                  maxLength: { value: 100, message: "Name too long" },
                })}
              />
              {errors.fullName && <p className="form-error">{errors.fullName.message}</p>}
            </div>

            {/* ── Username & Email Row ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="label">Username</label>
                <input
                  id="username"
                  type="text"
                  placeholder="john.doe"
                  className={`input-field ${errors.username ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                  {...register("username", {
                    required: "Username is required",
                    pattern: {
                      value: USERNAME_REGEX,
                      message: "3-30 chars, lowercase/digits/dot/_",
                    },
                  })}
                />
                {errors.username && <p className="form-error">{errors.username.message}</p>}
              </div>
              <div>
                <label className="label">Email</label>
                <input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  autoComplete="email"
                  className={`input-field ${errors.email ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /^\S+@\S+\.\S+$/, message: "Invalid email" },
                  })}
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
            </div>

            {/* ── Password + strength ── */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPass ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  className={`input-field pr-11 ${errors.password ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                  {...register("password", {
                    required: "Password is required",
                    minLength: { value: 6, message: "Minimum 6 characters" },
                  })}
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
              {errors.password && <p className="form-error">{errors.password.message}</p>}

              {/* Strength bar */}
              {passwordValue.length > 0 && (
                <div className="mt-2.5 space-y-1.5">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-400 ${
                          strength.level >= n ? strength.color : "bg-slate-100"
                        }`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${strength.textColor}`}>
                    {strength.label} password
                  </p>
                </div>
              )}
            </div>

            {/* ── Identity ID ── */}
            <div>
              <label className="label flex items-center justify-between">
                Identity ID
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Optional</span>
              </label>
              <input
                id="identityId"
                type="text"
                placeholder={roleInfo?.hint || "Roll number / Employee ID"}
                className="input-field uppercase placeholder-normal"
                style={{ textTransform: "uppercase" }}
                {...register("identityId")}
              />
              {roleInfo && (
                <p className="text-[11px] font-medium text-slate-500 mt-1.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> {roleInfo.hint}
                </p>
              )}
            </div>

            {/* Root Error */}
            {errors.root && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <p className="text-red-600 text-sm font-medium text-center">{errors.root.message}</p>
              </div>
            )}

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-8">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign in instead
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
