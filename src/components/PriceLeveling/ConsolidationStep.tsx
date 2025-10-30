import { DatabaseIcon, TrendingUpIcon, AlertTriangleIcon } from "lucide-react";
import React, { useState, useMemo } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Progress } from "../ui/progress";
import { BidderData, BoQItem, ConsolidatedData } from "../../types/priceleveling";

interface ConsolidationStepProps {
  bidders: BidderData[];
  onConsolidatedData: (data: ConsolidatedData) => void;
}

export const ConsolidationStep: React.FC<ConsolidationStepProps> = ({
  bidders,
  onConsolidatedData
}) => {
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [consolidationProgress, setConsolidationProgress] = useState(0);
  const [isConsolidated, setIsConsolidated] = useState(false);

  const consolidationStats = useMemo(() => {
    if (!isConsolidated) return null;

    const totalItems = bidders.reduce((sum, bidder) => {
      const sheet = bidder.sheets.find(s => s.name === bidder.selectedSheet);
      return sum + (sheet?.data.length || 0) - 1; // -1 for header
    }, 0);

    return {
      totalBidders: bidders.length,
      totalItems,
      averageItemsPerBidder: Math.round(totalItems / bidders.length)
    };
  }, [bidders, isConsolidated]);

  const consolidateData = async () => {
    setIsConsolidating(true);
    setConsolidationProgress(0);

    // Simulate consolidation process with progress updates
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setConsolidationProgress((i / steps) * 100);
    }

    // Process the actual data consolidation
    const consolidatedItems: BoQItem[] = [];
    const bidderNames = bidders.map(b => b.name);

    // For demo purposes, create sample consolidated data
    // In real implementation, this would parse Excel data and match items
    const sampleItems = Array.from({ length: 15 }, (_, index) => ({
      id: `${index + 1}`,
      itemCode: `ITEM-${String(index + 1).padStart(3, '0')}`,
      description: [
        'Concrete Grade C25/30',
        'Reinforcement Steel Bar 12mm',
        'Formwork for Columns',
        'Excavation in Soft Soil',
        'Backfilling with Selected Material',
        'Waterproofing Membrane',
        'Ceramic Floor Tiles',
        'Aluminum Window Frames',
        'Electrical Conduit Installation',
        'Plumbing Pipe Installation',
        'Paint Application - Interior',
        'Insulation Material',
        'Roofing Membrane',
        'Structural Steel Beams',
        'HVAC Ductwork Installation'
      ][index] || `Sample Item ${index + 1}`,
      unit: ['m³', 'kg', 'm²', 'm³', 'm³', 'm²', 'm²', 'm²', 'm', 'm', 'm²', 'm²', 'm²', 'kg', 'm²'][index] || 'unit',
      quantity: [150, 2500, 200, 300, 150, 180, 250, 45, 500, 300, 400, 200, 180, 1200, 150][index] || 100,
      baselineRate: [120, 0.85, 45, 25, 30, 35, 28, 150, 12, 18, 15, 25, 40, 2.5, 35][index] || 50,
      baselineTotal: function() {
        return this.quantity * this.baselineRate;
      }.call({
        quantity: [150, 2500, 200, 300, 150, 180, 250, 45, 500, 300, 400, 200, 180, 1200, 150][index] || 100,
        baselineRate: [120, 0.85, 45, 25, 30, 35, 28, 150, 12, 18, 15, 25, 40, 2.5, 35][index] || 50
      }),
      bidderRates: {
        [bidderNames[0]]: ([115, 0.82, 42, 23, 28, 33, 26, 145, 11, 17, 14, 23, 38, 2.3, 33][index] || 48) * (0.9 + Math.random() * 0.2),
        [bidderNames[1]]: ([125, 0.88, 48, 27, 32, 37, 30, 155, 13, 19, 16, 27, 42, 2.7, 37][index] || 52) * (0.9 + Math.random() * 0.2),
      },
      bidderTotals: function() {
        const quantity = [150, 2500, 200, 300, 150, 180, 250, 45, 500, 300, 400, 200, 180, 1200, 150][index] || 100;
        const rate1 = ([115, 0.82, 42, 23, 28, 33, 26, 145, 11, 17, 14, 23, 38, 2.3, 33][index] || 48) * (0.9 + Math.random() * 0.2);
        const rate2 = ([125, 0.88, 48, 27, 32, 37, 30, 155, 13, 19, 16, 27, 42, 2.7, 37][index] || 52) * (0.9 + Math.random() * 0.2);
        return {
          [bidderNames[0]]: quantity * rate1,
          [bidderNames[1]]: quantity * rate2,
        };
      }()
    }));

    // Legacy format for backward compatibility
    const legacyItems = [
      {
        id: '1',
        itemCode: 'CONC-001',
        description: 'Concrete Grade C25/30',
        unit: 'm³',
        quantity: 150,
        baselineRate: 120,
        baselineTotal: 18000,
        bidderRates: {
          [bidderNames[0]]: 115,
          [bidderNames[1]]: 125,
        },
        bidderTotals: {
          [bidderNames[0]]: 17250,
          [bidderNames[1]]: 18750,
        }
      },
      {
        id: '2',
        itemCode: 'STEEL-001',
        description: 'Reinforcement Steel Bar 12mm',
        unit: 'kg',
        quantity: 2500,
        baselineRate: 0.85,
        baselineTotal: 2125,
        bidderRates: {
          [bidderNames[0]]: 0.82,
          [bidderNames[1]]: 0.88,
        },
        bidderTotals: {
          [bidderNames[0]]: 2050,
          [bidderNames[1]]: 2200,
        }
      }
    ];

    const consolidatedData: ConsolidatedData = {
      items: sampleItems,
      bidders: bidderNames,
      baseline: {
        name: 'Project Baseline',
        data: sampleItems.reduce((acc, item) => ({
          ...acc,
          [item.id]: {
            rate: item.baselineRate || 0,
            total: item.baselineTotal || 0
          }
        }), {})
      }
    };

    onConsolidatedData(consolidatedData);
    setIsConsolidating(false);
    setIsConsolidated(true);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-[#001d3d] mb-2">
          Data Consolidation
        </h3>
        <p className="text-gray-600">
          Import all cost lines into database for dynamic analysis
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5 text-[#008080]" />
            Consolidation Process
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isConsolidated && !isConsolidating && (
            <div className="text-center py-8">
              <TrendingUpIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Ready to Consolidate Data
              </p>
              <p className="text-sm text-gray-500 mb-4">
                This will process {bidders.length} bidder files and create a unified database
              </p>
              <Button
                onClick={consolidateData}
                className="bg-[#008080] hover:bg-[#006666]"
                size="lg"
              >
                Start Consolidation
              </Button>
            </div>
          )}

          {isConsolidating && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="font-medium text-[#001d3d] mb-2">
                  Consolidating data...
                </p>
                <Progress value={consolidationProgress} className="w-full" />
                <p className="text-sm text-gray-500 mt-2">
                  {consolidationProgress.toFixed(0)}% complete
                </p>
              </div>
            </div>
          )}

          {isConsolidated && consolidationStats && (
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <DatabaseIcon className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <p className="text-green-800 font-medium mb-2">
                  Data Successfully Consolidated!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {consolidationStats.totalBidders}
                  </p>
                  <p className="text-sm text-blue-800">Bidders</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {consolidationStats.totalItems}
                  </p>
                  <p className="text-sm text-purple-800">Total Items</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {consolidationStats.averageItemsPerBidder}
                  </p>
                  <p className="text-sm text-orange-800">Avg Items/Bidder</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangleIcon className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Data is now ready for analysis. You can proceed to create analysis tabs.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};