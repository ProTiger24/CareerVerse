import React, { useState } from 'react';
import { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth, googleProvider } from '../../firebase/config';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email first.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setError('');
      alert('✅ Reset link sent to ' + email.trim());
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 p-8 rounded-3xl shadow-xl">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-3 flex justify-center">🚀</div>
            <h1 className="text-3xl font-bold text-gray-900">CareerVerse</h1>
            <p className="text-gray-500 mt-2 text-sm">AI Powered Career Growth Platform</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm border border-red-200 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="text-gray-700 text-xs font-semibold block mb-1.5">Email Address</label>
              <input type="email" placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all"
                value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" required />
            </div>

            <div>
              <label className="text-gray-700 text-xs font-semibold block mb-1.5">Password</label>
              <input type="password" placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-900 placeholder-gray-400 border border-gray-200 focus:outline-none focus:border-[#6366F1] focus:ring-2 focus:ring-[#6366F1]/20 transition-all"
                value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required />
              <div className="flex justify-end mt-2">
                <button type="button" onClick={handleForgotPassword} className="text-xs text-[#6366F1] hover:text-[#4F46E5] font-medium">
                  Forgot Password?
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-white text-gray-500">or continue with</span>
            </div>
          </div>

          <button onClick={handleGoogleLogin} disabled={loading}
            className="w-full bg-white text-gray-800 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all flex items-center justify-center gap-3 border border-gray-300 shadow-sm">
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Continue with Google
          </button>

          <p className="text-center mt-6 text-gray-600 text-sm">
            Don't have an account?{' '}
            <button onClick={() => navigate('/register')} className="text-[#6366F1] hover:text-[#4F46E5] font-semibold">
              Register
            </button>
          </p>

          {/* Back to Home — INSIDE the card, at the bottom */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-800 text-sm font-medium transition-colors group">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
