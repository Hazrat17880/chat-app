import nodemailer from "nodemailer";

export const sendEmail = async (options) => {
  try {
    // Validate environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("Email credentials not configured in environment variables");
      return { success: false, error: "Email credentials not configured" };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true,
      maxConnections: 1,
      rateDelta: 1000,
      rateLimit: 5,
    });

    // Verify connection before sending
    await transporter.verify();

    const mailOptions = {
      from: `"Chat App" <${process.env.EMAIL_USER}>`,
      to: options.to || options.email, // Support both formats
      subject: options.subject,
      html: options.html,
      text: options.text || null,
    };

    // Validate recipient
    if (!mailOptions.to) {
      console.error("No recipient email provided");
      return { success: false, error: "No recipient email provided" };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${mailOptions.to} (Message ID: ${info.messageId})`);
    
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email sending failed:", {
      error: error.message,
      email: options?.to || options?.email,
      timestamp: new Date().toISOString()
    });
    return { success: false, error: error.message };
  }
};

// For OTP verification (backward compatibility)
export const sendOTPEmail = async (email, otp, type = "verification") => {
  // More professional email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          
          <!-- Header -->
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #f3f4f6;">
            <h1 style="color: #1f2937; margin: 0; font-size: 24px;">🔐 Chat App</h1>
          </div>

          <!-- Body -->
          <div style="padding: 30px 0;">
            <h2 style="color: #1f2937; font-size: 20px; margin-top: 0;">
              ${type === "verification" ? "Verify Your Email Address" : "Password Reset Request"}
            </h2>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 20px 0;">
              ${type === "verification" 
                ? "Thank you for registering! Please use the following OTP to verify your email address:" 
                : "We received a request to reset your password. Use this OTP to proceed:"}
            </p>

            <!-- OTP Box -->
            <div style="text-align: center; padding: 20px; margin: 25px 0; background: #eff6ff; border-radius: 8px; border: 1px solid #dbeafe;">
              <div style="font-size: 36px; letter-spacing: 8px; font-weight: bold; color: #2563eb; font-family: monospace;">
                ${otp}
              </div>
            </div>

            <p style="color: #4b5563; font-size: 14px; margin: 15px 0;">
              ⏱️ This code will expire in <strong>10 minutes</strong>
            </p>

            <p style="color: #6b7280; font-size: 14px; margin: 20px 0;">
              If you didn't request this, please ignore this email or contact support.
            </p>
          </div>

          <!-- Footer -->
          <div style="border-top: 1px solid #f3f4f6; padding-top: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              This is an automated message, please do not reply to this email.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 5px 0;">
              © ${new Date().getFullYear()} Chat App. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: type === "verification" 
      ? "Verify Your Account - OTP Code" 
      : "Password Reset - OTP Code",
    html: htmlContent,
  });
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};