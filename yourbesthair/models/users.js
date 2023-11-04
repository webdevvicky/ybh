const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const phoneNumberSchema = require("./phone_number");
const fileSchema = require("./file");
const AutoIncrement = require("mongoose-sequence")(mongoose);

const userSchema = new mongoose.Schema(
  {
    user_id: {
      type: Number,
      autoIncrement: true,
      primaryKey: true,
    },
    user_uuid: {
      type: String,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user_roles",
    },
    user_name: String,
    first_name: String,
    last_name: String,
    profile_img: fileSchema,
    email: {
      type: String,
      unique: true,
    },
    password: String,
    phone_number: phoneNumberSchema,
    active_status: {
      type: String,
      enum: ['0', '1', '2', '3'], //3 is for deleted status
      default: '1',
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

userSchema.pre("save", async function (next) {
  if (this.password) {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
  }
});

userSchema.post("save", async function (doc) {
  doc.user_uuid = "USER0000" + doc.user_id;
  await doc.model("users").findOneAndUpdate({ _id: doc._id }, doc);
});

userSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.password !== "") {
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(update.password, salt, (err, hash) => {
        this.getUpdate().password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

userSchema.methods.isValidPassword = async function (password) {
 // console.log(password);
  if (this.password) {
    const compare = await bcrypt.compare(password, this.password);
    return compare;
  } else {
    return false;
  }
};

userSchema.plugin(AutoIncrement, { inc_field: "user_id" });
userSchema.methods.testMethod = function () {};
module.exports = mongoose.model("users", userSchema);
