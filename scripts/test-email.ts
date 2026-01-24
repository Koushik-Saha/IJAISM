
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log('📧 Testing Email Configuration...');

    // User Provided Credentials
    const config = {
        host: "smtp.gmail.com",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: "eauthentication20@gmail.com",
            pass: "qvsxofsjnrevdnvt",
        },
    };

    console.log('Configuration:', {
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.auth.user,
        pass: '****' // masked
    });

    try {
        const transporter = nodemailer.createTransport(config);

        // Verify connection configuration
        console.log('Verifying connection...');
        await transporter.verify();
        console.log('✅ Connection verified successfully!');

        // Send test email
        console.log('Sending test email...');
        const info = await transporter.sendMail({
            from: '"IJAISM Platform" <koushik.saha666@gmail.com>', // User provided FROM
            to: "eauthentication20@gmail.com", // Sending to self for test
            subject: "Test Email from Debug Script",
            text: "If you see this, the SMTP configuration is working correcty.",
            html: "<b>If you see this, the SMTP configuration is working correcty.</b>",
        });

        console.log('✅ Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    } catch (error) {
        console.error('❌ Error occurred:');
        console.error(error);
    }
}

testEmail();
