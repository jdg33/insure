
import React, { useState, useCallback } from 'react';
import { Contract, ContractType, ProcessingStatus } from './types';
import FileUpload from './components/FileUpload';
import ResultsDisplay from './components/ResultsDisplay';
import { processZipFile } from './services/fileProcessor';

// Header component for consistent branding
const AppHeader = () => (
  <header className="bg-white shadow-md">
    <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold leading-tight text-slate-900">
        Contract Insurance Provision Analyzer
      </h1>
      <p className="text-sm text-slate-500 mt-1">
        Upload a .zip of contracts to extract and analyze insurance clauses with AI.
      </p>
    </div>
  </header>
);

// Footer component
const AppFooter = () => (
    <footer className="bg-white mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 text-center text-sm text-slate-400">
            <p>&copy; 2024 AI Contract Analyzer. All rights reserved.</p>
        </div>
    </footer>
);


export default function App() {
  const [processingState, setProcessingState] = useState<{ status: ProcessingStatus; message: string }>({
    status: ProcessingStatus.Idle,
    message: '',
  });
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleProcessContracts = useCallback(async (file: File, contractType: ContractType) => {
    setProcessingState({ status: ProcessingStatus.Processing, message: 'Starting analysis...' });
    setError(null);
    setContracts([]);

    try {
      const processedContracts = await processZipFile(
        file,
        contractType,
        (message) => setProcessingState((prevState) => ({ ...prevState, message }))
      );
      setContracts(processedContracts);
      setProcessingState({ status: ProcessingStatus.Done, message: 'Analysis complete!' });
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setProcessingState({ status: ProcessingStatus.Error, message: errorMessage });
    }
  }, []);

  const handleReset = () => {
    setContracts([]);
    setProcessingState({ status: ProcessingStatus.Idle, message: '' });
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      <AppHeader />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {processingState.status === ProcessingStatus.Idle || processingState.status === ProcessingStatus.Error ? (
            <FileUpload onProcess={handleProcessContracts} status={processingState.status} error={error} />
          ) : processingState.status === ProcessingStatus.Processing ? (
             <div className="text-center p-12 bg-white rounded-lg shadow-lg">
                <div className="flex justify-center items-center mb-4">
                    <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-800">Processing Contracts...</h2>
                <p className="text-slate-500 mt-2">{processingState.message}</p>
            </div>
          ) : (
            <ResultsDisplay contracts={contracts} onReset={handleReset} />
          )}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
