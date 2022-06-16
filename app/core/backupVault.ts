import { KeyringState } from '@metamask/controllers';
import Logger from '../util/Logger';
// import SecureKeychain from './SecureKeychain';
import {
  getInternetCredentials,
  setInternetCredentials,
  Options,
  ACCESSIBLE,
} from 'react-native-keychain';

const VAULT_BACKUP_KEY = 'VAULT_BACKUP';

const options: Options = {
  accessible: ACCESSIBLE.WHEN_UNLOCKED,
};

interface KeyRingBackupResponse {
  success: boolean;
  message: string;
  vault?: string;
}

// eslint-disable-next-line import/prefer-default-export
export const backupVault = async (keyRingState: KeyringState) => {
  if (keyRingState.vault) {
    const backupResult = await setInternetCredentials(
      VAULT_BACKUP_KEY,
      VAULT_BACKUP_KEY,
      keyRingState.vault,
      options,
    );
    if (backupResult === false) {
      Logger.log(VAULT_BACKUP_KEY, 'Vault backup failed');
      const response: KeyRingBackupResponse = {
        success: false,
        message: 'Vault backup failed',
      };
      return response;
    }
    Logger.log(VAULT_BACKUP_KEY, 'Vault successfully backed up');
    const response: KeyRingBackupResponse = {
      success: true,
      message: 'Vault successfully backed up',
      vault: keyRingState.vault,
    };
    return response;
  }
  Logger.log(VAULT_BACKUP_KEY, 'Unable to backup vault as it is undefined');
  const response: KeyRingBackupResponse = {
    success: false,
    message: 'Unable to backup vault as it is undefined',
  };
  return response;
};

export const getVaultFromBackup = async () => {
  Logger.log(VAULT_BACKUP_KEY, 'getVaultFromBackup');
  const credentials = await getInternetCredentials(VAULT_BACKUP_KEY);
  if (credentials) {
    return credentials.password;
  }
  return false;
};
