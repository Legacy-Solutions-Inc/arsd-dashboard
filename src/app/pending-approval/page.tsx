"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function PendingApprovalPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'checking' | 'pending' | 'approved' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        setStatus('error');
        setError('Not authenticated');
        return;
      }

      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // Profile doesn't exist - this shouldn't happen with our new auth callback
          setStatus('error');
          setError('Profile not found. Please contact support.');
        } else {
          setStatus('error');
          setError('Database error. Please try again.');
        }
        return;
      }

      if (profile.status === 'pending' || profile.role === 'pending') {
        setStatus('pending');
      } else if (profile.status === 'active') {
        setStatus('approved');
        // Redirect to appropriate dashboard after a short delay
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setStatus('error');
        setError('Account is inactive. Please contact support.');
      }
    } catch (err) {
      console.error('Error checking user status:', err);
      setStatus('error');
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setStatus('checking');
    setError(null);
    checkUserStatus();
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/sign-in');
  };

  if (isLoading || status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Checking your account status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <p className="text-sm text-gray-600">Account approved! Redirecting to dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {status === 'pending' ? 'Account Pending Approval' : 'Account Issue'}
          </CardTitle>
          <CardDescription className="text-center">
            {status === 'pending' 
              ? 'Your account is pending approval from an administrator.'
              : 'There was an issue with your account.'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'pending' ? (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Your account has been created and is waiting for approval.
                </p>
                <p className="text-xs text-gray-500">
                  An administrator will review your account and activate it soon.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-red-600 font-medium">Error</p>
                <p className="text-xs text-gray-600">{error}</p>
              </div>
            </div>
          )}
          
          <div className="flex flex-col space-y-2">
            <Button onClick={handleRetry} variant="outline" className="w-full">
              Check Status Again
            </Button>
            <Button onClick={handleSignOut} variant="ghost" className="w-full">
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}