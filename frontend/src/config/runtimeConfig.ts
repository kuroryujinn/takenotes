export type StellarNetwork = 'testnet' | 'mainnet';

export interface RuntimeConfig {
  network: StellarNetwork;
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string;
  loggerContractId: string;
}

interface NetworkDefaults {
  rpcUrl: string;
  networkPassphrase: string;
}

const DEFAULTS: Record<StellarNetwork, NetworkDefaults> = {
  testnet: {
    rpcUrl: 'https://soroban-testnet.stellar.org',
    networkPassphrase: 'Test SDF Network ; September 2015',
  },
  mainnet: {
    rpcUrl: 'https://mainnet.sorobanrpc.com',
    networkPassphrase: 'Public Global Stellar Network ; September 2015',
  },
};

function normalizeNetwork(value: string | undefined): StellarNetwork {
  if (!value) {
    return 'testnet';
  }

  return value.toLowerCase() === 'mainnet' ? 'mainnet' : 'testnet';
}

export function getStellarNetwork(): StellarNetwork {
  return normalizeNetwork(process.env.REACT_APP_STELLAR_NETWORK);
}

export function getSorobanRpcUrl(): string {
  const fromEnv = process.env.REACT_APP_SOROBAN_RPC_URL?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULTS[getStellarNetwork()].rpcUrl;
}

export function getDefaultNetworkPassphrase(): string {
  const fromEnv = process.env.REACT_APP_NETWORK_PASSPHRASE?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  return DEFAULTS[getStellarNetwork()].networkPassphrase;
}

function looksLikeHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

export function getRuntimeConfig(): RuntimeConfig {
  return {
    network: getStellarNetwork(),
    rpcUrl: getSorobanRpcUrl(),
    networkPassphrase: getDefaultNetworkPassphrase(),
    contractId: process.env.REACT_APP_CONTRACT_ID?.trim() || '',
    loggerContractId: process.env.REACT_APP_LOGGER_CONTRACT_ID?.trim() || '',
  };
}

export function validateRuntimeConfig(config: RuntimeConfig): string[] {
  const errors: string[] = [];

  if (!config.contractId) {
    errors.push('REACT_APP_CONTRACT_ID is required.');
  }

  if (!looksLikeHttpUrl(config.rpcUrl)) {
    errors.push('REACT_APP_SOROBAN_RPC_URL must be a valid http(s) URL.');
  }

  if (!config.networkPassphrase.trim()) {
    errors.push('REACT_APP_NETWORK_PASSPHRASE is required.');
  }

  if (config.network === 'mainnet' && config.rpcUrl.includes('testnet')) {
    errors.push('Mainnet configuration cannot use a testnet RPC URL.');
  }

  if (config.network === 'testnet' && config.rpcUrl.includes('mainnet')) {
    errors.push('Testnet configuration cannot use a mainnet RPC URL.');
  }

  return errors;
}

