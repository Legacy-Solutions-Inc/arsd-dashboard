"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ItemsRepeater, ItemEntry } from '@/components/warehouse/ItemsRepeater';
import { FileUploader } from '@/components/warehouse/FileUploader';
import { StickyBottomBar } from '@/components/warehouse/StickyBottomBar';
import { ARSDCard } from '@/components/warehouse/ARSDCard';
import { projects, mockUser } from '@/data/warehouseMock';
import { useWarehouseStore } from '@/contexts/WarehouseStoreContext';
import { ArrowLeft, FileText, Package, Upload as UploadIcon, CheckCircle, Send } from 'lucide-react';
import type { DeliveryReceipt, DRItem } from '@/data/warehouseMock';

export default function CreateDRPage() {
  const router = useRouter();
  const { deliveryReceipts, addDR } = useWarehouseStore();
  const derivedDrNo = `DR-${new Date().getFullYear()}-${String(deliveryReceipts.length + 1).padStart(3, '0')}`;

  const [currentSection, setCurrentSection] = useState(1);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    projectId: '',
    supplier: '',
    warehouseman: mockUser.name,
    items: [] as ItemEntry[],
    drPhoto: null as File | null,
    poPhoto: null as File | null
  });

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { itemDescription: '', qty: 0, qtyInPO: 0, unit: 'kg' }]
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
    const items: DRItem[] = formData.items.map((it) => ({
      itemDescription: it.itemDescription,
      qtyInDR: it.qty,
      qtyInPO: it.qtyInPO ?? 0,
      unit: it.unit
    }));
    const warehouseman = (formData.warehouseman || mockUser.name || "Unknown").trim() || "Unknown";
    const dr: DeliveryReceipt = {
      id: `dr-${Date.now()}`,
      drNo: derivedDrNo,
      projectId: formData.projectId,
      supplier: formData.supplier,
      items,
      date: formData.date,
      locked: true,
      warehouseman
    };
    addDR(dr);
    router.push('/dashboard/warehouse/delivery-receipts');
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      router.push('/dashboard/warehouse/delivery-receipts');
    }
  };

  const canProceed = () => {
    if (currentSection === 1) {
      return formData.date && formData.time && formData.projectId && formData.supplier;
    }
    if (currentSection === 2) {
      return formData.items.length > 0 && formData.items.every(item => 
        item.itemDescription && item.qty > 0 && (item.qtyInPO ?? 0) > 0
      );
    }
    return true;
  };

  const totalSections = 4;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 pb-24 w-full">
      <div className="w-full mx-4 sm:mx-6 lg:mx-8 space-y-4 sm:space-y-6 lg:space-y-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-arsd-red/5 via-blue-500/5 to-purple-500/5 rounded-2xl blur-3xl"></div>
          <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => router.push('/dashboard/warehouse/delivery-receipts')}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors mobile-touch-target"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div className="flex-1">
                <h1 className="responsive-heading font-bold bg-gradient-to-r from-arsd-red to-red-600 bg-clip-text text-transparent">
                  Create Delivery Receipt
                </h1>
                <p className="text-gray-600 responsive-text">Fill in the details below</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mt-6 gap-2">
              {[1, 2, 3, 4].map((section) => (
                <React.Fragment key={section}>
                  <button
                    onClick={() => {
                      // Only allow going back or to completed sections
                      if (section <= currentSection || currentSection > section) {
                        setCurrentSection(section);
                      }
                    }}
                    disabled={section > currentSection && currentSection < section}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 flex-1 sm:flex-none ${
                      currentSection === section
                        ? 'bg-arsd-red text-white shadow-md scale-105'
                        : currentSection > section
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {currentSection > section ? (
                      <CheckCircle className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-current flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {section}
                      </span>
                    )}
                    <span className="hidden sm:inline whitespace-nowrap">
                      {section === 1 ? 'Details' : section === 2 ? 'Items' : section === 3 ? 'Attachments' : 'Review'}
                    </span>
                  </button>
                  {section < totalSections && (
                    <div className={`flex-1 h-0.5 mx-1 sm:mx-2 transition-colors duration-200 ${
                      currentSection > section ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Section 1 - Basic Details */}
        {currentSection === 1 && (
          <ARSDCard>
            <div className="space-y-5">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-red-200/30">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-5 w-5 text-arsd-red" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Basic Details</h2>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  DR No
                </label>
                <input
                  type="text"
                  value={derivedDrNo}
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
                    Time <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                    className="mobile-form-input w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project <span className="text-red-600">*</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.supplier}
                  onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                  className="mobile-form-input w-full"
                  placeholder="Enter supplier name"
                  required
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
                  placeholder="Warehouseman name"
                />
              </div>
            </div>
          </ARSDCard>
        )}

        {/* Section 2 - Items */}
        {currentSection === 2 && (
          <ARSDCard>
            <div className="space-y-5">
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
                showPOQty={true}
              />
            </div>
          </ARSDCard>
        )}

        {/* Section 3 - Attachments */}
        {currentSection === 3 && (
          <ARSDCard>
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-red-200/30">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <UploadIcon className="h-5 w-5 text-arsd-red" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Attachments</h2>
              </div>

              <FileUploader
                label="DR Photo"
                value={formData.drPhoto}
                onChange={(file) => setFormData(prev => ({ ...prev, drPhoto: file }))}
                required
              />

              <FileUploader
                label="PO Photo"
                value={formData.poPhoto}
                onChange={(file) => setFormData(prev => ({ ...prev, poPhoto: file }))}
                required
              />
            </div>
          </ARSDCard>
        )}

        {/* Section 4 - Confirmation */}
        {currentSection === 4 && (
          <ARSDCard>
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4 pb-4 border-b border-red-200/30">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-arsd-primary">Review Summary</h2>
              </div>

              <section>
                <h3 className="text-sm font-semibold text-arsd-primary mb-3">Details</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                    <dt className="text-gray-600 shrink-0">DR No</dt>
                    <dd className="font-medium break-words min-w-0">{derivedDrNo}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                    <dt className="text-gray-600 shrink-0">Date & Time</dt>
                    <dd className="font-medium break-words min-w-0">{formData.date} {formData.time}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                    <dt className="text-gray-600 shrink-0">Project</dt>
                    <dd className="font-medium break-words min-w-0">{projects.find(p => p.id === formData.projectId)?.name || 'N/A'}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                    <dt className="text-gray-600 shrink-0">Supplier</dt>
                    <dd className="font-medium break-words min-w-0">{formData.supplier}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                    <dt className="text-gray-600 shrink-0">Warehouseman</dt>
                    <dd className="font-medium break-words min-w-0">{formData.warehouseman || 'Unknown'}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                    <dt className="text-gray-600 shrink-0">Items Count</dt>
                    <dd className="font-medium">{formData.items.length}</dd>
                  </div>
                </dl>
              </section>

              <section>
                <h3 className="text-sm font-semibold text-arsd-primary mb-3">Attachments</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2 border-b border-red-200/20">
                    <dt className="text-gray-600 shrink-0">DR Photo</dt>
                    <dd className="font-medium break-words min-w-0">{formData.drPhoto ? formData.drPhoto.name : 'Not uploaded'}</dd>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 py-2">
                    <dt className="text-gray-600 shrink-0">PO Photo</dt>
                    <dd className="font-medium break-words min-w-0">{formData.poPhoto ? formData.poPhoto.name : 'Not uploaded'}</dd>
                  </div>
                </dl>
              </section>
            </div>
          </ARSDCard>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 sm:gap-4 pt-4">
          {currentSection > 1 && (
            <button
              onClick={() => setCurrentSection(prev => prev - 1)}
              className="btn-arsd-outline mobile-button mobile-touch-target min-h-[44px] flex-1 sm:flex-none sm:min-w-[120px] flex items-center justify-center"
            >
              Previous
            </button>
          )}
          <div className="flex-1" />
          {currentSection < totalSections ? (
            <button
              onClick={() => setCurrentSection(prev => prev + 1)}
              disabled={!canProceed()}
              className="btn-arsd-primary mobile-button mobile-touch-target min-h-[44px] flex-1 sm:flex-none sm:min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="btn-arsd-primary mobile-button mobile-touch-target min-h-[44px] flex-1 sm:flex-none sm:min-w-[180px] px-6 py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              Submit Delivery Receipt
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

