import { Plus as PlusIcon, Settings as SettingsIcon, Eye as EyeIcon, Table as TableIcon, Bitcoin as EditIcon, Palette as PaletteIcon, Brain as BrainIcon, Download as DownloadIcon } from "lucide-react";
import React, { useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { AnalysisTab, ConsolidatedData, BidderData } from "../../types/priceleveling";
import { AnalysisTable } from "./AnalysisTable";
import * as XLSX from "xlsx";

interface AnalysisStepProps {
  bidders: BidderData[];
  consolidatedData: ConsolidatedData;
}

export const AnalysisStep: React.FC<AnalysisStepProps> = ({ bidders, consolidatedData }) => {
  // Get all unique sheet names across all bidders
  const availableSheets = React.useMemo(() => {
    const sheetNames = new Set<string>();
    bidders.forEach(bidder => {
      bidder.sheets.forEach(sheet => {
        sheetNames.add(sheet.name);
      });
    });
    return Array.from(sheetNames).sort();
  }, [bidders]);

  // Initialize bidder sheets mapping
  const defaultBidderSheets = React.useMemo(() => {
    const bidderSheets: Record<string, string> = {};
    consolidatedData.bidders.forEach(bidder => {
      bidderSheets[bidder] = availableSheets[0] || '';
    });
    return bidderSheets;
  }, [consolidatedData.bidders, availableSheets]);

  const [analysisTabs, setAnalysisTabs] = useState<AnalysisTab[]>([
    {
      id: 'default',
      name: 'Default Analysis',
      bidderSheets: defaultBidderSheets,
      calculationMethod: 'average',
      showQuantities: true,
      showBidderQuantities: false,
      showRates: true,
      showTotals: true,
      deviationThresholds: {
        yellow: 10,
        orange: 20,
        red: 30
      },
      selectedBidders: consolidatedData.bidders
    }
  ]);
  
  const [activeTab, setActiveTab] = useState('default');
  const [showNewTabForm, setShowNewTabForm] = useState(false);
  const [newTabName, setNewTabName] = useState('');
  const [editingTabName, setEditingTabName] = useState<string | null>(null);
  const [tempTabName, setTempTabName] = useState('');

  const createNewTab = () => {
    if (!newTabName.trim()) return;

    const newTab: AnalysisTab = {
      id: `tab-${Date.now()}`,
      name: newTabName,
      bidderSheets: defaultBidderSheets,
      calculationMethod: 'average',
      showQuantities: true,
      showBidderQuantities: false,
      showRates: true,
      showTotals: false,
      deviationThresholds: {
        yellow: 10,
        orange: 20,
        red: 30
      },
      selectedBidders: consolidatedData.bidders
    };

    setAnalysisTabs([...analysisTabs, newTab]);
    setActiveTab(newTab.id);
    setNewTabName('');
    setShowNewTabForm(false);
  };

  const updateTab = (tabId: string, updates: Partial<AnalysisTab>) => {
    setAnalysisTabs(tabs =>
      tabs.map(tab =>
        tab.id === tabId ? { ...tab, ...updates } : tab
      )
    );
  };

  const deleteTab = (tabId: string) => {
    if (analysisTabs.length <= 1) return;
    
    setAnalysisTabs(tabs => tabs.filter(tab => tab.id !== tabId));
    if (activeTab === tabId) {
      setActiveTab(analysisTabs[0].id);
    }
  };

  const startEditingTabName = (tabId: string, currentName: string) => {
    setEditingTabName(tabId);
    setTempTabName(currentName);
  };

  const saveTabName = () => {
    if (editingTabName && tempTabName.trim()) {
      updateTab(editingTabName, { name: tempTabName.trim() });
    }
    setEditingTabName(null);
    setTempTabName('');
  };

  const cancelEditingTabName = () => {
    setEditingTabName(null);
    setTempTabName('');
  };
  const currentTab = analysisTabs.find(tab => tab.id === activeTab);

  // AI-powered insights generation
  const generateInsights = (data: ConsolidatedData, config: AnalysisTab) => {
    const insights = [];
    
    // Filter data based on selected bidders
    const selectedBidders = config.selectedBidders || data.bidders;
    const filteredItems = data.items.map(item => ({
      ...item,
      bidderRates: Object.fromEntries(
        Object.entries(item.bidderRates).filter(([bidder]) => selectedBidders.includes(bidder))
      ),
      bidderTotals: Object.fromEntries(
        Object.entries(item.bidderTotals).filter(([bidder]) => selectedBidders.includes(bidder))
      )
    }));

    // Calculate comprehensive statistics
    const totalItems = filteredItems.length;
    const bidderCount = selectedBidders.length;
    const level1Items = filteredItems.filter(item => item.hierarchyLevel === 1);
    const detailItems = filteredItems.filter(item => item.hierarchyLevel > 1 && !item.isSubtotal);
    
    // Analyze Level 1 (Major Sections) Summary
    const level1Analysis = level1Items.map(item => {
      const rates = selectedBidders.map(bidder => item.bidderRates[bidder] || 0).filter(rate => rate > 0);
      const totals = selectedBidders.map(bidder => item.bidderTotals[bidder] || 0).filter(total => total > 0);
      
      if (rates.length === 0) return null;
      
      const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const avgTotal = totals.reduce((sum, total) => sum + total, 0) / totals.length;
      const maxDeviation = Math.max(...rates.map(rate => Math.abs((rate - avgRate) / avgRate * 100)));
      const minBidder = selectedBidders[rates.indexOf(Math.min(...rates))];
      const maxBidder = selectedBidders[rates.indexOf(Math.max(...rates))];
      
      return {
        ...item,
        avgRate,
        avgTotal,
        maxDeviation,
        minBidder,
        maxBidder,
        priceSpread: ((Math.max(...rates) - Math.min(...rates)) / Math.min(...rates) * 100)
      };
    }).filter(Boolean);

    // Generate Level 1 Summary
    if (level1Analysis.length > 0) {
      const totalProjectValue = level1Analysis.reduce((sum, item) => sum + item.avgTotal, 0);
      const highestValueSection = level1Analysis.reduce((max, item) => 
        item.avgTotal > max.avgTotal ? item : max
      );
      const mostVolatileSection = level1Analysis.reduce((max, item) => 
        item.maxDeviation > max.maxDeviation ? item : max
      );

      insights.push(`📊 **PROJECT OVERVIEW**: Total estimated value of ${totalProjectValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} across ${level1Items.length} major sections. Highest value section: "${highestValueSection.description}" (${(highestValueSection.avgTotal/totalProjectValue*100).toFixed(1)}% of total).`);
      
      if (mostVolatileSection.maxDeviation > 25) {
        insights.push(`⚠️ **SECTION RISK**: "${mostVolatileSection.description}" shows highest price volatility with ${mostVolatileSection.maxDeviation.toFixed(1)}% deviation between ${mostVolatileSection.minBidder} and ${mostVolatileSection.maxBidder}. This section requires detailed review.`);
      }
    }

    // Detailed deviation analysis
    const itemsWithDeviations = detailItems.map(item => {
      const rates = selectedBidders.map(bidder => item.bidderRates[bidder] || 0).filter(rate => rate > 0);
      if (rates.length === 0) return null;
      
      const avgRate = rates.reduce((sum, rate) => sum + rate, 0) / rates.length;
      const maxDeviation = Math.max(...rates.map(rate => Math.abs((rate - avgRate) / avgRate * 100)));
      const minBidder = selectedBidders[rates.indexOf(Math.min(...rates))];
      const maxBidder = selectedBidders[rates.indexOf(Math.max(...rates))];
      
      return { 
        ...item, 
        maxDeviation,
        minBidder,
        maxBidder,
        avgRate,
        priceSpread: maxDeviation
      };
    }).filter(Boolean).sort((a, b) => b.maxDeviation - a.maxDeviation);

    // Critical deviations analysis
    const criticalDeviations = itemsWithDeviations.filter(item => item.maxDeviation > 50);
    const highDeviations = itemsWithDeviations.filter(item => item.maxDeviation > 30 && item.maxDeviation <= 50);
    const moderateDeviations = itemsWithDeviations.filter(item => item.maxDeviation > 15 && item.maxDeviation <= 30);

    if (criticalDeviations.length > 0) {
      const topCritical = criticalDeviations.slice(0, 3);
      insights.push(`🚨 **CRITICAL DEVIATIONS** (${criticalDeviations.length} items >50%): Top concerns - ${topCritical.map(item => `"${item.description}" (${item.maxDeviation.toFixed(1)}% between ${item.minBidder} & ${item.maxBidder})`).join(', ')}. Immediate clarification required.`);
    }

    if (highDeviations.length > 0) {
      insights.push(`⚠️ **HIGH DEVIATIONS** (${highDeviations.length} items 30-50%): Significant price variations detected. Review specifications and scope clarity for these items.`);
    }

    // Bidder performance analysis
    const bidderTotals = selectedBidders.map(bidder => {
      const total = filteredItems.reduce((sum, item) => sum + (item.bidderTotals[bidder] || 0), 0);
      const itemCount = filteredItems.filter(item => item.bidderRates[bidder] > 0).length;
      const avgRate = total / Math.max(itemCount, 1);
      return { bidder, total };
    }).sort((a, b) => a.total - b.total);

    if (bidderTotals.length > 1) {
      const lowestBidder = bidderTotals[0];
      const highestBidder = bidderTotals[bidderTotals.length - 1];
      const savings = ((highestBidder.total - lowestBidder.total) / highestBidder.total * 100);
      const savingsAmount = highestBidder.total - lowestBidder.total;
      
      insights.push(`💰 **COST OPTIMIZATION**: ${lowestBidder.bidder} offers most competitive total (${lowestBidder.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}), saving ${savingsAmount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (${savings.toFixed(1)}%) vs highest bidder ${highestBidder.bidder}.`);
      
      // Middle-range bidders analysis
      if (bidderTotals.length > 2) {
        const middleBidders = bidderTotals.slice(1, -1);
        const avgMiddle = middleBidders.reduce((sum, b) => sum + b.total, 0) / middleBidders.length;
        insights.push(`📈 **MARKET POSITIONING**: Average of middle bidders: ${avgMiddle.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}. Price spread across all bidders: ${savings.toFixed(1)}%.`);
      }
    }

    // Market stability analysis
    const consistentItems = itemsWithDeviations.filter(item => item.maxDeviation < 10);
    const stablePercentage = (consistentItems.length / detailItems.length) * 100;
    
    if (stablePercentage > 60) {
      insights.push(`✅ **MARKET STABILITY**: ${consistentItems.length} items (${stablePercentage.toFixed(0)}%) show consistent pricing (<10% deviation), indicating mature market with established pricing.`);
    } else if (stablePercentage < 30) {
      insights.push(`📊 **MARKET VOLATILITY**: Only ${stablePercentage.toFixed(0)}% of items show stable pricing. Consider market conditions, specification clarity, and bidder understanding.`);
    }

    // Quantity impact analysis
    const highQuantityItems = detailItems.filter(item => item.quantity > 1000).sort((a, b) => b.quantity - a.quantity);
    if (highQuantityItems.length > 0) {
      const topQuantityItem = highQuantityItems[0];
      const rates = selectedBidders.map(bidder => topQuantityItem.bidderRates[bidder]).filter(rate => rate > 0);
      const quantityImpact = (Math.max(...rates) - Math.min(...rates)) * topQuantityItem.quantity;
      
      if (quantityImpact > 10000) {
        insights.push(`📦 **QUANTITY IMPACT**: "${topQuantityItem.description}" (${topQuantityItem.quantity.toLocaleString()} ${topQuantityItem.unit}) has potential cost impact of ${quantityImpact.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} due to rate variations.`);
      }
    }

    return insights;
  };

  const exportToExcel = () => {
    if (!currentTab || !consolidatedData) return;

    const hierarchyDetector = new AIHierarchyDetector();
    const workbook = XLSX.utils.book_new();
    
    // Prepare data for export
    const exportData = [];
    
    // Headers
    const headers = ['Item Code', 'Description', 'Unit'];
    if (currentTab.showQuantities) headers.push('Baseline Quantity');
    if (currentTab.showQuantities && currentTab.showBidderQuantities) {
      consolidatedData.bidders.forEach(bidder => headers.push(`${bidder} Qty`));
    }
    if (consolidatedData.baseline && currentTab.showRates) headers.push('Baseline Rate');
    if (currentTab.showRates) {
      consolidatedData.bidders.forEach(bidder => headers.push(`${bidder} Rate`));
    }
    if (consolidatedData.baseline && currentTab.showTotals) headers.push('Baseline Total');
    if (currentTab.showTotals) {
      consolidatedData.bidders.forEach(bidder => headers.push(`${bidder} Total`));
    }
    
    exportData.push(headers);
    
    // Data rows with formulas
    consolidatedData.items.forEach(item => {
      const row = [item.itemCode, item.description, item.unit];
      if (currentTab.showQuantities) row.push(item.quantity);
      if (currentTab.showQuantities && currentTab.showBidderQuantities) {
        consolidatedData.bidders.forEach(bidder => row.push(item.bidderQuantities[bidder] || 0));
      }
      if (consolidatedData.baseline && currentTab.showRates) row.push(item.baselineRate);
      if (currentTab.showRates) {
        consolidatedData.bidders.forEach(bidder => row.push(item.bidderRates[bidder]));
      }
      if (consolidatedData.baseline && currentTab.showTotals) row.push(item.baselineTotal);
      if (currentTab.showTotals) {
        consolidatedData.bidders.forEach(bidder => row.push(item.bidderTotals[bidder]));
      }
      exportData.push(row);
    });
    
    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    
    // Get worksheet range
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    
    // Apply header formatting to match preview
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      // Create cell style object
      worksheet[cellAddress].s = {
        fill: { 
          patternType: "solid",
          fgColor: { rgb: "008080" }
        },
        font: { 
          color: { rgb: "FFFFFF" }, 
          bold: true,
          sz: 12
        },
        alignment: { 
          horizontal: "center",
          vertical: "center"
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }
    
    // Apply data formatting and formulas
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const item = consolidatedData.items[row - 1]; // -1 because header is row 0
      const hierarchyStyle = hierarchyDetector.getHierarchyFormatting(item.hierarchyLevel, item.isSubtotal);
      
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        // Apply hierarchy-based formatting
        worksheet[cellAddress].s = {
          border: {
            top: { style: "thin", color: { rgb: "CCCCCC" } },
            bottom: { style: "thin", color: { rgb: "CCCCCC" } },
            left: { style: "thin", color: { rgb: "CCCCCC" } },
            right: { style: "thin", color: { rgb: "CCCCCC" } }
          },
          fill: item.isSubtotal ? {
            patternType: "solid",
            fgColor: { rgb: "E0F2F1" }
          } : hierarchyStyle.backgroundColor ? {
            patternType: "solid", 
            fgColor: { rgb: hierarchyStyle.backgroundColor.replace('#', '') }
          } : row % 2 === 0 ? { 
            patternType: "solid",
            fgColor: { rgb: "F8F9FA" } 
          } : undefined,
          font: {
            bold: item.isSubtotal || item.hierarchyLevel <= 2
          },
          alignment: {
            horizontal: col <= 2 ? "left" : "right", // Left align text columns, right align numbers
            vertical: "center"
          }
        };
        
        // Format currency and number cells
        const header = headers[col];
        if (header && (header.includes('Rate') || header.includes('Total'))) {
          if (header.includes('Rate')) {
            worksheet[cellAddress].z = '$#,##0.00';
          } else {
            worksheet[cellAddress].z = '$#,##0';
          }
        }
      }
    }
    
    // Add formulas for calculated totals
    if (currentTab.showTotals) {
      const quantityColIndex = headers.indexOf('Quantity');
      const rateStartIndex = headers.findIndex(h => h.includes('Rate') && !h.includes('Baseline') && !h.includes('Calculated'));
      
      if (quantityColIndex !== -1 && rateStartIndex !== -1) {
        consolidatedData.items.forEach((item, itemIndex) => {
          const rowIndex = itemIndex + 1; // +1 for header row
          
          // Add formulas for each bidder's total
          consolidatedData.bidders.forEach((bidder, bidderIndex) => {
            const totalColIndex = headers.indexOf(`${bidder} Total`);
            if (totalColIndex !== -1) {
              const quantityCell = XLSX.utils.encode_cell({ r: rowIndex, c: quantityColIndex });
              const rateCell = XLSX.utils.encode_cell({ r: rowIndex, c: rateStartIndex + bidderIndex });
              const totalCell = XLSX.utils.encode_cell({ r: rowIndex, c: totalColIndex });
              
              worksheet[totalCell] = {
                f: `${quantityCell}*${rateCell}`,
                t: 'n'
              };
            }
          });
        });
      }
    }
    
    // Set column widths to match preview
    const colWidths = [
      { wch: 12 }, // Item Code
      { wch: 40 }, // Description
      { wch: 8 },  // Unit
    ];
    if (currentTab.showQuantities) colWidths.push({ wch: 12 });
    if (currentTab.showQuantities && currentTab.showBidderQuantities) {
      consolidatedData.bidders.forEach(() => colWidths.push({ wch: 12 }));
    }
    if (consolidatedData.baseline && currentTab.showRates) colWidths.push({ wch: 15 });
    if (currentTab.showRates) {
      consolidatedData.bidders.forEach(() => colWidths.push({ wch: 15 }));
    }
    if (consolidatedData.baseline && currentTab.showTotals) colWidths.push({ wch: 15 });
    if (currentTab.showTotals) {
      consolidatedData.bidders.forEach(() => colWidths.push({ wch: 15 }));
    }
    
    worksheet['!cols'] = colWidths;
    
    // Set print area and freeze panes
    worksheet['!autofilter'] = { ref: `A1:${XLSX.utils.encode_cell({ r: range.e.r, c: range.e.c })}` };
    worksheet['!freeze'] = { xSplit: 3, ySplit: 1 }; // Freeze first 3 columns and header row
    
    XLSX.utils.book_append_sheet(workbook, worksheet, currentTab.name);
    
    // Export file
    const fileName = `${currentTab.name.replace(/[^a-zA-Z0-9]/g, '_')}_Analysis.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between">
        <>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="w-full justify-start">
              {analysisTabs.map(tab => (
                <TabsTrigger key={tab.id} value={tab.id} className="relative group">
                  {editingTabName === tab.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={tempTabName}
                        onChange={(e) => setTempTabName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') saveTabName();
                          if (e.key === 'Escape') cancelEditingTabName();
                        }}
                        onBlur={saveTabName}
                        className="h-6 text-xs w-32"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>{tab.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditingTabName(tab.id, tab.name);
                          }}
                          className="h-4 w-4 p-0"
                        >
                          <EditIcon className="w-3 h-3" />
                        </Button>
                        {analysisTabs.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTab(tab.id);
                            }}
                            className="h-4 w-4 p-0 text-red-500 hover:text-red-700"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <Button
            onClick={() => setShowNewTabForm(true)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <PlusIcon className="w-4 h-4" />
            New Analysis
          </Button>
        </>
      </div>

      {showNewTabForm && (
        <Card className="mb-4">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Input
                placeholder="Analysis name..."
                value={newTabName}
                onChange={(e) => setNewTabName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createNewTab()}
                className="w-64"
              />
              <Button onClick={createNewTab} size="sm">
                Create
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewTabForm(false);
                  setNewTabName('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Tab Content */}
      {currentTab && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <SettingsIcon className="w-5 h-5 text-[#008080]" />
                  Analysis Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Sheet Selection per Bidder</Label>
                  <div className="space-y-3 mt-2">
                    {consolidatedData.bidders.map(bidder => (
                      <div key={bidder} className="flex items-center gap-3">
                        <span className="text-sm font-medium w-32 truncate" title={bidder}>
                          {bidder}
                        </span>
                        <Select
                          value={currentTab.bidderSheets[bidder] || availableSheets[0]}
                          onValueChange={(value) =>
                            updateTab(currentTab.id, {
                              bidderSheets: {
                                ...currentTab.bidderSheets,
                                [bidder]: value
                              }
                            })
                          }
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {availableSheets.map(sheet => (
                              <SelectItem key={sheet} value={sheet}>
                                {sheet}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Select which sheet to analyze for each bidder
                  </p>
                </div>

                <div>
                  <Label htmlFor="calculation-method">Calculation Method</Label>
                  <Select
                    value={currentTab.calculationMethod}
                    onValueChange={(value) =>
                      updateTab(currentTab.id, { calculationMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="average-minus-extremes">
                        Average (minus highest/lowest)
                      </SelectItem>
                      <SelectItem value="median">Median</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base font-medium">Display Options</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-quantities"
                        checked={currentTab.showQuantities}
                        onCheckedChange={(checked) =>
                          updateTab(currentTab.id, { 
                            showQuantities: !!checked
                          })
                        }
                      />
                      <Label htmlFor="show-quantities">Show Quantities</Label>
                    </div>
                    {currentTab.showQuantities && (
                      <div className="flex items-center space-x-2 ml-6">
                        <Checkbox
                          id="show-bidder-quantities"
                          checked={currentTab.showBidderQuantities}
                          onCheckedChange={(checked) =>
                            updateTab(currentTab.id, { showBidderQuantities: !!checked })
                          }
                        />
                        <Label htmlFor="show-bidder-quantities">Compare Bidder Quantities</Label>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-rates"
                        checked={currentTab.showRates}
                        onCheckedChange={(checked) =>
                          updateTab(currentTab.id, { showRates: !!checked })
                        }
                      />
                      <Label htmlFor="show-rates">Show Rates</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-totals"
                        checked={currentTab.showTotals}
                        onCheckedChange={(checked) =>
                          updateTab(currentTab.id, { showTotals: !!checked })
                        }
                      />
                      <Label htmlFor="show-totals">Show Totals</Label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-base font-medium">Select Bidders to Compare</Label>
                  <div className="space-y-2 mt-2 max-h-32 overflow-y-auto">
                    {consolidatedData.bidders.map(bidder => (
                      <div key={bidder} className="flex items-center space-x-2">
                        <Checkbox
                          id={`bidder-${bidder}`}
                          checked={(currentTab.selectedBidders || consolidatedData.bidders).includes(bidder)}
                          onCheckedChange={(checked) => {
                            const currentSelected = currentTab.selectedBidders || consolidatedData.bidders;
                            const newSelected = checked 
                              ? [...currentSelected, bidder]
                              : currentSelected.filter(b => b !== bidder);
                            
                            // Ensure at least one bidder is selected
                            if (newSelected.length > 0) {
                              updateTab(currentTab.id, { selectedBidders: newSelected });
                            }
                          }}
                        />
                        <Label htmlFor={`bidder-${bidder}`} className="text-sm">
                          {bidder}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Select which bidders to include in this analysis
                  </p>
                </div>

                <div>
                  <Label className="text-base font-medium">Deviation Thresholds (%)</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-300 rounded"></div>
                      <Input
                        type="number"
                        value={currentTab.deviationThresholds.yellow}
                        onChange={(e) =>
                          updateTab(currentTab.id, {
                            deviationThresholds: {
                              ...currentTab.deviationThresholds,
                              yellow: Number(e.target.value)
                            }
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-orange-300 rounded"></div>
                      <Input
                        type="number"
                        value={currentTab.deviationThresholds.orange}
                        onChange={(e) =>
                          updateTab(currentTab.id, {
                            deviationThresholds: {
                              ...currentTab.deviationThresholds,
                              orange: Number(e.target.value)
                            }
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-sm">%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-300 rounded"></div>
                      <Input
                        type="number"
                        value={currentTab.deviationThresholds.red}
                        onChange={(e) =>
                          updateTab(currentTab.id, {
                            deviationThresholds: {
                              ...currentTab.deviationThresholds,
                              red: Number(e.target.value)
                            }
                          })
                        }
                        className="w-20"
                      />
                      <span className="text-sm">%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Summary Statistics */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <EyeIcon className="w-5 h-5 text-[#008080]" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <p className="text-xl font-bold text-blue-600">
                        {consolidatedData.items.length.toLocaleString()}
                      </p>
                      <p className="text-sm text-blue-800">Total Items</p>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <p className="text-xl font-bold text-green-600">
                        {(currentTab.selectedBidders || consolidatedData.bidders).length}
                      </p>
                      <p className="text-sm text-green-800">Selected Bidders</p>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <p className="text-xl font-bold text-indigo-600">
                        Multi-Sheet
                      </p>
                      <p className="text-sm text-indigo-800">Sheet</p>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                      <p className="text-xl font-bold text-purple-600">
                        {currentTab.calculationMethod === 'average' ? 'AVG' : 
                         currentTab.calculationMethod === 'median' ? 'MED' : 'AVG-EX'}
                      </p>
                      <p className="text-sm text-purple-800">Method</p>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Current Analysis:</strong> Comparing data from {(currentTab.selectedBidders || consolidatedData.bidders).length} selected bidders using {currentTab.calculationMethod} calculation method with individual sheet selection per bidder.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BrainIcon className="w-5 h-5 text-[#008080]" />
                    AI Insights & Key Takeaways
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {generateInsights(consolidatedData, currentTab).map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-[#008080]">
                        <div className="text-sm text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: insight.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Analysis Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-lg">
                  <TableIcon className="w-5 h-5 text-[#008080]" />
                  {currentTab.name} - Multi-Sheet Analysis
                </div>
                <Button
                  onClick={exportToExcel}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <DownloadIcon className="w-4 h-4" />
                  Export Excel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnalysisTable
                consolidatedData={consolidatedData}
                analysisConfig={currentTab}
              />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};