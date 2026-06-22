"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

// --- Constants & Configurations ---

const PASSWORD_REQUIREMENTS = [
  { test: (p) => p.length >= 6, label: "At least 6 characters" },
  { test: (p) => /(?=.*[A-Z])/.test(p), label: "One uppercase letter" },
  { test: (p) => /(?=.*[0-9])/.test(p), label: "One number" },
  { test: (p) => /(?=.*[!@#$%^&*])/.test(p), label: "One special character (!@#$%^&*)" },
];

const STRENGTH_MAP = {
  0: { label: "Weak", color: "bg-red-500", text: "text-red-500" },
  1: { label: "Weak", color: "bg-red-500", text: "text-red-500" },
  2: { label: "Fair", color: "bg-yellow-500", text: "text-yellow-500" },
  3: { label: "Good", color: "bg-blue-500", text: "text-blue-500" },
  4: { label: "Strong", color: "bg-green-500", text: "text-green-500" },
  5: { label: "Very Strong", color: "bg-green-600", text: "text-green-600" },
};

// --- Reusable Sub-components ---

const ExclamationCircleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const FormInput = ({ id, label, type, value, onChange, placeholder, error, icon, showToggle, onToggle, isToggled, autoFocus }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
          {icon}
        </span>
      )}
      <input
        id={id}
        name={id}
        type={isToggled ? "text" : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoFocus={autoFocus}
        className={`w-full ${icon ? "pl-10" : "pl-4"} ${showToggle ? "pr-12" : "pr-4"} py-3 border rounded-xl outline-none transition-all duration-200 ${
          error 
            ? "border-red-400 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
            : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        }`}
        autoComplete={id}
      />
      {showToggle && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={isToggled ? "Hide password" : "Show password"}
        >
          {isToggled ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
          )}
        </button>
      )}
    </div>
    {error && (
      <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
        <ExclamationCircleIcon /> {error}
      </p>
    )}
  </div>
);

// --- Validation Logic ---

const validateResetForm = (data) => {
  const newErrors = {};

  if (!data.password) {
    newErrors.password = "Password is required";
  } else {
    const failedReq = PASSWORD_REQUIREMENTS.find(req => !req.test(data.password));
    if (failedReq) newErrors.password = `Password must include: ${failedReq.label}`;
  }

  if (!data.confirmPassword) {
    newErrors.confirmPassword = "Please confirm your password";
  } else if (data.password !== data.confirmPassword) {
    newErrors.confirmPassword = "Passwords do not match";
  }

  return newErrors;
};

// --- Main Component ---

export default function ResetPassword({ token }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateResetForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call to backend with the token
      // In a real app: await fetch(`/api/auth/reset-password?token=${token}`, { method: 'POST', body: JSON.stringify({ password: formData.password }) })
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setIsSuccess(true);
      setErrors({});
    } catch (error) {
      setErrors({ submit: "Failed to reset password. The link may have expired." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Password Strength Logic
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, ...STRENGTH_MAP[0] };
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    PASSWORD_REQUIREMENTS.forEach((req) => {
      if (req.test(password)) score++;
    });
    return { score: Math.min(score, 5), ...STRENGTH_MAP[Math.min(score, 5)] };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const lockIcon = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100/80">
        
        {/* Header */}
        <div className="text-center mb-8">
          {isSuccess ? (
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {isSuccess ? "Password Updated!" : "Set new password"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {isSuccess 
              ? "Your password has been reset successfully. You can now log in with your new credentials." 
              : "Your new password must be different from previously used passwords."
            }
          </p>
        </div>

        {/* Success State View */}
        {isSuccess ? (
          <button
            onClick={() => router.push("/login")}
            className="block w-full py-3 px-4 rounded-xl text-white font-semibold text-center bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg transition-all duration-200"
          >
            Continue to Login
          </button>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            {/* New Password Field */}
            <div>
              <FormInput
                id="password"
                label="New Password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a strong password"
                error={errors.password}
                icon={lockIcon}
                showToggle
                onToggle={() => setShowPassword((prev) => !prev)}
                isToggled={showPassword}
                autoFocus
              />
              
              {formData.password && (
                <div className="mt-3 pl-1">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-gray-500">Password strength:</span>
                    <span className={`text-xs font-semibold ${passwordStrength.text}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ease-out ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <ul className="mt-2 space-y-1">
                    {PASSWORD_REQUIREMENTS.map((req) => {
                      const isMet = req.test(formData.password);
                      return (
                        <li key={req.label} className={`text-xs flex items-center gap-1.5 transition-colors ${isMet ? "text-green-600" : "text-gray-400"}`}>
                          <span className="font-bold">{isMet ? "✓" : "○"}</span>
                          {req.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <FormInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your new password"
              error={errors.confirmPassword}
              icon={lockIcon}
              showToggle
              onToggle={() => setShowConfirmPassword((prev) => !prev)}
              isToggled={showConfirmPassword}
            />

            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 text-center">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all duration-200 flex items-center justify-center ${
                isSubmitting 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg"
              }`}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}