"use client";

import { useRBAC } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Clock } from 'lucide-react';

export default function PendingApprovalPage() {
  const { user, refreshUser } = useRBAC();

  const handleRefresh = async () => {
    await refreshUser();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
            <Clock className="h-6 w-6 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl">Account Pending Approval</CardTitle>
          <CardDescription>
            Your account is currently under review. Please wait for an administrator to approve your access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-medium text-gray-900">Account Status</h3>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p><strong>Role:</strong> {user.role}</p>
                <p><strong>Status:</strong> {user.status}</p>
                <p><strong>Email:</strong> {user.email}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start space-x-3 rounded-lg bg-blue-50 p-4">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">What happens next?</p>
              <p className="mt-1">
                An administrator will review your account and assign you the appropriate role and permissions. 
                You'll receive an email notification once your account is approved.
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Button onClick={handleRefresh} variant="outline" className="w-full">
              Check Status
            </Button>
            <Button 
              onClick={() => window.location.href = '/sign-out'} 
              variant="ghost" 
              className="w-full"
            >
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}