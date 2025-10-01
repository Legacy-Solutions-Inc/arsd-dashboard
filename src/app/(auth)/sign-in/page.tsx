import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import Navbar from "@/components/navbar";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { LogIn, Mail, Lock, User, Building2, Sparkles, ArrowRight } from "lucide-react";

interface LoginProps {
  searchParams: Promise<Message>;
}

export default async function SignInPage({ searchParams }: LoginProps) {
  const message = await searchParams;

  if ("message" in message) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-pink-50/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-red-500/5 to-pink-500/5 rounded-2xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
              <FormMessage message={message} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-pink-50/20 flex flex-col items-center justify-center px-4 py-8">
        {/* Floating background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-gradient-to-br from-arsd-red/10 to-red-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 rounded-full blur-3xl animate-float-slow"></div>
        </div>

        <div className="relative w-full max-w-md z-10">
          <div className="relative">
            {/* Glass background effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-red-500/5 to-pink-500/5 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 border border-white/20 shadow-2xl">
              <form className="flex flex-col space-y-6">
                {/* Header Section */}
                <div className="space-y-4 text-center">
                  <div className="flex justify-center">
                    <Image src="/images/arsd-logo.png" alt="ARSD Logo" width={100} height={100} />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                      Welcome Back
                    </h1>
                    <p className="text-gray-600 text-sm font-medium mt-1">
                      Project Management Platform
                    </p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Don't have an account?{" "}
                    <Link
                      className="text-arsd-red font-semibold hover:text-red-700 hover:underline transition-all duration-200"
                      href="/sign-up"
                    >
                      Sign up here
                    </Link>
                  </p>
                </div>

                {/* Form Fields */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4 text-arsd-red" />
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="your.email@company.com"
                        required
                        className="glass-input w-full pl-4 pr-4 py-3 border-red-200/50 focus:border-arsd-red/50 focus:ring-arsd-red/20 transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-arsd-red" />
                        Password
                      </Label>
                      <Link
                        className="text-xs text-arsd-red hover:text-red-700 hover:underline transition-all duration-200 font-medium"
                        href="/forgot-password"
                      >
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="password"
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        required
                        className="glass-input w-full pl-4 pr-4 py-3 border-red-200/50 focus:border-arsd-red/50 focus:ring-arsd-red/20 transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <SubmitButton
                  className="w-full bg-gradient-to-r from-arsd-red to-red-600 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border-0"
                  pendingText="Signing In..."
                  formAction={signInAction}
                >
                  <div className="flex items-center justify-center gap-2">
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </div>
                </SubmitButton>

                <FormMessage message={message} />
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
