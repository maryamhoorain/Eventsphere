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
  emailPass:
    process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
      ? "Loaded"
      : "Missing",
});

// ======================================================
// PASSWORD VALIDATION
// ======================================================

const validateStrongPassword = (password) => {
  const value = String(password || "");

  if (value.length < 8) {
    return {
      valid: false,
      message: "Password must be at least 8 characters long.",
    };
  }

  if (value.length > 128) {
    return {
      valid: false,
      message: "Password must not exceed 128 characters.",
    };
  }

  if (/\s/.test(value)) {
    return {
      valid: false,
      message: "Password must not contain spaces.",
    };
  }

  if (!/[A-Z]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain at least one uppercase letter.",
    };
  }

  if (!/[a-z]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain at least one lowercase letter.",
    };
  }

  if (!/[0-9]/.test(value)) {
    return {
      valid: false,
      message: "Password must contain at least one number.",
    };
  }

  if (!/[!@#$%^&*(),.?":{}|<>[\]\\/'`~_+=;-]/.test(value)) {
    return {
      valid: false,
      message:
        "Password must contain at least one special character.",
    };
  }

  return {
    valid: true,
    message: "Password is strong.",
  };
};

// ======================================================
// HTML ESCAPE HELPER
// ======================================================

const escapeHtml = (value) => {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// ======================================================
// SEND EMAIL
// ======================================================

const sendEmail = async ({ to, subject, html }) => {
  console.log("Attempting to send email...");
  console.log("To:", to);
  console.log(
    "From:",
    process.env.EMAIL_USER ? "Loaded" : "Missing"
  );
  console.log(
    "Password:",
    process.env.EMAIL_PASS || process.env.EMAIL_PASSWORD
      ? "Loaded"
      : "Missing"
  );

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
// EVENTSPHERE EMAIL STYLES / VERIFICATION EMAIL
// ======================================================

const createVerificationEmail = ({
  name,
  verificationUrl,
}) => {
  const safeName = escapeHtml(name);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Verify your EventSphere account</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #070d1d;
  font-family: Arial, Helvetica, sans-serif;
  color: #ffffff;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background-color: #070d1d;
      margin: 0;
      padding: 40px 16px;
    "
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 600px;
            margin: 0 auto;
          "
        >

          <!-- BRAND -->
          <tr>
            <td
              align="center"
              style="padding: 10px 20px 28px;"
            >

              <div style="
                font-size: 28px;
                line-height: 34px;
                font-weight: 700;
                letter-spacing: 1.5px;
                color: #ffffff;
              ">
                EVENT<span style="color: #35c6d9;">SPHERE</span>
              </div>

              <div style="
                margin-top: 8px;
                font-size: 12px;
                line-height: 18px;
                letter-spacing: 1px;
                color: #8190aa;
              ">
                EVENTS • CONNECTIONS • EXPERIENCE
              </div>

            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background-color: #111a2d;
                  border: 1px solid #263652;
                  border-radius: 16px;
                  overflow: hidden;
                "
              >

                <!-- ACCENT -->
                <tr>
                  <td
                    style="
                      height: 3px;
                      background-color: #35c6d9;
                      font-size: 0;
                      line-height: 0;
                    "
                  >
                    &nbsp;
                  </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                  <td
                    style="
                      padding: 42px 40px 40px;
                    "
                  >

                    <!-- ICON -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">

                          <div style="
                            width: 64px;
                            height: 64px;
                            line-height: 64px;
                            border-radius: 50%;
                            background-color: #123843;
                            color: #35c6d9;
                            font-size: 28px;
                            font-weight: 700;
                            text-align: center;
                          ">
                            ✓
                          </div>

                        </td>
                      </tr>
                    </table>

                    <!-- HEADING -->
                    <h1 style="
                      margin: 28px 0 12px;
                      text-align: center;
                      font-size: 26px;
                      line-height: 34px;
                      font-weight: 700;
                      color: #ffffff;
                    ">
                      Verify your email
                    </h1>

                    <!-- GREETING -->
                    <p style="
                      margin: 0 0 18px;
                      font-size: 15px;
                      line-height: 25px;
                      color: #d8deea;
                    ">
                      Hi ${safeName},
                    </p>

                    <p style="
                      margin: 0 0 18px;
                      font-size: 15px;
                      line-height: 25px;
                      color: #aeb9cc;
                    ">
                      Welcome to
                      <strong style="color: #ffffff;">
                        EventSphere
                      </strong>.
                      Your account has been created successfully.
                    </p>

                    <p style="
                      margin: 0 0 28px;
                      font-size: 15px;
                      line-height: 25px;
                      color: #aeb9cc;
                    ">
                      Please verify your email address to activate
                      your account and start exploring events,
                      sessions, exhibitors, and more.
                    </p>

                    <!-- BUTTON -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">

                          <a
                            href="${verificationUrl}"
                            target="_blank"
                            style="
                              display: inline-block;
                              padding: 14px 30px;
                              background-color: #35c6d9;
                              color: #07101f;
                              text-decoration: none;
                              font-size: 15px;
                              font-weight: 700;
                              border-radius: 8px;
                              letter-spacing: 0.2px;
                            "
                          >
                            Verify Email
                          </a>

                        </td>
                      </tr>
                    </table>

                    <!-- EXPIRY -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="
                        margin-top: 30px;
                        background-color: #0b1426;
                        border: 1px solid #24324a;
                        border-radius: 10px;
                      "
                    >
                      <tr>
                        <td
                          style="
                            padding: 14px 16px;
                            font-size: 13px;
                            line-height: 20px;
                            color: #8f9bb0;
                            text-align: center;
                          "
                        >
                          This verification link expires in
                          <strong style="color: #dce3ef;">
                            24 hours
                          </strong>.
                        </td>
                      </tr>
                    </table>

                    <!-- FALLBACK LINK -->
                    <p style="
                      margin: 28px 0 8px;
                      font-size: 12px;
                      line-height: 19px;
                      color: #718099;
                    ">
                      If the button doesn't work, copy and paste
                      this link into your browser:
                    </p>

                    <p style="
                      margin: 0;
                      word-break: break-all;
                      font-size: 12px;
                      line-height: 19px;
                    ">
                      <a
                        href="${verificationUrl}"
                        style="
                          color: #35c6d9;
                          text-decoration: none;
                        "
                      >
                        ${verificationUrl}
                      </a>
                    </p>

                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              align="center"
              style="padding: 28px 20px 10px;"
            >

              <p style="
                margin: 0 0 8px;
                font-size: 12px;
                line-height: 18px;
                color: #69768d;
              ">
                If you did not create an EventSphere account,
                you can safely ignore this email.
              </p>

              <p style="
                margin: 0;
                font-size: 12px;
                line-height: 18px;
                color: #4f5c72;
              ">
                © ${new Date().getFullYear()} EventSphere
                &nbsp;•&nbsp;
                Event Management Platform
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

// ======================================================
// EVENTSPHERE PASSWORD RESET EMAIL
// ======================================================

const createPasswordResetEmail = ({
  name,
  resetUrl,
}) => {
  const safeName = escapeHtml(name);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>Reset your EventSphere password</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #070d1d;
  font-family: Arial, Helvetica, sans-serif;
  color: #ffffff;
">

  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background-color: #070d1d;
      margin: 0;
      padding: 40px 16px;
    "
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 600px;
            margin: 0 auto;
          "
        >

          <!-- BRAND -->
          <tr>
            <td
              align="center"
              style="padding: 10px 20px 28px;"
            >

              <div style="
                font-size: 28px;
                line-height: 34px;
                font-weight: 700;
                letter-spacing: 1.5px;
                color: #ffffff;
              ">
                EVENT<span style="color: #35c6d9;">SPHERE</span>
              </div>

              <div style="
                margin-top: 8px;
                font-size: 12px;
                line-height: 18px;
                letter-spacing: 1px;
                color: #8190aa;
              ">
                EVENTS • CONNECTIONS • EXPERIENCE
              </div>

            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>

              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background-color: #111a2d;
                  border: 1px solid #263652;
                  border-radius: 16px;
                  overflow: hidden;
                "
              >

                <!-- ACCENT -->
                <tr>
                  <td
                    style="
                      height: 3px;
                      background-color: #35c6d9;
                      font-size: 0;
                      line-height: 0;
                    "
                  >
                    &nbsp;
                  </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                  <td
                    style="
                      padding: 42px 40px 40px;
                    "
                  >

                    <!-- ICON -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">

                          <div style="
                            width: 64px;
                            height: 64px;
                            line-height: 64px;
                            border-radius: 50%;
                            background-color: #123843;
                            color: #35c6d9;
                            font-size: 27px;
                            font-weight: 700;
                            text-align: center;
                          ">
                            ↻
                          </div>

                        </td>
                      </tr>
                    </table>

                    <!-- HEADING -->
                    <h1 style="
                      margin: 28px 0 12px;
                      text-align: center;
                      font-size: 26px;
                      line-height: 34px;
                      font-weight: 700;
                      color: #ffffff;
                    ">
                      Reset your password
                    </h1>

                    <!-- GREETING -->
                    <p style="
                      margin: 0 0 18px;
                      font-size: 15px;
                      line-height: 25px;
                      color: #d8deea;
                    ">
                      Hi ${safeName},
                    </p>

                    <p style="
                      margin: 0 0 18px;
                      font-size: 15px;
                      line-height: 25px;
                      color: #aeb9cc;
                    ">
                      We received a request to reset the password
                      for your
                      <strong style="color: #ffffff;">
                        EventSphere
                      </strong>
                      account.
                    </p>

                    <p style="
                      margin: 0 0 28px;
                      font-size: 15px;
                      line-height: 25px;
                      color: #aeb9cc;
                    ">
                      Click the button below to create a new
                      password for your account.
                    </p>

                    <!-- BUTTON -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                    >
                      <tr>
                        <td align="center">

                          <a
                            href="${resetUrl}"
                            target="_blank"
                            style="
                              display: inline-block;
                              padding: 14px 30px;
                              background-color: #35c6d9;
                              color: #07101f;
                              text-decoration: none;
                              font-size: 15px;
                              font-weight: 700;
                              border-radius: 8px;
                              letter-spacing: 0.2px;
                            "
                          >
                            Reset Password
                          </a>

                        </td>
                      </tr>
                    </table>

                    <!-- EXPIRY -->
                    <table
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="
                        margin-top: 30px;
                        background-color: #0b1426;
                        border: 1px solid #24324a;
                        border-radius: 10px;
                      "
                    >
                      <tr>
                        <td
                          style="
                            padding: 14px 16px;
                            font-size: 13px;
                            line-height: 20px;
                            color: #8f9bb0;
                            text-align: center;
                          "
                        >
                          This password reset link expires in
                          <strong style="color: #dce3ef;">
                            15 minutes
                          </strong>.
                        </td>
                      </tr>
                    </table>

                    <!-- FALLBACK LINK -->
                    <p style="
                      margin: 28px 0 8px;
                      font-size: 12px;
                      line-height: 19px;
                      color: #718099;
                    ">
                      If the button doesn't work, copy and paste
                      this link into your browser:
                    </p>

                    <p style="
                      margin: 0;
                      word-break: break-all;
                      font-size: 12px;
                      line-height: 19px;
                    ">
                      <a
                        href="${resetUrl}"
                        style="
                          color: #35c6d9;
                          text-decoration: none;
                        "
                      >
                        ${resetUrl}
                      </a>
                    </p>

                  </td>
                </tr>

              </table>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td
              align="center"
              style="padding: 28px 20px 10px;"
            >

              <p style="
                margin: 0 0 8px;
                font-size: 12px;
                line-height: 18px;
                color: #69768d;
              ">
                If you did not request a password reset,
                you can safely ignore this email.
              </p>

              <p style="
                margin: 0;
                font-size: 12px;
                line-height: 18px;
                color: #4f5c72;
              ">
                © ${new Date().getFullYear()} EventSphere
                &nbsp;•&nbsp;
                Event Management Platform
              </p>

            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>
  `;
};

// ======================================================
// REGISTER USER
// ======================================================

const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // ==========================================
    // REQUIRED FIELDS
    // ==========================================

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // ==========================================
    // STRONG PASSWORD VALIDATION
    // ==========================================

    const passwordValidation = validateStrongPassword(password);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: passwordValidation.message,
        passwordRequirements: {
          minLength: 8,
          maxLength: 128,
          uppercase: true,
          lowercase: true,
          number: true,
          specialCharacter: true,
          spacesAllowed: false,
        },
      });
    }

    // ==========================================
    // NORMALIZE EMAIL
    // ==========================================

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
    const verificationExpires =
      Date.now() + 24 * 60 * 60 * 1000;

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

    const frontendUrl =
      process.env.FRONTEND_URL || "http://localhost:5173";

    const verificationUrl =
      `${frontendUrl}/verify-email/${verificationToken}`;

    // ==========================================
    // SEND VERIFICATION EMAIL
    // ==========================================

    let verificationEmailSent = true;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your EventSphere account",
        html: createVerificationEmail({
          name: user.name,
          verificationUrl,
        }),
      });
    } catch (emailError) {
      verificationEmailSent = false;

      console.error(
        "Verification email delivery failed:",
        emailError.message
      );
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(201).json({
      message: verificationEmailSent
        ? "Registration successful. Please check your email to verify your account."
        : "Account created, but the verification email could not be sent. Use the local verification link to activate this account.",

      verificationEmailSent,

      ...(verificationEmailSent ||
      process.env.NODE_ENV === "production"
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
    console.error(
      "Registration error:",
      error.message
    );

    return res.status(500).json({
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

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    // ==========================================
    // HASH TOKEN
    // ==========================================

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // ==========================================
    // FIND USER WITH VALID TOKEN
    // ==========================================

    const user = await User.findOne({
      emailVerificationToken: hashedToken,

      emailVerificationExpires: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Email verification token is invalid or expired",
      });
    }

    // ==========================================
    // VERIFY EMAIL
    // ==========================================

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message:
        "Email verified successfully. You can now log in.",
    });
  } catch (error) {
    console.error(
      "Email verification error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// RESEND VERIFICATION EMAIL
// ======================================================

const resendVerificationEmail = async (req, res) => {
  try {
    const normalizedEmail = String(
      req.body?.email || ""
    )
      .toLowerCase()
      .trim();

    // ==========================================
    // VALIDATION
    // ==========================================

    if (!normalizedEmail) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // ==========================================
    // FIND USER
    // ==========================================

    const user = await User.findOne({
      email: normalizedEmail,
    });

    // Don't reveal whether an account exists
    if (!user) {
      return res.status(200).json({
        message:
          "If the account exists, a verification email has been sent.",
      });
    }

    // ==========================================
    // CHECK ALREADY VERIFIED
    // ==========================================

    if (user.emailVerified) {
      return res.status(400).json({
        message:
          "This email is already verified. You can sign in.",
      });
    }

    // ==========================================
    // GENERATE NEW TOKEN
    // ==========================================

    const verificationToken =
      crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken =
      crypto
        .createHash("sha256")
        .update(verificationToken)
        .digest("hex");

    user.emailVerificationToken =
      hashedVerificationToken;

    user.emailVerificationExpires =
      Date.now() + 24 * 60 * 60 * 1000;

    await user.save();

    // ==========================================
    // VERIFICATION LINK
    // ==========================================

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const verificationUrl =
      `${frontendUrl}/verify-email/${verificationToken}`;

    // ==========================================
    // SEND EMAIL
    // ==========================================

    let verificationEmailSent = true;

    try {
      await sendEmail({
        to: user.email,
        subject: "Verify your EventSphere account",
        html: createVerificationEmail({
          name: user.name,
          verificationUrl,
        }),
      });
    } catch (emailError) {
      verificationEmailSent = false;

      console.error(
        "Verification email delivery failed:",
        emailError.message
      );
    }

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message: verificationEmailSent
        ? "Verification email sent."
        : "Email could not be sent. Use the local verification link.",

      verificationEmailSent,

      ...(verificationEmailSent ||
      process.env.NODE_ENV === "production"
        ? {}
        : { verificationUrl }),
    });
  } catch (error) {
    console.error(
      "Resend verification error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
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

    const normalizedEmail =
      email.toLowerCase().trim();

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
        message:
          "Please verify your email before logging in",
      });
    }

    // ==========================================
    // CHECK PASSWORD
    // ==========================================

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

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
      }
    );

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
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
    console.error(
      "Login error:",
      error.message
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

// ======================================================
// GET CURRENT USER
// ======================================================

const getCurrentUser = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
    });
  } catch (error) {
    console.error(
      "Get current user error:",
      error.message
    );

    return res.status(500).json({
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

    const normalizedEmail =
      email.toLowerCase().trim();

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

    const resetToken =
      crypto.randomBytes(32).toString("hex");

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

    // Token expires after 15 minutes
    user.resetPasswordToken = hashedToken;

    user.resetPasswordExpires =
      Date.now() + 15 * 60 * 1000;

    await user.save();

    // ==========================================
    // RESET URL
    // ==========================================

    const frontendUrl =
      process.env.FRONTEND_URL ||
      "http://localhost:5173";

    const resetUrl =
      `${frontendUrl}/reset-password/${resetToken}`;

    // ==========================================
    // SEND RESET EMAIL
    // ==========================================

    await sendEmail({
      to: user.email,

      subject:
        "Reset your EventSphere password",

      html: createPasswordResetEmail({
        name: user.name,
        resetUrl,
      }),
    });

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message:
        "If an account with that email exists, a password reset link will be sent.",
    });
  } catch (error) {
    console.error(
      "Forgot password error:",
      error.message
    );

    return res.status(500).json({
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
    // TOKEN VALIDATION
    // ==========================================

    if (!token) {
      return res.status(400).json({
        message: "Reset token is required",
      });
    }

    // ==========================================
    // PASSWORD REQUIRED
    // ==========================================

    if (!password) {
      return res.status(400).json({
        message: "New password is required",
      });
    }

    // ==========================================
    // STRONG PASSWORD VALIDATION
    // ==========================================

    const passwordValidation =
      validateStrongPassword(password);

    if (!passwordValidation.valid) {
      return res.status(400).json({
        message: passwordValidation.message,

        passwordRequirements: {
          minLength: 8,
          maxLength: 128,
          uppercase: true,
          lowercase: true,
          number: true,
          specialCharacter: true,
          spacesAllowed: false,
        },
      });
    }

    // ==========================================
    // HASH TOKEN
    // ==========================================

    const hashedToken =
      crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

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
        message:
          "Password reset token is invalid or expired",
      });
    }

    // ==========================================
    // HASH NEW PASSWORD
    // ==========================================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // ==========================================
    // CLEAR RESET TOKEN
    // ==========================================

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    // ==========================================
    // RESPONSE
    // ==========================================

    return res.status(200).json({
      message:
        "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error(
      "Reset password error:",
      error.message
    );

    return res.status(500).json({
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