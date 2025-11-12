import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendResetEmail(email: string, resetToken: string) {
  try {
    const resetLink = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password`;
    const appName = process.env.APP_NAME || "TaskFlow";

    const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
            border-radius: 10px 10px 0 0;
        }
        .content { 
            background: #f9f9f9; 
            padding: 30px; 
            border-radius: 0 0 10px 10px;
            border: 1px solid #e1e1e1;
            border-top: none;
        }
        .token-box { 
            background: #fff; 
            border: 2px dashed #667eea; 
            padding: 15px; 
            margin: 20px 0; 
            text-align: center; 
            font-family: monospace; 
            font-size: 18px; 
            font-weight: bold;
            border-radius: 5px;
        }
        .button { 
            display: inline-block; 
            background: #667eea; 
            color: white; 
            padding: 12px 30px; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 15px 0; 
            font-weight: bold;
        }
        .footer { 
            text-align: center; 
            margin-top: 30px; 
            color: #666; 
            font-size: 12px;
        }
        .warning {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 5px;
            margin: 15px 0;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Password Reset Request</h1>
    </div>
    <div class="content">
        <p>Hello,</p>
        <p>You recently requested to reset your password for your ${appName} account. Click the button below to proceed:</p>
        
        <div style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Your Password</a>
        </div>

        <p>Or copy and paste this reset token on the password reset page:</p>
        
        <div class="token-box">
            ${resetToken}
        </div>

        <div class="warning">
            <strong>⚠️ Important:</strong> 
            <ul>
                <li>This token will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share your reset token with anyone</li>
            </ul>
        </div>

        <p>If you're having trouble with the button above, visit this link:</p>
        <p style="word-break: break-all; color: #667eea;">${resetLink}</p>
        
        <p>Best regards,<br>The ${appName} Team</p>
    </div>
    <div class="footer">
        <p>This is an automated message. Please do not reply to this email.</p>
        <p>&copy; ${new Date().getFullYear()} ${appName}. All rights reserved.</p>
    </div>
</body>
</html>
    `;

    const textTemplate = `
Password Reset Request

You recently requested to reset your password for your ${appName} account.

Reset Link: ${resetLink}
Reset Token: ${resetToken}

This token will expire in 1 hour. If you didn't request this reset, please ignore this email.

Best regards,
The ${appName} Team
    `.trim();

    const mailOptions = {
      from: `"${appName}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Password Reset Request - ${appName}`,
      text: textTemplate,
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent to ${email}`);
  } catch (error) {
    console.error("Failed to send reset email:", error);
    throw new Error("Failed to send reset email");
  }
}
