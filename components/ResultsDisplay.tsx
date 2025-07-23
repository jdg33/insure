
import React, { useState, useMemo } from 'react';
import { Contract, ContractType, Provision } from '../types';
import { DocumentIcon } from './icons/DocumentIcon';

interface ResultsDisplayProps {
  contracts: Contract[];
  onReset: () => void;
}

const ProvisionItem: React.FC<{ provision: Provision }> = ({ provision }) => (
  <div className="py-4 px-5 bg-slate-50 border border-slate-200 rounded-lg">
    <blockquote className="text-slate-600 italic border-l-4 border-slate-300 pl-4 mb-3">
      {provision.text}
    </blockquote>
    <p className="text-slate-800"><span className="font-semibold text-blue-700">AI Summary:</span> {provision.summary}</p>
  </div>
);

const ContractAccordion: React.FC<{ contract: Contract }> = ({ contract }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 bg-white rounded-lg shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <div className="flex items-center">
          <DocumentIcon className="h-5 w-5 mr-3 text-slate-500" />
          <span className="font-medium text-slate-800">{contract.name}</span>
        </div>
        <div className="flex items-center">
            <span className="text-sm bg-blue-100 text-blue-800 font-medium mr-4 px-2.5 py-0.5 rounded-full">{contract.provisions.length} provisions</span>
            <svg
                className={`w-5 h-5 text-slate-500 transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
        </div>
      </button>
      {isOpen && (
        <div className="p-4 border-t border-slate-200">
          <div className="space-y-4">
            {contract.provisions.length > 0 ? (
                contract.provisions.map(p => <ProvisionItem key={p.id} provision={p} />)
            ) : (
                <p className="text-slate-500 text-center py-4">No relevant provisions found in this document.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


export default function ResultsDisplay({ contracts, onReset }: ResultsDisplayProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredContracts = useMemo(() => {
    if (!searchTerm) return contracts;
    const lowercasedFilter = searchTerm.toLowerCase();
    
    return contracts
      .map(contract => {
        const matchingProvisions = contract.provisions.filter(
          provision =>
            provision.text.toLowerCase().includes(lowercasedFilter) ||
            provision.summary.toLowerCase().includes(lowercasedFilter)
        );

        if (contract.name.toLowerCase().includes(lowercasedFilter) || matchingProvisions.length > 0) {
            return {...contract, provisions: matchingProvisions.length > 0 ? matchingProvisions : contract.provisions };
        }
        return null;
      })
      .filter((c): c is Contract => c !== null);
  }, [contracts, searchTerm]);
  
  const contractsByType = useMemo(() => {
    return filteredContracts.reduce((acc, contract) => {
        (acc[contract.type] = acc[contract.type] || []).push(contract);
        return acc;
    }, {} as Record<ContractType, Contract[]>);
  }, [filteredContracts]);

  const exportToCSV = () => {
    const headers = ['Contract Name', 'Contract Type', 'Original Provision', 'AI Summary'];
    const rows = filteredContracts.flatMap(contract => 
      contract.provisions.map(provision => [
        `"${contract.name.replace(/"/g, '""')}"`,
        `"${contract.type}"`,
        `"${provision.text.replace(/"/g, '""')}"`,
        `"${provision.summary.replace(/"/g, '""')}"`
      ].join(','))
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "insurance_provision_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="space-y-8">
        <div className="bg-white p-4 rounded-lg shadow-md flex flex-wrap items-center justify-between gap-4">
            <div className="flex-grow">
                 <input
                    type="text"
                    placeholder="Search by contract name or provision keyword..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
            </div>
            <div className="flex items-center gap-4">
                <button
                    onClick={exportToCSV}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition"
                >
                    Export to CSV
                </button>
                <button
                    onClick={onReset}
                    className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition"
                >
                    Start New Analysis
                </button>
            </div>
        </div>

      {Object.keys(contractsByType).length > 0 ? (
        (Object.keys(contractsByType) as ContractType[]).map(type => (
          <div key={type}>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 pb-2 border-b-2 border-blue-500">{type} Contracts</h2>
            <div className="space-y-3">
              {contractsByType[type].length > 0 ? (
                 contractsByType[type].map(contract => (
                    <ContractAccordion key={contract.id} contract={contract} />
                 ))
              ) : (
                <p className="text-slate-500">No contracts of this type match the current filter.</p>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-slate-700">No Results Found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your search term or start a new analysis.</p>
        </div>
      )}
    </div>
  );
}
