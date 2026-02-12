"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { BadgeStatus } from '@/components/warehouse/BadgeStatus';
import { useWarehouseAuth } from '@/hooks/warehouse/useWarehouseAuth';
import { UniversalLoading } from '@/components/ui/universal-loading';
import { ReleaseForm } from '@/types/warehouse';
import { useIPOW } from '@/hooks/warehouse/useIPOW';
import { ItemsRepeater, ItemEntry } from '@/components/warehouse/ItemsRepeater';
import { mapReleaseItemsToEntries, buildUpdateReleasePayload } from '@/utils/warehouse/itemMapping';
import { ArrowLeft, Package, FileText, Lock, Unlock } from 'lucide-react';

export default function ReleaseFormDetailPage() {
  const params = useParams();
  const router = useRouter();
  const releaseId = params?.id as string;
  const { user, canUnlock } = useWarehouseAuth();

  const [release, setRelease] = useState<ReleaseForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editReceivedBy, setEditReceivedBy] = useState('');
  const [editWarehouseman, setEditWarehouseman] = useState('');
  const [editPurpose, setEditPurpose] = useState('');
  const [editItems, setEditItems] = useState<ItemEntry[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);

  const projectId = release?.project_id ?? '';
  const { ipowItems } = useIPOW(projectId);

  const normalizeDescription = (value: string) => value.trim().toLowerCase();

  const resourceIndexByKey = useMemo(() => {
    const index = new Map<string, string>();
    ipowItems.forEach((ipow) => {
      const key = `${ipow.wbs ?? 'null'}|${normalizeDescription(ipow.item_description)}`;
      if (ipow.resource) {
        index.set(key, ipow.resource);
      }
    });
    return index;
  }, [ipowItems]);

  const getItemResource = (item: NonNullable<ReleaseForm['items']>[number]): string | null => {
    if (!ipowItems || ipowItems.length === 0) return null;

    const keyWithWbs = `${item.wbs ?? 'null'}|${normalizeDescription(item.item_description)}`;
    const byWbs = resourceIndexByKey.get(keyWithWbs);
    if (byWbs) return byWbs;

    const normalized = normalizeDescription(item.item_description);
    const fallbackIpow = ipowItems.find(
      (ipow) => normalizeDescription(ipow.item_description) === normalized && ipow.resource
    );
    return fallbackIpow?.resource ?? null;
  };

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

  const canEdit = useMemo(() => {
    if (!release || !user) return false;
    if (release.locked) return false;
    if (user.role !== 'warehouseman') return false;
    const currentName = (user.display_name || '').trim();
    const releaseWarehouseman = (release.warehouseman || '').trim();
    return currentName !== '' && currentName === releaseWarehouseman;
  }, [release, user]);

  const handleEnterEdit = () => {
    if (!release || !canEdit) return;
    setIsEditing(true);
    setSaveError(null);
    setEditDate(release.date);
    setEditReceivedBy(release.received_by);
    setEditWarehouseman(release.warehouseman || '');
    setEditPurpose(release.purpose || '');
    setEditItems(mapReleaseItemsToEntries(release.items));
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleAddItem = () => {
    setEditItems((prev) => [
      ...prev,
      { itemDescription: '', qty: 0, unit: 'kg', wbs: null },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setEditItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ItemEntry, value: string | number) => {
    setEditItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const canSave = useMemo(() => {
    if (!isEditing) return false;
    if (!editDate || !editReceivedBy) return false;
    if (editItems.length === 0) return false;
    return editItems.every((item) => item.itemDescription.trim() !== '' && item.qty > 0);
  }, [isEditing, editDate, editReceivedBy, editItems]);

  const handleSave = async () => {
    if (!release || !canEdit || !canSave) return;
    setSaveError(null);
    setSaveLoading(true);

    try {
      const payload = {
        ...buildUpdateReleasePayload(release, editItems),
        date: editDate,
        received_by: editReceivedBy,
        warehouseman: editWarehouseman || null,
        purpose: editPurpose || null,
      };

      const response = await fetch(`/api/warehouse/releases/${release.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response.json().catch(() => null);
        throw new Error(json?.error || 'Failed to save changes');
      }

      const updated = await response.json();
      setRelease(updated);
      setIsEditing(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaveLoading(false);
    }
  };

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
                    disabled={isEditing}
                    className={`btn-arsd-outline mobile-button flex items-center gap-2 ${
                      release.locked
                        ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                        : 'text-green-700 border-green-300 hover:bg-green-50'
                    } ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {release.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {release.locked ? 'Unlock' : 'Lock'}
                  </button>
                )}
                {canEdit && !isEditing && (
                  <button
                    type="button"
                    onClick={handleEnterEdit}
                    className="btn-arsd-primary mobile-button flex items-center gap-2"
                  >
                    Edit
                  </button>
                )}
                {canEdit && isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={!canSave || saveLoading}
                      className="btn-arsd-primary mobile-button flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {saveLoading ? 'Saving…' : 'Save changes'}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      disabled={saveLoading}
                      className="btn-arsd-outline mobile-button flex items-center gap-2"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
            {isEditing && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                You are editing this unlocked release form. Changes will update the existing record.
              </div>
            )}
            {saveError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                {saveError}
              </div>
            )}
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
                <dd className="font-medium break-words min-w-0">
                  {isEditing ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="mobile-form-input w-full sm:max-w-xs"
                    />
                  ) : (
                    release.date
                  )}
                </dd>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                <dt className="text-gray-600 shrink-0">Received By</dt>
                <dd className="font-medium break-words min-w-0">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editReceivedBy}
                      onChange={(e) => setEditReceivedBy(e.target.value)}
                      className="mobile-form-input w-full sm:max-w-md"
                    />
                  ) : (
                    release.received_by
                  )}
                </dd>
              </div>
              {release.warehouseman && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Warehouseman</dt>
                  <dd className="font-medium break-words min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editWarehouseman}
                        onChange={(e) => setEditWarehouseman(e.target.value)}
                        className="mobile-form-input w-full sm:max-w-md"
                      />
                    ) : (
                      release.warehouseman
                    )}
                  </dd>
                </div>
              )}
              {release.purpose && (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 py-2 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Purpose</dt>
                  <dd className="font-medium break-words min-w-0">
                    {isEditing ? (
                      <textarea
                        value={editPurpose}
                        onChange={(e) => setEditPurpose(e.target.value)}
                        className="mobile-form-input w-full sm:max-w-xl min-h-[80px]"
                      />
                    ) : (
                      release.purpose
                    )}
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
              <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">
                Items ({(isEditing ? editItems.length : release.items?.length) || 0})
              </h2>
            </div>

            {isEditing ? (
              <ItemsRepeater
                items={editItems}
                onAdd={handleAddItem}
                onRemove={handleRemoveItem}
                onUpdate={handleUpdateItem}
                showPOQty={false}
                ipowItems={ipowItems}
              />
            ) : (
              <div className="space-y-4">
                {release.items?.map((item, index) => (
                  <div key={index} className="glass-card p-4">
                    <dl className="grid grid-cols-2 gap-3 text-sm">
                      <dt className="text-gray-600">Description</dt>
                      <dd className="font-medium break-words">
                        {item.item_description}
                        {(() => {
                          const resource = getItemResource(item);
                          return resource ? (
                            <span className="block text-xs text-gray-500 mt-0.5">
                              {resource}
                            </span>
                          ) : null;
                        })()}
                      </dd>
                      <dt className="text-gray-600">Quantity</dt>
                      <dd className="font-medium">
                        {item.qty.toLocaleString()} {item.unit}
                      </dd>
                    </dl>
                  </div>
                ))}
              </div>
            )}
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
