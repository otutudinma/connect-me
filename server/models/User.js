import mongoose from 'mongoose';

const {
  Schema
} = mongoose;
const userSchema = new Schema({
  username: {
    type: String,
    sparse: true,
    unique: true
  },
  phoneNumber: {
    type: Number,
    unique: true,
    required: true
  },
  slingPhoneNumber_id: {
    type: Number,
  },
  imageUrl: {
    type: Object
  },
  bio: {
    type: String,
  },
  role: {
    type: String, default: 'user', enum: ['admin', 'user']
  },
  email: {
    type: String
  },
  verified: {
    type: String,
    default: 'false',
    enum: ['false', 'true', 'pending']
  },
  token: {
    type: String,
  },
  resetCode: {
    type: Boolean,
    default: false
  },
  friends: {
    type: Array
  },
  banks: {
    type: Array,
    default: []
  },
  date: {
    type: Date,
    default: new Date().toString()
  },
  firebaseDeviceToken: {
    type: String
  },
  jwtToken: {
    type: String,
    sparse: true,
    unique: true
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

userSchema.methods.toJSON = function () {
  var response = this.toObject();
  delete response.jwtToken;
  return response;
};
const User = mongoose.model('user', userSchema);
export default User;
