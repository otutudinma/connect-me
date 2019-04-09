import mongoose from 'mongoose';

const {
  Schema
} = mongoose;

const walletSchema = new Schema({
  phoneNumber: {
    type: Number,
    unique: true,
    required: true
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  email: {
    type: String
  },
  passCode: {
    type: String
  },
  totalAmount: {
    type: Number,
    default: 0.00
  },
  
  isLocked: {
    type: Boolean,
    default: false
  },
  securityQuestion: {
    type: String,
  },
  securityAnswer: {
    type: String
  },
  transactionReference: {
    type: Array
  },
  merchantReference: {
    type: Array
  },
  cardTokens: [{
    embedToken: String,
    last4digits: String,
    cardType: String
  }]
});

const Wallet = mongoose.model('wallet', walletSchema);

export default Wallet;
