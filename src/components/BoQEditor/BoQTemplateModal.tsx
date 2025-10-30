import React, { useState } from "react";
import { PlusIcon, TrashIcon, DownloadIcon, EyeIcon, SettingsIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Checkbox } from "../ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BoQColumn, BoQSheet, BoQTemplate, BoQPreset } from "../../types/boq";
import * as XLSX from "xlsx";

interface BoQTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const defaultPresets: BoQPreset[] = [
  {
    id: 'standard',
    name: 'Standard BoQ',
    description: 'Basic Bill of Quantities with essential columns',
    columns: [
      { name: '#', type: 'text', width: 50, required: true },
      { name: 'Description', type: 'text', width: 300, required: true },
      { name: 'Quantity', type: 'number', width: 100, required: true },
      { name: 'Unit', type: 'text', width: 80, required: true },
      { name: 'Unit Rate', type: 'currency', width: 120, required: true },
      { name: 'Total', type: 'formula', width: 120, required: true, formula: 'Quantity * Unit Rate' }
    ]
  },
  {
    id: 'detailed',
    name: 'Detailed BoQ',
    description: 'Comprehensive BoQ with additional fields',
    columns: [
      { name: '#', type: 'text', width: 50, required: true },
      { name: 'Item Code', type: 'text', width: 100, required: false },
      { name: 'Description', type: 'text', width: 300, required: true },
      { name: 'Specification', type: 'text', width: 200, required: false },
      { name: 'Quantity', type: 'number', width: 100, required: true },
      { name: 'Unit', type: 'text', width: 80, required: true },
      { name: 'Unit Rate', type: 'currency', width: 120, required: true },
      { name: 'Total', type: 'formula', width: 120, required: true, formula: 'Quantity * Unit Rate' },
      { name: 'Remarks', type: 'text', width: 150, required: false }
    ]
  }
];

export const BoQTemplateModal: React.FC<BoQTemplateModalProps> = ({ isOpen, onClose }) => {
  const [template, setTemplate] = useState<BoQTemplate>({
    id: '',
    name: 'New BoQ Template',
    description: '',
    sheets: [
      {
        id: 'sheet1',
        name: 'Sheet1',
        columns: defaultPresets[0].columns.map((col, index) => ({
          id: `col-${index}`,
          ...col
        }))
      }
    ],
    formatting: {
      headerStyle: {
        backgroundColor: '#008080',
        textColor: '#ffffff',
        fontSize: 12,
        bold: true
      },
      dataStyle: {
        fontSize: 11,
        alternateRowColor: true,
        borderStyle: 'thin'
      },
      currencyFormat: '$#,##0.00',
      numberFormat: '#,##0.00'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });

  const [activeSheet, setActiveSheet] = useState('sheet1');
  const [previewMode, setPreviewMode] = useState(false);

  const addSheet = () => {
    const newSheet: BoQSheet = {
      id: `sheet-${Date.now()}`,
      name: `Sheet${template.sheets.length + 1}`,
      columns: defaultPresets[0].columns.map((col, index) => ({
        id: `col-${Date.now()}-${index}`,
        ...col
      }))
    };
    setTemplate(prev => ({
      ...prev,
      sheets: [...prev.sheets, newSheet]
    }));
    setActiveSheet(newSheet.id);
  };

  const removeSheet = (sheetId: string) => {
    if (template.sheets.length <= 1) return;
    setTemplate(prev => ({
      ...prev,
      sheets: prev.sheets.filter(s => s.id !== sheetId)
    }));
    if (activeSheet === sheetId) {
      setActiveSheet(template.sheets[0].id);
    }
  };

  const updateSheet = (sheetId: string, updates: Partial<BoQSheet>) => {
    setTemplate(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === sheetId ? { ...sheet, ...updates } : sheet
      )
    }));
  };

  const addColumn = (sheetId: string) => {
    const newColumn: BoQColumn = {
      id: `col-${Date.now()}`,
      name: 'New Column',
      type: 'text',
      width: 100,
      required: false
    };
    
    setTemplate(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === sheetId
          ? { ...sheet, columns: [...sheet.columns, newColumn] }
          : sheet
      )
    }));
  };

  const removeColumn = (sheetId: string, columnId: string) => {
    setTemplate(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === sheetId
          ? { ...sheet, columns: sheet.columns.filter(col => col.id !== columnId) }
          : sheet
      )
    }));
  };

  const updateColumn = (sheetId: string, columnId: string, updates: Partial<BoQColumn>) => {
    setTemplate(prev => ({
      ...prev,
      sheets: prev.sheets.map(sheet =>
        sheet.id === sheetId
          ? {
              ...sheet,
              columns: sheet.columns.map(col =>
                col.id === columnId ? { ...col, ...updates } : col
              )
            }
          : sheet
      )
    }));
  };

  const applyPreset = (sheetId: string, presetId: string) => {
    const preset = defaultPresets.find(p => p.id === presetId);
    if (!preset) return;

    const newColumns = preset.columns.map((col, index) => ({
      id: `col-${Date.now()}-${index}`,
      ...col
    }));

    updateSheet(sheetId, { columns: newColumns });
  };

  const generateExcelTemplate = () => {
    const workbook = XLSX.utils.book_new();

    template.sheets.forEach(sheet => {
      // Create header row
      const headers = sheet.columns.map(col => col.name);
      const worksheet = XLSX.utils.aoa_to_sheet([headers]);

      // Add some sample rows for demonstration
      const sampleRows = [
        sheet.columns.map(col => {
          switch (col.type) {
            case 'text': return col.name === '#' ? '1' : 'Sample text';
            case 'number': return col.name === 'Quantity' ? 100 : 0;
            case 'currency': return 50.00;
            case 'formula': return col.name === 'Total' ? 5000.00 : 0;
            default: return '';
          }
        }),
        sheet.columns.map(col => {
          switch (col.type) {
            case 'text': return col.name === '#' ? '2' : 'Sample text 2';
            case 'number': return col.name === 'Quantity' ? 200 : 0;
            case 'currency': return 75.00;
            case 'formula': return col.name === 'Total' ? 15000.00 : 0;
            default: return '';
          }
        })
      ];

      XLSX.utils.sheet_add_aoa(worksheet, sampleRows, { origin: 'A2' });

      // Set column widths
      const colWidths = sheet.columns.map(col => ({ wch: (col.width || 100) / 8 }));
      worksheet['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
    });

    // Generate and download the file
    const fileName = `${template.name.replace(/[^a-zA-Z0-9]/g, '_')}_Template.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const currentSheet = template.sheets.find(s => s.id === activeSheet);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold text-[#001d3d]">BoQ Template Generator</h2>
            <p className="text-gray-600 mt-1">Create customizable Bill of Quantities templates</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
              className="flex items-center gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {previewMode ? (
            <div className="p-6 overflow-auto max-h-[calc(90vh-200px)]">
              <div className="mb-4">
                <h3 className="text-lg font-semibold mb-2">Template Preview</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <strong>Template Name:</strong> {template.name}
                  </div>
                  <div>
                    <strong>Number of Sheets:</strong> {template.sheets.length}
                  </div>
                </div>
              </div>

              <Tabs value={activeSheet} onValueChange={setActiveSheet}>
                <TabsList className="mb-4">
                  {template.sheets.map(sheet => (
                    <TabsTrigger key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {template.sheets.map(sheet => (
                  <TabsContent key={sheet.id} value={sheet.id}>
                    <div className="border rounded-lg overflow-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr style={{
                            backgroundColor: template.formatting.headerStyle.backgroundColor,
                            color: template.formatting.headerStyle.textColor,
                            fontSize: `${template.formatting.headerStyle.fontSize}px`,
                            fontWeight: template.formatting.headerStyle.bold ? 'bold' : 'normal'
                          }}>
                            {sheet.columns.map(col => (
                              <th
                                key={col.id}
                                className="border border-gray-300 px-3 py-2 text-left"
                                style={{ width: col.width }}
                              >
                                {col.name}
                                {col.required && <span className="text-red-300 ml-1">*</span>}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[1, 2, 3].map(rowIndex => (
                            <tr
                              key={rowIndex}
                              className={template.formatting.dataStyle.alternateRowColor && rowIndex % 2 === 0 ? 'bg-gray-50' : ''}
                              style={{ fontSize: `${template.formatting.dataStyle.fontSize}px` }}
                            >
                              {sheet.columns.map(col => (
                                <td
                                  key={col.id}
                                  className="border border-gray-300 px-3 py-2"
                                  style={{
                                    borderWidth: template.formatting.dataStyle.borderStyle === 'none' ? '0' :
                                                template.formatting.dataStyle.borderStyle === 'thin' ? '1px' : '2px'
                                  }}
                                >
                                  {col.type === 'formula' ? `[${col.formula}]` : `Sample ${col.type}`}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="mt-6 flex justify-center">
                <Button
                  onClick={generateExcelTemplate}
                  className="bg-[#008080] hover:bg-[#006666] flex items-center gap-2"
                  size="lg"
                >
                  <DownloadIcon className="w-5 h-5" />
                  Download Excel Template
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex h-[calc(90vh-120px)]">
              {/* Left Panel - Template Settings */}
              <div className="w-1/3 border-r overflow-auto p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="template-name">Template Name</Label>
                    <Input
                      id="template-name"
                      value={template.name}
                      onChange={(e) => setTemplate(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="template-description">Description</Label>
                    <Input
                      id="template-description"
                      value={template.description}
                      onChange={(e) => setTemplate(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description"
                    />
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <SettingsIcon className="w-5 h-5" />
                        Formatting Options
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Header Background Color</Label>
                        <Input
                          type="color"
                          value={template.formatting.headerStyle.backgroundColor}
                          onChange={(e) => setTemplate(prev => ({
                            ...prev,
                            formatting: {
                              ...prev.formatting,
                              headerStyle: {
                                ...prev.formatting.headerStyle,
                                backgroundColor: e.target.value
                              }
                            }
                          }))}
                        />
                      </div>

                      <div>
                        <Label>Header Text Color</Label>
                        <Input
                          type="color"
                          value={template.formatting.headerStyle.textColor}
                          onChange={(e) => setTemplate(prev => ({
                            ...prev,
                            formatting: {
                              ...prev.formatting,
                              headerStyle: {
                                ...prev.formatting.headerStyle,
                                textColor: e.target.value
                              }
                            }
                          }))}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="alternate-rows"
                          checked={template.formatting.dataStyle.alternateRowColor}
                          onCheckedChange={(checked) => setTemplate(prev => ({
                            ...prev,
                            formatting: {
                              ...prev.formatting,
                              dataStyle: {
                                ...prev.formatting.dataStyle,
                                alternateRowColor: !!checked
                              }
                            }
                          }))}
                        />
                        <Label htmlFor="alternate-rows">Alternate Row Colors</Label>
                      </div>

                      <div>
                        <Label>Border Style</Label>
                        <Select
                          value={template.formatting.dataStyle.borderStyle}
                          onValueChange={(value: any) => setTemplate(prev => ({
                            ...prev,
                            formatting: {
                              ...prev.formatting,
                              dataStyle: {
                                ...prev.formatting.dataStyle,
                                borderStyle: value
                              }
                            }
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Border</SelectItem>
                            <SelectItem value="thin">Thin Border</SelectItem>
                            <SelectItem value="medium">Medium Border</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right Panel - Sheet Configuration */}
              <div className="flex-1 overflow-auto p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Sheet Configuration</h3>
                  <Button onClick={addSheet} size="sm" className="flex items-center gap-2">
                    <PlusIcon className="w-4 h-4" />
                    Add Sheet
                  </Button>
                </div>

                <Tabs value={activeSheet} onValueChange={setActiveSheet}>
                  <TabsList className="mb-4">
                    {template.sheets.map(sheet => (
                      <TabsTrigger key={sheet.id} value={sheet.id} className="relative group">
                        {sheet.name}
                        {template.sheets.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeSheet(sheet.id);
                            }}
                            className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {currentSheet && (
                    <TabsContent value={activeSheet} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="flex-1">
                          <Label>Sheet Name</Label>
                          <Input
                            value={currentSheet.name}
                            onChange={(e) => updateSheet(activeSheet, { name: e.target.value })}
                          />
                        </div>
                        <div className="flex-1">
                          <Label>Apply Preset</Label>
                          <Select onValueChange={(value) => applyPreset(activeSheet, value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose preset..." />
                            </SelectTrigger>
                            <SelectContent>
                              {defaultPresets.map(preset => (
                                <SelectItem key={preset.id} value={preset.id}>
                                  {preset.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Columns ({currentSheet.columns.length})</h4>
                          <Button
                            onClick={() => addColumn(activeSheet)}
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-2"
                          >
                            <PlusIcon className="w-4 h-4" />
                            Add Column
                          </Button>
                        </div>

                        <div className="space-y-2 max-h-96 overflow-auto">
                          {currentSheet.columns.map((column, index) => (
                            <Card key={column.id} className="p-4">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label>Column Name</Label>
                                  <Input
                                    value={column.name}
                                    onChange={(e) => updateColumn(activeSheet, column.id, { name: e.target.value })}
                                  />
                                </div>
                                <div>
                                  <Label>Type</Label>
                                  <Select
                                    value={column.type}
                                    onValueChange={(value: any) => updateColumn(activeSheet, column.id, { type: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="text">Text</SelectItem>
                                      <SelectItem value="number">Number</SelectItem>
                                      <SelectItem value="currency">Currency</SelectItem>
                                      <SelectItem value="formula">Formula</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>Width (px)</Label>
                                  <Input
                                    type="number"
                                    value={column.width || 100}
                                    onChange={(e) => updateColumn(activeSheet, column.id, { width: Number(e.target.value) })}
                                  />
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`required-${column.id}`}
                                      checked={column.required || false}
                                      onCheckedChange={(checked) => updateColumn(activeSheet, column.id, { required: !!checked })}
                                    />
                                    <Label htmlFor={`required-${column.id}`}>Required</Label>
                                  </div>
                                  <Button
                                    onClick={() => removeColumn(activeSheet, column.id)}
                                    size="sm"
                                    variant="outline"
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </Button>
                                </div>
                                {column.type === 'formula' && (
                                  <div className="col-span-2">
                                    <Label>Formula</Label>
                                    <Input
                                      value={column.formula || ''}
                                      onChange={(e) => updateColumn(activeSheet, column.id, { formula: e.target.value })}
                                      placeholder="e.g., Quantity * Unit Rate"
                                    />
                                  </div>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-6 flex justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={generateExcelTemplate}
            className="bg-[#008080] hover:bg-[#006666] flex items-center gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            Generate & Download Template
          </Button>
        </div>
      </div>
    </div>
  );
};