const nodemailer = require('nodemailer');
const sgMail = require("@sendgrid/mail");
const mailService = 'gmail';
const mailAuth = {
    type: 'OAuth2',
    user: '',
    pass: '',
    clientId: '132565221935-s8i0tgkdqj1oqm84up9uq61520fj9e8c.apps.googleusercontent.com',
    clientSecret: 'iHgU7-BqOMsu_LPUgyyv2m9V',
    refreshToken: '1//047J4upZCe2c2CgYIARAAGAQSNwF-L9IrGE6AgCQz7ImL65kVEAXMrhHR3soRGXZLkx4ho4EC3ghcK-FYsSgg8RGP2L48_V9Bh3I'
}
const {
    getEmailConfigDBCall,
} = require("./../settings/general_settings");

module.exports = {
    sendVendorApprovalMail(vendor) {
        return new Promise((resolve, reject) => {
            const smtpTransport = nodemailer.createTransport({
                service: mailService,
                auth: mailAuth
            });
            var mailOptions = {
                from: 'Your Best Hair <>',
                to: vendor.email,
                subject: 'Welcome to Your Best Hair',
                text: `Hello ${vendor.first_name}, \n\n Welcome to your best hair. Your profile has been approved successfuly
            \n Please click on below link to access your account \n https://ybhvendor.appsleet.com/#/login?token=${vendor.email_verification_token}`
            };
            // http://localhost:4200/#/login
            // https://ybhvendor.appsleet.com/#/login
            smtpTransport.sendMail(mailOptions, function (err, info) {
                if (err) {
                    console.log('sendVendorApprovalMail error =>', err.message)
                    reject(err);
                } else {
                    console.log('sendVendorApprovalMail Success')
                    resolve();
                }
            });
        })
    },
    sendVendorApprovalMailV2(vendor, approved) {
        return new Promise((resolve, reject) => {
            let message = approved ? `Welcome to YBH, Your profile has been approved successfuly.`: `Sorry!, Your account has been rejected, contact admin for more detail`
            let subject = approved ? `Congratulations!, Your profile successfully verified by admin.`: `Your profile rejected by admin`
            getMailConfig().then((mailConfig) => {
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
                        <p>Hi "${vendor.salon_name}",</p>
                        <p>${message} </p> \n\n
                        <p>Best Regards, <br><br>
                        <p>The Your Best Hair Team.</p>
                    </div>
                </body> </html>`;

                var mailOptions = {
                    from: `Your Best Hair <${mailConfig.email_from}>`,
                    to: vendor.email,
                    subject: subject,
                    html: htmlcode
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
                            status: 200
                        });
                    }
                });
            });
        });
    },
}

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
