import { listCommand } from './list';
import * as config from '../config/envaultConfig';
import * as fileStore from '../storage/fileStore';

jest.mock('../config/envaultConfig');
jest.mock('../storage/fileStore');

const mockLoadConfig = config.loadConfig as jest.MockedFunction<typeof config.loadConfig>;
const mockListEntries = fileStore.listEntries as jest.MockedFunction<typeof fileStore.listEntries>;

describe('listCommand', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  let processExitSpy: jest.SpyInstance;

  beforeEach(() => {
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should exit with error if config is not found', async () => {
    mockLoadConfig.mockResolvedValue(null);

    await expect(listCommand()).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('No envault config found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should print message when vault is empty', async () => {
    mockLoadConfig.mockResolvedValue({ vaultDir: '.envault', project: 'test' } as any);
    mockListEntries.mockResolvedValue([]);

    await listCommand();

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('No entries found')
    );
  });

  it('should print entries when vault has items', async () => {
    mockLoadConfig.mockResolvedValue({ vaultDir: '.envault', project: 'test' } as any);
    mockListEntries.mockResolvedValue([
      { name: 'production', version: 3, updatedAt: new Date('2024-01-15T10:00:00Z').toISOString() },
      { name: 'staging', version: 1, updatedAt: new Date('2024-01-10T08:00:00Z').toISOString() },
    ]);

    await listCommand();

    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Vault entries (2)'));
    expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('NAME'));
  });

  it('should exit with error if listEntries throws', async () => {
    mockLoadConfig.mockResolvedValue({ vaultDir: '.envault', project: 'test' } as any);
    mockListEntries.mockRejectedValue(new Error('disk read error'));

    await expect(listCommand()).rejects.toThrow('process.exit');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Failed to read vault entries'),
      'disk read error'
    );
  });
});
