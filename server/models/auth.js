const bcrypt = require("bcryptjs");
const { Schema, model } = require("mongoose");

const authSchema = new Schema(
  {
    name: { type: String, trim: true, required: true },
    userName: {
      type: String,
      trim: true,
      unique: true,
      minlength: [5, "Username must be of minimum 6 characters"],
      maxlength: [20, "Username must be of maximum 20 characters"],
    },
    password: { type: String, required: true },
    email: {
      type: String,
      unique: true,
      trim: true,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["LAWYER", "PROFESSIONAL", "JUDGE", "PUBLIC"],
      default: "PUBLIC",
    },
    active: { type: Boolean, default: true },
    refreshToken: [String],
  },
  { versionKey: false, timestamps: true }
);

// hash password before saving
authSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(this.password, salt);
    this.password = hashed;
  }
  next();
});

// compare password
authSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = model("auth", authSchema);
