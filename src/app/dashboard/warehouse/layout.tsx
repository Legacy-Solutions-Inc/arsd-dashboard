"use client";

import { WarehouseStoreProvider } from "@/contexts/WarehouseStoreContext";

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <WarehouseStoreProvider>{children}</WarehouseStoreProvider>;
}
