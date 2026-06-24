"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// --- Reusable Sub-components (Consistent with Login/Register) ---

const ExclamationCircleIcon = () => (
  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const FormInput = ({ id, label, type, value, onChange, placeholder, error, icon, autoFocus }) => (
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
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        autoFocus={autoFocus}
        className={`w-full ${icon ? "pl-10" : "pl-4"} pr-4 py-3 border rounded-xl outline-none transition-all duration-200 ${
          error 
            ? "border-red-400 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
            : "border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        }`}
        autoComplete="email"
      />
    </div>
    {error && (
      <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600 flex items-center gap-1.5">
        <ExclamationCircleIcon /> {error}
      </p>
    )}
  </div>
);

// --- Validation Logic ---

const validateForgotForm = (data) => {
  const newErrors = {};
  const trimmedEmail = data.email.trim();

  if (!trimmedEmail) {
    newErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    newErrors.email = "Please enter a valid email address";
  }

  return newErrors;
};

// --- Main Component ---

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) {
      setErrors({});
    }
  }, [errors.email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForgotForm({ email });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to send reset email");
      }

      setIsSubmitted(true);
      setErrors({});
      
      toast.success("Password reset email sent! Check your inbox.", {
        duration: 4000,
        position: "top-center",
      });

    } catch (error) {
      console.error(error);
      toast.error(error.message || "Failed to send reset email. Please try again.", {
        duration: 4000,
        position: "top-center",
      });
      setErrors({ submit: error.message || "Failed to send reset email. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setEmail("");
    setErrors({});
  };

  // Icons
  const emailIcon = (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100/80">
        
        {/* Header / Icon */}
        <div className="text-center mb-8">
          {isSubmitted ? (
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {isSubmitted ? "Check your email" : "Forgot your password?"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {isSubmitted ? (
              <>
                We sent a password reset link to{" "}
                <span className="font-medium text-gray-700">{email.trim()}</span>
              </>
            ) : (
              "No worries, we'll send you reset instructions."
            )}
          </p>
        </div>

        {/* Success State View */}
        {isSubmitted ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700 text-center">
                ✅ Password reset link sent successfully!
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Please check your email inbox and follow the instructions.
              </p>
            </div>
            <p className="text-sm text-gray-500 text-center">
              Didn't receive the email?{" "}
              <button 
                onClick={handleRetry} 
                className="text-blue-600 hover:text-blue-800 font-semibold hover:underline underline-offset-2 transition-colors"
              >
                Click here to try again
              </button>
            </p>
            <Link
              href="/login"
              className="block w-full py-3 px-4 rounded-xl text-white font-semibold text-center bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg transition-all duration-200"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            
            <FormInput
              id="email"
              label="Email Address"
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="you@example.com"
              error={errors.email}
              icon={emailIcon}
              autoFocus
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
                  Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>
        )}

        {/* Footer Back Link (Only show when NOT submitted) */}
        {!isSubmitted && (
          <div className="mt-8 text-center text-sm text-gray-600">
            Remember your password?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline underline-offset-2 transition-colors">
              Back to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}