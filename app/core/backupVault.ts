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
      return false;
    }
    Logger.log(VAULT_BACKUP_KEY, 'Vault successfully backed up');
    return true;
  }
  Logger.log(VAULT_BACKUP_KEY, 'Unable to backup vault as it is undefined');
  return false;
};

export const getVaultFromBackup = async () => {
  Logger.log(VAULT_BACKUP_KEY, 'getVaultFromBackup');
  const credentials = await getInternetCredentials(VAULT_BACKUP_KEY);
  if (credentials) {
    return credentials.password;
  }
  return false;
};
