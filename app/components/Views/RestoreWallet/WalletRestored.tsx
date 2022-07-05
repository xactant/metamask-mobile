/* eslint-disable import/no-commonjs */
import { useAppThemeFromContext } from '../../../util/theme';
import React, { useCallback } from 'react';
import { View, Image } from 'react-native';
import { strings } from '../../../../locales/i18n';
import { createStyles } from './styles';
import BaseText, {
  BaseTextVariant,
} from '../../../component-library/components/BaseText';
import StyledButton from '../../UI/StyledButton';
import { createNavigationDetails } from '../../../util/navigation/navUtils';
import Routes from '../../../constants/navigation/Routes';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const onboardingDeviceImage = require('../../../images/swaps_onboard_device.png');

export const createRestoreWalletNavDetails = createNavigationDetails(
  Routes.VAULT_RECOVERY.WALLET_RESTORED,
);

const RestoreWallet = () => {
  const { colors } = useAppThemeFromContext();
  const styles = createStyles(colors);
  const handleOnNext = useCallback(() => {
    console.log('Vault recovery');
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.images}>
          <Image source={onboardingDeviceImage} />
          <BaseText variant={BaseTextVariant.lHeadingLG}>
            {strings('vault_recovery.restore_needed_title')}
          </BaseText>
          <BaseText
            variant={BaseTextVariant.sBodyMD}
            style={styles.description}
          >
            {strings('vault_recovery.restore_needed_description')}
          </BaseText>
        </View>
      </View>
      <View style={styles.actionButtonWrapper}>
        <StyledButton
          type="confirm"
          containerStyle={styles.actionButton}
          onPress={handleOnNext}
        >
          {strings('vault_recovery.restore_needed_action')}
        </StyledButton>
      </View>
    </View>
  );
};

export default React.memo(RestoreWallet);
