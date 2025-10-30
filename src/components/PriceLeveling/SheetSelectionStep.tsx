import { CheckIcon, FileSpreadsheetIcon, SettingsIcon, ArrowRightIcon } from "lucide-react";
import React from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Label } from "../ui/label";
import { BidderData, ColumnMapping, PolarisField } from "../../types/priceleveling";

const POLARIS_FIELDS: PolarisField[] = [
  { key: 'itemCode', label: 'Item Code', description: 'Unique identifier for each item', required: true },
  { key: 'description', label: 'Description', description: 'Item description or name', required: true },
  { key: 'unit', label: 'Unit', description: 'Unit of measurement (m², kg, etc.)', required: true },
  { key: 'quantity', label: 'Quantity', description: 'Number of units', required: true },
  { key: 'rate', label: 'Rate', description: 'Unit price or rate', required: true },
  { key: 'total', label: 'Total', description: 'Total amount (Quantity × Rate)', required: false }
];

interface SheetSelectionStepProps {
  bidders: BidderData[];
  onBiddersUpdate: (bidders: BidderData[]) => void;
}

export const SheetSelectionStep: React.FC<SheetSelectionStepProps> = ({
  bidders,
  onBiddersUpdate
}) => {
  const [selectedBidder, setSelectedBidder] = React.useState<string | null>(null);

  const selectSheet = (bidderId: string, sheetName: string) => {
    const updatedBidders = bidders.map(bidder =>
      bidder.id === bidderId
        ? { ...bidder, selectedSheet: sheetName }
        : bidder
    );
    onBiddersUpdate(updatedBidders);
  };

  const updateColumnMapping = (bidderId: string, mapping: ColumnMapping) => {
    const updatedBidders = bidders.map(bidder =>
      bidder.id === bidderId
        ? { ...bidder, columnMapping: mapping }
        : bidder
    );
    onBiddersUpdate(updatedBidders);
  };

  const getDefaultColumnMapping = (headers: string[]): ColumnMapping => {
    return {
      itemCode: Math.max(0, headers.findIndex(h => h.toLowerCase().includes('item') || h.toLowerCase().includes('code'))),
      description: Math.max(0, headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('item'))),
      unit: Math.max(0, headers.findIndex(h => h.toLowerCase().includes('unit'))),
      quantity: Math.max(0, headers.findIndex(h => h.toLowerCase().includes('quantity') || h.toLowerCase().includes('qty'))),
      rate: Math.max(0, headers.findIndex(h => h.toLowerCase().includes('rate') || h.toLowerCase().includes('price'))),
      total: Math.max(0, headers.findIndex(h => h.toLowerCase().includes('total') || h.toLowerCase().includes('amount')))
    };
  };

  const allSheetsSelected = bidders.every(bidder => bidder.selectedSheet);
  const allColumnsMapped = bidders.every(bidder => bidder.columnMapping);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-[#001d3d] mb-2">
          Select Sheets for Analysis
        </h3>
        <p className="text-gray-600">
          Choose which sheet contains the Bill of Quantities for each bidder
        </p>
      </div>

      {allSheetsSelected && !allColumnsMapped && (
        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800 font-medium">Next: Configure column mapping for each bidder</p>
        </div>
      )}

      <div className="grid gap-6">
        {bidders.map((bidder) => (
          <Card key={bidder.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheetIcon className="w-5 h-5 text-[#008080]" />
                {bidder.name}
                {bidder.selectedSheet && (
                  <CheckIcon className="w-5 h-5 text-green-600 ml-auto" />
                )}
                {bidder.selectedSheet && !selectedBidder && (
                  <Button variant="ghost" size="sm" onClick={() => setSelectedBidder(bidder.id)} className="ml-2">
                    <SettingsIcon className="w-4 h-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedBidder === bidder.id ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Column Mapping for {bidder.selectedSheet}</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setSelectedBidder(null)}
                    >
                      Back to Sheet Selection
                    </Button>
                  </div>
                  
                  {bidder.selectedSheet && (() => {
                    const selectedSheet = bidder.sheets.find(s => s.name === bidder.selectedSheet);
                    if (!selectedSheet) return null;
                    
                    const currentMapping = bidder.columnMapping || getDefaultColumnMapping(selectedSheet.headers);
                    
                    return (
                      <div className="space-y-4">
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-2">
                            <strong>Excel Headers:</strong> {selectedSheet.headers.join(' | ')}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {POLARIS_FIELDS.map((field) => (
                            <div key={field.key} className="space-y-2">
                              <Label className="flex items-center gap-2">
                                <span className="font-medium">{field.label}</span>
                                {field.required && <span className="text-red-500">*</span>}
                                <ArrowRightIcon className="w-3 h-3 text-gray-400" />
                              </Label>
                              <Select
                                value={currentMapping[field.key].toString()}
                                onValueChange={(value) => {
                                  const newMapping = {
                                    ...currentMapping,
                                    [field.key]: parseInt(value)
                                  };
                                  updateColumnMapping(bidder.id, newMapping);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {selectedSheet.headers.map((header, index) => (
                                    <SelectItem key={index} value={index.toString()}>
                                      Column {index + 1}: {header}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500">{field.description}</p>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={() => setSelectedBidder(null)}
                            className="bg-[#008080] hover:bg-[#006666]"
                          >
                            Confirm Mapping
                          </Button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {bidder.sheets.map((sheet) => (
                      <Button
                        key={sheet.name}
                        variant={bidder.selectedSheet === sheet.name ? "default" : "outline"}
                        className={`h-auto p-4 justify-start ${
                          bidder.selectedSheet === sheet.name
                            ? "bg-[#008080] hover:bg-[#006666]"
                            : ""
                        }`}
                        onClick={() => selectSheet(bidder.id, sheet.name)}
                      >
                        <div className="text-left">
                          <p className="font-medium">{sheet.name}</p>
                          <p className="text-sm opacity-70">
                            {sheet.data.length} rows • {sheet.headers.length} columns
                          </p>
                        </div>
                      </Button>
                    ))}
                  </div>
                  
                  {bidder.selectedSheet && !bidder.columnMapping && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        <strong>Next step:</strong> Click the settings icon to configure column mapping
                      </p>
                    </div>
                  )}
                  
                  {bidder.columnMapping && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">
                        <CheckIcon className="w-4 h-4 inline mr-2" />
                        Column mapping configured
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {allSheetsSelected && allColumnsMapped && (
        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-green-800 font-medium">
            All sheets selected and columns mapped! Ready to proceed to analysis.
          </p>
        </div>
      )}
    </div>
  );
};