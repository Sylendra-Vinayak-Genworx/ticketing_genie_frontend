import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Zap, ArrowLeft, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

export default function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  function validate() {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Enter a valid email');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      await authService.forgotPassword(email);
      setSubmitted(true);
      toast.success('Reset link sent!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl shadow-lg mb-4">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Forgot Password</h1>
          <p className="text-slate-400 mt-2 text-sm">
            Enter your email and we'll send a reset link
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <Mail className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Check your email</h2>
              <p className="text-sm text-gray-500 mb-6">
                If an account exists for <strong>{email}</strong>, you'll receive a password reset
                link shortly.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="btn-primary w-full justify-center py-2.5 text-base"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  placeholder="you@company.com"
                  className={`input-field ${error ? 'input-error' : ''}`}
                />
                {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full justify-center py-2.5 text-base"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending…
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" /> Back to Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
