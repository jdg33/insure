
export enum ContractType {
  NJA = 'NJA',
  Supplier = 'Supplier',
}

export interface Provision {
  id: string;
  text: string;
  summary: string;
}

export interface Contract {
  id: string;
  name: string;
  type: ContractType;
  content: string; // The full text content of the contract
  provisions: Provision[];
}

export enum ProcessingStatus {
  Idle = 'Idle',
  Processing = 'Processing',
  Done = 'Done',
  Error = 'Error',
}
