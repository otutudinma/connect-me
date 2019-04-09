import {
  Router
} from 'express';
import ConnectionController from '../controllers/ConnectionController';
import connectionVerification from '../middlewares/connectionValidator';
import auth from '../middlewares/authentication';
import handleToken from '../middlewares/compareToken';

const {
  phoneNumberVerification,
  connectionRemovalValidator
} = connectionVerification;
const router = Router();
// destructure connections controller
const {
  addConnections,
  getAllConnections,
  deleteConnections
} = ConnectionController;

// destructure handletoken
const { compareToken } = handleToken;

router.use(auth, compareToken);
// connections endpoints
router.post(
  '/',
  phoneNumberVerification,
  addConnections
);
router.get(
  '/',
  getAllConnections
);
router.put(
  '/removefriend',
  connectionRemovalValidator,
  deleteConnections
);
export default router;
