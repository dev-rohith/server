export function password_reset_template(link) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border-radius: 10px; background: url('https://res.cloudinary.com/dlbyxcswi/image/upload/v1738811358/product_uploads/lspmlx6tqyzkpztgia9g.jpg') no-repeat center center; background-size: cover;">
      <div style="background: rgba(255, 255, 255, 0.9); padding: 20px; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <img src="https://res.cloudinary.com/dlbyxcswi/image/upload/f_auto,q_auto/v1/product_uploads/shcnb6zmtrykp1ygw3dc" alt="Logo" style="width: 120px;">
        </div>
        <h1 style="text-align: center; color: #6a0dad;">Reset Your Password</h1>
        <p style="text-align: center; color: #444; font-size: 16px;">
          You requested a password reset. Click the button below to proceed.
        </p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${link}" style="display: inline-block; padding: 12px 20px; background-color: #6a0dad; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 5px;">
            Reset Password
          </a>
        </div>
        <p style="text-align: center; color: #666; font-size: 14px;">
          If you didn't request this, please ignore this email.
        </p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="text-align: center; color: #888; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Your Company | All rights reserved
        </p>
      </div>
    </div>
    `;
  }
  