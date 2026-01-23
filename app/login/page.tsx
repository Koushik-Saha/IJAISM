"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decode JWT to check if it's valid and not expired
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        // Check if token is not expired
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          // Token is valid, redirect to dashboard
          router.push('/dashboard');
        } else {
          // Token expired, remove it
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      } catch (error) {
        // Invalid token, remove it
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    const newErrors: Record<string, string> = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage
        localStorage.setItem('token', data.data.accessToken);
        localStorage.setItem('user', JSON.stringify(data.data.user));

        // Dispatch login event to update Header
        window.dispatchEvent(new Event('userLoggedIn'));

        // Show success toast
        toast.success('Successfully logged in!', {
          description: data.message || `Welcome back, ${data.data.user.name || data.data.user.email}!`,
          duration: 3000,
        });

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        const errorMessage = data.error?.message || data.error?.code || 'Login failed';
        setErrors({ submit: errorMessage });
        toast.error('Login failed', {
          description: errorMessage,
          duration: 4000,
        });
      }
    } catch (error) {
      const errorMessage = 'An error occurred. Please try again.';
      setErrors({ submit: errorMessage });
      toast.error('Login error', {
        description: errorMessage,
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary">Sign In to IJAISM</h2>
            <p className="mt-2 text-gray-600">Access your academic account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                placeholder="your.email@university.edu"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary pr-10 ${errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link href="/forgot-password" className="text-primary hover:text-primary-dark">
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {errors.submit}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing In...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary hover:text-primary-dark font-semibold">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
