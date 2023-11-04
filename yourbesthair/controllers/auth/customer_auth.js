const Customers = require('../../models/customers');
const GeneralSettings = require('../../models/general_settings');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../../config/auth');
const { generateAPIReponse } = require('../../utils/response');
const { OAuth2Client } = require('google-auth-library');
const { googleAuth, customerUI } = require('../../config/auth');
const client = new OAuth2Client(googleAuth.clientId);
const axios = require('axios');
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const {
	sendEmailVerificationMail,
	sendWelcomeMail,
	sendGridMail,
	sendforgotPasswordMail,
	sendGridMail_customer
} = require('../email');
const { getSecureRandomToken, getSecureRandomOtp } = require('../../utils/functions');
const bcrypt = require('bcrypt');
const { createCustomerDBCall } = require('../customer/customers');

//for general setting service
var service = '{}';
GeneralSettings.find().then((generalSettings)=>{
	let _ser = generalSettings && generalSettings.length && generalSettings[0] && generalSettings[0].email_settings ? generalSettings[0].email_settings : {}
	service = JSON.stringify(_ser);
});

let k = 0;

module.exports = {
	async signup(req, res) {
			const params = req.body;
			try {
				params.email_verification_token = await getSecureRandomToken(20);
				params['otp'] = getSecureRandomOtp();
				params.auth_provider = 'local';
				const customer = await createCustomerDBCall(params);
				await sendGridMail_customer(customer, res);
				const token = module.exports.getAuthToken({ id: customer._id });
				return res.status(200).send({error:0,message:'You have signed up successfully, please enter otp to complete the process.', data:{ token: token, user: getAuthUserResponse(customer) }});
			} catch (error) {
				console.log('signup error =>', error);
				if (error.resCode)
					return res.status(error.resCode).send({error:1,message:error.message});
				else
					return res.status(500).send({error:1,message:error.message});
			}
	},

	async customerSignIn(req, res) {
		console.log("Signin",req.body)
		const { email, password } = req.body;
		const customer = await Customers.findOne({ email })
		if (!customer || customer.active_status == "3" || customer.active_status == "0" || customer.approval_status == "0" || customer.approval_status == "3")
			return res.status(404).send(generateAPIReponse(1,'The email address you entered is invalid. Please try again or sign up below.'));
		const isPasswordValid = await customer.isValidPassword(password);
		if (!isPasswordValid)
			return res.status(401).send(generateAPIReponse(1,'The password you entered is incorrect. Please try again or click on forgot password to retrieve.'));
		if (customer.is_email_verified !== true) {
			let otp = getSecureRandomOtp();
			customer['otp'] = otp
			await Customers.findOneAndUpdate({ email }, { $set: { otp }}).exec();
			await sendGridMail_customer(customer, res);
			return res.status(400).send({ error:1,is_email_verified: false, customerId: customer._id, message:"You were Already signed up but Your email is not verified yet, Please check your mail box and enter otp to verify Email", status:400 });
		}
		const token = module.exports.getAuthToken({ id: customer._id });		
		return res.status(200).send(generateAPIReponse(0,'Logged in Successfully', { token: token, user: getAuthUserResponse(customer) }));

		
	},

	async customerGoogleToken(req, res) {
		const { userId, token } = req.query;
		const customer = await Customers.findOne({ _id: ObjectId(userId), email_verification_token: token }).lean().exec();
		if (!customer || customer.active_status == "3")
			return res.status(404).send(generateAPIReponse(1,'Invalid login, Please try again or sign up below.'));
		const _token = module.exports.getAuthToken({ id: customer._id });
		return res.status(200).send(generateAPIReponse(0,'Logged in Successfully', { token: _token, user: getAuthUserResponse(customer) }));
	},

	async resendCustomerMailApi(req, res) {
		const { email } = req.body;
		const customer = await Customers.findOne({ email });
		  if (!customer){
			  return res.status(201).send({error:0,message:"The email address you entered is invalid. Please try again or sign up below.", status:201});
		} else {
			let otp = getSecureRandomOtp();
			customer['otp'] = otp
			await Customers.findOneAndUpdate({ email }, { $set: { otp }}).exec();
			await sendGridMail_customer(customer);
			return res.status(200).send({error:0,message:"Email Send Successfully, Please check your mail box to verify your mail", status: 200 });
		} 
	  },

	async googleSignIn(req, res) {
		const J_service = JSON.parse(service).length;
		const parse = JSON.parse(service);
		for(i=0;i<J_service;i++)
		{
			if (parse[i].is_enabled == true){
				k = i;
			}
		}
		if (k == 0){
		try {
			const _token = await getSecureRandomToken(20);
			const payload = await verifyGoogleIdToken(req.body.credential);
			let customer = {};
			if (!payload.email) {
				console.log('googleSignIn email is not available');
				customer = await createCustomerDBCall({
					full_name: payload.name,
					auth_provider: 'google',
					email_verification_token: _token,
					is_email_verified: true
				});
			} else {
				console.log('googleSignIn email is available', payload.email);
				customer = await Customers.findOne({ email: payload.email })
				if (!customer) {
					customer = await createCustomerDBCall({
						email: payload.email,
						full_name: payload.name,
						is_email_verified: true,
						auth_provider: 'google',
						email_verification_token: _token
					});
					await sendWelcomeMail(customer);
				} else {
					await Customers.findOneAndUpdate({ _id: customer._id }, { $set: { email_verification_token: _token }}).exec();
				}
			}
			// const token = module.exports.getAuthToken({ id: customer._id });
			// return res.status(200).send(generateAPIReponse(0,'User signed up successfully with google', { token: token, user: getAuthUserResponse(customer) }));
			res.redirect(`${customerUI}?token=${_token}&userId=${customer._id}`);
		} catch (error) {
			if (error.resCode)
				return res.status(error.resCode).send(generateAPIReponse(error.message));
			else
				return res.status(500).send(generateAPIReponse(1,error.message));
		}
	}else if(k == 1){
		try {
			const _token = await getSecureRandomToken(20);
			const payload = await verifyGoogleIdToken(req.body.credential);
			let customer = {};
			if (!payload.email) {
				console.log('googleSignIn email is not available');
				customer = await createCustomerDBCall({
					full_name: payload.name,
					auth_provider: 'google',
					email_verification_token: _token,
					is_email_verified: true
				});
			} else {
				console.log('googleSignIn email is available', payload.email);
				customer = await Customers.findOne({ email: payload.email })
				if (!customer) {
					customer = await createCustomerDBCall({
						email: payload.email,
						full_name: payload.name,
						is_email_verified: true,
						auth_provider: 'google',
						email_verification_token: _token
					});
					await sendWelcomeMail(customer);
				} else {
					await Customers.findOneAndUpdate({ _id: customer._id }, { $set: { email_verification_token: _token }}).exec();
				}
			}
			// const token = module.exports.getAuthToken({ id: customer._id });
			// return res.status(200).send(generateAPIReponse(0,'User signed up successfully with google', { token: token, user: getAuthUserResponse(customer) }));
			res.redirect(`${customerUI}?token=${_token}&userId=${customer._id}`);
		} catch (error) {
			if (error.resCode)
				return res.status(error.resCode).send(generateAPIReponse(error.message));
			else
				return res.status(500).send(generateAPIReponse(1,error.message));
		}
	}else{
		try {
			const _token = await getSecureRandomToken(20);
			const payload = await verifyGoogleIdToken(req.body.credential);
			let customer = {};
			if (!payload.email) {
				console.log('googleSignIn email is not available');
				customer = await createCustomerDBCall({
					full_name: payload.name,
					auth_provider: 'google',
					email_verification_token: _token,
					is_email_verified: true
				});
			} else {
				console.log('googleSignIn email is available', payload.email);
				customer = await Customers.findOne({ email: payload.email })
				if (!customer) {
					customer = await createCustomerDBCall({
						email: payload.email,
						full_name: payload.name,
						is_email_verified: true,
						auth_provider: 'google',
						email_verification_token: _token
					});
					await sendGridMail(customer);
				} else {
					await Customers.findOneAndUpdate({ _id: customer._id }, { $set: { email_verification_token: _token }}).exec();
				}
			}
			// const token = module.exports.getAuthToken({ id: customer._id });
			// return res.status(200).send(generateAPIReponse(0,'User signed up successfully with google', { token: token, user: getAuthUserResponse(customer) }));
			res.redirect(`${customerUI}?token=${_token}&userId=${customer._id}`);
		} catch (error) {
			if (error.resCode)
				return res.status(error.resCode).send(generateAPIReponse(error.message));
			else
				return res.status(500).send(generateAPIReponse(1,error.message));
		}
	}
	},

	async facebookSignIn(req, res) {
		const J_service = JSON.parse(service).length;
		const parse = JSON.parse(service);
		for(i=0;i<J_service;i++)
		{
			if (parse[i].is_enabled == true){
				k = i;
			}
		}
		if (k == 0){
		try {
			const payload = await verifyFacebookAccessToken(req.body.access_token);
			let customer = {};
			if (!payload.email) {
				console.log('facebookSignIn email is not available');
				const token = await getSecureRandomToken(20);
				customer = await createCustomerDBCall({
					full_name: payload.name,
					auth_provider: 'facebook',
					email_verification_token: token,
					is_email_verified: true
				});
			} else {
				console.log('facebookSignIn email is available');
				customer = await Customers.findOne({ email: payload.email }).populate('role');
				if (!customer) {
					customer = await createCustomerDBCall({
						email: payload.email,
						full_name: payload.name,
						is_email_verified: true,
						auth_provider: 'facebook'
					});
					await sendWelcomeMail(customer);
				}
			}
			const token = module.exports.getAuthToken({ id: customer._id });
			return res.status(200).send(generateAPIReponse(0,'User signed up successfully with facebook', { token: token, user: getAuthUserResponse(customer) }));
		} catch (error) {
			if (error.resCode)
				return res.status(error.resCode).send(generateAPIReponse(error.message));
			else
				return res.status(500).send(generateAPIReponse(1,error.message));
		}
	}else if(k == 1){
		try {
			const payload = await verifyFacebookAccessToken(req.body.access_token);
			let customer = {};
			if (!payload.email) {
				console.log('facebookSignIn email is not available');
				const token = await getSecureRandomToken(20);
				customer = await createCustomerDBCall({
					full_name: payload.name,
					auth_provider: 'facebook',
					email_verification_token: token,
					is_email_verified: true
				});
			} else {
				console.log('facebookSignIn email is available');
				customer = await Customers.findOne({ email: payload.email }).populate('role');
				if (!customer) {
					customer = await createCustomerDBCall({
						email: payload.email,
						full_name: payload.name,
						is_email_verified: true,
						auth_provider: 'facebook'
					});
					await sendWelcomeMail(customer);
				}
			}
			const token = module.exports.getAuthToken({ id: customer._id });
			return res.status(200).send(generateAPIReponse(0,'User signed up successfully with facebook', { token: token, user: getAuthUserResponse(customer) }));
		} catch (error) {
			if (error.resCode)
				return res.status(error.resCode).send(generateAPIReponse(error.message));
			else
				return res.status(500).send(generateAPIReponse(1,error.message));
		}
	}else{
		try {
			const payload = await verifyFacebookAccessToken(req.body.access_token);
			let customer = {};
			if (!payload.email) {
				console.log('facebookSignIn email is not available');
				const token = await getSecureRandomToken(20);
				customer = await createCustomerDBCall({
					full_name: payload.name,
					auth_provider: 'facebook',
					email_verification_token: token,
					is_email_verified: true
				});
			} else {
				console.log('facebookSignIn email is available');
				customer = await Customers.findOne({ email: payload.email }).populate('role');
				if (!customer) {
					customer = await createCustomerDBCall({
						email: payload.email,
						full_name: payload.name,
						is_email_verified: true,
						auth_provider: 'facebook'
					});
					await sendGridMail(customer);
				}
			}
			const token = module.exports.getAuthToken({ id: customer._id });
			return res.status(200).send(generateAPIReponse(0,'User signed up successfully with facebook', { token: token, user: getAuthUserResponse(customer) }));
		} catch (error) {
			if (error.resCode)
				return res.status(error.resCode).send(generateAPIReponse(error.message));
			else
				return res.status(500).send(generateAPIReponse(1,error.message));
		}
	}
	},

	async forgotPassword(req, res, next) {
		const J_service = JSON.parse(service).length;
		const parse = JSON.parse(service);
		for(i=0;i<J_service;i++)
		{
			if (parse[i].is_enabled == true){
				k = i;
			}
		}
		if (k == 0){
		const params = req.body;
		console.log('forgotPassword params =>', params);
		try {
			const token = await getSecureRandomToken(20);
			let otp = getSecureRandomOtp();
			Customers.findOneAndUpdate({ email: params.email }, {
				reset_password_token: token,
				otp: otp,
				reset_password_sent_at: Date.now()
			}).then(async (customer) => {
				if (customer) {		
					customer['otp'] = otp
					await sendforgotPasswordMail(customer, token);
					return res.status(200).send({error:0,message:'We have sent you an email, please check'});
				}
				else {
					return res.status(401).send({error:1,message:'No User found of this email'});
				}
			}).catch(error => {
				return res.status(500).send({error:1,message:error.message});
			})
		} catch (error) {
			return res.status(500).send({error:1,message:error.message});
		}
	}else if(k == 1){
		const params = req.body;
		console.log('forgotPassword params =>', params);
		try {
			const token = await getSecureRandomToken(20);
			let otp = getSecureRandomOtp();
			Customers.findOneAndUpdate({ email: params.email }, {
				reset_password_token: token,
				otp: otp,
				reset_password_sent_at: Date.now()
			}).then(async (customer) => {
				if (customer) {
					customer['otp'] = otp
					await sendforgotPasswordMail(customer, token);
					return res.status(200).send({error:0,message:'We have sent you an email, please check'});
				}
				else {
					return res.status(401).send({error:1,message:'No User found of this email'});
				}
			}).catch(error => {
				return res.status(500).send({error:1,message:error.message});
			})
		} catch (error) {
			return res.status(500).send({error:1,message:error.message});
		}
	}else{
		const params = req.body;
		console.log('forgotPassword params =>', params);
		try {
			const token = await getSecureRandomToken(20);
			let otp = getSecureRandomOtp();
			Customers.findOneAndUpdate({ email: params.email }, {
				reset_password_token: token,
				otp: otp,
				reset_password_sent_at: Date.now()
			}).then(async (customer) => {
				if (customer) {
					customer['otp'] = otp
					await sendforgotPasswordMail(customer, token);
					return res.status(200).send({error:0,message:'We have sent you an email, please check'});
				}
				else {
					return res.status(401).send({error:1,message:'No User found of this email'});
				}
			}).catch(error => {
				return res.status(500).send({error:1,message:error.message});
			})
		} catch (error) {
			return res.status(500).send({error:1,message:error.message});
		}
	}
	},

	async validateResetPasswordToken(req, res) {
		const params = req.body;
		console.log('validateResetPasswordToken params =>', params);
		try {
			const isValidToken = await isResetPasswordTokenValid(params.reset_password_token);
			if (isValidToken)
				return res.status(200).send({error:0,message:'Token Validated Successfully'});
			else
				return res.status(422).send({error:1,message:'Reset password token is invalid or expired'});
		} catch (error) {
			return res.status(500).send({error:1,message:error.message});
		}
	},

	async resetPassword(req, res) {
		const params = req.body;
		console.log('resetPassword params =>', params);
		try {
			const isValidToken = await isResetPasswordTokenValid(params.otp);
			if (isValidToken) {
				const hash = await bcrypt.hash(params.new_password, 10);
				Customers.findOneAndUpdate({ email: params.email, otp: params.otp }, {
					password: hash,
					otp: null,
					reset_password_sent_at: null,
					reset_password_token: null
				}).then(result => {
					return res.status(200).send({error:0,message:'Your password reset successfully'});
				}).catch(error => {
					throw error
				})
			} else {
				return res.status(201).send({error:1,message:'Reset password token is invalid or expired'});
			}
		} catch (error) {
			return res.status(500).send({error:1,message:error.message});
		}
	},

	async verifyCustomerEmail(req, res) {
		const params = req.body;
		console.log('verifyCustomerEmail params =>', params);
		/* ================== Temparary code =============================*/
		if (params.email_verification_token) {
			return res.status(200).send(generateAPIReponse(0,''));
		}
		/* ================== Temparary code end =============================*/
		if (params.customerId) {
			if (params.otp) {
				let result = await Customers.findOne({ _id: params.customerId }).exec();
				if (result && result._id) {
					if (result.otp == params.otp) {
						Customers.findOneAndUpdate({ otp: params.otp }, {
							is_email_verified: true,
							otp: null
						}).then(customer => {
							if (customer) {
								sendWelcomeMail(customer);
								const token = module.exports.getAuthToken({ id: customer._id });
								return res.status(200).send(generateAPIReponse(0,'Your email has been verified successfully', { token: token, user: getAuthUserResponse(customer), success: true }));
							}
							else {
								return res.status(401).send(generateAPIReponse(1,'Email Token not found, You might be verified already'));
							}
						}).catch(error => {
							return res.status(500).send(generateAPIReponse(1,error.message));
						})
					} else {
						return res.status(400).send(generateAPIReponse(1,'Invalid otp!'));
					}
				} else {
					return res.status(400).send(generateAPIReponse(1,'No User found!'));
				}
			} else {
				return res.status(400).send(generateAPIReponse(1,'Otp is required!'));
			}
		} else {
			return res.status(400).send(generateAPIReponse(1,'CustomerId is required!'));
		}

	},

	getAuthToken(data) {
		const token = jwt.sign({ user: data }, jwtSecret, {
			expiresIn: 1296000000 // expires in 15 Days
		});
		return token;
	},

	// possible params email and phone number
	async postSocialAuth(req, res) {
		const J_service = JSON.parse(service).length;
		const parse = JSON.parse(service);
		for(i=0;i<J_service;i++)
		{
			if (parse[i].is_enabled == true){
				k = i;
			}
		}
		if (k == 0){
		const params = req.body;
		const id = req.params.id
		console.log('postSocialAuth params, id =>', params, id);
		const isEmailExist = await Customers.exists({ email: params.email });
		const isPhoneNumberExist = await Customers.exists({ 'phone_number.international_number': params.phone_number.international_number });
		if (isEmailExist)
			return res.status(409).send(generateAPIReponse(1,'The email you entered is already exist, Please try with another one.'));
		if (isPhoneNumberExist)
			return res.status(409).send(generateAPIReponse(1,'The phone number you entered is already exist, Please try with another one.'));
		Customers.findByIdAndUpdate(id, params, { new: true }).then(async (customer) => {
			if (params.email) {
				await sendEmailVerificationMail(customer);
				//await sendGridMail(customer);
				return res.status(200).send(generateAPIReponse(0,'We have sent you and email for your email verification, Please check.'));
			} else {
				return res.status(200).send(generateAPIReponse(0,'Customer Updated Successfully', customer));
			}
		}).catch(error => {
			return res.status(500).send(generateAPIReponse(1,error.message));
		})
	}else if(k == 1){
		const params = req.body;
		const id = req.params.id
		console.log('postSocialAuth params, id =>', params, id);
		const isEmailExist = await Customers.exists({ email: params.email });
		const isPhoneNumberExist = await Customers.exists({ 'phone_number.international_number': params.phone_number.international_number });
		if (isEmailExist)
			return res.status(409).send(generateAPIReponse(1,'The email you entered is already exist, Please try with another one.'));
		if (isPhoneNumberExist)
			return res.status(409).send(generateAPIReponse(1,'The phone number you entered is already exist, Please try with another one.'));
		Customers.findByIdAndUpdate(id, params, { new: true }).then(async (customer) => {
			if (params.email) {
				await sendEmailVerificationMail(customer);
				//await sendGridMail(customer);
				return res.status(200).send(generateAPIReponse(0,'We have sent you and email for your email verification, Please check.'));
			} else {
				return res.status(200).send(generateAPIReponse(0,'Customer Updated Successfully', customer));
			}
		}).catch(error => {
			return res.status(500).send(generateAPIReponse(1,error.message));
		})
	}else{
		const params = req.body;
		const id = req.params.id
		console.log('postSocialAuth params, id =>', params, id);
		const isEmailExist = await Customers.exists({ email: params.email });
		const isPhoneNumberExist = await Customers.exists({ 'phone_number.international_number': params.phone_number.international_number });
		if (isEmailExist)
			return res.status(409).send(generateAPIReponse(1,'The email you entered is already exist, Please try with another one.'));
		if (isPhoneNumberExist)
			return res.status(409).send(generateAPIReponse(1,'The phone number you entered is already exist, Please try with another one.'));
		Customers.findByIdAndUpdate(id, params, { new: true }).then(async (customer) => {
			if (params.email) {
				//await sendEmailVerificationMail(customer);
				await sendGridMail(customer);
				return res.status(200).send(generateAPIReponse(0,'We have sent you and email for your email verification, Please check.'));
			} else {
				return res.status(200).send(generateAPIReponse(0,'Customer Updated Successfully', customer));
			}
		}).catch(error => {
			return res.status(500).send(generateAPIReponse(1,error.message));
		})
	}
	},
};

function verifyGoogleIdToken(idToken) {
	return new Promise(async (resolve, reject) => {
		try {
			const ticket = await client.verifyIdToken({
				idToken: idToken,
				audience: googleAuth.clientId,
			});
			const payload = ticket.getPayload();
			resolve(payload);
		} catch (error) {
			console.log('verifyGoogleIdToken error =>', error.message);
			reject(error);
		}
	})
}

function verifyFacebookAccessToken(accessToken) {
	return new Promise(async (resolve, reject) => {
		try {
			const { data } = await axios({
				url: 'https://graph.facebook.com/me',
				method: 'get',
				params: {
					fields: ['id', 'email', 'name', 'picture.type(large)'].join(','),
					access_token: accessToken
				},
			});
			resolve(data);
		} catch (error) {
			console.log('verifyFacebookAccessToken error =>', error.message);
			reject(error);
		}
	})
}

function isResetPasswordTokenValid(otp) {
	return new Promise((resolve, reject) => {
		let now = new Date();
		now = new Date(now.setDate(now.getDate() - 1));
		Customers.findOne({
			$and: [
				{ otp: otp },
				{ reset_password_sent_at: { $gte: now } },
			]
		}).then(customer => {
			if (!customer)
				resolve(false);
			else
				resolve(true);
		}).catch(error => {
			reject(error.message);
		})
	})
}

function getAuthUserResponse(user) {
	return {
		_id: user._id,
		email: user.email,
		full_name: user.full_name,
		first_name: user.first_name,
		last_name: user.last_name,
		phone_number: user.phone_number,
		auth_provider: user.auth_provider
	}
}
