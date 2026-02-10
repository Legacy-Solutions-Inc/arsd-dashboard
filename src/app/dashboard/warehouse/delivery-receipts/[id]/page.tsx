"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { BadgeStatus } from '@/components/warehouse/BadgeStatus';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { DeliveryReceipt } from '@/types/warehouse';
import { ArrowLeft, Package, FileText, Lock, Unlock } from 'lucide-react';

export default function DeliveryReceiptDetailPage() {
  const params = useParams();
  const router = useRouter();
  const drId = params?.id as string;
  const { canUnlock } = useWarehouseAuth();

  const [dr, setDR] = useState<DeliveryReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null);

  useEffect(() => {
    async function fetchDR() {
      try {
        const response = await fetch(`/api/warehouse/delivery-receipts/${drId}`);
        if (!response.ok) throw new Error('Failed to fetch delivery receipt');
        const data = await response.json();
        setDR(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    }

    if (drId) {
      fetchDR();
    }
  }, [drId]);

  const handleLockToggle = async () => {
    if (!dr) return;
    
    try {
      const response = await fetch(`/api/warehouse/delivery-receipts/${dr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked: !dr.locked }),
      });

      if (!response.ok) throw new Error('Failed to update lock status');
      
      const updated = await response.json();
      setDR(updated);
    } catch (err) {
      alert('Failed to update lock status. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-arsd-red mx-auto mb-4"></div>
          <p className="text-gray-600">Loading delivery receipt...</p>
        </div>
      </div>
    );
  }

  if (error || !dr) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="glass-card text-center max-w-md">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Delivery Receipt Not Found</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'The requested delivery receipt could not be found.'}</p>
          <button
            onClick={() => router.push('/dashboard/warehouse/delivery-receipts')}
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
                onClick={() => router.push('/dashboard/warehouse/delivery-receipts')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-touch-target"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <h1 className="responsive-heading font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                  Delivery Receipt Details
                </h1>
                <p className="text-gray-600 responsive-text">{dr.dr_no}</p>
              </div>
              <div className="flex items-center gap-2">
                <BadgeStatus locked={dr.locked} />
                {canUnlock && (
                  <button
                    onClick={handleLockToggle}
                    className={`btn-arsd-outline mobile-button flex items-center gap-2 ${
                      dr.locked
                        ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                        : 'text-green-700 border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {dr.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {dr.locked ? 'Unlock' : 'Lock'}
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
                <dt className="text-gray-600 shrink-0">DR No</dt>
                <dd className="font-medium break-words min-w-0">{dr.dr_no}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                <dt className="text-gray-600 shrink-0">Date</dt>
                <dd className="font-medium break-words min-w-0">{dr.date} {dr.time && `at ${dr.time}`}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                <dt className="text-gray-600 shrink-0">Supplier</dt>
                <dd className="font-medium break-words min-w-0">{dr.supplier}</dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                <dt className="text-gray-600 shrink-0">Warehouseman</dt>
                <dd className="font-medium break-words min-w-0">{dr.warehouseman}</dd>
              </div>
              {dr.dr_photo_url && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">DR Photo</dt>
                  <dd className="font-medium break-words min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          url: dr.dr_photo_url as string,
                          label: 'Delivery Receipt Photo',
                        })
                      }
                      className="btn-arsd-outline inline-flex items-center gap-2"
                    >
                      View DR Photo
                    </button>
                  </dd>
                </div>
              )}
              {dr.po_photo_url && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">PO Photo</dt>
                  <dd className="font-medium break-words min-w-0">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewImage({
                          url: dr.po_photo_url as string,
                          label: 'Purchase Order Photo',
                        })
                      }
                      className="btn-arsd-outline inline-flex items-center gap-2"
                    >
                      View PO Photo
                    </button>
                  </dd>
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
              <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Items ({dr.items?.length || 0})</h2>
            </div>

            <div className="space-y-4">
              {dr.items?.map((item, index) => (
                <div key={index} className="glass-card p-4">
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <dt className="text-gray-600">Description</dt>
                    <dd className="font-medium break-words">{item.item_description}</dd>
                    <dt className="text-gray-600">Qty in DR</dt>
                    <dd className="font-medium">{item.qty_in_dr.toLocaleString()} {item.unit}</dd>
                    <dt className="text-gray-600">Qty in PO</dt>
                    <dd className="font-medium">{item.qty_in_po.toLocaleString()} {item.unit}</dd>
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </ARSDCard>
      </div>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative w-full max-w-3xl bg-white/95 rounded-2xl shadow-2xl border border-white/40 p-4 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-arsd-primary">
                {previewImage.label}
              </h2>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Close
              </button>
            </div>
            <div className="relative w-full aspect-[4/3] sm:aspect-[16/9] bg-gray-50 rounded-xl overflow-hidden border border-gray-200">
              <Image
                src={previewImage.url}
                alt={previewImage.label}
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
