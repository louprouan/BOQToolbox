import React, { useMemo } from "react";
import { AIHierarchyDetector } from "../../utils/hierarchyDetection";
import { AnalysisTab, ConsolidatedData, BoQItem } from "../../types/priceleveling";

interface AnalysisTableProps {
  consolidatedData: ConsolidatedData;
  analysisConfig: AnalysisTab;
}

export const AnalysisTable: React.FC<AnalysisTableProps> = ({
  consolidatedData,
  analysisConfig
}) => {
  const hierarchyDetector = new AIHierarchyDetector();
  
  // Filter data based on selected bidders
  const selectedBidders = analysisConfig.selectedBidders || consolidatedData.bidders;
  const filteredConsolidatedData = {
    ...consolidatedData,
    bidders: selectedBidders,
    items: consolidatedData.items.map(item => ({
      ...item,
      bidderRates: Object.fromEntries(
        Object.entries(item.bidderRates).filter(([bidder]) => selectedBidders.includes(bidder))
      ),
      bidderTotals: Object.fromEntries(
        Object.entries(item.bidderTotals).filter(([bidder]) => selectedBidders.includes(bidder))
      )
    }))
  };

  const calculateDeviation = (value: number, baseline: number): number => {
    if (baseline === 0) return 0;
    return ((value - baseline) / baseline) * 100;
  };

  const getDeviationColor = (deviation: number): string => {
    const absDeviation = Math.abs(deviation);
    if (absDeviation >= analysisConfig.deviationThresholds.red) {
      return 'bg-red-200 text-red-800';
    } else if (absDeviation >= analysisConfig.deviationThresholds.orange) {
      return 'bg-orange-200 text-orange-800';
    } else if (absDeviation >= analysisConfig.deviationThresholds.yellow) {
      return 'bg-yellow-200 text-yellow-800';
    }
    return '';
  };

  const calculateStatistic = (values: number[]): number => {
    if (values.length === 0) return 0;
    
    switch (analysisConfig.calculationMethod) {
      case 'average':
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      
      case 'average-minus-extremes':
        if (values.length <= 2) return values.reduce((sum, val) => sum + val, 0) / values.length;
        const sorted = [...values].sort((a, b) => a - b);
        const trimmed = sorted.slice(1, -1);
        return trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length;
      
      case 'median':
        const sortedValues = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sortedValues.length / 2);
        return sortedValues.length % 2 === 0
          ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
          : sortedValues[mid];
      
      default:
        return 0;
    }
  };

  const processedData = useMemo(() => {
    return filteredConsolidatedData.items.map(item => {
      const rates = Object.values(item.bidderRates);
      const totals = Object.values(item.bidderTotals);
      
      return {
        ...item,
        calculatedRate: calculateStatistic(rates),
        calculatedTotal: calculateStatistic(totals),
        rateDeviation: item.baselineRate ? calculateDeviation(calculateStatistic(rates), item.baselineRate) : 0,
        totalDeviation: item.baselineTotal ? calculateDeviation(calculateStatistic(totals), item.baselineTotal) : 0
      };
    });
  }, [filteredConsolidatedData.items, analysisConfig.calculationMethod]);

  const getRowStyle = (item: BoQItem) => {
    return hierarchyDetector.getHierarchyFormatting(item.hierarchyLevel, item.isSubtotal);
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Item Code</th>
            <th className="border border-gray-300 px-3 py-2 text-left font-medium">Description</th>
            <th className="border border-gray-300 px-3 py-2 text-center font-medium">Unit</th>
            {analysisConfig.showQuantities && analysisConfig.showBidderQuantities && (
              <th className="border border-gray-300 px-3 py-2 text-right font-medium bg-blue-50">Baseline Quantity</th>
            )}
            
            {analysisConfig.showBidderQuantities && (
              <>
                {filteredConsolidatedData.bidders.map(bidder => (
                  <th 
                    key={`${bidder}-quantity`} 
                    className="border border-gray-300 px-3 py-2 text-right font-medium"
                  >
                    <div>{bidder}</div>
                    <div className="text-xs font-normal text-gray-600">Quantity</div>
                  </th>
                ))}
              </>
            )}
            
            {filteredConsolidatedData.baseline && analysisConfig.showRates && (
              <th className="border border-gray-300 px-3 py-2 text-right font-medium">Baseline Rate</th>
            )}
            
            {analysisConfig.showRates && (
              <>
                {filteredConsolidatedData.bidders.map(bidder => (
                  <th 
                    key={`${bidder}-rate`} 
                    className="border border-gray-300 px-3 py-2 text-right font-medium"
                  >
                    <div>{bidder}</div>
                    <div className="text-xs font-normal text-gray-600">Rate</div>
                  </th>
                ))}
              </>
            )}
            
            {filteredConsolidatedData.baseline && analysisConfig.showTotals && (
              <th className="border border-gray-300 px-3 py-2 text-right font-medium">Baseline Total</th>
            )}
            
            {analysisConfig.showTotals && (
              <>
                {filteredConsolidatedData.bidders.map(bidder => (
                  <th 
                    key={`${bidder}-total`} 
                    className="border border-gray-300 px-3 py-2 text-right font-medium"
                  >
                    <div>{bidder}</div>
                    <div className="text-xs font-normal text-gray-600">Total</div>
                  </th>
                ))}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {processedData.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50" style={getRowStyle(item)}>
              <td 
                className="border border-gray-300 px-3 py-2 font-mono text-sm"
                style={{ paddingLeft: getRowStyle(item).paddingLeft }}
              >
                {item.itemCode}
              </td>
              <td 
                className="border border-gray-300 px-3 py-2"
                style={{ 
                  paddingLeft: getRowStyle(item).paddingLeft,
                  fontWeight: getRowStyle(item).fontWeight,
                  fontSize: getRowStyle(item).fontSize
                }}
              >
                {item.description}
                {item.isSubtotal && <span className="ml-2 text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">SUBTOTAL</span>}
              </td>
              <td className="border border-gray-300 px-3 py-2 text-center">{item.unit}</td>
              
              {analysisConfig.showQuantities && analysisConfig.showBidderQuantities && (
                <td className="border border-gray-300 px-3 py-2 text-right bg-blue-50 font-medium">
                  {item.quantity.toLocaleString()}
                </td>
              )}
              
              {analysisConfig.showBidderQuantities && (
                <>
                  {filteredConsolidatedData.bidders.map(bidder => {
                    const quantity = item.bidderQuantities[bidder] || 0;
                    const avgQuantity = Object.values(item.bidderQuantities).reduce((sum, qty) => sum + qty, 0) / Object.values(item.bidderQuantities).filter(qty => qty > 0).length;
                    const deviation = avgQuantity > 0 ? calculateDeviation(quantity, avgQuantity) : 0;
                    return (
                      <td
                        key={`${bidder}-quantity`}
                        className={`border border-gray-300 px-3 py-2 text-right ${getDeviationColor(deviation)}`}
                      >
                        {quantity.toLocaleString()}
                        {avgQuantity > 0 && Math.abs(deviation) > 5 && (
                          <div className="text-xs">
                            ({deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%)
                          </div>
                        )}
                      </td>
                    );
                  })}
                </>
              )}
              
              {filteredConsolidatedData.baseline && analysisConfig.showRates && (
                <td className="border border-gray-300 px-3 py-2 text-right bg-blue-50 font-medium">
                  {item.baselineRate?.toFixed(2)}
                </td>
              )}
              
              {analysisConfig.showRates && (
                <>
                  {filteredConsolidatedData.bidders.map(bidder => {
                    const rate = item.bidderRates[bidder];
                    const deviation = item.baselineRate ? calculateDeviation(rate, item.baselineRate) : 0;
                    return (
                      <td
                        key={`${bidder}-rate`}
                        className={`border border-gray-300 px-3 py-2 text-right ${getDeviationColor(deviation)}`}
                      >
                        {rate?.toFixed(2)}
                        {item.baselineRate && (
                          <div className="text-xs">
                            ({deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%)
                          </div>
                        )}
                      </td>
                    );
                  })}
                </>
              )}
              
              {filteredConsolidatedData.baseline && analysisConfig.showTotals && (
                <td className="border border-gray-300 px-3 py-2 text-right bg-blue-50 font-medium">
                  {item.baselineTotal?.toLocaleString()}
                </td>
              )}
              
              {analysisConfig.showTotals && (
                <>
                  {filteredConsolidatedData.bidders.map(bidder => {
                    const total = item.bidderTotals[bidder];
                    const deviation = item.baselineTotal ? calculateDeviation(total, item.baselineTotal) : 0;
                    return (
                      <td
                        key={`${bidder}-total`}
                        className={`border border-gray-300 px-3 py-2 text-right ${getDeviationColor(deviation)}`}
                      >
                        {total?.toLocaleString()}
                        {item.baselineTotal && (
                          <div className="text-xs">
                            ({deviation > 0 ? '+' : ''}{deviation.toFixed(1)}%)
                          </div>
                        )}
                      </td>
                    );
                  })}
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};