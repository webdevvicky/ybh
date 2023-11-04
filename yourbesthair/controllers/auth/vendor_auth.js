const Vendors = require("../../models/vendors");
const VendorSettings = require("../../models/vendor_Settings");
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
// const Admins = require('../../models/admin');
const Users = require("../../models/users");
const { generateAPIReponse } = require("../../utils/response");
const { getAuthToken } = require("./customer_auth");
const { getSecureRandomToken, getSecureRandomOtp } = require("../../utils/functions");
const { sendGridMail, sendGridMail_vendor } = require("../email");

let status = 0;
//for vendor_status update
var vendor_status = 0;
VendorSettings.find().then((vendorsettings) => {
  let approval = vendorsettings && vendorsettings.length && vendorsettings[0] && vendorsettings[0].approvals_auto_approve_vendors ? vendorsettings[0].approvals_auto_approve_vendors: 0
  vendor_status = JSON.stringify(approval);
});

module.exports = {
  async vendorSignup(req, res) {
    if (vendor_status == 1) {
      const params = req.body;
      try {
        const isEmailExist = await Vendors.exists({ email: params.email });
        if (isEmailExist) {
        	return res.status(400).send({message:"The email you entered is already exist, Please try with another one.", status:400});
		}
        params.email_verification_token = await getSecureRandomToken(20);
        params['otp'] = getSecureRandomOtp();
        params.approval_status = "1";
        params.active_status = "1";
        const vendor = await createVendor(params);
        // console.log(vendor);
        await sendGridMail_vendor(vendor, res);
        return res.status(200).send(generateAPIReponse(0,"Vendor signed up successfully", vendor, 200));
        vendor_status = 0;
      } catch (error) {
        console.error("vendorSignup error =>", error.message);
        return res.status(error.resCode).send(generateAPIReponse(error.message));
      }
    } else {
      const params = req.body;
      try {
        const isEmailExist = await Vendors.exists({ email: params.email });
        if (isEmailExist) {
        	return res.status(400).send({message:"The email you entered is already exist, Please try with another one.", status:400});
		}
        params.email_verification_token = await getSecureRandomToken(20);
        params['otp'] = getSecureRandomOtp();
        params.approval_status = "2";
        params.active_status = "0";
        const vendor = await createVendor(params);
        await sendGridMail_vendor(vendor);
        return res.status(200).send(generateAPIReponse(0,"Vendor signed up successfully", vendor, 200));
        vendor_status = 0;
      } catch (error) {
        console.error("vendorSignup error =>", error.message);
        return res.status(error.resCode).send(generateAPIReponse(error.message));
      }
    }
  },

  async vendorSignin(req, res) {
    const { email, password } = req.body;
    const vendor = await Vendors.findOne({ email });
    if (vendor) {
      const isPasswordValid = await vendor.isValidPassword(password);
      if (!isPasswordValid) {
        return res.status(401).send(generateAPIReponse(1,"The password you entered is incorrect. Please try again or click on forgot password to retrieve."));
      }
      if (vendor.active_status !== "1") {
        return res.status(400).send({ message: "Sorry..! Your Profile is not activate yet", status: 400 });
      }
      if (vendor.is_email_verified !== true) {
        let otp = getSecureRandomOtp();
        vendor['otp'] = otp
        await Vendors.findOneAndUpdate({ email }, { $set: { otp } }).exec();
        return res.status(400).send({ is_email_verified: false, vendorId: vendor._id, message: "You were Already signed up but Your email is not verified, Please check your mail box to verify your Email", status: 400 });
      }
      const token = getAuthToken({ id: vendor._id, role: "vendor" });
      const vendor_details = await Vendors.findOne({ email }).select({ salon_name: 1, first_name: 1, last_name: 1, email: 1, is_profile_completed: 1  })
        .then((vendors) => {
          return res.status(200).send(generateAPIReponse(0,"Logged in Successfully", { token: token, vendors: vendors }, 200));
        })
    } else {
      return res.status(400).send({ message: "The email address you entered is invalid. Please try again or sign up below.", status: 400 });
    }
  },

  async resendOtp(req, res) {
    const { email } = req.body;
    const vendor = await Vendors.findOne({ email });
    if (!vendor) {
      return res.status(400).send({ message: "The email address you entered is invalid. Please try again or sign up below.", status: 400 });
    } else {
      let otp = getSecureRandomOtp();
      vendor['otp'] = otp
      await Vendors.findOneAndUpdate({ email }, { $set: { otp } }).exec();
      await sendGridMail_vendor(vendor);
      return res.status(200).send({ message: "Email Send Successfully, Please check your mail box to verify your mail", status: 200 });
    }
  },

  async sendProfileCompleteStatus(req, res) {
    try {
      console.log('sendProfileCompleteStatus id=>', req.user.id);
      let id = req.user.id;
      if (id) {
        const vendor_details = await Vendors.findOne({ _id: id }, { salon_name: 1, first_name: 1, last_name: 1, email: 1, is_profile_completed: 1, logo: 1 }).lean().exec();
        return res.status(200).send(generateAPIReponse(0,'Vendor Profile details retrieved successfully', vendor_details));
      } else {
        return res.status(401).send(generateAPIReponse(1,'Please login to get access!'));
      }
    } catch (err) {
      return res.status(500).send(generateAPIReponse(1,'Something went worng!'));
    }
  },

  async adminSignin(req, res) {
    const { email, password } = req.body;
    const admin = await Users.findOne({ email }).populate("role");
    if (admin) {
      const isPasswordValid = await admin.isValidPassword(password);

      //console.log(isPasswordValid);
      if (!isPasswordValid)
        return res
          .status(401)
          .send(
            generateAPIReponse(
              "The password you entered is incorrect. Please try again or click on forgot password to retrieve."
            )
          );
      const token = getAuthToken({ id: admin._id, role: admin.role.role_name });
      const user = await Users.findOne({ email })
        .select({
          user_name: 1,
          first_name: 1,
          last_name: 1,
          email: 1,
          role: 1,
        })
        .then((users) => {
          res
            .status(200)
            .send(
              generateAPIReponse("Logged in Successfully", {
                token: token,
                users: users,
                menu_access: admin.role.menu_access,
              })
            );
        });
    } else {
      return res
        .status(401)
        .send(generateAPIReponse("You are not authorised to login"));
    }
  },

  async verifyVendorEmail(req, res) {
    const { vendorId, otp } = req.body;
    if (!otp) {
      return res.status(400).send(generateAPIReponse(1,"Otp required!"));
    }
    if (!vendorId && ObjectId.isValid(vendorId)) {
      return res.status(400).send(generateAPIReponse(1,"Vendor id required!"));
    }
    console.log("verifyVendorEmail params =>", vendorId, otp);
    const vendor = await Vendors.findOne({ _id: vendorId }).lean().exec();
    if (vendor && vendor._id) {
      if (vendor.otp != otp) {
        return res.status(400).send(generateAPIReponse(1,"Invalid otp!"));
      }
      Vendors.findOneAndUpdate({ _id: vendorId, otp },
        {
          is_email_verified: true,
          email_verification_token: null,
          otp: null
        }
      ).then((vendor) => {
          if (vendor) {
            return res
              .status(200)
              .send(
                generateAPIReponse("Your email has been verified successfully")
              );
          } else {
            return res
              .status(401)
              .send(
                generateAPIReponse(
                  "Email Token not found, You might be verified already"
                )
              );
          }
        })
        .catch((error) => {
          console.log("verifyVendorEmail error =>", error.messge);
          return res.status(500).send(generateAPIReponse(1,error.message));
        });
    } else {
      return res.status(400).send(generateAPIReponse(1,"No vendor found!"));
    }

  },
};

function createVendor(params) {
  return new Promise(async (resolve, reject) => {
    const newVendor = new Vendors(params);
    if (params.full_name) {
      const name = params.full_name.split(" ");
      newVendor.first_name = name[0];
      newVendor.last_name = name[1];
    }
    newVendor.save().then(async (vendor) => {
        resolve(vendor);
      })
      .catch((err) => {
        // if (err.code == 11000 && err.keyPattern.email)
        // 	reject({ resCode: 409, message: 'The email you entered is already exist, Please try with another one.' });
        //else
        reject({ resCode: 500, message: err.message });
      });
  });
}
