mport {
    Router
  } from 'express';
  import walletValidator from '../middlewares/walletValidator';
  import WalletController from '../controllers/WalletController';
  import SettingsController from '../controllers/SettingController';
  import TransactionController from '../controllers/TransactionController';
  import moneyValidation from '../middlewares/moneyValidation';
  import connectionValidator from '../middlewares/connectionValidator';
  import transactionValidator from '../middlewares/transactionValidator';
  import auth from '../middlewares/authentication';
  import handleToken from '../middlewares/compareToken';

  const {
    phoneNumberVerification
  } = connectionValidator;
  const {
    transactionVerification
  } = transactionValidator;
  const {
    walletActivator,
    codeRestValidator,
    codeRecoveryValidator,
    verifyPhone,
    transferVerification,
    codeVerificationValidator
  } = walletValidator;
  const {
    amountChecker
  } = moneyValidation;
  
  const { compareToken } = handleToken;

  const router = Router();
// destructure from wallet controller
const {
  activateWallet,
  sendMoney,
  walletCodeReset,
  walletCodeRecovery,
} = WalletController;