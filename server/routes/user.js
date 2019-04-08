import {
  Router
} from 'express';
import UsersController from '../controllers/UsersController';
import signUpVerification from '../middlewares/signUpVerification';
import verifyNumber from '../middlewares/verifyNumber';
import uploadUserImage from '../middlewares/uploadImage';
import settingValidator from '../middlewares/settingValidator';
import auth from '../middlewares/authentication';
import handleToken from '../middlewares/compareToken';
import FirebaseController from '../controllers/FirebaseController';


const {
  phoneNumberVerification
} = signUpVerification;
const {
  profileUpdateValidator
} = settingValidator;
const {
  numberChecker
} = verifyNumber;
// destructure handletoken
const {
  compareToken
} = handleToken;
const router = Router();
// destructure users controller
const {
  newUser,
  verifyUser,
  updateUserProfile,
  resendToken,
  getUser,
  getAnyUser,
  saveFirebaseToken,
  changeNumber
} = UsersController;

const {
  firebaseNotification
} = FirebaseController;

// user endpoints
router.post('/', numberChecker, phoneNumberVerification, newUser);
router.put('/', numberChecker, phoneNumberVerification, verifyUser);
router.get(
  '/:phoneNumber/resendToken',
  numberChecker,
  phoneNumberVerification,
  resendToken
);
router.post('/images', uploadUserImage);
router.post('/notifications', firebaseNotification);

router.use(auth, compareToken);
router.put(
  '/profile',
  numberChecker,
  phoneNumberVerification,
  profileUpdateValidator,
  updateUserProfile
);
router.get(
  '/',
  getUser
);

router.patch(
  '/firebaseToken',
  saveFirebaseToken
);

router.patch(
  '/changenumber',
  numberChecker,
  changeNumber
);

router.get(
  '/:phoneNumber',
  numberChecker,
  getAnyUser
);
export default router;
