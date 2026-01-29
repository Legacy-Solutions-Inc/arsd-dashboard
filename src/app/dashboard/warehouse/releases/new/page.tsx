"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItemsRepeater, ItemEntry } from '@/components/warehouse/ItemsRepeater';
import { FileUploader } from '@/components/warehouse/FileUploader';
import { StickyBottomBar } from '@/components/warehouse/StickyBottomBar';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { projects, mockUser } from '@/data/warehouseMock';
import { useWarehouseStore } from '@/contexts/WarehouseStoreContext';
import { ArrowLeft, Package, Upload as UploadIcon, User, FileText } from 'lucide-react';
import type { ReleaseForm, ReleaseItem } from '@/data/warehouseMock';

export default function CreateReleasePage() {
  const router = useRouter();
  const { releaseForms, addRelease } = useWarehouseStore();
  const derivedReleaseNo = `REL-${new Date().getFullYear()}-${String(releaseForms.length + 1).padStart(3, '0')}`;

  const [formData, setFormData] = useState({
    warehouseman: mockUser.name,
    date: new Date().toISOString().split('T')[0],
    projectId: '',
    items: [] as ItemEntry[],
    purpose: '',
    receivedBy: '',
    attachment: null as File | null
  });

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemDescription: '', qty: 0, unit: 'kg' }]
    }));
  };

  const handleRemoveItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateItem = (index: number, field: keyof ItemEntry, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmit = () => {
    const items: ReleaseItem[] = formData.items.map((it) => ({
      itemDescription: it.itemDescription,
      qty: it.qty,
      unit: it.unit
    }));
    const rf: ReleaseForm = {
      id: `rel-${Date.now()}`,
      releaseNo: derivedReleaseNo,
      projectId: formData.projectId,
      receivedBy: formData.receivedBy,
      items,
      date: formData.date,
      locked: true,
      warehouseman: formData.warehouseman,
      purpose: formData.purpose || undefined,
      attachment: formData.attachment ? formData.attachment.name : undefined
    };
    addRelease(rf);
    router.push('/dashboard/warehouse/releases');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/dashboard/warehouse/releases');
    }
  };

  const canSubmit = () => {
    return formData.date &&
           formData.projectId &&
           formData.items.length > 0 &&
           formData.items.every(item => item.itemDescription && item.qty > 0) &&
           formData.receivedBy;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-24 w-full">
      <div className="w-full mx-4 sm:mx-6 lg:mx-8 space-y-4 sm:space-y-6 lg:space-y-8 py-4 sm:py-6 lg:py-8">
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
                  Create Release Form
                </h1>
                <p className="text-gray-600 responsive-text">Fill in the details below</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <ARSDCard>
          <div className="space-y-8">
            {/* Basic Details */}
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-red-200/30">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-arsd-red" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Basic Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Release No
                  </label>
                  <input
                    type="text"
                    value={derivedReleaseNo}
                    readOnly
                    className="mobile-form-input w-full bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warehouseman
                  </label>
                  <input
                    type="text"
                    value={formData.warehouseman}
                    readOnly
                    className="mobile-form-input w-full bg-gray-50 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="mobile-form-input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Project/Site <span className="text-red-600">*</span>
                    </label>
                    <select
                      value={formData.projectId}
                      onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                      className="mobile-form-input w-full"
                      required
                    >
                      <option value="">Select a project</option>
                      {projects.map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-red-200/30">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-arsd-red" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Items</h2>
              </div>

              <ItemsRepeater
                items={formData.items}
                onAdd={handleAddItem}
                onRemove={handleRemoveItem}
                onUpdate={handleUpdateItem}
                showPOQty={false}
              />
            </div>

            {/* Additional Details */}
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-red-200/30">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-arsd-red" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Additional Details</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purpose / Where to be used
                  </label>
                  <textarea
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    className="mobile-form-input w-full min-h-[100px] resize-y"
                    placeholder="Enter purpose or location where items will be used..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Received By <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.receivedBy}
                    onChange={(e) => setFormData(prev => ({ ...prev, receivedBy: e.target.value }))}
                    className="mobile-form-input w-full"
                    placeholder="Enter recipient name"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Attachment */}
            <div>
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-red-200/30">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <UploadIcon className="h-5 w-5 text-arsd-red" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Attachment (Optional)</h2>
              </div>

              <FileUploader
                label="Attachment"
                value={formData.attachment}
                onChange={(file) => setFormData(prev => ({ ...prev, attachment: file }))}
                required={false}
              />
            </div>

            {/* Review before submit */}
            <div className="rounded-xl border border-red-200/30 bg-red-50/10 p-4 sm:p-5">
              <h3 className="text-sm font-semibold text-arsd-primary mb-3">Review before submit</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1.5 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Release No</dt>
                  <dd className="font-medium break-words min-w-0">{derivedReleaseNo}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1.5 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Date</dt>
                  <dd className="font-medium break-words min-w-0">{formData.date}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1.5 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Project</dt>
                  <dd className="font-medium break-words min-w-0">{projects.find(p => p.id === formData.projectId)?.name || 'N/A'}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1.5 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Warehouseman</dt>
                  <dd className="font-medium break-words min-w-0">{formData.warehouseman || 'Unknown'}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1.5 border-b border-red-200/20">
                  <dt className="text-gray-600 shrink-0">Received By</dt>
                  <dd className="font-medium break-words min-w-0">{formData.receivedBy || '—'}</dd>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-0.5 py-1.5">
                  <dt className="text-gray-600 shrink-0">Items</dt>
                  <dd className="font-medium">{formData.items.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        </ARSDCard>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4 pt-4">
          <button
            onClick={handleCancel}
            className="btn-arsd-outline mobile-button mobile-touch-target min-h-[44px] flex-1 sm:flex-none sm:min-w-[120px] flex items-center justify-center"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="btn-arsd-primary mobile-button mobile-touch-target min-h-[44px] flex-1 sm:flex-none sm:min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Submit Release
          </button>
        </div>
      </div>
    </div>
  );
}

