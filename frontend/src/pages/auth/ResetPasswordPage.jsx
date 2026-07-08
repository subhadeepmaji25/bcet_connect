// src/pages/auth/ResetPasswordPage.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  KeyRound, Zap, ArrowLeft, Eye, EyeOff,
  Mail, ShieldCheck, Lock, CheckCircle2,
  Fingerprint, Lightbulb,
} from "lucide-react";
import toast from "react-hot-toast";
import { resetPassword } from "../../api/auth.api";

/* ─── Step config ─── */
const STEPS = [
  { id: 0, label: "Identify", icon: Mail, desc: "Enter your account identifier" },
  { id: 1, label: "Verify", icon: ShieldCheck, desc: "Enter the admin reset secret" },
  { id: 2, label: "Reset", icon: Lock, desc: "Set your new password" },
];

/* ─── Animated step progress ─── */
function ResetStepIndicator({ currentStep, success }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-7 select-none">
      {STEPS.map((step, idx) => {
        const StepIcon = step.icon;
        const isCompleted = success ? true : idx < currentStep;
        const isActive = !success && idx === currentStep;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted
                    ? "bg-primary-600 border-primary-600"
                    : isActive
                    ? "bg-white border-primary-500"
                    : "bg-slate-50 border-slate-200"
                  }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-white" />
                ) : (
                  <StepIcon className={`w-4 h-4 ${isActive ? "text-primary-600" : "text-slate-400"}`} />
                )}
              </div>
              <span
                className={`text-[10px] mt-1.5 font-semibold transition-colors duration-300 uppercase tracking-wider ${
                  isCompleted || isActive ? "text-primary-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`w-12 sm:w-16 h-px mx-1 -mt-4 transition-all duration-500 ${
                  idx < currentStep || success ? "bg-primary-500" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, formState: { errors }, setError, watch } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await resetPassword(data);
      if (res.success) {
        setSuccess(true);
        toast.success("Password reset successful!");
      }
    } catch (err) {
      const msg = err?.message || "Reset failed";
      setError("root", { message: msg });
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // Advance UI step as fields are filled
  const identifierVal = watch("identifier") || "";
  const secretVal = watch("resetSecret") || "";
  const displayStep = success ? 3 : identifierVal ? (secretVal ? 2 : 1) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative bg-slate-50">

      <div className="w-full max-w-md relative z-10 animate-slide-up">

        {/* Header */}
        <div className="text-center mb-8 relative z-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 border border-primary-200 mb-4">
            <Fingerprint className="w-6 h-6 text-primary-600" />
          </div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1.5 font-medium">Recover access to your BCET Connect account</p>
        </div>

        {/* Step indicator */}
        <ResetStepIndicator currentStep={displayStep} success={success} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 sm:p-10">

            {success ? (
              /* ── Success state ── */
              <div className="text-center py-4">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-emerald-100 border border-emerald-200">
                  <KeyRound className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Password Reset!</h3>
                <p className="text-slate-500 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
                  Your password has been updated successfully. You can now sign in with your new credentials.
                </p>
                <Link
                  to="/login"
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </Link>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <div className="mb-8 text-center sm:text-left">
                  <h2 className="font-display text-xl font-bold text-slate-900">Account Recovery</h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {displayStep === 0
                      ? "Start by entering your account identifier"
                      : displayStep === 1
                      ? "Now enter the secret provided by your admin"
                      : "Almost there — set your new password"}
                  </p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

                  {/* Identifier */}
                  <div>
                    <label className="label">Email or Username</label>
                    <input
                      type="text"
                      placeholder="Your identifier"
                      className={`input-field ${errors.identifier ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                      {...register("identifier", { required: "Identifier is required" })}
                    />
                    {errors.identifier && <p className="form-error">{errors.identifier.message}</p>}
                  </div>

                  {/* Reset Secret */}
                  <div>
                    <label className="label flex items-center justify-between">
                      Reset Secret
                    </label>
                    <input
                      type="text"
                      placeholder="Admin-provided reset secret"
                      className={`input-field ${errors.resetSecret ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                      {...register("resetSecret", { required: "Reset secret is required" })}
                    />
                    <div className="flex items-start gap-1.5 mt-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-[11px] font-medium text-slate-500">Contact admin for the reset secret</p>
                    </div>
                    {errors.resetSecret && <p className="form-error">{errors.resetSecret.message}</p>}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="label">New Password</label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        placeholder="Enter new password"
                        className={`input-field pr-11 ${errors.newPassword ? "border-red-300 focus:border-red-500 focus:ring-red-200" : ""}`}
                        {...register("newPassword", {
                          required: "New password is required",
                          minLength: { value: 6, message: "At least 6 characters" },
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
                    {errors.newPassword && <p className="form-error">{errors.newPassword.message}</p>}
                  </div>

                  {/* Root error */}
                  {errors.root && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                      <p className="text-red-600 text-sm font-medium text-center">{errors.root.message}</p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <KeyRound className="w-5 h-5" />
                    )}
                    {loading ? "Resetting..." : "Reset Password"}
                  </button>
                </form>

                <div className="mt-8 pt-6 border-t border-slate-100 text-center">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-primary-600 hover:text-primary-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Sign In
                  </Link>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
}
