import {
  Router
} from 'express';
import SettingController from '../controllers/SettingController';
import signUpVerification from '../middlewares/signUpVerification';
import settingValidator from '../middlewares/settingValidator';
import verifyNumber from '../middlewares/verifyNumber';
import auth from '../middlewares/authentication';
import handleToken from '../middlewares/compareToken';

const {
  phoneNumberVerification
} = signUpVerification;
const {
  bankDataValidator
} = settingValidator;
const {
  numberChecker
} = verifyNumber;
const {
  addBankData,
  removeBankData,
  removeCardDetails
} = SettingController;
const {
  compareToken
} = handleToken;
const router = Router();
router.use(auth, compareToken);
router.put(
  '/addbank',
  numberChecker,
  phoneNumberVerification,
  bankDataValidator,
  addBankData
);
router.put(
  '/removebank',
  numberChecker,
  phoneNumberVerification,
  removeBankData
);
router.delete('/removeCards', removeCardDetails);
export default router;
