
import React, { useState, useCallback } from 'react';
import { ContractType, ProcessingStatus } from '../types';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onProcess: (file: File, type: ContractType) => void;
  status: ProcessingStatus;
  error: string | null;
}

export default function FileUpload({ onProcess, status, error }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [contractType, setContractType] = useState<ContractType>(ContractType.NJA);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvents(e);
      if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
          setIsDragging(true);
      }
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvents(e);
      setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      handleDragEvents(e);
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          setFile(e.dataTransfer.files[0]);
          e.dataTransfer.clearData();
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (file) {
      onProcess(file, contractType);
    }
  };
  
  const dragDropClasses = isDragging 
    ? "border-blue-500 bg-blue-50" 
    : "border-slate-300 hover:border-slate-400";

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <h2 className="text-2xl font-semibold text-slate-800 mb-2">Start a New Analysis</h2>
      <p className="text-slate-500 mb-6">Select contract type and upload a single .zip file containing all documents.</p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">1. Select Contract Type</label>
          <div className="flex space-x-4">
            {(Object.keys(ContractType) as Array<keyof typeof ContractType>).map((key) => (
              <label key={key} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="contractType"
                  value={ContractType[key]}
                  checked={contractType === ContractType[key]}
                  onChange={() => setContractType(ContractType[key])}
                  className="h-4 w-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <span className="text-slate-800">{ContractType[key]}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">2. Upload Contracts (.zip)</label>
          <div
             onDragEnter={handleDragEnter}
             onDragOver={handleDragEnter}
             onDragLeave={handleDragLeave}
             onDrop={handleDrop}
             className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 ${dragDropClasses} border-dashed rounded-md transition-colors duration-200`}
          >
            <div className="space-y-1 text-center">
              <UploadIcon className="mx-auto h-12 w-12 text-slate-400" />
              <div className="flex text-sm text-slate-600">
                <label
                  htmlFor="file-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" className="sr-only" accept=".zip" onChange={handleFileChange} />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-slate-500">ZIP file only</p>
            </div>
          </div>
          {file && <p className="mt-2 text-sm text-slate-600">Selected file: <span className="font-medium">{file.name}</span></p>}
        </div>

        {error && status === ProcessingStatus.Error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4" role="alert">
            <p className="font-bold text-red-800">Analysis Failed</p>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div>
          <button
            type="submit"
            disabled={!file || status === ProcessingStatus.Processing}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Analyze Contracts
          </button>
        </div>
      </form>
    </div>
  );
}
