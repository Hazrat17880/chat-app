"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from 'react-hot-toast';
import { clearUserEmail } from "../../redux/sclies/authSlice";

export default function Verification({ onVerify }) {
  const dispatch = useDispatch();
  
  // Get email from Redux store
  const email = useSelector((state) => state.auth.email || "");
  
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [activeIndex, setActiveIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState("");

  const inputRefs = useRef([]);

  // --- Timer Logic ---
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // --- Focus initial input on mount ---
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // --- Handlers ---
  const handleChange = useCallback((e, index) => {
    const value = e.target.value;
    
    // Allow only numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    // Take only the last entered digit to prevent pasting multiple in one box
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    // Move to next input
    if (value && index < 5) {
      setActiveIndex(index + 1);
      inputRefs.current[index + 1]?.focus();
    }
  }, [otp]);

  const handleKeyDown = useCallback((e, index) => {
    // Move to previous input on backspace if current is empty
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newOtp = [...otp];
      newOtp[index - 1] = "";
      setOtp(newOtp);
    }
  }, [otp]);

  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    
    if (pastedData.length > 0) {
      const newOtp = [...otp];
      pastedData.split("").forEach((char, index) => {
        newOtp[index] = char;
      });
      setOtp(newOtp);
      setError("");
      
      // Focus the last filled input or the next empty one
      const nextEmptyIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextEmptyIndex]?.focus();
    }
  }, [otp]);

  const handleResend = async () => {
    if (timeLeft > 0) return;
    
    try {
      // Call the resend OTP API
      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        // Show success toast message
        toast.success('OTP resent successfully! Please check your email.', {
          duration: 4000,
          position: 'top-center',
          icon: '📧',
        });
        
        setTimeLeft(30);
        setOtp(Array(6).fill(""));
        setError("");
        inputRefs.current[0]?.focus();
      } else {
        // Show error toast message
        toast.error(data.message || "Failed to resend OTP. Please try again.", {
          duration: 4000,
          position: 'top-center',
        });
        setError(data.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      // Show error toast message
      toast.error("Failed to resend OTP. Please try again.", {
        duration: 4000,
        position: 'top-center',
      });
      setError("Failed to resend OTP. Please try again.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join("");

    if (code.length < 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Call the verify OTP API
      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: email,
          otp: code 
        }),
      });

      const data = await response.json();

      if (data.success) {
        // ✅ Clear email from Redux store after successful verification
        dispatch(clearUserEmail());
        
        // Show success toast message
        toast.success('Email verified successfully!', {
          duration: 4000,
          position: 'top-center',
          icon: '✅',
        });
        
        setIsVerified(true);
        onVerify?.(code);
      } else {
        // Show error toast message
        toast.error(data.message || "Invalid verification code. Please try again.", {
          duration: 4000,
          position: 'top-center',
        });
        setError(data.message || "Invalid verification code. Please try again.");
        setOtp(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      // Show error toast message
      toast.error("Something went wrong. Please try again.", {
        duration: 4000,
        position: 'top-center',
      });
      setError("Something went wrong. Please try again.");
      setOtp(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-100/80">
        
        {/* Header */}
        <div className="text-center mb-8">
          {isVerified ? (
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          )}
          
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            {isVerified ? "Verified!" : "Check your email"}
          </h1>
          <p className="text-gray-500 mt-2 text-sm leading-relaxed">
            {isVerified ? (
              "Your identity has been successfully verified."
            ) : (
              <>
                We sent a 6-digit code to <span className="font-medium text-gray-700">{email}</span>
              </>
            )}
          </p>
        </div>

        {/* Success State View */}
        {isVerified ? (
          <button
            onClick={() => window.location.href = "/login"}
            className="block w-full py-3 px-4 rounded-xl text-white font-semibold text-center bg-blue-600 hover:bg-blue-700 active:scale-[0.98] shadow-md hover:shadow-lg transition-all duration-200"
          >
            Continue to Dashboard
          </button>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            
            {/* OTP Input Grid */}
            <div>
              <div className="flex justify-between gap-2 sm:gap-3" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(e, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onFocus={() => setActiveIndex(index)}
                    className={`w-full h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-all duration-200 ${
                      error 
                        ? "border-red-300 focus:ring-2 focus:ring-red-500 focus:border-transparent" 
                        : activeIndex === index
                          ? "border-blue-500 ring-2 ring-blue-100" 
                          : "border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    }`}
                  />
                ))}
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center justify-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </p>
              )}
            </div>

            {/* Submit Button */}
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
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>

            {/* Resend Logic */}
            <div className="text-center text-sm text-gray-500">
              {timeLeft > 0 ? (
                <span>
                  Didn't receive the code?{" "}
                  <span className="text-gray-400 font-medium">Resend in {formatTime(timeLeft)}</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-blue-600 hover:text-blue-800 font-semibold hover:underline underline-offset-2 transition-colors"
                >
                  Resend verification code
                </button>
              )}
            </div>
            
          </form>
        )}

      </div>
    </div>
  );
}