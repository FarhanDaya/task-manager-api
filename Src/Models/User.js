const mongoose = require("mongoose");
const validator = require("validator");
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./Task");

const Userschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(val) {
        if (!validator.isEmail(val)) {
          throw new error("Email is in valid");
        }
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
      trim: true,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new error("pawword is invalid");
        }
      }
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be greater than 0");
        }
      }
    },
    profile: {
      type: Buffer
    },
    tokens: [
      {
        token: {
          type: String,
          required: true
        }
      }
    ]
  },
  {
    timestamps: true
  }
);
// for relation between Task
Userschema.virtual("tasks", {
  ref: "Tasks",
  localField: "_id",
  foreignField: "owner"
});

Userschema.methods.toJSON = function() {
  const user = this;
  const userobj = user.toObject();
  delete userobj.tokens;
  delete userobj.password;
  delete userobj.profile;
  return userobj;
};

Userschema.methods.generatejwt = async function() {
  const user = this;
  const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1 days"
  });
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

Userschema.statics.findbycredentials = async (email, password) => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new error("Unable to login");
  }
  const match = await bcryptjs.compare(password, user.password);

  if (!match) {
    throw new error("Unable to login");
  }
  return user;
};

//hash password before saving
Userschema.pre("save", async function(next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcryptjs.hash(user.password, 8);
  }
  next();
});

//delete users task when user is deleted
Userschema.pre("remove", async function(next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", Userschema);

module.exports = User;
