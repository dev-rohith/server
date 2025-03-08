import nodemailer from "nodemailer";
import { otp_email_template } from "./mail-templetes/otp.js";
import { password_reset_template } from "./mail-templetes/password-reset.js";
import AppError from "./app-error-util.js";

class Email {
  constructor(name, email) {
    if (!name || !email) {
      throw new AppError("Name and email are required to send an email.", 400);
    }

    this.name = name;
    this.email = email;

    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAILSERVICE_GMAIL_USERNAME,
        pass: process.env.MAILSERVICE_GMAIL_PASSWORD,
      },
    });
  }

  async send(subject, html) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: this.email,
        subject,
        html,
        text: "Your mail provider does not support HTML.",
      };

      return await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new AppError("Failed to send email. Please try again later.", 500);
    }
  }

  async sendOtp(otp) {
    if (!otp) {
      throw new AppError("OTP is required", 400);
    }

    const template = otp_email_template(this.name, otp);
    const subject = "Verify code for creating an account";
    return await this.send(subject, template);
  }

  async sendPasswordReset(link) {
    if (!link) {
      throw new AppError("Reset password link is required", 400);
    }

    const template = password_reset_template(link);
    const subject = "Reset Password";
    return await this.send(subject, template);
  }
}

export default Email;
