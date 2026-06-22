"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

// --- Reusable Sub-components (Matches RegisterForm for consistency) ---

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

const validateLoginForm = (data) => {
  const newErrors = {};
  const trimmedEmail = data.email.trim();

  if (!trimmedEmail) {
    newErrors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    newErrors.email = "Please enter a valid email address";
  }

  // Login forms generally only check if the password is empty, 
  // as strict formatting rules were enforced during registration.
  if (!data.password) {
    newErrors.password = "Password is required";
  }

  return newErrors;
};

// --- Main Component ---

export default function LoginForm({ onLogin, onSwitchToRegister }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateLoginForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      setErrors({});
      // Trigger the parent login handler, passing back the user's email
      onLogin(formData.email.trim());
    } catch (error) {
      setErrors({ submit: "Login failed. Please check your credentials and try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // SVG Icons
  const icons = {
    email: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
    password: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100/80">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
          <p className="text-gray-500 mt-2 text-sm">Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          
          <FormInput
            id="email"
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
            icon={icons.email}
            autoFocus
          />

          <div>
            <FormInput
              id="password"
              label="Password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              error={errors.password}
              icon={icons.password}
              showToggle
              onToggle={() => setShowPassword((prev) => !prev)}
              isToggled={showPassword}
            />
            <div className="flex justify-end mt-1.5 pr-1">
              <Link href="/forgot-password" className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline underline-offset-2 transition-colors">
                Forgot password?
              </Link>
            </div>
          </div>

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
                Signing In...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-600">
          Don't have an account?{" "}
          {/* You can either use the prop-based switcher or a Next.js Link */}
          {onSwitchToRegister ? (
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline underline-offset-2 transition-colors"
            >
              Create one here
            </button>
          ) : (
            <Link href="/signup" className="text-blue-600 hover:text-blue-800 font-semibold hover:underline underline-offset-2 transition-colors">
              Create one here
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}