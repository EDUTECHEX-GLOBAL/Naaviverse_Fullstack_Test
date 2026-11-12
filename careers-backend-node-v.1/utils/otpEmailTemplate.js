const path = require("path");

/**
 * Generates enhanced, modern HTML email templates for Naaviverse OTP notifications.
 *
 * @param {Object} options
 * @param {'user_signup' | 'partner_signup' | 'user_forgot' | 'partner_forgot'} options.type
 * @param {string} options.otpCode - 6-digit OTP code
 * @param {string} [options.recipientName]
 * @param {string} [options.expiresIn] - Default "10 minutes"
 * @returns {{ subject: string, html: string }}
 */
function getOtpEmailContent({ type, otpCode, recipientName, userType, expiresIn = "10 minutes" }) {
  const isPartner = type.includes("partner");
  const isForgot  = type.includes("forgot");

  const subtitleHeader  = isPartner ? "PARTNER NETWORK" : "NAAVIVERSE PLATFORM";
  const platformName    = isPartner ? "Naaviverse Partner Platform" : "Naaviverse Platform";
  const platformContext = isPartner ? "Naaviverse partner platform" : "Naaviverse platform";

  const tagline   = isForgot ? "RESET YOUR PASSWORD" : "VERIFY IT'S YOU";
  const mainTitle = isForgot ? "Reset your password" : "Confirm your registration";
  const actionDescription = isForgot
    ? `Enter the code below to complete your password reset for the ${platformContext}. Don't share this code with anyone — our team will never ask for it.`
    : `Enter the code below to complete your sign-in to the ${platformContext}. Don't share this code with anyone — our team will never ask for it.`;

  const subject = isForgot
    ? `Naaviverse Password Reset OTP [LOCK]`
    : `Naaviverse Registration Confirmation OTP [LOCK]`;

  // Clean continuous digits so user can select/copy pure 6 digits without embedded spaces
  const cleanOtp = String(otpCode).replace(/\s+/g, "").trim();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FB; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8F9FB; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05); border: 1px solid #EAE6DF;">
          
          <!-- LIGHT HEADER (Clean White for High Logo Contrast) -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 24px 16px; text-align: center; border-bottom: 1px solid #EBE5D8;">
              <img src="cid:naavi_logo" alt="naaviverse" style="max-height: 44px; width: auto; max-width: 210px; display: block; margin: 0 auto 6px auto;" />
              <div style="color: #64748B; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;">
                ${subtitleHeader}
              </div>
            </td>
          </tr>

          <!-- BODY CONTAINER -->
          <tr>
            <td style="padding: 28px 28px 20px; background-color: #ffffff;">

              <!-- TAGLINE PILL -->
              <div style="color: #0D6E63; font-size: 10.5px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px;">
                ${tagline}
              </div>

              <!-- MAIN HEADING -->
              <h1 style="margin: 0 0 12px 0; color: #0A192F; font-family: 'Poppins', sans-serif; font-size: 23px; font-weight: 600; line-height: 1.25;">
                ${mainTitle}
              </h1>

              <!-- BODY TEXT -->
              <p style="margin: 0 0 20px 0; color: #4A5568; font-size: 13.5px; line-height: 1.55;">
                ${actionDescription}
              </p>

              <!-- COMPACT OTP CARD BOX -->
              <div style="background-color: #F7F4EE; border: 1px solid #EBE5D8; border-radius: 8px; padding: 18px 20px; text-align: center; margin-bottom: 22px;">
                <div style="color: #8C8275; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 10px;">
                  YOUR ONE-TIME CODE
                </div>
                <div style="display: inline-block; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 34px; font-weight: 700; color: #0A192F; letter-spacing: 6px; margin: 0 0 8px 0; line-height: 1.2; user-select: all; -webkit-user-select: all;">${cleanOtp}</div>
                <div style="color: #718096; font-size: 11px; font-weight: 500;">
                  Expires in ${expiresIn}
                </div>
              </div>

              <!-- DOTTED DIVIDER -->
              <div style="border-top: 1px dashed #E2E8F0; margin-bottom: 18px; height: 0;"></div>

              <!-- SECURITY FOOTER TEXT -->
              <p style="margin: 0; color: #718096; font-size: 11.5px; line-height: 1.5;">
                If you didn't request this code, you can safely ignore this email — your account remains secure. For help, reach us anytime at <a href="mailto:support@naaviverse.com" style="color: #0D6E63; text-decoration: underline;">support@naaviverse.com</a>.
              </p>

            </td>
          </tr>

          <!-- BOTTOM FOOTER -->
          <tr>
            <td style="background-color: #F7F4EE; padding: 16px 20px; text-align: center; border-top: 1px solid #EBE5D8;">
              <p style="margin: 0 0 4px 0; color: #8C8275; font-size: 11.5px; font-weight: 600;">
                ${platformName}
              </p>
              <p style="margin: 0; color: #A0968A; font-size: 10.5px;">
                <a href="#" style="color: #0D6E63; text-decoration: underline;">Manage preferences</a> &nbsp;·&nbsp; <a href="#" style="color: #0D6E63; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * Generates enhanced, modern HTML email templates for Admin Account Approval.
 *
 * @param {Object} options
 * @param {'user' | 'partner'} [options.role]
 * @param {string} [options.email]
 * @param {string} [options.recipientName]
 * @param {string} [options.loginUrl]
 * @returns {{ subject: string, html: string }}
 */
function getApprovalEmailContent({ role = "partner", email, recipientName, loginUrl }) {
  const isPartner     = role?.toLowerCase() === "partner";
  const subtitleHeader = isPartner ? "PARTNER NETWORK" : "NAAVIVERSE PLATFORM";
  const platformName   = isPartner ? "Naaviverse Partner Platform" : "Naaviverse Platform";
  const accessLevelText = isPartner ? "Partner" : "User";
  const targetLoginUrl = loginUrl || (isPartner ? "https://naavinetwork.ai/login?type=partner" : "https://naavinetwork.ai/login");

  const subject = `Account Approved — Welcome to Naaviverse! [DONE]`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FB; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8F9FB; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05); border: 1px solid #EAE6DF;">
          
          <!-- LIGHT HEADER (Clean White for High Logo Contrast) -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 24px 16px; text-align: center; border-bottom: 1px solid #EBE5D8;">
              <img src="cid:naavi_logo" alt="naaviverse" style="max-height: 44px; width: auto; max-width: 210px; display: block; margin: 0 auto 6px auto;" />
              <div style="color: #64748B; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;">
                ${subtitleHeader}
              </div>
            </td>
          </tr>

          <!-- BODY CONTAINER -->
          <tr>
            <td style="padding: 28px 28px 20px; background-color: #ffffff;">

              <!-- STATUS PILL BADGE -->
              <div style="display: inline-block; background-color: #E6F7F5; border-radius: 20px; padding: 5px 14px; margin-bottom: 14px;">
                <span style="color: #0D6E63; font-size: 12.5px; font-weight: 600;">[OK] Account approved</span>
              </div>

              <!-- MAIN HEADING -->
              <h1 style="margin: 0 0 12px 0; color: #0A192F; font-family: 'Poppins', sans-serif; font-size: 23px; font-weight: 600; line-height: 1.25;">
                You're cleared to set sail
              </h1>

              <!-- BODY TEXT -->
              <p style="margin: 0 0 20px 0; color: #4A5568; font-size: 13.5px; line-height: 1.55;">
                Welcome aboard${recipientName ? ` <strong>${recipientName}</strong>` : ""} — your ${isPartner ? "partner" : "user"} account has been reviewed and approved by the Naaviverse admin team. You can now sign in and start managing your ${isPartner ? "offerings" : "account"}.
              </p>

              <!-- DETAILS CARD -->
              <div style="background-color: #F7F4EE; border: 1px solid #EBE5D8; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50%" style="vertical-align: top;">
                      <div style="color: #8C8275; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                        STATUS
                      </div>
                      <div style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 700; color: #0A192F;">
                        Approved
                      </div>
                    </td>
                    <td width="50%" style="vertical-align: top; text-align: right;">
                      <div style="color: #8C8275; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                        ACCESS LEVEL
                      </div>
                      <div style="font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 700; color: #0A192F;">
                        ${accessLevelText}
                      </div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- CTA BUTTON -->
              <div style="text-align: center; margin-bottom: 8px;">
                <a href="${targetLoginUrl}" style="background-color: #06152B; color: #ffffff; font-size: 13.5px; font-weight: 700; padding: 12px 24px; border-radius: 6px; text-decoration: none; display: inline-block;">
                  Log in to your dashboard
                </a>
              </div>

            </td>
          </tr>

          <!-- BOTTOM FOOTER -->
          <tr>
            <td style="background-color: #F7F4EE; padding: 16px 20px; text-align: center; border-top: 1px solid #EBE5D8;">
              <p style="margin: 0 0 4px 0; color: #8C8275; font-size: 11.5px; font-weight: 600;">
                ${platformName}
              </p>
              <p style="margin: 0; color: #A0968A; font-size: 10.5px;">
                <a href="#" style="color: #0D6E63; text-decoration: underline;">Manage preferences</a> &nbsp;·&nbsp; <a href="#" style="color: #0D6E63; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

/**
 * Generates enhanced, modern HTML email templates for Admin Account Rejection.
 *
 * @param {Object} options
 * @param {'user' | 'partner'} [options.role]
 * @param {string} [options.email]
 * @param {string} [options.recipientName]
 * @param {string} [options.reason]
 * @returns {{ subject: string, html: string }}
 */
function getRejectionEmailContent({ role = "partner", email, recipientName, reason }) {
  const isPartner      = role?.toLowerCase() === "partner";
  const subtitleHeader = isPartner ? "PARTNER NETWORK" : "NAAVIVERSE PLATFORM";
  const platformName   = isPartner ? "Naaviverse Partner Platform" : "Naaviverse Platform";
  const accessLevelText = isPartner ? "Partner Application" : "User Application";

  const subject = `Application Status Update — Naaviverse ${isPartner ? "Partner Network" : "Platform"}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8F9FB; font-family: 'Poppins', -apple-system, BlinkMacSystemFont, Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #F8F9FB; padding: 24px 12px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 18px rgba(0, 0, 0, 0.05); border: 1px solid #EAE6DF;">
          
          <!-- LIGHT HEADER WITH LOGO -->
          <tr>
            <td style="background-color: #ffffff; padding: 24px 24px 16px; text-align: center; border-bottom: 1px solid #EBE5D8;">
              <img src="cid:naavi_logo" alt="SkillNaav" style="max-height: 44px; width: auto; max-width: 210px; display: block; margin: 0 auto 6px auto;" />
              <div style="color: #64748B; font-size: 10px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase;">
                ${subtitleHeader}
              </div>
            </td>
          </tr>

          <!-- BODY CONTAINER -->
          <tr>
            <td style="padding: 28px 28px 20px; background-color: #ffffff;">

              <!-- STATUS PILL BADGE -->
              <div style="display: inline-block; background-color: #FEE2E2; border-radius: 20px; padding: 5px 14px; margin-bottom: 14px;">
                <span style="color: #DC2626; font-size: 12px; font-weight: 700; letter-spacing: 0.5px;">APPLICATION UPDATE</span>
              </div>

              <!-- MAIN HEADING -->
              <h1 style="margin: 0 0 12px 0; color: #0A192F; font-family: 'Poppins', sans-serif; font-size: 22px; font-weight: 700; line-height: 1.25;">
                Application Not Approved
              </h1>

              <!-- BODY TEXT -->
              <p style="margin: 0 0 16px 0; color: #4A5568; font-size: 13.5px; line-height: 1.55;">
                Dear${recipientName ? ` <strong>${recipientName}</strong>` : " Applicant"},
              </p>
              <p style="margin: 0 0 20px 0; color: #4A5568; font-size: 13.5px; line-height: 1.55;">
                Thank you for your interest in joining the ${platformName}. After careful review by our administration team, we regret to inform you that your application could not be approved at this time.
              </p>

              <!-- DETAILS CARD -->
              <div style="background-color: #F7F4EE; border: 1px solid #EBE5D8; border-radius: 8px; padding: 16px 20px; margin-bottom: 22px;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td width="50%" style="vertical-align: top;">
                      <div style="color: #8C8275; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                        STATUS
                      </div>
                      <div style="font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 700; color: #DC2626;">
                        Not Approved
                      </div>
                    </td>
                    <td width="50%" style="vertical-align: top; text-align: right;">
                      <div style="color: #8C8275; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                        APPLICATION TYPE
                      </div>
                      <div style="font-family: 'Poppins', sans-serif; font-size: 15px; font-weight: 700; color: #0A192F;">
                        ${accessLevelText}
                      </div>
                    </td>
                  </tr>
                </table>
                ${reason ? `
                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px dashed #E2E8F0;">
                  <div style="color: #8C8275; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 4px;">
                    FEEDBACK / REASON
                  </div>
                  <div style="font-size: 13px; color: #4A5568; line-height: 1.5;">
                    ${reason}
                  </div>
                </div>
                ` : ""}
              </div>

              <!-- SUPPORT INFO -->
              <p style="margin: 0; color: #718096; font-size: 12px; line-height: 1.55;">
                If you believe this decision was made in error or would like to submit additional information, please contact our support team at <a href="mailto:support@naaviverse.com" style="color: #0D6E63; text-decoration: underline;">support@naaviverse.com</a>.
              </p>

            </td>
          </tr>

          <!-- BOTTOM FOOTER -->
          <tr>
            <td style="background-color: #F7F4EE; padding: 16px 20px; text-align: center; border-top: 1px solid #EBE5D8;">
              <p style="margin: 0 0 4px 0; color: #8C8275; font-size: 11.5px; font-weight: 600;">
                ${platformName}
              </p>
              <p style="margin: 0; color: #A0968A; font-size: 10.5px;">
                <a href="mailto:support@naaviverse.com" style="color: #0D6E63; text-decoration: underline;">Contact Support</a> &nbsp;·&nbsp; <a href="#" style="color: #0D6E63; text-decoration: underline;">Privacy Policy</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject, html };
}

module.exports = {
  getOtpEmailContent,
  getApprovalEmailContent,
  getRejectionEmailContent,
};
