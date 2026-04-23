import {
  getRuntimeConfig,
  getDefaultNetworkPassphrase,
  getSorobanRpcUrl,
  getStellarNetwork,
  validateRuntimeConfig,
} from './runtimeConfig';

describe('runtimeConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.REACT_APP_STELLAR_NETWORK;
    delete process.env.REACT_APP_SOROBAN_RPC_URL;
    delete process.env.REACT_APP_NETWORK_PASSPHRASE;
    process.env.REACT_APP_CONTRACT_ID = '';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('defaults to testnet profile', () => {
    expect(getStellarNetwork()).toBe('testnet');
    expect(getSorobanRpcUrl()).toBe('https://soroban-testnet.stellar.org');
    expect(getDefaultNetworkPassphrase()).toBe('Test SDF Network ; September 2015');
  });

  test('switches defaults for mainnet profile', () => {
    process.env.REACT_APP_STELLAR_NETWORK = 'mainnet';

    expect(getStellarNetwork()).toBe('mainnet');
    expect(getSorobanRpcUrl()).toBe('https://mainnet.sorobanrpc.com');
    expect(getDefaultNetworkPassphrase()).toBe('Public Global Stellar Network ; September 2015');
  });

  test('env values override profile defaults', () => {
    process.env.REACT_APP_STELLAR_NETWORK = 'mainnet';
    process.env.REACT_APP_SOROBAN_RPC_URL = 'https://custom-rpc.example';
    process.env.REACT_APP_NETWORK_PASSPHRASE = 'Custom Passphrase';

    expect(getSorobanRpcUrl()).toBe('https://custom-rpc.example');
    expect(getDefaultNetworkPassphrase()).toBe('Custom Passphrase');
  });

  test('runtime config validation reports missing contract id', () => {
    const errors = validateRuntimeConfig(getRuntimeConfig());
    expect(errors).toContain('REACT_APP_CONTRACT_ID is required.');
  });

  test('runtime config validation reports network/rpc mismatch', () => {
    process.env.REACT_APP_CONTRACT_ID = 'CBADTESTCONTRACTID';
    process.env.REACT_APP_STELLAR_NETWORK = 'mainnet';
    process.env.REACT_APP_SOROBAN_RPC_URL = 'https://soroban-testnet.stellar.org';

    const errors = validateRuntimeConfig(getRuntimeConfig());
    expect(errors).toContain('Mainnet configuration cannot use a testnet RPC URL.');
  });
});
