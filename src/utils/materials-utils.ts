/**
 * Utility functions for Materials component computations
 */

export interface DatabaseMaterial {
  id: string;
  material: string;
  type: string;
  unit: string;
  sum_qty: number;
  created_at: string;
}

export interface DatabasePurchaseOrder {
  id: string;
  po_number: string;
  date_requested: string;
  expected_delivery_date: string;
  materials_requested: string;
  qty: number;
  unit: string;
  status: string;
  priority_level: string;
  created_at: string;
}

export interface Material {
  name: string;
  type: string;
  unit: string;
  totalQuantity: number;
  requestedQuantity: number;
  receivedQuantity: number;
  utilizedQuantity: number;
  pendingQuantity: number;
  purchaseOrders: DatabasePurchaseOrder[];
}

export interface MaterialFilters {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
}

export interface MaterialSorting {
  field: 'name' | 'type' | 'totalQuantity' | 'requestedQuantity' | 'receivedQuantity';
  direction: 'asc' | 'desc';
}

export interface ProcessedMaterialsData {
  processedMaterials: Material[];
  filteredMaterials: Material[];
  paginatedMaterials: Material[];
  paginationInfo: PaginationInfo;
  summaryStats: MaterialSummaryStats;
  pieData: PieDataPoint[];
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  startIndex: number;
  endIndex: number;
}

export interface MaterialSummaryStats {
  totalRequests: number;
  receivedPercentage: number;
  utilizedPercentage: number;
  uniqueMaterials: number;
  totalPurchaseOrders: number;
}

export interface PieDataPoint {
  name: string;
  value: number;
}

// Constants
export const ITEMS_PER_PAGE = 8;
export const PIE_COLORS = ["#F59E0B", "#14B8A6", "#3B82F6", "#F8BBD9"]; // Orange, Teal, Blue, Pink
export const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "partial", label: "Partial" },
  { value: "received", label: "Received" },
  { value: "utilized", label: "Utilized" },
  { value: "pending", label: "Pending" }
] as const;

/**
 * Determine material status based on quantities
 */
export const getMaterialStatus = (material: Material): string => {
  if (material.utilizedQuantity >= material.receivedQuantity && material.receivedQuantity > 0) {
    return "utilized";
  } else if (material.utilizedQuantity > 0) {
    return "partial";
  } else if (material.receivedQuantity > 0) {
    return "received";
  }
  return "pending";
};

/**
 * Get status badge variant styling
 */
export const getStatusBadgeVariant = (status: string): string => {
  switch (status) {
    case "utilized":
      return "bg-green-100 text-green-800 border-green-200";
    case "partial":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "received":
      return "bg-blue-100 text-blue-800 border-blue-200";
    default:
      return "bg-red-100 text-red-800 border-red-200";
  }
};

/**
 * Get status label for display
 */
export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "utilized":
      return "Utilized";
    case "partial":
      return "Partial";
    case "received":
      return "Received";
    default:
      return "Pending";
  }
};

/**
 * Process and combine materials with purchase orders
 */
export const processMaterialsData = (
  materials: DatabaseMaterial[],
  purchaseOrders: DatabasePurchaseOrder[]
): Material[] => {
  const materialMap = new Map<string, Material>();
  
  // Process materials from database - determine status from material name/type
  materials.forEach((dbMaterial) => {
    const materialName = dbMaterial.material;
    const materialType = dbMaterial.type?.toLowerCase() || '';
    const key = materialName.toLowerCase(); // Use material name as key to group by material
    
    if (!materialMap.has(key)) {
      const material: Material = {
        name: materialName,
        type: materialType,
        unit: dbMaterial.unit,
        totalQuantity: dbMaterial.sum_qty,
        requestedQuantity: 0,
        receivedQuantity: 0,
        utilizedQuantity: 0,
        pendingQuantity: 0,
        purchaseOrders: []
      };
      
      // Determine status based on type
      if (materialType === 'requested') {
        material.requestedQuantity = dbMaterial.sum_qty;
      } else if (materialType === 'received' || materialType === 'recieved') {
        material.receivedQuantity = dbMaterial.sum_qty;
      } else if (materialType === 'utilized') {
        material.utilizedQuantity = dbMaterial.sum_qty;
      }
      
      materialMap.set(key, material);
    } else {
      // Accumulate quantities for same material
      const existing = materialMap.get(key)!;
      existing.totalQuantity += dbMaterial.sum_qty;
      
      // Update quantities based on type
      if (materialType === 'requested') {
        existing.requestedQuantity += dbMaterial.sum_qty;
      } else if (materialType === 'received' || materialType === 'recieved') {
        existing.receivedQuantity += dbMaterial.sum_qty;
      } else if (materialType === 'utilized') {
        existing.utilizedQuantity += dbMaterial.sum_qty;
      }
    }
  });
  
  // Process purchase orders and match with materials
  purchaseOrders.forEach((po) => {
    const materialName = po.materials_requested.toLowerCase();
    const matchingMaterial = Array.from(materialMap.values()).find(
      m => m.name.toLowerCase().includes(materialName) || materialName.includes(m.name.toLowerCase())
    );
    
    if (matchingMaterial) {
      matchingMaterial.purchaseOrders.push(po);
    }
  });
  
  // Calculate pending quantities
  materialMap.forEach((material) => {
    material.pendingQuantity = Math.max(0, material.requestedQuantity - material.receivedQuantity);
  });
  
  return Array.from(materialMap.values());
};

/**
 * Filter materials based on search and status filters
 */
export const filterMaterials = (
  materials: Material[],
  filters: MaterialFilters
): Material[] => {
  return materials.filter((material) => {
    // Search term filter
    const matchesSearch = !filters.searchTerm || 
      material.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      material.type.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      material.unit.toLowerCase().includes(filters.searchTerm.toLowerCase());

    // Status filter
    const materialStatus = getMaterialStatus(material);
    const matchesStatus = filters.statusFilter === "all" || materialStatus === filters.statusFilter;

    // Type filter
    const matchesType = !filters.typeFilter || 
      material.type.toLowerCase() === filters.typeFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesType;
  });
};

/**
 * Sort materials based on field and direction
 */
export const sortMaterials = (
  materials: Material[],
  sorting: MaterialSorting
): Material[] => {
  return [...materials].sort((a, b) => {
    const fieldA = a[sorting.field];
    const fieldB = b[sorting.field];

    // Handle string comparison
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      const comparison = fieldA.toLowerCase().localeCompare(fieldB.toLowerCase());
      return sorting.direction === 'asc' ? comparison : -comparison;
    }

    // Handle numeric comparison
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sorting.direction === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }

    return 0;
  });
};

/**
 * Calculate pagination information
 */
export const calculatePagination = (
  totalItems: number,
  currentPage: number,
  itemsPerPage: number
): PaginationInfo => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    startIndex,
    endIndex
  };
};

/**
 * Get paginated materials
 */
export const getPaginatedMaterials = (
  materials: Material[],
  paginationInfo: PaginationInfo
): Material[] => {
  return materials.slice(paginationInfo.startIndex, paginationInfo.endIndex);
};

/**
 * Calculate summary statistics
 */
export const calculateMaterialSummaryStats = (processedMaterials: Material[]): MaterialSummaryStats => {
  const totalRequests = processedMaterials.reduce((sum, material) => sum + material.requestedQuantity, 0);
  const totalReceived = processedMaterials.reduce((sum, material) => sum + material.receivedQuantity, 0);
  const totalUtilized = processedMaterials.reduce((sum, material) => sum + material.utilizedQuantity, 0);
  const totalPurchaseOrders = processedMaterials.reduce((sum, material) => sum + material.purchaseOrders.length, 0);
  
  const receivedPercentage = totalRequests > 0 ? (totalReceived / totalRequests) * 100 : 0;
  const utilizedPercentage = totalReceived > 0 ? (totalUtilized / totalReceived) * 100 : 0;
  
  return {
    totalRequests,
    receivedPercentage: Math.round(receivedPercentage * 100) / 100,
    utilizedPercentage: Math.round(utilizedPercentage * 100) / 100,
    uniqueMaterials: processedMaterials.length,
    totalPurchaseOrders
  };
};

/**
 * Generate pie chart data for selected material
 */
export const generatePieData = (selectedMaterial: Material | null): PieDataPoint[] => {
  if (!selectedMaterial) return [];

  return [
    { name: "Requested", value: selectedMaterial.requestedQuantity },
    { name: "Received", value: selectedMaterial.receivedQuantity },
    { name: "Utilized", value: selectedMaterial.utilizedQuantity },
    { name: "Pending", value: selectedMaterial.pendingQuantity },
  ].filter(item => item.value > 0);
};

/**
 * Calculate percent received for a material
 */
export const calculatePercentReceived = (material: Material | null): number => {
  if (!material || material.requestedQuantity <= 0) return 0;
  return Math.round((material.receivedQuantity / material.requestedQuantity) * 100);
};

/**
 * Get unique filter values for dropdowns
 */
export const getUniqueFilterValues = (materials: Material[]) => {
  const types = [...new Set(materials.map(m => m.type))].filter(Boolean).sort();
  const statuses = [...new Set(materials.map(m => getMaterialStatus(m)))].sort();
  const units = [...new Set(materials.map(m => m.unit))].filter(Boolean).sort();

  return {
    types,
    statuses,
    units
  };
};

/**
 * Get PO status badge styling
 */
export const getPOStatusBadgeStyling = (status: string): string => {
  const normalizedStatus = status.toLowerCase();
  
  if (normalizedStatus.includes('delivered') || 
      normalizedStatus.includes('received') || 
      normalizedStatus.includes('recieved')) {
    return "bg-green-100 text-green-800 border-green-200";
  } else if (normalizedStatus.includes('utilized') || 
             normalizedStatus.includes('used')) {
    return "bg-blue-100 text-blue-800 border-blue-200";
  } else if (normalizedStatus.includes('pending')) {
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  } else {
    return "bg-red-100 text-red-800 border-red-200";
  }
};

/**
 * Get priority badge styling
 */
export const getPriorityBadgeStyling = (priority: string): string => {
  const normalizedPriority = priority?.toLowerCase();
  
  switch (normalizedPriority) {
    case 'high':
      return "bg-red-100 text-red-800 border-red-200";
    case 'medium':
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case 'low':
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

/**
 * Validate material data
 */
export const validateMaterial = (material: Material): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!material.name || material.name.trim() === '') {
    errors.push('Material name is required');
  }

  if (!material.unit || material.unit.trim() === '') {
    errors.push('Unit is required');
  }

  if (material.totalQuantity < 0) {
    errors.push('Total quantity cannot be negative');
  }

  if (material.requestedQuantity < 0) {
    errors.push('Requested quantity cannot be negative');
  }

  if (material.receivedQuantity < 0) {
    errors.push('Received quantity cannot be negative');
  }

  if (material.utilizedQuantity < 0) {
    errors.push('Utilized quantity cannot be negative');
  }

  if (material.utilizedQuantity > material.receivedQuantity) {
    errors.push('Utilized quantity cannot exceed received quantity');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Search materials with fuzzy matching
 */
export const fuzzySearchMaterials = (
  materials: Material[],
  searchTerm: string
): Material[] => {
  if (!searchTerm.trim()) return materials;

  const normalizedSearchTerm = searchTerm.toLowerCase();
  
  return materials.filter(material => {
    const searchableText = [
      material.name,
      material.type,
      material.unit
    ].join(' ').toLowerCase();

    // Simple fuzzy matching - check if all characters of search term exist in order
    let searchIndex = 0;
    for (let i = 0; i < searchableText.length && searchIndex < normalizedSearchTerm.length; i++) {
      if (searchableText[i] === normalizedSearchTerm[searchIndex]) {
        searchIndex++;
      }
    }

    return searchIndex === normalizedSearchTerm.length;
  });
};

/**
 * Calculate material efficiency metrics
 */
export const calculateMaterialEfficiency = (materials: Material[]) => {
  const totalRequested = materials.reduce((sum, m) => sum + m.requestedQuantity, 0);
  const totalReceived = materials.reduce((sum, m) => sum + m.receivedQuantity, 0);
  const totalUtilized = materials.reduce((sum, m) => sum + m.utilizedQuantity, 0);

  const deliveryRate = totalRequested > 0 ? (totalReceived / totalRequested) * 100 : 0;
  const utilizationRate = totalReceived > 0 ? (totalUtilized / totalReceived) * 100 : 0;
  const wasteRate = totalReceived > 0 ? ((totalReceived - totalUtilized) / totalReceived) * 100 : 0;

  return {
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    utilizationRate: Math.round(utilizationRate * 100) / 100,
    wasteRate: Math.round(wasteRate * 100) / 100
  };
};

/**
 * Main function to process all materials data
 */
export const processMaterialsDataComplete = (
  materials: DatabaseMaterial[],
  purchaseOrders: DatabasePurchaseOrder[],
  filters: MaterialFilters,
  sorting: MaterialSorting,
  currentPage: number,
  itemsPerPage: number = ITEMS_PER_PAGE,
  selectedMaterial: Material | null = null
): ProcessedMaterialsData => {
  // Process raw data
  const processedMaterials = processMaterialsData(materials, purchaseOrders);
  
  // Filter materials
  const filteredMaterials = filterMaterials(processedMaterials, filters);
  
  // Sort materials
  const sortedMaterials = sortMaterials(filteredMaterials, sorting);
  
  // Calculate pagination
  const paginationInfo = calculatePagination(sortedMaterials.length, currentPage, itemsPerPage);
  
  // Get paginated materials
  const paginatedMaterials = getPaginatedMaterials(sortedMaterials, paginationInfo);
  
  // Calculate summary stats
  const summaryStats = calculateMaterialSummaryStats(processedMaterials);
  
  // Generate pie data for selected material
  const pieData = generatePieData(selectedMaterial);

  return {
    processedMaterials,
    filteredMaterials: sortedMaterials,
    paginatedMaterials,
    paginationInfo,
    summaryStats,
    pieData
  };
};

/**
 * Export materials data to CSV format
 */
export const exportMaterialsToCSV = (materials: Material[]): string => {
  const headers = ['Name', 'Type', 'Unit', 'Requested', 'Received', 'Utilized', 'Pending', 'Status'];
  const csvRows = [headers.join(',')];

  materials.forEach(material => {
    const status = getMaterialStatus(material);
    const values = [
      `"${material.name}"`,
      `"${material.type}"`,
      `"${material.unit}"`,
      material.requestedQuantity.toString(),
      material.receivedQuantity.toString(),
      material.utilizedQuantity.toString(),
      material.pendingQuantity.toString(),
      `"${getStatusLabel(status)}"`
    ];
    csvRows.push(values.join(','));
  });

  return csvRows.join('\n');
};

/**
 * Get materials by status
 */
export const getMaterialsByStatus = (materials: Material[], status: string): Material[] => {
  return materials.filter(material => getMaterialStatus(material) === status);
};

/**
 * Get materials by type
 */
export const getMaterialsByType = (materials: Material[], type: string): Material[] => {
  return materials.filter(material => 
    material.type.toLowerCase() === type.toLowerCase()
  );
};

/**
 * Get overdue purchase orders
 */
export const getOverduePurchaseOrders = (materials: Material[]): DatabasePurchaseOrder[] => {
  const currentDate = new Date();
  const overduePOs: DatabasePurchaseOrder[] = [];

  materials.forEach(material => {
    material.purchaseOrders.forEach(po => {
      const expectedDate = new Date(po.expected_delivery_date);
      if (expectedDate < currentDate && !po.status.toLowerCase().includes('delivered')) {
        overduePOs.push(po);
      }
    });
  });

  return overduePOs;
};
