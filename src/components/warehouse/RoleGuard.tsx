"use client";

import React from 'react';
import { UserRole } from '@/data/warehouseMock';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  currentRole: UserRole;
}

export function RoleGuard({ children, allowedRoles, currentRole }: RoleGuardProps) {
  if (!allowedRoles.includes(currentRole)) {
    return null;
  }

  return <>{children}</>;
}

