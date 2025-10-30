import { CheckIcon, DatabaseIcon, FileSpreadsheetIcon, TrendingUpIcon } from "lucide-react";
import React, { useState } from "react";
import { AIHierarchyDetector } from "../../utils/hierarchyDetection";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BidderData, ConsolidatedData, BoQItem } from "../../types/priceleveling";
import { ImportStep } from "./ImportStep";
import { SheetSelectionStep } from "./SheetSelectionStep";
import { ConsolidationStep } from "./ConsolidationStep";
import { AnalysisStep } from "./AnalysisStep";

type Step = 'import' | 'sheets' | 'consolidate' | 'analyze';

export const PriceLevelingTool: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>('import');
  const [bidders, setBidders] = useState<BidderData[]>([]);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedData | null>(null);

  const steps = [
    { id: 'import', label: 'Import Data', icon: FileSpreadsheetIcon },
    { id: 'sheets', label: 'Select Sheets', icon: CheckIcon },
    { id: 'analyze', label: 'Analyze', icon: TrendingUpIcon },
  ];

  const canProceedToSheets = bidders.length > 0;
  const canProceedToConsolidate = bidders.every(b => b.selectedSheet && b.columnMapping);
  const canProceedToAnalyze = canProceedToConsolidate;

  // Auto-consolidate when sheets are selected
  React.useEffect(() => {
    if (canProceedToConsolidate && !consolidatedData) {
      // Process actual Excel data from bidders
      processExcelData();
    }
  }, [canProceedToConsolidate, consolidatedData, bidders]);

  const processExcelData = () => {
    const hierarchyDetector = new AIHierarchyDetector();
    const consolidatedItems: BoQItem[] = [];
    const bidderNames = bidders.map(b => b.name);
    
    // Find the longest sheet to use as baseline structure
    let maxItems = 0;
    let baselineSheet: any = null;
    
    bidders.forEach(bidder => {
      if (bidder.selectedSheet) {
        const sheet = bidder.sheets.find(s => s.name === bidder.selectedSheet);
        if (sheet && sheet.data.length > maxItems) {
          maxItems = sheet.data.length;
          baselineSheet = sheet;
        }
      }
    });
    
    if (!baselineSheet) return;
    
    // Process each row from the baseline sheet
    for (let rowIndex = 1; rowIndex < baselineSheet.data.length; rowIndex++) {
      const row = baselineSheet.data[rowIndex];
      if (!row || row.length === 0) continue;
      
      // Extract basic item information (assuming standard BoQ columns)
      // Use the first bidder's column mapping as baseline structure
      const firstBidder = bidders[0];
      if (!firstBidder.columnMapping) continue;
      
      const itemCode = String(row[firstBidder.columnMapping.itemCode] || '').trim();
      const description = String(row[firstBidder.columnMapping.description] || '').trim();
      const unit = String(row[firstBidder.columnMapping.unit] || '').trim();
      const quantity = parseFloat(row[firstBidder.columnMapping.quantity]) || 0;
      
      // Collect rates and totals from all bidders
      const bidderRates: { [key: string]: number } = {};
      const bidderTotals: { [key: string]: number } = {};
      const bidderQuantities: { [key: string]: number } = {};
      
      bidders.forEach(bidder => {
        if (bidder.selectedSheet && bidder.columnMapping) {
          const bidderSheet = bidder.sheets.find(s => s.name === bidder.selectedSheet);
          if (bidderSheet && bidderSheet.data[rowIndex] && bidder.columnMapping) {
            const bidderRow = bidderSheet.data[rowIndex];
            
            // Use column mapping to extract data
            const bidderQuantity = parseFloat(bidderRow[bidder.columnMapping.quantity]) || 0;
            const rate = parseFloat(bidderRow[bidder.columnMapping.rate]) || 0;
            const total = parseFloat(bidderRow[bidder.columnMapping.total]) || 0;
            
            // Calculate missing values if needed
            const finalQuantity = bidderQuantity || quantity;
            const finalRate = rate || (total && finalQuantity ? total / finalQuantity : 0);
            const finalTotal = total || (rate && finalQuantity ? rate * finalQuantity : 0);
            
            bidderQuantities[bidder.name] = finalQuantity;
            bidderRates[bidder.name] = finalRate;
            bidderTotals[bidder.name] = finalTotal;
          }
        }
      });
      
      // Only include items that have data from at least one bidder
      if (Object.values(bidderRates).some(rate => rate > 0)) {
        const item: BoQItem = {
          id: `item-${rowIndex}`,
          itemCode: itemCode || `ITEM-${String(rowIndex).padStart(3, '0')}`,
          description,
          unit: unit || 'unit',
          quantity: Object.values(bidderQuantities).reduce((sum, qty) => sum + qty, 0) / Object.values(bidderQuantities).filter(qty => qty > 0).length || quantity,
          hierarchyLevel: 1, // Will be updated by hierarchy detector
          isSubtotal: false, // Will be updated by hierarchy detector
          baselineRate: Object.values(bidderRates).reduce((sum, rate) => sum + rate, 0) / Object.values(bidderRates).filter(rate => rate > 0).length || 0,
          baselineTotal: Object.values(bidderTotals).reduce((sum, total) => sum + total, 0) / Object.values(bidderTotals).filter(total => total > 0).length || 0,
          bidderQuantities,
          bidderRates,
          bidderTotals
        };
        
        consolidatedItems.push(item);
      }
    }
    
    // Process with AI hierarchy detection
    const processedItems = hierarchyDetector.processBoQData(consolidatedItems);
    
    const consolidatedData: ConsolidatedData = {
      items: processedItems,
      bidders: bidderNames,
      baseline: {
        name: 'Project Baseline',
        data: processedItems.reduce((acc, item) => ({
          ...acc,
          [item.id]: {
            rate: item.baselineRate || 0,
            total: item.baselineTotal || 0
          }
        }), {})
      }
    };
    
    setConsolidatedData(consolidatedData);
  };

  const getStepStatus = (stepId: Step): 'completed' | 'current' | 'upcoming' => {
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'upcoming';
  };

  const navigateToStep = (stepId: Step) => {
    // Only allow navigation to completed steps or the next available step
    const stepIndex = steps.findIndex(s => s.id === stepId);
    const currentIndex = steps.findIndex(s => s.id === currentStep);
    
    if (stepIndex <= currentIndex) {
      setCurrentStep(stepId);
    } else if (stepId === 'sheets' && canProceedToSheets) {
      setCurrentStep(stepId);
    } else if (stepId === 'analyze' && canProceedToAnalyze) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              const status = getStepStatus(step.id as Step);
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center">
                    <Button
                      variant="ghost"
                      className={`w-12 h-12 rounded-full p-0 mb-2 ${
                        status === 'completed'
                          ? 'bg-green-100 text-green-600 hover:bg-green-200'
                          : status === 'current'
                          ? 'bg-[#008080] text-white hover:bg-[#006666]'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                      onClick={() => navigateToStep(step.id as Step)}
                    >
                      <IconComponent className="w-5 h-5" />
                    </Button>
                    <span
                      className={`text-sm font-medium ${
                        status === 'current' ? 'text-[#008080]' : 'text-gray-600'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        getStepStatus(steps[index + 1].id as Step) === 'completed' ||
                        getStepStatus(steps[index + 1].id as Step) === 'current'
                          ? 'bg-[#008080]'
                          : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="min-h-[600px]">
        {currentStep === 'import' && (
          <ImportStep bidders={bidders} onBiddersUpdate={setBidders} />
        )}
        
        {currentStep === 'sheets' && (
          <SheetSelectionStep bidders={bidders} onBiddersUpdate={setBidders} />
        )}
        
        {currentStep === 'analyze' && consolidatedData && (
          <AnalysisStep bidders={bidders} consolidatedData={consolidatedData} />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex > 0) {
              setCurrentStep(steps[currentIndex - 1].id as Step);
            }
          }}
          disabled={currentStep === 'import'}
        >
          Previous
        </Button>

        <Button
          onClick={() => {
            const currentIndex = steps.findIndex(s => s.id === currentStep);
            if (currentIndex < steps.length - 1) {
              const nextStep = steps[currentIndex + 1].id as Step;
              if (
                (nextStep === 'sheets' && canProceedToSheets) ||
                (nextStep === 'analyze' && canProceedToAnalyze)
              ) {
                setCurrentStep(nextStep);
              }
            }
          }}
          disabled={
            (currentStep === 'import' && !canProceedToSheets) ||
            (currentStep === 'sheets' && !canProceedToAnalyze)
          }
          className="bg-[#008080] hover:bg-[#006666]"
        >
          {currentStep === 'analyze' ? 'Complete' : 'Next'}
        </Button>
      </div>
    </div>
  );
};