"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { BadgeStatus } from '@/components/warehouse/BadgeStatus';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { UniversalLoading } from '@/components/ui/universal-loading';
import { ReleaseForm } from '@/types/warehouse';
import { ArrowLeft, Package, FileText, Lock, Unlock } from 'lucide-react';

export default function ReleaseFormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params?.id as string;
  const { canUnlock } = useWarehouseAuth();

  const [release, setRelease] = useState<ReleaseForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchRelease() {
      try {
        const response = await fetch(`/api/warehouse/releases/${releaseId}`);
        if (!response.ok) throw new Error('Failed to fetch release form');
        const data = await response.json();
        setRelease(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    if (releaseId) {
      fetchRelease();
    }
  }, [releaseId]);

  const handleLockToggle = async () => {
    if (!release) return;
    
    try {
      const response = await fetch(`/api/warehouse/releases/${release.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !release.locked }),
      });

      if (!response.ok) throw new Error('Failed to update lock status');
      
      const updated = await response.json();
      setRelease(updated);
    } catch (err) {
      alert('Failed to update lock status. Please try again.');
    }
  };

  if (loading) {
    return (
      <UniversalLoading
        type="data"
        message="Loading Release Form"
        subtitle="Fetching release form details..."
        size="lg"
        fullScreen
      />
    );
  }

  if (error || !release) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="glass-card text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Release Form Not Found</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'The requested release form could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard/warehouse/releases')}
            className="btn-arsd-primary mobile-button"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 w-full">
      <div className="w-full mx-4 sm:mx-6 lg:mx-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/dashboard/warehouse/releases')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-touch-target"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <h1 className="responsive-heading font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                  Release Form Details
                </h1>
                <p className="text-gray-600 responsive-text">{release.release_no}</p>
              </div>
              <div className="flex items-center gap-2">
                <BadgeStatus locked={release.locked} />
                {canUnlock && (
                  <button
                    onClick={handleLockToggle}
                    className={`btn-arsd-outline mobile-button flex items-center gap-2 ${
                      release.locked
                        ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                        : 'text-green-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {release.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {release.locked ? 'Unlock' : 'Lock'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <ARSDCard>
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-red-200/30">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-arsd-red" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Basic Details</h2>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                <dt className="text-gray-600 shrink-0">Release No</dt>
                <dd className="font-medium break-words min-w-0">{release.release_no}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                <dt className="text-gray-600 shrink-0">Date</dt>
                <dd className="font-medium break-words min-w-0">{release.date}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                <dt className="text-gray-600 shrink-0">Received By</dt>
                <dd className="font-medium break-words min-w-0">{release.received_by}</dd>
              </div>
              {release.warehouseman && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Warehouseman</dt>
                  <dd className="font-medium break-words min-w-0">{release.warehouseman}</dd>
                </div>
              )}
              {release.purpose && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-2 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Purpose</dt>
                  <dd className="font-medium break-words min-w-0">{release.purpose}</dd>
                </div>
              )}
            </dl>
          </div>
        </ARSDCard>

        {/* Items */}
        <ARSDCard>
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b border-red-200/30">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <Package className="h-5 w-5 text-arsd-red" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Items ({release.items?.length || 0})</h2>
            </div>

            <div className="space-y-4">
              {release.items?.map((item, index) => (
                <div key={index} className="glass-card p-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <dt className="text-gray-600">Description</dt>
                    <dd className="font-medium break-words">{item.item_description}</dd>
                    <dt className="text-gray-600">Quantity</dt>
                    <dd className="font-medium">{item.qty.toLocaleString()} {item.unit}</dd>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </ARSDCard>

        {/* Attachment */}
        {release.attachment_url && (
          <ARSDCard>
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-arsd-primary mb-4">Attachment</h2>
              <a
                href={release.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-arsd-outline inline-flex items-center gap-2"
              >
                View Attachment
              </a>
            </div>
          </ARSDCard>
        )}
      </div>
    </div>
  );
}
