import User from "../models/User.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ======================================================
// EMAIL CONFIGURATION
// ======================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD,
  },
});

console.log("Email config check:", {
  emailUser: process.env.EMAIL_USER ? "Loaded" : "Missing",

  emailPass: process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD ? "Loaded" : "Missing",
});

// ======================================================
// SEND EMAIL
// ======================================================

const sendEmail = async ({ to, subject, html }) => {
  console.log("Attempting to send email...");
  console.log("To:", to);
  console.log("From:", process.env.EMAIL_USER ? "Loaded" : "Missing");
  console.log("Password:", process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD ? "Loaded" : "Missing");

  const info = await transporter.sendMail({
    from: `"EventSphere" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent successfully!");
  console.log("Message ID:", info.messageId);

  return info;
};

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ==========================================
    // CHECK EXISTING USER
    // ==========================================

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // ==========================================
    // HASH PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(password, 10);

    // ==========================================
    // GENERATE EMAIL VERIFICATION TOKEN
    // ==========================================

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    // Token expires after 24 hours
    const verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

    // ==========================================
    // CREATE USER
    // ==========================================

    const user = await User.create({
      name,

      email: normalizedEmail,

      password: hashedPassword,

      role: "attendee",

      phone,

      isActive: true,

      emailVerified: false,

      emailVerificationToken: hashedVerificationToken,

      emailVerificationExpires: verificationExpires,
    });

    // ==========================================
    // VERIFICATION LINK
    // ==========================================

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;

    // ==========================================
    // SEND VERIFICATION EMAIL
    // ==========================================

    let verificationEmailSent = true;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your EventSphere account",
        html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

                    <h2>Welcome to EventSphere!</h2>

                    <p>
                        Hi ${user.name},
                    </p>

                    <p>
                        Thank you for registering with EventSphere.
                        Please verify your email address by clicking
                        the button below.
                    </p>

                    <p style="margin: 30px 0;">

                        <a
                            href="${verificationUrl}"
                            style="
                                background-color: #2563eb;
                                color: white;
                                padding: 12px 20px;
                                text-decoration: none;
                                border-radius: 6px;
                                display: inline-block;
                            "
                        >
                            Verify Email
                        </a>

                    </p>

                    <p>
                        This verification link will expire in
                        <strong>24 hours</strong>.
                    </p>

                    <p>
                        If you did not create an EventSphere account,
                        you can ignore this email.
                    </p>

                    <p>
                        Regards,<br>
                        EventSphere Team
                    </p>

                </div>
        `,
      });
    } catch (emailError) {
      verificationEmailSent = false;
      console.error("Verification email delivery failed:", emailError.message);
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(201).json({
      message: verificationEmailSent
        ? "Registration successful. Please check your email to verify your account."
        : "Account created, but the verification email could not be sent. Use the local verification link to activate this account.",

      verificationEmailSent,

      ...(verificationEmailSent || process.env.NODE_ENV === "production"
        ? {}
        : { verificationUrl }),

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Registration error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// VERIFY EMAIL
// ======================================================

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    // ==========================================
    // HASH TOKEN
    // ==========================================

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      emailVerificationToken: hashedToken,

      emailVerificationExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Email verification token is invalid or expired",
      });
    }

    // ==========================================
    // VERIFY EMAIL
    // ==========================================

    user.emailVerified = true;

    user.emailVerificationToken = undefined;

    user.emailVerificationExpires = undefined;

    await user.save();

    res.status(200).json({
      message: "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Email verification error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const normalizedEmail = String(req.body?.email || "").toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(200).json({ message: "If the account exists, a verification email has been sent." });
    }
    if (user.emailVerified) {
      return res.status(400).json({ message: "This email is already verified. You can sign in." });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = crypto.createHash("sha256").update(verificationToken).digest("hex");
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email/${verificationToken}`;
    let verificationEmailSent = true;
    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your EventSphere account",
        html: `<p>Verify your EventSphere account:</p><p><a href="${verificationUrl}">Verify Email</a></p>`,
      });
    } catch (emailError) {
      verificationEmailSent = false;
      console.error("Verification email delivery failed:", emailError.message);
    }

    return res.status(200).json({
      message: verificationEmailSent ? "Verification email sent." : "Email could not be sent. Use the local verification link.",
      verificationEmailSent,
      ...(verificationEmailSent || process.env.NODE_ENV === "production" ? {} : { verificationUrl }),
    });
  } catch (error) {
    console.error("Resend verification error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

// ======================================================
// LOGIN USER
// ======================================================

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ==========================================
    // CHECK ACCOUNT STATUS
    // ==========================================

    if (!user.isActive) {
      return res.status(403).json({
        message: "Your account has been deactivated",
      });
    }

    // ==========================================
    // CHECK EMAIL VERIFICATION
    // ==========================================

    if (!user.emailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in",
      });
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ==========================================
    // GENERATE JWT
    // ==========================================

    const token = jwt.sign(
      {
        userId: user._id,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      },
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(200).json({
      message: "Login successful",

      token,

      user: {
        id: user._id,

        name: user.name,

        email: user.email,

        role: user.role,

        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET CURRENT USER
// ======================================================

const getCurrentUser = async (req, res) => {
  try {
    res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error("Get current user error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// FORGOT PASSWORD
// ======================================================

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // ==========================================
    // DON'T REVEAL ACCOUNT EXISTENCE
    // ==========================================

    if (!user) {
      return res.status(200).json({
        message:
          "If an account with that email exists, a password reset link will be sent.",
      });
    }

    // ==========================================
    // GENERATE RESET TOKEN
    // ==========================================

    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires after 15 minutes
    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

    await user.save();

    // ==========================================
    // RESET URL
    // ==========================================

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    // ==========================================
    // SEND RESET EMAIL
    // ==========================================

    await sendEmail({
      to: user.email,

      subject: "Reset your EventSphere password",

      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">

                    <h2>Password Reset</h2>

                    <p>
                        Hi ${user.name},
                    </p>

                    <p>
                        We received a request to reset your
                        EventSphere password.
                    </p>

                    <p style="margin: 30px 0;">

                        <a
                            href="${resetUrl}"
                            style="
                                background-color: #2563eb;
                                color: white;
                                padding: 12px 20px;
                                text-decoration: none;
                                border-radius: 6px;
                                display: inline-block;
                            "
                        >
                            Reset Password
                        </a>

                    </p>

                    <p>
                        This link will expire in
                        <strong>15 minutes</strong>.
                    </p>

                    <p>
                        If you did not request a password reset,
                        you can safely ignore this email.
                    </p>

                    <p>
                        Regards,<br>
                        EventSphere Team
                    </p>

                </div>
            `,
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    res.status(200).json({
      message:
        "If an account with that email exists, a password reset link will be sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// RESET PASSWORD
// ======================================================

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;

    const { password } = req.body;

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    if (!password) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters long",
      });
    }

    // ==========================================
    // HASH TOKEN
    // ==========================================

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // ==========================================
    // FIND USER WITH VALID TOKEN
    // ==========================================

    const user = await User.findOne({
      resetPasswordToken: hashedToken,

      resetPasswordExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Password reset token is invalid or expired",
      });
    }

    // ==========================================
    // HASH NEW PASSWORD
    // ==========================================

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // ==========================================
    // CLEAR RESET TOKEN
    // ==========================================

    user.resetPasswordToken = undefined;

    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error.message);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// EXPORT
// ======================================================

export {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};
