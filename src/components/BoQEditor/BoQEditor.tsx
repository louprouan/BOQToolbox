import React, { useState } from "react";
import { FolderPlusIcon, FileSpreadsheetIcon } from "lucide-react";
import { Button } from "../ui/button";
import { BoQTemplateModal } from "./BoQTemplateModal";

interface FolderStructure {
  id: string;
  name: string;
  type: 'folder' | 'file';
  children?: FolderStructure[];
  parentId?: string;
}

export const BoQEditor: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [folders, setFolders] = useState<FolderStructure[]>([
    {
      id: 'drawings',
      name: 'Drawings',
      type: 'folder',
      children: []
    },
    {
      id: 'specifications',
      name: 'Specifications',
      type: 'folder',
      children: []
    },
    {
      id: 'boq',
      name: 'Bill of Quantities',
      type: 'folder',
      children: []
    }
  ]);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);

  const addFolder = () => {
    if (!newFolderName.trim()) return;
    
    const newFolder: FolderStructure = {
      id: `folder-${Date.now()}`,
      name: newFolderName,
      type: 'folder',
      children: []
    };
    
    setFolders([...folders, newFolder]);
    setNewFolderName('');
    setShowNewFolderInput(false);
  };

  const deleteFolder = (folderId: string) => {
    setFolders(folders.filter(folder => folder.id !== folderId));
  };

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex items-center gap-4">
        <Button
          onClick={() => setShowNewFolderInput(true)}
          className="bg-[#008080] hover:bg-[#006666] flex items-center gap-2"
        >
          <FolderPlusIcon className="w-4 h-4" />
          Add Folder
        </Button>
        
        <Button
          onClick={() => setIsModalOpen(true)}
          variant="outline"
          className="flex items-center gap-2"
        >
          <FileSpreadsheetIcon className="w-4 h-4" />
          Generate BoQ Template
        </Button>
      </div>

      {/* New Folder Input */}
      {showNewFolderInput && (
        <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-lg">
          <input
            type="text"
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addFolder()}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent"
            autoFocus
          />
          <Button onClick={addFolder} size="sm">
            Add
          </Button>
          <Button
            onClick={() => {
              setShowNewFolderInput(false);
              setNewFolderName('');
            }}
            variant="outline"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Folder Structure */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-[#001d3d]">Document Folders</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <FolderPlusIcon className="w-5 h-5 text-[#008080]" />
                <span className="font-medium text-[#001d3d]">{folder.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Upload
                </Button>
                <Button
                  onClick={() => deleteFolder(folder.id)}
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  ×
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BoQTemplateModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};