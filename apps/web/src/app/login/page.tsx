'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'motion/react';
import VideoBackground from '@/components/landing/VideoBackground';

export default function LoginPage() {
  const [email, setEmail] = useState('test@test.com');
  const [password, setPassword] = useState('password123');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const setToken = useAuthStore((state) => state.setToken);
  const setUser = useAuthStore((state) => state.setUser);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      setToken(response.data.accessToken);
      setUser(response.data.user);

      toast.success('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      toast.error('Login failed', {
        description: error.response?.data?.message || 'Please check your credentials and try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-[#000000] p-4 text-white">
      <VideoBackground />

      <div className="absolute top-6 left-6 z-20">
        <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm font-medium" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md p-8 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>Welcome Back</h1>
          <p className="text-white/60 text-sm" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>Enter your credentials to access your workspace</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90" htmlFor="email" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3054ff] focus:border-transparent transition-all"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
              placeholder="you@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/90" htmlFor="password" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-lg bg-black/20 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#3054ff] focus:border-transparent transition-all"
              style={{ fontFamily: '"Instrument Sans", sans-serif' }}
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 rounded-lg bg-white text-[#0a0400] font-semibold text-lg hover:bg-white/90 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
            style={{ fontFamily: '"Instrument Sans", sans-serif' }}
          >
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-sm text-white/60" style={{ fontFamily: '"Instrument Sans", sans-serif' }}>
            Don't have an account?{' '}
            <Link href="/register" className="text-white hover:text-[#b4c0ff] font-medium transition-colors">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}