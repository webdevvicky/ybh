const {
  getEmailConfigDBCall,
} = require("../controllers/settings/general_settings");
const vendorverification = require("../models/vendorverification");
const customerverification = require("../models/customerverification");
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
const EmailTemplate = require('email-templates');
const path = require('path');
const {v4:uuidv4 } = require("uuid");
const bcrypt = require('bcrypt');
const Vendors = require('../models/vendors');
const { customerUI, adminEmail } = require('../config/auth');

module.exports = {

  sendGridMailForBookingConfimation(payload, _commision, _type) {
    return new Promise((resolve, reject) => {
      getMailConfig().then(async (mailConfig) => {
        const API_KEY = "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";
        const smtpTransport = sgMail.setApiKey(API_KEY);
        const currentLink = "https://api-bookingdemo.zielcommerce.in/";
        const uniqueString = uuidv4() + payload._id;
        const _id = payload._id;
        let subject = "", productLink = customerUI, name = 'Folk', userEmail = adminEmail;
        if (_type == 'customer') {
          name = payload.customer.full_name;
          userEmail = payload.customer.email;
          subject = "You have successfully placed your order!";
          payload['v_isCommissionEnable'] = false;
          payload['v_commision'] = _commision;
        }
        if (_type == 'vendor') {
          name = payload.vendor.salon_name;
          userEmail = payload.vendor.email;
          subject = "A customer booked a slot!";
          payload['v_isCommissionEnable'] = true;
          payload['v_commision'] = _commision;
        }
        if (_type == 'admin') {
          name = "admin";
          userEmail = adminEmail;
          subject = "We have got an order, which booking id is " +payload.booking_uuid + "!";
          payload['v_isCommissionEnable'] = true;
          payload['v_commision'] = _commision;
        }
        payload['v_name'] = name
        let result = await loadTemplate("bookings", payload);
        
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: userEmail,
          subject: subject,
          html : result
        };
        smtpTransport.send(mailOptions, function (err, info) {
          if (err) {
            console.log("sendGridMail error", err.message);
            reject({
              resCode: 500,
              message: `Sending send grid email error: ${err.message}`,
            });
          } else {
            resolve({
              status : 200
            });
          }
        });
      });
    });
  },


  sendEmailVerificationMail(user) {
    return new Promise(async (resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        console.log("sendEmailVerificationMail mailConfig =>", mailConfig);
        const smtpTransport = nodemailer.createTransport(
          mailConfig.email_config
        );
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: user.email,
          subject: "Your Best Hair Email Verification",
          text: `Hello ${user.full_name}, \n\nPlease click on below link to verify your email in order to access your best hair services.
                  \n https://bookingdemo.zielcommerce.in?token=${user.email_verification_token}`,
        };
        smtpTransport.sendMail(mailOptions, function (err, info) {
          if (err) {
            console.log("sendEmailVerificationMail error", err);
            reject({
              resCode: 500,
              message: `Sending verification email error: ${err.message}`,
            });
          } else {
            console.log("sendEmailVerificationMail Success");
            resolve();
          }
        });
      });
    });
  },

  sendWelcomeMail(user) {
    return new Promise((resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        console.log("sendWelcomeMail mailConfig =>", mailConfig);
        const smtpTransport = nodemailer.createTransport(
          mailConfig.email_config
        );
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: user.email,
          subject: "Welcome to Your Best Hair",
          text: `Hello ${user.full_name}, \n\n Welcome to your best hair. We are delighted to serve you your best hair services.`,
        };
        smtpTransport.sendMail(mailOptions, function (err, info) {
          if (err) {
            console.log("sendWelcomeMail error", err.message);
            reject({
              resCode: 500,
              message: `Sending welcome email error: ${err.message}`,
            });
          } else {
            console.log("sendWelcomeMail Success");
            resolve();
          }
        });
      });
    });
  },

  sendGridMail(user) {
    return new Promise((resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        const API_KEY =
          "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";
        const smtpTransport = sgMail.setApiKey(API_KEY);
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: user.email,
          subject: "Welcome to Your Best Hair",
          text: `Hello ${user.full_name}, \n\n Welcome to your best hair. We are delighted to serve you your best hair services.`,
        };
        smtpTransport.send(mailOptions, function (err, info) {
          if (err) {
            console.log("sendGridMail error", err.message);
            reject({
              resCode: 500,
              message: `Sending send grid email error: ${err.message}`,
            });
          } else {
            console.log("sendGridMail Success");
            resolve();
          }
        });
      });
    });
  },

  sendGridMail_customer(customer, res) {
    return new Promise((resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        const API_KEY =
          "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";
        const smtpTransport = sgMail.setApiKey(API_KEY);
        const currentLink = "https://api-bookingdemo.zielcommerce.in/";
        const uniqueString = uuidv4() + customer._id;
        const _id = customer._id;

        let htmlcode = `<html> <head>
          <title>Email Templete</title>
        </head>
        
        <style>
            *{
                box-sizing: border-box;
            }
        
            body{
                font-family: sans-serif;
            }
        
            #cust_email_temp p{
                font-size: 15px;
            }
        
            #cust_email_temp h2{
                font-size: 18px;
                font-weight: bold;
            }
        
            #cust_email_temp button{
                padding: 10px 15px;
                font-size: 14px;
                font-weight: bold;
                background-color: #29947f;
                color: #fff;
                border: 0;
                border-radius: 5px;
            }
        
            #cust_email_temp a{
                color: #29947f;
                text-decoration: none;
            }
            
        </style>
        
        <body>
          <div id="cust_email_temp">
                <p>Hello "${customer.full_name}",</p>
                <h2>Thank you for signing up for Yourbesthair. Use below otp to verify your email:</h2>
                <p>You are one step away from completing your 'Your Best Hair' account.</p> \n
  
                <p style="padding: 10px 15px;
                font-size: 22px;
                font-weight: bold;
                color: #29947f;">${customer.otp}</p> \n
                <p>This otp will expire in 15 minutes. If you did not sign up for a Yourbesthair account, you can safely ignore this email.</p>\n\n
                <p>Best Regards, <br><br>
                The YourBestHair Team</p>
            </div>
        </body> </html>`;
        
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: customer.email,
          subject: "Welcome to Your Best Hair",
          html : htmlcode
        };

        const saltRounds = 10;
        bcrypt
          .hash(uniqueString, saltRounds)
          .then((hashuniqueString) => {

            const newcVerification = new customerverification({
              customerID: _id,
              uniqueString: hashuniqueString,
              otp: customer.otp,
              createdAt: Date.now(),
              expiresAt: Date.now() + 900000,
            });
            newcVerification.save()
              .then(() => {
                smtpTransport.send(mailOptions, function (err, info) {
                  if (err) {
                    console.log("sendGridMail error", err.message);
                    reject({
                      resCode: 500,
                      message: `Sending send grid email error: ${err.message}`,
                    });
                  } else {
                    console.log();

                    resolve({
                      status : 200
                    });
                  }
                });
              })
              .catch(() => {
                res.json({
                  status: "FAILED",
                  message: "Empty credential supplied",
                });
              })
              .catch(() => {
                res.json({
                  status: "FAILED",
                  message: "Empty credential supplied",
                });
              })
          });
      });
    });
  },

  sendGridMail_vendor(vendor, res) {
    return new Promise((resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        const API_KEY =
          "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";
        const smtpTransport = sgMail.setApiKey(API_KEY);
        const currentLink = "https://api-bookingdemo.zielcommerce.in/";
        const uniqueString = uuidv4() + vendor._id;
        const _id = vendor._id;
        const role = vendor.role;
        var subjecttxt="";
        if (role != "Employee")
        {  
        var htmlcode = `<html> <head>
          <title>Email Templete</title>
        </head>
        
        <style>
            *{
                box-sizing: border-box;
            }
        
            body{
                font-family: sans-serif;
            }
        
            #email_temp p{
                font-size: 15px;
            }
        
            #email_temp h2{
                font-size: 18px;
                font-weight: bold;
            }
        
            #email_temp button{
                padding: 10px 15px;
                font-size: 14px;
                font-weight: bold;
                background-color: #29947f;
                color: #fff;
                border: 0;
                border-radius: 5px;
            }
        
            #email_temp a{
                color: #29947f;
                text-decoration: none;
            }
            
        </style>
        
        <body>
          <div id="email_temp">
                <p>Hi "${vendor.salon_name}",</p>
                <h2>Welcome to Your Best Hair!</h2>
                <p>You are one step away from completing your 'Your Best Hair' staff account. Use below otp to verify your email: </p> \n

                <p style="padding: 10px 15px;
                font-size: 22px;
                font-weight: bold;
                color: #29947f;">${vendor.otp}</p> \n
                <p>This otp will expire in 15 minutes. If you did not create an account, please contact <a href="">Your Best Hair Support</a> </p> \n\n
                <p>Best Regards, <br><br>
                <p>The Your Best Hair Team.</p>
            </div>
        </body> </html>`;
        subjecttxt=  "Welcome to Your Best Hair"
          }
          else
          {
            var htmlcode = `<html> <head>
          <title>Email Templete</title>
        </head>
        
        <style>
            *{
                box-sizing: border-box;
            }
        
            body{
                font-family: sans-serif;
            }
        
            #email_temp p{
                font-size: 15px;
            }
        
            #email_temp h2{
                font-size: 18px;
                font-weight: bold;
            }
        
            #email_temp button{
                padding: 10px 15px;
                font-size: 14px;
                font-weight: bold;
                background-color: #29947f;
                color: #fff;
                border: 0;
                border-radius: 5px;
            }
        
            #email_temp a{
                color: #29947f;
                text-decoration: none;
            }
            
        </style>
        
        <body>
          <div id="email_temp">
                <p>Hi "${vendor.first_name}",</p>
                <h2>Welcome to Your Best Hair!</h2>
                <p>You are Successfully register as YBH Staff. </p> \n
                <p>Please login with your account and check your bookings</p>\n
               
            </div>
        </body> </html>`;
        subjecttxt=  "Welcome to Your Best Hair Staff Account"
          }
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: vendor.email,
          subject: subjecttxt,
          html : htmlcode
        };

        const saltRounds = 10;
        bcrypt
          .hash(uniqueString, saltRounds)
          .then((hashuniqueString) => {

            const newvVerification = new vendorverification({
              verndorID: _id,
              uniqueString: hashuniqueString,
              otp: vendor.otp,
              createdAt: Date.now(),
              expiresAt: Date.now() + 900000,
            });
            newvVerification.save()
              .then(() => {
                smtpTransport.send(mailOptions, function (err, info) {
                  if (err) {
                    console.log("sendGridMail error", err.message);
                    reject({
                      resCode: 500,
                      message: `Sending send grid email error: ${err.message}`,
                    });
                  } else {
                    console.log();

                    resolve({
                      status : 200
                    });
                  }
                });
              })
              .catch(() => {
                res.json({
                  status: "FAILED",
                  message: "Empty credential supplied",
                });
              })
              .catch(() => {
                res.json({
                  status: "FAILED",
                  message: "Empty credential supplied",
                });
              })
          });
      });
    });
  },


  sendGridMail_assignstaff(vendor, res) {
    console.log(vendor);
    console.log(vendor.first_name); 
    var bookingid = vendor.booking_id;
    var staffname;
    var staffemail;
    
    vendor.forEach((item) => {
        staffname = item.first_name;
        staffemail = item.email;  
        staffid = item._id;
    });
    
    return new Promise((resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        const API_KEY =
          "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";
        const smtpTransport = sgMail.setApiKey(API_KEY);
        const currentLink = "https://api-bookingdemo.zielcommerce.in/";
        const uniqueString = uuidv4() + staffid;
        const _id = staffid;

        let htmlcode = `<html> <head>
          <title>Email Templete</title>
        </head>
        
        <style>
            *{
                box-sizing: border-box;
            }
        
            body{
                font-family: sans-serif;
            }
        
            #email_temp p{
                font-size: 15px;
            }
        
            #email_temp h2{
                font-size: 18px;
                font-weight: bold;
            }
        
            #email_temp button{
                padding: 10px 15px;
                font-size: 14px;
                font-weight: bold;
                background-color: #29947f;
                color: #fff;
                border: 0;
                border-radius: 5px;
            }
        
            #email_temp a{
                color: #29947f;
                text-decoration: none;
            }
            
        </style>
        
        <body>
          <div id="email_temp">
                <p>Hi "${staffname}",</p>
                <h2>Booking Notification from Your Best Hair!</h2>
                <p>Booking is alloted to you. And your bookiing id is "${bookingid}": </p> \n
                <p>Best Regards, <br><br>
                <p>The Your Best Hair Team.</p>
            </div>
        </body> </html>`;
        
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: staffemail,
          subject: "Booking alloted Notification",
          html : htmlcode
        };

        const saltRounds = 10;
        smtpTransport.send(mailOptions, function (err, info) {
          if (err) {
            console.log("sendGridMail error", err.message);
            reject({
              resCode: 500,
              message: `Sending send grid email error: ${err.message}`,
            });
          } else {
            console.log();

            resolve({
              status : 200
            });
          }
        });        
        
      });
    });
  },

  sendforgotPasswordMail(user, token) {
    return new Promise((resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        console.log("sendforgotPasswordMail mailConfig =>", mailConfig);
        const API_KEY = "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";
        const smtpTransport = sgMail.setApiKey(API_KEY);
        let htmlcode = `<html> <head>
          <title>Email Templete</title>
        </head>
        
        <style>
            *{
                box-sizing: border-box;
            }
        
            body{
                font-family: sans-serif;
            }
        
            #email_temp p{
                font-size: 15px;
            }
        
            #email_temp h2{
                font-size: 18px;
                font-weight: bold;
            }
        
            #email_temp button{
                padding: 10px 15px;
                font-size: 14px;
                font-weight: bold;
                background-color: #29947f;
                color: #fff;
                border: 0;
                border-radius: 5px;
            }
        
            #email_temp a{
                color: #29947f;
                text-decoration: none;
            }
            
        </style>
        
        <body>
          <div id="email_temp">
                <p>Hi ${user.first_name},</p>
                <br>
                <br>
                <p>You are receiving this because you have requested the reset of the password for your account. <br>
                Please use below otp to complete the process. </p> \n

                <p style="padding: 10px 15px;
                font-size: 22px;
                font-weight: bold;
                color: #29947f;">${user.otp}</p> \n
                <p>This otp will expire in 15 minutes. If you did not request this, please ignore this email and your password will remain unchanged. </p> \n\n
                <p>Best Regards, <br><br>
                <p>The Your Best Hair Team.</p>
            </div>
        </body> </html>`;
        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: user.email,
          subject: "Your Best Hair Reset Password",
          html : htmlcode
        };
        const newcVerification = new customerverification({
          customerID: user._id,
          uniqueString: '',
          otp: user.otp,
          createdAt: Date.now(),
          expiresAt: Date.now() + 900000,
        });
        newcVerification.save()
        .then(() => {
          smtpTransport.send(mailOptions, function (err, info) {
            if (err) {
              console.log("sendforgotPasswordMail error", err.message);
              reject(err);
            } else {
              console.log("sendforgotPasswordMail Success");
              resolve();
            }
          });
        });
      });
    });
  },
  sendContactMail(contact) {
    return new Promise((resolve, reject) => {
      getMailConfig().then((mailConfig) => {
        console.log("sendContactMail mailConfig =>", mailConfig);

        const API_KEY = "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";
        const smtpTransport = sgMail.setApiKey(API_KEY);
        
       /*  const smtpTransport = nodemailer.createTransport( mailConfig.email_config); */

        let htmlCode = `<p>Hello Admin,</p>
           <p>Name: ${contact.name}</p>
           <p>Email: ${contact.email}</p>
           <p>Phone: ${contact.phone}</p>
           <p>Message: ${contact.message}</p>`;

        var mailOptions = {
          from: `Your Best Hair <${mailConfig.email_from}>`,
          to: adminEmail,
          subject: "Your Best Hair - Contact Form Submission",
          html: htmlCode,
        };
        smtpTransport.send(mailOptions, function (err, info) {
          if (err) {
            console.log("sendContactMail error", err.message);
            reject({
              resCode: 500,
              message: `Sending contact email error: ${err.message}`,
            });
          } else {
            console.log("sendContactMail Success");
            resolve();
          }
        });
      });
    });
  },
};

function getMailConfig() {
  return new Promise(async (resolve, reject) => {
    const config = await getEmailConfigDBCall();
    let emailConfig;
    if (config.service == "Gmail") {
      emailConfig = getGmailConfig(config);
    }
    if (config.service == "SMTP") {
      emailConfig = getSMTPConfig(config);
    }
    if (config.service == "SendGrid") {
      emailConfig = getSendGridConfig(config);
    }
    return resolve({
      email_config: emailConfig,
      email_from: config.email_from,
      email_config: config.emailConfig,
    });
  });
}  

function getGmailConfig(config) {    
  return {
    service: "gmail",
    auth: {
      type: "OAuth2",
      user: config.user_name,
      pass: config.password,
      clientId: config.client_id,
      clientSecret: config.client_secret,
      refreshToken: config.refresh_token,
    },
  };
}

function getSMTPConfig(config) {
  return {
    host: config.host,
    port: config.port,
    secure: true,
    auth: {
      user: config.user_name,
      pass: config.password,
    },
  };
}

function getSendGridConfig(config) {
  return {
    service_Sendgrid: "Sendgrid",
    auth: {
      api_key: config.api_key,
      user: config.user_name,
      pass: config.password,
    },
  };
}

function loadTemplate(templateName, contexts) {
  global.__basedir = __dirname;
  const template = new EmailTemplate({
    views: {
      options: {
        extension: 'hbs'
      }
    }
  });
  return new Promise((resolve, reject) => {
    let _path = path.join(__dirname, '../views/bookings/html.hbs');
    template.render(_path, contexts)
      .then((result) => {
        resolve(result);
      }).catch(err => {
        reject(err)
      })
  });
}
