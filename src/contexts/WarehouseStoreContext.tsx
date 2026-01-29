"use client";

import React, { createContext, useContext, useCallback, useState } from "react";
import type { DeliveryReceipt, ReleaseForm } from "@/data/warehouseMock";
import {
  deliveryReceipts as initialDRs,
  releaseForms as initialRFs,
} from "@/data/warehouseMock";

function normalizeDR(
  dr: DeliveryReceipt | (Omit<DeliveryReceipt, "warehouseman"> & { warehouseman?: string })
): DeliveryReceipt {
  return { ...dr, warehouseman: dr.warehouseman ?? "Unknown" };
}

interface WarehouseStoreContextValue {
  deliveryReceipts: DeliveryReceipt[];
  releaseForms: ReleaseForm[];
  addDR: (dr: DeliveryReceipt) => void;
  addRelease: (rf: ReleaseForm) => void;
  setDRLock: (id: string, locked: boolean) => void;
  setReleaseLock: (id: string, locked: boolean) => void;
}

const WarehouseStoreContext = createContext<WarehouseStoreContextValue | null>(
  null
);

export function WarehouseStoreProvider({ children }: { children: React.ReactNode }) {
  const [deliveryReceipts, setDeliveryReceipts] = useState<DeliveryReceipt[]>(
    () => (JSON.parse(JSON.stringify(initialDRs)) as typeof initialDRs).map(normalizeDR)
  );
  const [releaseForms, setReleaseForms] = useState<ReleaseForm[]>(() =>
    JSON.parse(JSON.stringify(initialRFs))
  );

  const addDR = useCallback((dr: DeliveryReceipt) => {
    setDeliveryReceipts((prev) => [...prev, normalizeDR(dr)]);
  }, []);

  const addRelease = useCallback((rf: ReleaseForm) => {
    setReleaseForms((prev) => [...prev, rf]);
  }, []);

  const setDRLock = useCallback((id: string, locked: boolean) => {
    setDeliveryReceipts((prev) =>
      prev.map((dr) => (dr.id === id ? { ...dr, locked } : dr))
    );
  }, []);

  const setReleaseLock = useCallback((id: string, locked: boolean) => {
    setReleaseForms((prev) =>
      prev.map((rf) => (rf.id === id ? { ...rf, locked } : rf))
    );
  }, []);

  const value: WarehouseStoreContextValue = {
    deliveryReceipts,
    releaseForms,
    addDR,
    addRelease,
    setDRLock,
    setReleaseLock,
  };

  return (
    <WarehouseStoreContext.Provider value={value}>
      {children}
    </WarehouseStoreContext.Provider>
  );
}

export function useWarehouseStore() {
  const ctx = useContext(WarehouseStoreContext);
  if (!ctx) {
    throw new Error("useWarehouseStore must be used within WarehouseStoreProvider");
  }
  return ctx;
}
