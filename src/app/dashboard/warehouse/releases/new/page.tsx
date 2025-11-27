"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItemsRepeater, ItemEntry } from '@/components/warehouse/ItemsRepeater';
import { FileUploader } from '@/components/warehouse/FileUploader';
import { StickyBottomBar } from '@/components/warehouse/StickyBottomBar';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { projects, releaseForms, mockUser } from '@/data/warehouseMock';
import { ArrowLeft, Package, Upload as UploadIcon, User, FileText } from 'lucide-react';

export default function CreateReleasePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    releaseNo: `REL-${new Date().getFullYear()}-${String(releaseForms.length + 1).padStart(3, '0')}`,
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
    // Mock submit - just navigate back
    alert('Release form submitted successfully! (Mock)');
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
                    value={formData.releaseNo}
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
          </div>
        </ARSDCard>

        {/* Action Buttons */}
        <div className="flex gap-3 sm:gap-4 pt-4">
          <button
            onClick={handleCancel}
            className="btn-arsd-outline mobile-button flex-1 sm:flex-none sm:min-w-[120px]"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            onClick={handleSubmit}
            disabled={!canSubmit()}
            className="btn-arsd-primary mobile-button flex-1 sm:flex-none sm:min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Release
          </button>
        </div>
      </div>
    </div>
  );
}

