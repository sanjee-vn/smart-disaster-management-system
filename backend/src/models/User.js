const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const USER_ROLES = ['dmc_officer', 'duty_officer', 'district_officer']

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 254 },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, required: true, enum: USER_ROLES },
  district: { type: String, trim: true, maxlength: 100, default: '' },
}, {
  timestamps: true,
  toJSON: { transform: (_doc, result) => { delete result.password; delete result.__v; return result } },
})

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

module.exports = mongoose.models.User || mongoose.model('User', userSchema)
module.exports.USER_ROLES = USER_ROLES
