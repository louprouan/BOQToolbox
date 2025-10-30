export interface BoQColumn {
  id: string;
  name: string;
  type: 'text' | 'number' | 'currency' | 'formula';
  width?: number;
  required?: boolean;
  formula?: string; // For calculated columns like total = quantity * unit_rate
}

export interface BoQSheet {
  id: string;
  name: string;
  columns: BoQColumn[];
}

export interface BoQTemplate {
  id: string;
  name: string;
  description: string;
  sheets: BoQSheet[];
  formatting: {
    headerStyle: {
      backgroundColor: string;
      textColor: string;
      fontSize: number;
      bold: boolean;
    };
    dataStyle: {
      fontSize: number;
      alternateRowColor: boolean;
      borderStyle: 'none' | 'thin' | 'medium';
    };
    currencyFormat: string;
    numberFormat: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BoQPreset {
  id: string;
  name: string;
  description: string;
  columns: Omit<BoQColumn, 'id'>[];
}