import { UploadIcon, FileSpreadsheetIcon, TrashIcon } from "lucide-react";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { BidderData, ExcelSheet } from "../../types/priceleveling";

interface ImportStepProps {
  bidders: BidderData[];
  onBiddersUpdate: (bidders: BidderData[]) => void;
}

export const ImportStep: React.FC<ImportStepProps> = ({ bidders, onBiddersUpdate }) => {
  const processExcelFile = useCallback((file: File): Promise<BidderData> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets: ExcelSheet[] = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headers = jsonData[0] as string[] || [];
            
            return {
              name: sheetName,
              data: jsonData as any[][],
              headers
            };
          });

          const bidderData: BidderData = {
            id: `bidder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name.replace(/\.[^/.]+$/, ""),
            fileName: file.name,
            uploadDate: new Date(),
            sheets
          };

          resolve(bidderData);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    try {
      const newBidders = await Promise.all(
        acceptedFiles.map(file => processExcelFile(file))
      );
      onBiddersUpdate([...bidders, ...newBidders]);
    } catch (error) {
      console.error('Error processing files:', error);
    }
  }, [bidders, onBiddersUpdate, processExcelFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  const removeBidder = (bidderId: string) => {
    onBiddersUpdate(bidders.filter(b => b.id !== bidderId));
  };

  const importFromVendorSubmission = () => {
    // Placeholder for importing from Vendor Submission tab
    console.log('Import from Vendor Submission - to be implemented');
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#001d3d]">
              Import Excel Files
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-[#008080] bg-[#008080]/5'
                  : 'border-gray-300 hover:border-[#008080]'
              }`}
            >
              <input {...getInputProps()} />
              <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isDragActive ? 'Drop Excel files here' : 'Drag & drop Excel files here'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to select files (.xlsx, .xls)
              </p>
              <Button variant="outline" className="mx-auto">
                Select Files
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="flex-1">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#001d3d]">
              Import from Vendor Submission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileSpreadsheetIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Import Pricing Data
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Import pricing files from the dedicated Pricing folder
              </p>
              <Button onClick={importFromVendorSubmission} className="bg-[#008080] hover:bg-[#006666]">
                Import from Pricing Folder
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {bidders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-[#001d3d]">
              Imported Bidders ({bidders.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bidders.map((bidder) => (
                <div
                  key={bidder.id}
                  className="flex items-center justify-between p-4 border rounded-lg bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheetIcon className="w-5 h-5 text-[#008080]" />
                    <div>
                      <p className="font-medium text-[#001d3d]">{bidder.name}</p>
                      <p className="text-sm text-gray-500">
                        {bidder.sheets.length} sheet{bidder.sheets.length !== 1 ? 's' : ''} • 
                        Uploaded {bidder.uploadDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBidder(bidder.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};