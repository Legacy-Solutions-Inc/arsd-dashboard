import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import Image from "next/image";
import { signUpAction } from "@/app/actions";
import Navbar from "@/components/navbar";
import { UrlProvider } from "@/components/url-provider";
import { UserPlus, Mail, Lock, User, Building2, Sparkles, Shield } from "lucide-react";

export default async function Signup(props: {
  searchParams: Promise<Message>;
}) {
  const searchParams = await props.searchParams;
  if ("message" in searchParams) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-pink-50/20 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-red-500/5 to-pink-500/5 rounded-2xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-xl">
              <FormMessage message={searchParams} />
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
              <UrlProvider>
                <form className="flex flex-col space-y-6">
                  {/* Header Section */}
                  <div className="space-y-4 text-center">
                    <div className="flex justify-center">
                      <Image src="/images/arsd-logo.png" alt="ARSD Logo" width={100} height={100} />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                        Join ARSD
                      </h1>
                      <p className="text-gray-600 text-sm font-medium mt-1">
                        Project Management Platform
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
                      Already have an account?{" "}
                      <Link
                        className="text-arsd-red font-semibold hover:text-red-700 hover:underline transition-all duration-200"
                        href="/sign-in"
                      >
                        Sign in here
                      </Link>
                    </p>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="h-4 w-4 text-arsd-red" />
                        Full Name
                      </Label>
                      <div className="relative">
                        <Input
                          id="full_name"
                          name="full_name"
                          type="text"
                          placeholder="Enter your full name"
                          required
                          className="glass-input w-full pl-4 pr-4 py-3 border-red-200/50 focus:border-arsd-red/50 focus:ring-arsd-red/20 transition-all duration-200"
                        />
                      </div>
                    </div>

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
                      <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="h-4 w-4 text-arsd-red" />
                        Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type="password"
                          name="password"
                          placeholder="Create a secure password"
                          minLength={6}
                          required
                          className="glass-input w-full pl-4 pr-4 py-3 border-red-200/50 focus:border-arsd-red/50 focus:ring-arsd-red/20 transition-all duration-200"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Minimum 6 characters required
                      </p>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 rounded-xl p-4 border border-blue-200/30">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-800 mb-1">Secure Registration</h4>
                        <p className="text-xs text-gray-600">
                          Your account will be reviewed by our administrators before activation. You'll receive an email confirmation once approved.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <SubmitButton
                    formAction={signUpAction}
                    pendingText="Creating Account..."
                    className="w-full bg-gradient-to-r from-arsd-red to-red-600 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] border-0"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      <span>Create Account</span>
                      <Sparkles className="h-4 w-4" />
                    </div>
                  </SubmitButton>

                  <FormMessage message={searchParams} />
                </form>
              </UrlProvider>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
