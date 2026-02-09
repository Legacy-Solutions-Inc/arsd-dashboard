// Mock data for Warehouse Management Module

export type UserRole = 'superadmin' | 'purchasing' | 'warehouseman' | 'project_inspector' | 'project_manager';

export interface MockUser {
  id: string;
  name: string;
  role: UserRole;
  assignedProjectIds: string[];
}

export interface Project {
  id: string;
  name: string;
  location: string;
  siteEngineer: string;
  status: 'active' | 'completed' | 'on_hold';
}

export interface IPOWItem {
  projectId: string;
  wbs: string;
  description: string;
  ipowQty: number;
  cost: number;
  unit: string;
}

export interface DRItem {
  itemDescription: string;
  qtyInDR: number;
  qtyInPO: number;
  unit: string;
}

export interface DeliveryReceipt {
  id: string;
  drNo: string;
  projectId: string;
  supplier: string;
  items: DRItem[];
  date: string;
  locked: boolean;
  warehouseman: string;
  drPhoto?: string;
  poPhoto?: string;
}

export interface ReleaseItem {
  itemDescription: string;
  qty: number;
  unit: string;
}

export interface ReleaseForm {
  id: string;
  releaseNo: string;
  projectId: string;
  receivedBy: string;
  items: ReleaseItem[];
  date: string;
  locked: boolean;
  warehouseman?: string;
  purpose?: string;
  attachment?: string;
}

// Mock User Data
export const mockUser: MockUser = {
  id: 'user-1',
  name: 'John Doe',
  role: 'warehouseman', // Change this to test different roles
  assignedProjectIds: ['proj-1', 'proj-2']
};

// Mock Projects
export const projects: Project[] = [
  {
    id: 'proj-1',
    name: 'Residential Complex Phase 1',
    location: 'Makati City',
    siteEngineer: 'Engineer Smith',
    status: 'active'
  },
  {
    id: 'proj-2',
    name: 'Commercial Building Tower A',
    location: 'BGC, Taguig',
    siteEngineer: 'Engineer Johnson',
    status: 'active'
  },
  {
    id: 'proj-3',
    name: 'Highway Extension Project',
    location: 'Quezon City',
    siteEngineer: 'Engineer Williams',
    status: 'active'
  },
  {
    id: 'proj-4',
    name: 'Shopping Mall Renovation',
    location: 'Pasig City',
    siteEngineer: 'Engineer Brown',
    status: 'on_hold'
  },
  {
    id: 'proj-5',
    name: 'Hospital Wing Expansion',
    location: 'Manila',
    siteEngineer: 'Engineer Davis',
    status: 'active'
  }
];

// Mock IPOW Items
export const ipowItems: IPOWItem[] = [
  {
    projectId: 'proj-1',
    wbs: 'WBS-001',
    description: 'Reinforcing Steel Bar #16',
    ipowQty: 5000,
    cost: 45000,
    unit: 'kg'
  },
  {
    projectId: 'proj-1',
    wbs: 'WBS-002',
    description: 'Portland Cement Type 1',
    ipowQty: 1000,
    cost: 35000,
    unit: 'bags'
  },
  {
    projectId: 'proj-1',
    wbs: 'WBS-003',
    description: 'Gravel 3/4"',
    ipowQty: 500,
    cost: 25000,
    unit: 'cu.m'
  },
  {
    projectId: 'proj-2',
    wbs: 'WBS-101',
    description: 'Reinforcing Steel Bar #12',
    ipowQty: 3000,
    cost: 27000,
    unit: 'kg'
  },
  {
    projectId: 'proj-2',
    wbs: 'WBS-102',
    description: 'Portland Cement Type 1',
    ipowQty: 800,
    cost: 28000,
    unit: 'bags'
  },
  {
    projectId: 'proj-3',
    wbs: 'WBS-201',
    description: 'Asphalt Concrete',
    ipowQty: 2000,
    cost: 120000,
    unit: 'tons'
  },
  {
    projectId: 'proj-3',
    wbs: 'WBS-202',
    description: 'Aggregate Base Course',
    ipowQty: 1500,
    cost: 75000,
    unit: 'cu.m'
  }
];

// Mock Delivery Receipts
export const deliveryReceipts: DeliveryReceipt[] = [
  {
    id: 'dr-1',
    drNo: 'DR-2024-001',
    projectId: 'proj-1',
    supplier: 'ABC Steel Corporation',
    items: [
      {
        itemDescription: 'Reinforcing Steel Bar #16',
        qtyInDR: 500,
        qtyInPO: 500,
        unit: 'kg'
      },
      {
        itemDescription: 'Portland Cement Type 1',
        qtyInDR: 100,
        qtyInPO: 100,
        unit: 'bags'
      }
    ],
    date: '2024-01-15',
    locked: true,
    warehouseman: 'John Doe'
  },
  {
    id: 'dr-2',
    drNo: 'DR-2024-002',
    projectId: 'proj-1',
    supplier: 'XYZ Construction Supply',
    items: [
      {
        itemDescription: 'Gravel 3/4"',
        qtyInDR: 50,
        qtyInPO: 50,
        unit: 'cu.m'
      }
    ],
    date: '2024-01-20',
    locked: true,
    warehouseman: 'Alex Cruz'
  },
  {
    id: 'dr-3',
    drNo: 'DR-2024-003',
    projectId: 'proj-2',
    supplier: 'ABC Steel Corporation',
    items: [
      {
        itemDescription: 'Reinforcing Steel Bar #12',
        qtyInDR: 300,
        qtyInPO: 300,
        unit: 'kg'
      }
    ],
    date: '2024-01-25',
    locked: false,
    warehouseman: 'Maria Santos'
  }
];

// Mock Release Forms
export const releaseForms: ReleaseForm[] = [
  {
    id: 'rel-1',
    releaseNo: 'REL-2024-001',
    projectId: 'proj-1',
    receivedBy: 'Site Foreman A',
    items: [
      {
        itemDescription: 'Reinforcing Steel Bar #16',
        qty: 200,
        unit: 'kg'
      },
      {
        itemDescription: 'Portland Cement Type 1',
        qty: 50,
        unit: 'bags'
      }
    ],
    date: '2024-01-16',
    locked: true,
    warehouseman: 'John Doe',
    purpose: 'Foundation works - Column reinforcement'
  },
  {
    id: 'rel-2',
    releaseNo: 'REL-2024-002',
    projectId: 'proj-1',
    receivedBy: 'Site Foreman B',
    items: [
      {
        itemDescription: 'Gravel 3/4"',
        qty: 30,
        unit: 'cu.m'
      }
    ],
    date: '2024-01-21',
    locked: true,
    warehouseman: 'Alex Cruz',
    purpose: 'Road base preparation'
  },
  {
    id: 'rel-3',
    releaseNo: 'REL-2024-003',
    projectId: 'proj-2',
    receivedBy: 'Site Engineer Johnson',
    items: [
      {
        itemDescription: 'Reinforcing Steel Bar #12',
        qty: 150,
        unit: 'kg'
      }
    ],
    date: '2024-01-26',
    locked: false,
    warehouseman: 'Maria Santos',
    purpose: 'Beam reinforcement'
  }
];

// Helper function to get projects based on user role
export function getAccessibleProjects(user: MockUser): Project[] {
  if (user.role === 'superadmin' || user.role === 'purchasing') {
    return projects;
  }
  return projects.filter(p => user.assignedProjectIds.includes(p.id));
}

// Helper function to check if user can create DR/Release
export function canCreateDRRelease(user: MockUser): boolean {
  return user.role === 'warehouseman';
}

// Helper function to check if user can view all projects
export function canViewAllProjects(user: MockUser): boolean {
  return user.role === 'superadmin' || user.role === 'purchasing';
}

// Helper: only project inspector (PM) / project manager (site engineer) or superadmin can unlock DR/RF after warehouseman submit
export function canUnlockDRRelease(user: MockUser): boolean {
  return ['superadmin', 'project_inspector', 'project_manager'].includes(user.role);
}

// Fallback warehouseman for mock release forms (used when store has stale data without warehouseman)
export const releaseWarehousemanFallback: Record<string, string> = {
  'rel-1': 'John Doe',
  'rel-2': 'Alex Cruz',
  'rel-3': 'Maria Santos',
};

