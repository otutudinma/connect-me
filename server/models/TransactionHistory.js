import mongoose from 'mongoose';

const {
  Schema
} = mongoose;

const transactionHistorySchema = new Schema({
  phoneNumber: {
    type: Number,
    required: true
  },
  beneficiary: {
    type: String,
  },
  senderName: {
    type: String
  },
  recipientNumber: {
    type: Number
  },
  senderNumber: {
    type: Number
  },
  status: {
    type: String,
    required: true
  },
  amount: {
    type: Number
  },
  transactionType: {
    type: String,
    enum: ['funding', 'withdrawal', 'transfer', 'credit']
  },
  description: {
    type: String
  },
  merchantReference: {
    type: Array
  },
  date: {
    type: Date,
    default: new Date().toString()
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const TransactionHistory = mongoose.model('transactionHistory', transactionHistorySchema);

export default TransactionHistory;
