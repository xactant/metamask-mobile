import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import {
	Alert,
	StyleSheet,
	Switch,
	Text,
	ScrollView,
	View,
	ActivityIndicator,
	TouchableOpacity,
	Keyboard,
	InteractionManager,
	Linking,
} from 'react-native';
import AsyncStorage from '@react-native-community/async-storage';
import { connect } from 'react-redux';
import { MAINNET } from '../../../../constants/network';
import ActionModal from '../../../UI/ActionModal';
import SecureKeychain from '../../../../core/SecureKeychain';
import SelectComponent from '../../../UI/SelectComponent';
import StyledButton from '../../../UI/StyledButton';
import SettingsNotification from '../../../UI/SettingsNotification';
import { clearHistory } from '../../../../actions/browser';
import { clearHosts, setPrivacyMode, setThirdPartyApiMode } from '../../../../actions/privacy';
import { colors, fontStyles } from '../../../../styles/common';
import Logger from '../../../../util/Logger';
import Device from '../../../../util/device';
import { getNavigationOptionsTitle } from '../../../UI/Navbar';
import { setLockTime } from '../../../../actions/settings';
import { strings } from '../../../../../locales/i18n';
import Analytics from '../../../../core/Analytics';
import { passwordSet } from '../../../../actions/user';
import Engine from '../../../../core/Engine';
import AppConstants from '../../../../core/AppConstants';
import {
	EXISTING_USER,
	BIOMETRY_CHOICE,
	PASSCODE_CHOICE,
	TRUE,
	PASSCODE_DISABLED,
	BIOMETRY_CHOICE_DISABLED,
	SEED_PHRASE_HINTS,
} from '../../../../constants/storage';

import CookieManager from '@react-native-community/cookies';
import Icon from 'react-native-vector-icons/FontAwesome';
import HintModal from '../../../UI/HintModal';
import AnalyticsV2, { trackErrorAsAnalytics } from '../../../../util/analyticsV2';
import SeedPhraseVideo from '../../../UI/SeedPhraseVideo';

const isIos = Device.isIos();
const LEARN_MORE_URL =
	'https://metamask.zendesk.com/hc/en-us/articles/360015489591-Basic-Safety-and-Security-Tips-for-MetaMask';

const styles = StyleSheet.create({
	wrapper: {
		backgroundColor: colors.white,
		flex: 1,
		padding: 24,
		paddingBottom: 48,
	},
	title: {
		...fontStyles.normal,
		color: colors.fontPrimary,
		fontSize: 20,
		lineHeight: 20,
	},
	bump: {
		marginBottom: 10,
	},
	heading: {
		fontSize: 24,
		lineHeight: 30,
		marginBottom: 24,
	},
	desc: {
		...fontStyles.normal,
		color: colors.grey500,
		fontSize: 14,
		lineHeight: 20,
		marginTop: 12,
	},
	learnMore: {
		...fontStyles.normal,
		color: colors.blue,
		fontSize: 14,
		lineHeight: 20,
	},
	switchElement: {
		marginTop: 18,
	},
	setting: {
		marginTop: 50,
	},
	firstSetting: {
		marginTop: 0,
	},
	modalView: {
		alignItems: 'center',
		flex: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		padding: 20,
	},
	modalText: {
		...fontStyles.normal,
		fontSize: 18,
		textAlign: 'center',
	},
	modalTitle: {
		...fontStyles.bold,
		fontSize: 22,
		textAlign: 'center',
		marginBottom: 20,
	},
	confirm: {
		marginTop: 18,
	},
	protect: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	col: {
		width: '100%',
	},
	inner: {
		paddingBottom: 112,
	},
	picker: {
		borderColor: colors.grey200,
		borderRadius: 5,
		borderWidth: 2,
		marginTop: 16,
	},
	loader: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
	},
	warningText: {
		color: colors.black,
		fontSize: 12,
		flex: 1,
		...fontStyles.normal,
	},
	warningTextRed: {
		color: colors.red,
	},
	warningTextGreen: {
		color: colors.black,
	},
	warningBold: {
		...fontStyles.bold,
		color: colors.blue,
	},
	viewHint: {
		padding: 5,
	},
});

const Heading = ({ children, first }) => (
	<View style={[styles.setting, first && styles.firstSetting]}>
		<Text style={[styles.title, styles.heading]}>{children}</Text>
	</View>
);

const WarningIcon = () => <Icon size={16} color={colors.red} name="exclamation-triangle" />;

Heading.propTypes = {
	children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]),
	first: PropTypes.bool,
};

/**
 * Main view for app configurations
 */
class Settings extends PureComponent {
	static propTypes = {
		/**
		 * Indicates whether privacy mode is enabled
		 */
		privacyMode: PropTypes.bool,
		/**
		 * Called to toggle privacy mode
		 */
		setPrivacyMode: PropTypes.func,
		/**
		 * Called to toggle set party api mode
		 */
		setThirdPartyApiMode: PropTypes.func,
		/**
		 * Indicates whether third party API mode is enabled
		 */
		thirdPartyApiMode: PropTypes.bool,
		/**
		 * Called to set the passwordSet flag
		 */
		passwordSet: PropTypes.func,
		/**
		/* navigation object required to push new views
		*/
		navigation: PropTypes.object,
		/**
		 * Map of hostnames with approved account access
		 */
		approvedHosts: PropTypes.object,
		/**
		 * Called to clear all hostnames with account access
		 */
		clearHosts: PropTypes.func,
		/**
		 * Array of visited websites
		 */
		browserHistory: PropTypes.array,
		/**
		 * Called to clear the list of visited urls
		 */
		clearBrowserHistory: PropTypes.func,
		/**
		 * Called to set the active search engine
		 */
		setLockTime: PropTypes.func,
		/**
		 * Active search engine
		 */
		lockTime: PropTypes.number,
		/**
		 * Selected address as string
		 */
		selectedAddress: PropTypes.string,
		/**
		 * List of accounts from the AccountTrackerController
		 */
		accounts: PropTypes.object,
		/**
		 * List of accounts from the PreferencesController
		 */
		identities: PropTypes.object,
		/**
		 * redux flag that indicates if the user
		 * completed the seed phrase backup flow
		 */
		seedphraseBackedUp: PropTypes.bool,
		/**
		 * State of OpenSea Enable toggle
		 */
		openSeaEnabled: PropTypes.bool,
		/**
		 * State of NFT detection toggle
		 */
		useCollectibleDetection: PropTypes.bool,
		/**
		 * Route passed in props from navigation
		 */
		route: PropTypes.object,
		/**
		 * Type of network
		 */
		type: PropTypes.string,
	};

	static navigationOptions = ({ navigation }) =>
		getNavigationOptionsTitle(strings('app_settings.security_title'), navigation);

	state = {
		approvalModalVisible: false,
		biometryChoice: null,
		biometryType: false,
		browserHistoryModalVisible: false,
		cookiesModalVisible: false,
		analyticsEnabled: false,
		passcodeChoice: false,
		showHint: false,
		hintText: '',
	};

	autolockOptions = [
		{
			value: '0',
			label: strings('app_settings.autolock_immediately'),
			key: '0',
		},
		{
			value: '5000',
			label: strings('app_settings.autolock_after', { time: 5 }),
			key: '5000',
		},
		{
			value: '15000',
			label: strings('app_settings.autolock_after', { time: 15 }),
			key: '15000',
		},
		{
			value: '30000',
			label: strings('app_settings.autolock_after', { time: 30 }),
			key: '30000',
		},
		{
			value: '60000',
			label: strings('app_settings.autolock_after', { time: 60 }),
			key: '60000',
		},
		{
			value: '300000',
			label: strings('app_settings.autolock_after_minutes', { time: 5 }),
			key: '300000',
		},
		{
			value: '600000',
			label: strings('app_settings.autolock_after_minutes', { time: 10 }),
			key: '600000',
		},
		{
			value: '-1',
			label: strings('app_settings.autolock_never'),
			key: '-1',
		},
	];

	scrollView = undefined;

	componentDidMount = async () => {
		const biometryType = await SecureKeychain.getSupportedBiometryType();
		const analyticsEnabled = Analytics.getEnabled();
		const currentSeedphraseHints = await AsyncStorage.getItem(SEED_PHRASE_HINTS);
		const parsedHints = currentSeedphraseHints && JSON.parse(currentSeedphraseHints);
		const manualBackup = parsedHints?.manualBackup;

		if (biometryType) {
			let passcodeEnabled = false;
			const biometryChoice = await AsyncStorage.getItem(BIOMETRY_CHOICE);
			if (!biometryChoice) {
				const passcodeChoice = await AsyncStorage.getItem(PASSCODE_CHOICE);
				if (passcodeChoice !== '' && passcodeChoice === TRUE) {
					passcodeEnabled = true;
				}
			}
			this.setState({
				biometryType: biometryType && Device.isAndroid() ? 'biometrics' : biometryType,
				biometryChoice: !!biometryChoice,
				analyticsEnabled,
				passcodeChoice: passcodeEnabled,
				hintText: manualBackup,
			});
		} else {
			this.setState({
				analyticsEnabled,
				hintText: manualBackup,
			});
		}

		if (this.props.route?.params?.scrollToBottom) this.scrollView?.scrollToEnd({ animated: true });
	};

	onSingInWithBiometrics = async (enabled) => {
		this.setState({ loading: true }, async () => {
			let credentials;
			try {
				credentials = await SecureKeychain.getGenericPassword();
			} catch (error) {
				Logger.error(error);
			}
			if (credentials && credentials.password !== '') {
				this.storeCredentials(credentials.password, enabled, 'biometryChoice');
			} else {
				this.props.navigation.navigate('EnterPasswordSimple', {
					onPasswordSet: (password) => {
						this.storeCredentials(password, enabled, 'biometryChoice');
					},
				});
			}
		});
	};

	isMainnet = () => this.props.type === MAINNET;

	onSignInWithPasscode = async (enabled) => {
		this.setState({ loading: true }, async () => {
			let credentials;
			try {
				credentials = await SecureKeychain.getGenericPassword();
			} catch (error) {
				Logger.error(error);
			}

			if (credentials && credentials.password !== '') {
				this.storeCredentials(credentials.password, enabled, 'passcodeChoice');
			} else {
				this.props.navigation.navigate('EnterPasswordSimple', {
					onPasswordSet: (password) => {
						this.storeCredentials(password, enabled, 'passcodeChoice');
					},
				});
			}
		});
	};

	storeCredentials = async (password, enabled, type) => {
		try {
			await SecureKeychain.resetGenericPassword();

			await Engine.context.KeyringController.exportSeedPhrase(password);

			await AsyncStorage.setItem(EXISTING_USER, TRUE);

			if (!enabled) {
				this.setState({ [type]: false, loading: false });
				if (type === 'passcodeChoice') {
					await AsyncStorage.setItem(PASSCODE_DISABLED, TRUE);
				} else if (type === 'biometryChoice') {
					await AsyncStorage.setItem(BIOMETRY_CHOICE_DISABLED, TRUE);
				}

				return;
			}

			if (type === 'passcodeChoice')
				await SecureKeychain.setGenericPassword(password, SecureKeychain.TYPES.PASSCODE);
			else if (type === 'biometryChoice')
				await SecureKeychain.setGenericPassword(password, SecureKeychain.TYPES.BIOMETRICS);

			this.props.passwordSet();

			if (this.props.lockTime === -1) {
				this.props.setLockTime(AppConstants.DEFAULT_LOCK_TIMEOUT);
			}

			this.setState({ [type]: true, loading: false });
		} catch (e) {
			if (e.message === 'Invalid password') {
				Alert.alert(strings('app_settings.invalid_password'), strings('app_settings.invalid_password_message'));
				trackErrorAsAnalytics('SecuritySettings: Invalid password', e?.message);
			} else {
				Logger.error(e, 'SecuritySettings:biometrics');
			}
			this.setState({ [type]: !enabled, loading: false });
		}
	};

	toggleClearApprovalsModal = () => {
		this.setState({ approvalModalVisible: !this.state.approvalModalVisible });
	};

	toggleClearBrowserHistoryModal = () => {
		this.setState({ browserHistoryModalVisible: !this.state.browserHistoryModalVisible });
	};

	toggleClearCookiesModal = () => {
		this.setState({ cookiesModalVisible: !this.state.cookiesModalVisible });
	};

	clearApprovals = () => {
		this.props.clearHosts();
		this.toggleClearApprovalsModal();
	};

	clearBrowserHistory = () => {
		this.props.clearBrowserHistory();
		this.toggleClearBrowserHistoryModal();
	};

	clearCookies = () => {
		CookieManager.clearAll().then(() => {
			Logger.log('Browser cookies cleared');
			this.toggleClearCookiesModal();
		});
	};

	togglePrivacy = (value) => {
		this.props.setPrivacyMode(value);
	};

	toggleThirdPartyAPI = (value) => {
		this.props.setThirdPartyApiMode(value);
	};

	toggleOpenSeaApi = (value) => {
		const { PreferencesController } = Engine.context;
		PreferencesController?.setOpenSeaEnabled(value);
		if (!value) PreferencesController?.setUseCollectibleDetection(value);
	};

	toggleNftAutodetect = (value) => {
		const { PreferencesController } = Engine.context;
		PreferencesController.setUseCollectibleDetection(value);
	};

	/**
	 * Track the event of opt in or opt out.
	 * @param AnalyticsOptionSelected - User selected option regarding the tracking of events
	 */
	trackOptInEvent = (AnalyticsOptionSelected) => {
		InteractionManager.runAfterInteractions(async () => {
			AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.ANALYTICS_PREFERENCE_SELECTED, {
				analytics_option_selected: AnalyticsOptionSelected,
				updated_after_onboarding: true,
			});
		});
	};

	toggleMetricsOptIn = async (value) => {
		if (value) {
			Analytics.enable();
			this.setState({ analyticsEnabled: true });
			await this.trackOptInEvent('Metrics Opt In');
		} else {
			await this.trackOptInEvent('Metrics Opt Out');
			Analytics.disable();
			this.setState({ analyticsEnabled: false });
			Alert.alert(
				strings('app_settings.metametrics_opt_out'),
				strings('app_settings.metametrics_restart_required')
			);
		}
	};

	goToRevealPrivateCredential = () => {
		AnalyticsV2.trackEvent(AnalyticsV2.SETTINGS_REVEAL_SRP);
		this.props.navigation.navigate('RevealPrivateCredentialView', { privateCredentialName: 'seed_phrase' });
	};

	goToExportPrivateKey = () => {
		this.props.navigation.navigate('RevealPrivateCredentialView', { privateCredentialName: 'private_key' });
	};

	selectLockTime = (lockTime) => {
		this.props.setLockTime(parseInt(lockTime, 10));
	};

	goToBackup = () => {
		this.props.navigation.navigate('AccountBackupStep1B');
		InteractionManager.runAfterInteractions(() => {
			AnalyticsV2.trackEvent(AnalyticsV2.ANALYTICS_EVENTS.WALLET_SECURITY_STARTED, {
				source: 'Settings',
			});
		});
	};

	resetPassword = () => {
		this.props.navigation.navigate('ResetPassword');
	};

	saveHint = async () => {
		const { hintText } = this.state;
		if (!hintText) return;
		this.toggleHint();
		const currentSeedphraseHints = await AsyncStorage.getItem(SEED_PHRASE_HINTS);
		const parsedHints = JSON.parse(currentSeedphraseHints);
		await AsyncStorage.setItem(SEED_PHRASE_HINTS, JSON.stringify({ ...parsedHints, manualBackup: hintText }));
	};

	toggleHint = () => {
		this.setState((state) => ({ showHint: !state.showHint }));
	};

	handleChangeText = (text) => this.setState({ hintText: text });

	renderHint = () => {
		const { showHint, hintText } = this.state;
		return (
			<HintModal
				onConfirm={this.saveHint}
				onCancel={this.toggleHint}
				modalVisible={showHint}
				onRequestClose={Keyboard.dismiss}
				value={hintText}
				onChangeText={this.handleChangeText}
			/>
		);
	};

	onBack = () => this.props.navigation.goBack();

	renderProtectYourWalletSection = () => {
		const { seedphraseBackedUp } = this.props;
		const { hintText } = this.state;

		return (
			<View style={[styles.setting, styles.firstSetting]}>
				<Text style={[styles.title, styles.bump]}>
					{!seedphraseBackedUp ? (
						<>
							<WarningIcon />{' '}
						</>
					) : null}
					<Text style={[styles.title, styles.bump]}>{strings('app_settings.protect_title')}</Text>
				</Text>

				<SeedPhraseVideo onClose={this.onBack} />

				<Text style={styles.desc}>
					{strings(seedphraseBackedUp ? 'app_settings.protect_desc' : 'app_settings.protect_desc_no_backup')}
				</Text>

				{!seedphraseBackedUp && (
					<TouchableOpacity onPress={() => Linking.openURL(LEARN_MORE_URL)}>
						<Text style={styles.learnMore}>{strings('app_settings.learn_more')}</Text>
					</TouchableOpacity>
				)}

				<SettingsNotification isWarning={!seedphraseBackedUp}>
					<Text
						style={[
							styles.warningText,
							seedphraseBackedUp ? styles.warningTextGreen : styles.warningTextRed,
							styles.marginLeft,
						]}
					>
						{strings(
							seedphraseBackedUp
								? 'app_settings.seedphrase_backed_up'
								: 'app_settings.seedphrase_not_backed_up'
						)}
					</Text>
					{hintText && seedphraseBackedUp ? (
						<TouchableOpacity style={styles.viewHint} onPress={this.toggleHint}>
							<Text style={[styles.warningText, styles.warningBold]}>
								{strings('app_settings.view_hint')}
							</Text>
						</TouchableOpacity>
					) : null}
				</SettingsNotification>

				{!seedphraseBackedUp ? (
					<StyledButton type="blue" onPress={this.goToBackup} containerStyle={styles.confirm}>
						{strings('app_settings.back_up_now')}
					</StyledButton>
				) : (
					<View style={styles.protect}>
						<StyledButton
							type="normal"
							onPress={this.goToRevealPrivateCredential}
							containerStyle={[styles.confirm, styles.col]}
							testID={'reveal-seed-button'}
						>
							{strings('reveal_credential.seed_phrase_title')}
						</StyledButton>
					</View>
				)}
			</View>
		);
	};

	renderPasswordSection = () => (
		<View style={styles.setting} testID={'change-password-section'}>
			<Text style={styles.title}>{strings('password_reset.password_title')}</Text>
			<Text style={styles.desc}>{strings('password_reset.password_desc')}</Text>
			<StyledButton type="normal" onPress={this.resetPassword} containerStyle={styles.confirm}>
				{strings('password_reset.change_password')}
			</StyledButton>
		</View>
	);

	renderAutoLockSection = () => {
		<View style={styles.setting} testID={'auto-lock-section'}>
			<Text style={styles.title}>{strings('app_settings.auto_lock')}</Text>
			<Text style={styles.desc}>{strings('app_settings.auto_lock_desc')}</Text>
			<View style={styles.picker}>
				{this.autolockOptions && (
					<SelectComponent
						selectedValue={this.props.lockTime.toString()}
						onValueChange={this.selectLockTime}
						label={strings('app_settings.auto_lock')}
						options={this.autolockOptions}
					/>
				)}
			</View>
		</View>;
	};

	renderBiometricOptionsSection = () => (
		<View style={styles.setting} testID={'biometrics-option'}>
			<Text style={styles.title}>{strings(`biometrics.enable_${this.state.biometryType.toLowerCase()}`)}</Text>
			<View style={styles.switchElement}>
				<Switch
					onValueChange={this.onSingInWithBiometrics}
					value={this.state.biometryChoice}
					trackColor={isIos ? { true: colors.blue, false: colors.grey000 } : null}
					ios_backgroundColor={colors.grey000}
				/>
			</View>
		</View>
	);

	renderDevicePasscodeSection = () => (
		<View style={styles.setting}>
			<Text style={styles.title}>
				{isIos
					? strings(`biometrics.enable_device_passcode_ios`)
					: strings(`biometrics.enable_device_passcode_android`)}
			</Text>
			<View style={styles.switchElement}>
				<Switch
					onValueChange={this.onSignInWithPasscode}
					value={this.state.passcodeChoice}
					trackColor={isIos ? { true: colors.blue, false: colors.grey000 } : null}
					ios_backgroundColor={colors.grey000}
				/>
			</View>
		</View>
	);

	renderPrivateKeySection = () => {
		const { accounts, identities, selectedAddress } = this.props;
		const account = { address: selectedAddress, ...identities[selectedAddress], ...accounts[selectedAddress] };

		return (
			<View style={styles.setting} testID={'reveal-private-key-section'}>
				<Text style={styles.title}>
					{strings('reveal_credential.private_key_title_for_account', {
						accountName: account.name,
					})}
				</Text>
				<Text style={styles.desc}>
					{strings('reveal_credential.private_key_warning', { accountName: account.name })}
				</Text>
				<StyledButton type="normal" onPress={this.goToExportPrivateKey} containerStyle={styles.confirm}>
					{strings('reveal_credential.show_private_key')}
				</StyledButton>
			</View>
		);
	};

	renderClearPrivacySection = () => {
		const { approvedHosts } = this.props;

		return (
			<View style={[styles.setting, styles.firstSetting]} testID={'clear-privacy-section'}>
				<Text style={styles.title}>{strings('app_settings.clear_privacy_title')}</Text>
				<Text style={styles.desc}>{strings('app_settings.clear_privacy_desc')}</Text>
				<StyledButton
					type="normal"
					onPress={this.toggleClearApprovalsModal}
					disabled={Object.keys(approvedHosts).length === 0}
					containerStyle={styles.confirm}
				>
					{strings('app_settings.clear_privacy_title')}
				</StyledButton>
			</View>
		);
	};

	renderClearBrowserHistorySection = () => {
		const { browserHistory } = this.props;

		return (
			<View style={styles.setting}>
				<Text style={styles.title}>{strings('app_settings.clear_browser_history_desc')}</Text>
				<Text style={styles.desc}>{strings('app_settings.clear_history_desc')}</Text>
				<StyledButton
					type="normal"
					onPress={this.toggleClearBrowserHistoryModal}
					disabled={browserHistory.length === 0}
					containerStyle={styles.confirm}
				>
					{strings('app_settings.clear_browser_history_desc')}
				</StyledButton>
			</View>
		);
	};

	renderClearCookiesSection = () => (
		<View style={styles.setting} testID={'clear-cookies-section'}>
			<Text style={styles.title}>{strings('app_settings.clear_browser_cookies_desc')}</Text>
			<Text style={styles.desc}>{strings('app_settings.clear_cookies_desc')}</Text>
			<StyledButton type="normal" onPress={this.toggleClearCookiesModal} containerStyle={styles.confirm}>
				{strings('app_settings.clear_browser_cookies_desc')}
			</StyledButton>
		</View>
	);

	renderPrivacyModeSection = () => {
		const { privacyMode } = this.props;

		return (
			<View style={styles.setting} testID={'privacy-mode-section'}>
				<Text style={styles.title}>{strings('app_settings.privacy_mode')}</Text>
				<Text style={styles.desc}>{strings('app_settings.privacy_mode_desc')}</Text>
				<View style={styles.switchElement}>
					<Switch
						value={privacyMode}
						onValueChange={this.togglePrivacy}
						trackColor={Device.isIos() ? { true: colors.blue, false: colors.grey000 } : null}
						ios_backgroundColor={colors.grey000}
					/>
				</View>
			</View>
		);
	};

	renderMetaMetricsSection = () => {
		const { analyticsEnabled } = this.state;

		return (
			<View style={styles.setting} testID={'metametrics-section'}>
				<Text style={styles.title}>{strings('app_settings.metametrics_title')}</Text>
				<Text style={styles.desc}>{strings('app_settings.metametrics_description')}</Text>
				<View style={styles.switchElement}>
					<Switch
						value={analyticsEnabled}
						onValueChange={this.toggleMetricsOptIn}
						trackColor={Device.isIos() ? { true: colors.blue, false: colors.grey000 } : null}
						ios_backgroundColor={colors.grey000}
						testID={'metametrics-switch'}
					/>
				</View>
			</View>
		);
	};

	renderThirdPartySection = () => {
		const { thirdPartyApiMode } = this.props;

		return (
			<View style={styles.setting} testID={'third-party-section'}>
				<Text style={styles.title}>{strings('app_settings.third_party_title')}</Text>
				<Text style={styles.desc}>{strings('app_settings.third_party_description')}</Text>
				<View style={styles.switchElement}>
					<Switch
						value={thirdPartyApiMode}
						onValueChange={this.toggleThirdPartyAPI}
						trackColor={Device.isIos() ? { true: colors.blue, false: colors.grey000 } : null}
						ios_backgroundColor={colors.grey000}
					/>
				</View>
			</View>
		);
	};

	renderApprovalModal = () => {
		const { approvalModalVisible } = this.state;

		return (
			<ActionModal
				modalVisible={approvalModalVisible}
				confirmText={strings('app_settings.clear')}
				cancelText={strings('app_settings.reset_account_cancel_button')}
				onCancelPress={this.toggleClearApprovalsModal}
				onRequestClose={this.toggleClearApprovalsModal}
				onConfirmPress={this.clearApprovals}
			>
				<View style={styles.modalView}>
					<Text style={styles.modalTitle}>{strings('app_settings.clear_approvals_modal_title')}</Text>
					<Text style={styles.modalText}>{strings('app_settings.clear_approvals_modal_message')}</Text>
				</View>
			</ActionModal>
		);
	};

	renderHistoryModal = () => {
		const { browserHistoryModalVisible } = this.state;

		return (
			<ActionModal
				modalVisible={browserHistoryModalVisible}
				confirmText={strings('app_settings.clear')}
				cancelText={strings('app_settings.reset_account_cancel_button')}
				onCancelPress={this.toggleClearBrowserHistoryModal}
				onRequestClose={this.toggleClearBrowserHistoryModal}
				onConfirmPress={this.clearBrowserHistory}
			>
				<View style={styles.modalView}>
					<Text style={styles.modalTitle}>{strings('app_settings.clear_browser_history_modal_title')}</Text>
					<Text style={styles.modalText}>{strings('app_settings.clear_browser_history_modal_message')}</Text>
				</View>
			</ActionModal>
		);
	};

	renderCookiesModal = () => {
		const { cookiesModalVisible } = this.state;

		return (
			<ActionModal
				modalVisible={cookiesModalVisible}
				confirmText={strings('app_settings.clear')}
				cancelText={strings('app_settings.reset_account_cancel_button')}
				onCancelPress={this.toggleClearCookiesModal}
				onRequestClose={this.toggleClearCookiesModal}
				onConfirmPress={this.clearCookies}
			>
				<View style={styles.modalView}>
					<Text style={styles.modalTitle}>{strings('app_settings.clear_cookies_modal_title')}</Text>
					<Text style={styles.modalText}>{strings('app_settings.clear_cookies_modal_message')}</Text>
				</View>
			</ActionModal>
		);
	};

	renderOpenSeaSettings = () => {
		const { openSeaEnabled, useCollectibleDetection } = this.props;

		return (
			<>
				<View style={styles.setting} testID={'nft-opensea-mode-section'}>
					<Text style={styles.title}>{strings('app_settings.nft_opensea_mode')}</Text>
					<Text style={styles.desc}>{strings('app_settings.nft_opensea_desc')}</Text>
					<View style={styles.switchElement}>
						<Switch
							value={openSeaEnabled}
							onValueChange={this.toggleOpenSeaApi}
							trackColor={Device.isIos() ? { true: colors.blue, false: colors.grey000 } : null}
							ios_backgroundColor={colors.grey000}
						/>
					</View>
				</View>
				<View style={styles.setting} testID={'nft-opensea-autodetect-mode-section'}>
					<Text style={styles.title}>{strings('app_settings.nft_autodetect_mode')}</Text>
					<Text style={styles.desc}>{strings('app_settings.nft_autodetect_desc')}</Text>
					<View style={styles.switchElement}>
						<Switch
							value={useCollectibleDetection}
							onValueChange={this.toggleNftAutodetect}
							trackColor={Device.isIos() ? { true: colors.blue, false: colors.grey000 } : null}
							ios_backgroundColor={colors.grey000}
							disabled={!openSeaEnabled}
						/>
					</View>
				</View>
			</>
		);
	};

	render = () => {
		const { biometryType, biometryChoice, loading } = this.state;

		if (loading)
			return (
				<View style={styles.loader}>
					<ActivityIndicator size="large" />
				</View>
			);

		return (
			<ScrollView
				style={styles.wrapper}
				testID={'security-settings-scrollview'}
				ref={(view) => {
					this.scrollView = view;
				}}
			>
				<View style={styles.inner}>
					<Heading first>{strings('app_settings.security_heading')}</Heading>
					{this.renderProtectYourWalletSection()}
					{this.renderPasswordSection()}
					{this.renderAutoLockSection()}
					{biometryType && this.renderBiometricOptionsSection()}
					{biometryType && !biometryChoice && this.renderDevicePasscodeSection()}
					{this.renderPrivateKeySection()}
					<Heading>{strings('app_settings.privacy_heading')}</Heading>
					{this.renderClearPrivacySection()}
					{this.renderClearBrowserHistorySection()}
					{this.renderClearCookiesSection()}
					{this.renderPrivacyModeSection()}
					{this.renderMetaMetricsSection()}
					{this.renderThirdPartySection()}
					{this.renderApprovalModal()}
					{this.renderHistoryModal()}
					{this.renderCookiesModal()}
					{this.isMainnet() && this.renderOpenSeaSettings()}
					{this.renderHint()}
				</View>
			</ScrollView>
		);
	};
}

const mapStateToProps = (state) => ({
	approvedHosts: state.privacy.approvedHosts,
	browserHistory: state.browser.history,
	lockTime: state.settings.lockTime,
	privacyMode: state.privacy.privacyMode,
	thirdPartyApiMode: state.privacy.thirdPartyApiMode,
	selectedAddress: state.engine.backgroundState.PreferencesController.selectedAddress,
	accounts: state.engine.backgroundState.AccountTrackerController.accounts,
	identities: state.engine.backgroundState.PreferencesController.identities,
	keyrings: state.engine.backgroundState.KeyringController.keyrings,
	openSeaEnabled: state.engine.backgroundState.PreferencesController.openSeaEnabled,
	useCollectibleDetection: state.engine.backgroundState.PreferencesController.useCollectibleDetection,
	passwordHasBeenSet: state.user.passwordSet,
	seedphraseBackedUp: state.user.seedphraseBackedUp,
	type: state.engine.backgroundState.NetworkController.provider.type,
});

const mapDispatchToProps = (dispatch) => ({
	clearBrowserHistory: () => dispatch(clearHistory()),
	clearHosts: () => dispatch(clearHosts()),
	setLockTime: (lockTime) => dispatch(setLockTime(lockTime)),
	setPrivacyMode: (enabled) => dispatch(setPrivacyMode(enabled)),
	setThirdPartyApiMode: (enabled) => dispatch(setThirdPartyApiMode(enabled)),
	passwordSet: () => dispatch(passwordSet()),
});

export default connect(mapStateToProps, mapDispatchToProps)(Settings);
