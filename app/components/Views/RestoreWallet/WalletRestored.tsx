/* eslint-disable import/no-commonjs */
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { logIn } from '../../../actions/user';
import { useNavigation } from '@react-navigation/native';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const onboardingDeviceImage = require('../../../images/swaps_onboard_device.png');

export const createWalletRestoredNavDetails = createNavigationDetails(
  Routes.VAULT_RECOVERY.WALLET_RESTORED,
);

const WalletRestored = () => {
  const dispatch = useDispatch();
  const styles = createStyles();
  const navigation = useNavigation();
  // const userLoggedIn = useSelector()
  const handleOnNext = useCallback(async () => {
    console.log('WalletRestored login');
    dispatch(logIn());
    navigation.replace('HomeNav');
  }, [dispatch, navigation]);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.content}>
        <View style={styles.images}>
          <Image source={onboardingDeviceImage} />
          <BaseText variant={BaseTextVariant.lHeadingLG}>
            {strings('wallet_restored.wallet_restored_title')}
          </BaseText>
          <BaseText
            variant={BaseTextVariant.sBodyMD}
            style={styles.description}
          >
            {strings('wallet_restored.wallet_restored_description')}
          </BaseText>
          <BaseText
            variant={BaseTextVariant.sBodyMD}
            style={styles.description}
          >
            {strings('wallet_restored.wallet_restored_manual_backup')}
          </BaseText>
        </View>
      </View>
      <View style={styles.actionButtonWrapper}>
        <StyledButton
          type="confirm"
          containerStyle={styles.actionButton}
          onPress={handleOnNext}
        >
          {strings('wallet_restored.wallet_restored_action')}
        </StyledButton>
      </View>
    </SafeAreaView>
  );
};

export default React.memo(WalletRestored);
