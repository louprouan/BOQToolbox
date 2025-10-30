export interface BidderData {
  id: string;
  name: string;
  fileName: string;
  uploadDate: Date;
  sheets: ExcelSheet[];
  selectedSheet?: string;
  columnMapping?: ColumnMapping;
}

export interface ExcelSheet {
  name: string;
  data: any[][];
  headers: string[];
}

export interface ColumnMapping {
  itemCode: number;      // Excel column index for Item Code
  description: number;   // Excel column index for Description
  unit: number;         // Excel column index for Unit
  quantity: number;     // Excel column index for Quantity
  rate: number;         // Excel column index for Rate
  total: number;        // Excel column index for Total
}

export interface PolarisField {
  key: keyof ColumnMapping;
  label: string;
  description: string;
  required: boolean;
}

export interface BoQItem {
  id: string;
  itemCode: string;
  description: string;
  unit: string;
  quantity: number;
  hierarchyLevel: number;
  isSubtotal: boolean;
  parentId?: string;
  baselineRate?: number;
  baselineTotal?: number;
  bidderQuantities: Record<string, number>;
  bidderRates: Record<string, number>;
  bidderTotals: Record<string, number>;
}

export interface AnalysisTab {
  id: string;
  name: string;
  bidderSheets: Record<string, string>; // bidder name -> sheet name
  calculationMethod: 'average' | 'average-minus-extremes' | 'median';
  showQuantities: boolean;
  showBidderQuantities: boolean;
  showRates: boolean;
  showTotals: boolean;
  deviationThresholds: {
    yellow: number;
    orange: number;
    red: number;
  };
  selectedBidders?: string[];
}

export interface ConsolidatedData {
  items: BoQItem[];
  bidders: string[];
  baseline?: {
    name: string;
    data: Record<string, { rate: number; total: number }>;
  };
}