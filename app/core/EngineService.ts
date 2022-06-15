import UntypedEngine from './Engine';
import { getVaultFromBackup } from '../core/backupVault';

const UPDATE_BG_STATE_KEY = 'UPDATE_BG_STATE';
const INIT_BG_STATE_KEY = 'INIT_BG_STATE';

class EngineService {
  private engineInitialized = false;

  /**
   * Initializer for the EngineService
   *
   * @param store - Redux store
   */

  initalizeEngine = (store: any) => {
    const reduxState = store.getState?.();
    const state = reduxState?.engine?.backgroundState || {};
    const Engine = UntypedEngine as any;

    Engine.init(state);
    this.updateControllers(store, Engine);
  };

  private updateControllers = (store: any, engine: any) => {
    const controllers = [
      { name: 'AccountTrackerController' },
      { name: 'AddressBookController' },
      { name: 'AssetsContractController' },
      { name: 'CollectiblesController' },
      { name: 'TokensController' },
      { name: 'TokenDetectionController' },
      { name: 'CollectibleDetectionController' },
      { name: 'KeyringController' },
      { name: 'AccountTrackerController' },
      { name: 'NetworkController' },
      { name: 'PhishingController' },
      { name: 'PreferencesController' },
      { name: 'TokenBalancesController' },
      { name: 'TokenRatesController' },
      { name: 'TransactionController' },
      { name: 'TypedMessageManager' },
      { name: 'SwapsController' },
      {
        name: 'TokenListController',
        key: `${engine.context.TokenListController.name}:stateChange`,
      },
      {
        name: 'CurrencyRateController',
        key: `${engine.context.CurrencyRateController.name}:stateChange`,
      },
      {
        name: 'GasFeeController',
        key: `${engine.context.GasFeeController.name}:stateChange`,
      },
      {
        name: 'ApprovalController',
        key: `${engine.context.ApprovalController.name}:stateChange`,
      },
    ];

    engine?.datamodel?.subscribe?.(() => {
      if (!this.engineInitialized) {
        store.dispatch({ type: INIT_BG_STATE_KEY });
        this.engineInitialized = true;
      }
    });

    controllers.forEach((controller) => {
      const { name, key = undefined } = controller;
      const update_bg_state_cb = () =>
        store.dispatch({ type: UPDATE_BG_STATE_KEY, key: name });
      if (!key) engine.context[name].subscribe(update_bg_state_cb);
      else engine.controllerMessenger.subscribe(key, update_bg_state_cb);
    });
  };

  /**
   * Initializer for the EngineService
   *
   * @param store - Redux store
   */
  async initalizeVaultFromBackup(store: any) {
    console.log('EngineService initalizeVaultFromBackup');
    // const vaultFromBackup = await getVaultFromBackup();
    // console.log('EngineService vault from backup', vaultFromBackup);
    const reduxState = store.getState?.();
    const state = reduxState?.engine?.backgroundState || {};
    const vault =
      state?.KeyringController !== undefined
        ? state.KeyringController
        : undefined;
    console.log('EngineService', state, vault);
    const Engine = UntypedEngine as any;
    Engine.init(state, undefined);

    this.updateControllers(store, Engine);
  }
}

/**
 * EngineService class used for initializing and subscribing to the engine controllers
 */
export default new EngineService();
