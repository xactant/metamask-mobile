import { KeyringState } from '@metamask/controllers';
import Logger from '../util/Logger';
// import SecureKeychain from './SecureKeychain';
import { getGenericPassword, setGenericPassword } from 'react-native-keychain';

const VAULT_BACKUP_KEY = 'VAULT_BACKUP';

// eslint-disable-next-line import/prefer-default-export
export const backupVault = async (keyRingState: KeyringState) => {
  if (keyRingState.vault) {
    const backupResult = await setGenericPassword(
      VAULT_BACKUP_KEY,
      keyRingState.vault,
      { service: VAULT_BACKUP_KEY },
    );
    if (backupResult === false) {
      Logger.log(VAULT_BACKUP_KEY, 'Vault backup failed');
      return false;
    }
    return true;
  }
  Logger.log(VAULT_BACKUP_KEY, 'Unable to backup vault as it is undefined');
  return false;
};

const getVaultFromBackaup = () => {
  const credentials = getGenericPassword();
  console.log({ credentials });
};
