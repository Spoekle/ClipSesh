/**
 * Email layout templates for ClipSesh notifications and auth actions.
 */

export interface ResetPasswordEmailParams {
  username: string;
  resetLink: string;
  frontendUrl?: string;
}

/**
 * Generates a responsive, cross-client HTML email layout for password reset requests,
 * styled using ClipSesh's official dark theme and signature red palette (#f23030).
 *
 * @param params - Configuration object including username, reset link, and optional site URL.
 * @returns Complete HTML email document as a string.
 *
 * @example
 * ```ts
 * const html = generateResetPasswordEmailHtml({
 *   username: 'Gamer123',
 *   resetLink: 'https://clipsesh.com/reset-password?token=xyz123',
 *   frontendUrl: 'https://clipsesh.com',
 * });
 * ```
 */
export function generateResetPasswordEmailHtml({
  username,
  resetLink,
  frontendUrl = '',
}: ResetPasswordEmailParams): string {
  const currentYear = new Date().getFullYear();
  const safeUsername = username ? escapeHtml(username) : 'ClipSesh User';
  const logoUrl = frontendUrl
    ? `${frontendUrl.replace(/\/+$/, '')}/CC_Logo_32px.png`
    : '';
  const siteUrl = frontendUrl || '#';

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="format-detection" content="telephone=no, date=no, address=no, email=no" />
  <meta name="color-scheme" content="dark only" />
  <meta name="supported-color-schemes" content="dark only" />
  <title>Reset Your ClipSesh Password</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    /* Base resets */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      height: auto;
      line-height: 100%;
      outline: none;
      text-decoration: none;
    }
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background-color: #0f0f0f;
      color: #f1f1f1;
      font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    }
    /* Mobile responsive */
    @media only screen and (max-width: 620px) {
      .container-table {
        width: 100% !important;
        max-width: 100% !important;
      }
      .card-body {
        padding: 28px 20px !important;
      }
      .header-body {
        padding: 0 20px 16px 20px !important;
      }
      .footer-body {
        padding: 24px 20px 32px 20px !important;
      }
      .btn-container {
        width: 100% !important;
      }
      .btn-link {
        display: block !important;
        width: auto !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; color: #f1f1f1; font-family: 'Rubik', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <!-- Preheader text for inbox preview snippet -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; color: #0f0f0f;">
    Reset your ClipSesh account password. This link is valid for 1 hour.
    &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
  </div>

  <!-- Outer background container -->
  <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #0f0f0f; width: 100%; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 20px 12px 48px 12px;">
        <!-- Center wrapper (max 580px) -->
        <table role="presentation" class="container-table" width="100%" border="0" cellpadding="0" cellspacing="0" style="max-width: 580px; width: 100%; margin: 0 auto;">
          
          <!-- BRAND HEADER -->
          <tr>
            <td align="center" class="header-body" style="padding: 0 0 20px 0; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <a href="${siteUrl}" style="text-decoration: none; display: inline-block;">
                      ${
                        logoUrl
                          ? `<img src="${logoUrl}" width="32" height="32" alt="ClipSesh Logo" style="display: block; width: 32px; height: 32px; border-radius: 6px; margin: 0 auto;" />`
                          : `<div style="width: 28px; height: 28px; background-color: #f23030; border-radius: 6px; text-align: center; line-height: 28px; font-weight: bold; color: #ffffff; font-size: 16px; margin: 0 auto;">▶</div>`
                      }
                    </a>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <a href="${siteUrl}" style="text-decoration: none; color: #f1f1f1; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; display: inline-block;">
                      Clip<span style="color: #f23030;">Sesh</span>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- MAIN CARD -->
          <tr>
            <td>
              <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #181818; border: 1px solid #262626; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);">

                <!-- Content Area -->
                <tr>
                  <td class="card-body" style="padding: 36px 36px 32px 36px;">
                    
                    <!-- Heading -->
                    <h1 style="margin: 0 0 12px 0; color: #ffffff; font-size: 22px; font-weight: 700; line-height: 1.3; letter-spacing: -0.3px;">
                      Reset Your Password
                    </h1>

                    <!-- Greeting -->
                    <p style="margin: 0 0 16px 0; color: #e6e6e6; font-size: 15px; line-height: 1.6;">
                      Hi <strong style="color: #ffffff;">${safeUsername}</strong>,
                    </p>

                    <!-- Body copy -->
                    <p style="margin: 0 0 24px 0; color: #b3b3b3; font-size: 15px; line-height: 1.6;">
                      We received a request to reset the password for your ClipSesh account. Click the button below to set a new password:
                    </p>

                    <!-- Action Button Container -->
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 28px 0;">
                      <tr>
                        <td align="center">
                          <!--[if mso]>
                          <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${resetLink}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="18%" stroke="f" fillcolor="#f23030">
                            <w:anchorlock/>
                            <center style="color:#ffffff;font-family:'Rubik',-apple-system,sans-serif;font-size:15px;font-weight:bold;">
                              Reset Password
                            </center>
                          </v:roundrect>
                          <![endif]-->
                          <!--[if !mso]><!-- -->
                          <a href="${resetLink}" class="btn-link" target="_blank" style="display: inline-block; background-color: #f23030; color: #ffffff; font-size: 15px; font-weight: 700; line-height: 1; text-align: center; text-decoration: none; padding: 15px 36px; border-radius: 9999px; box-shadow: 0 4px 14px rgba(242, 48, 48, 0.35); transition: background-color 0.2s ease;">
                            Reset Password
                          </a>
                          <!--<![endif]-->
                        </td>
                      </tr>
                    </table>

                    <!-- Expiration Notice Pill / Callout -->
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 28px 0; background-color: #121212; border: 1px solid #262626; border-radius: 8px;">
                      <tr>
                        <td style="padding: 12px 16px; color: #b3b3b3; font-size: 13px; line-height: 1.5; text-align: center;">
                          <span style="color: #ffffff; font-weight: 600;">Note:</span> This password reset link will expire in <strong style="color: #ffffff;">1 hour</strong> for your security.
                        </td>
                      </tr>
                    </table>

                    <!-- Divider -->
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin: 0 0 24px 0;">
                      <tr>
                        <td height="1" style="background-color: #262626; line-height: 1px; font-size: 1px;">&nbsp;</td>
                      </tr>
                    </table>

                    <!-- Alternative Link Section -->
                    <p style="margin: 0 0 8px 0; color: #888888; font-size: 13px; line-height: 1.5;">
                      If the button doesn&rsquo;t work, click or copy and paste this link into your web browser:
                    </p>
                    <p style="margin: 0 0 24px 0; word-break: break-all; font-size: 12px; line-height: 1.5;">
                      <a href="${resetLink}" target="_blank" style="color: #f23030; text-decoration: underline;">
                        ${resetLink}
                      </a>
                    </p>

                    <!-- Security Alert -->
                    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #161819; border-left: 3px solid #737373; border-radius: 0 6px 6px 0;">
                      <tr>
                        <td style="padding: 12px 14px; color: #888888; font-size: 12px; line-height: 1.5;">
                          If you did not request a password reset, please ignore this email or reach out to an admin. Your account remains secure and your password has not been changed.
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" class="footer-body" style="padding: 28px 16px 12px 16px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #737373; font-size: 12px; line-height: 1.5;">
                Sent by <a href="${siteUrl}" style="color: #b3b3b3; text-decoration: none; font-weight: 600;">ClipSesh</a> &bull; Cube Community
              </p>
              <p style="margin: 0 0 8px 0; color: #555555; font-size: 11px; line-height: 1.5;">
                This is an automated email. Please do not reply to this address :)
              </p>
              <p style="margin: 0; color: #444444; font-size: 11px; line-height: 1.5;">
                &copy; ${currentYear} Spoekle. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generates the plain-text alternative body for the password reset email.
 *
 * @param params - Email parameters containing username and reset link.
 * @returns Formatted plain-text string.
 *
 * @example
 * ```ts
 * const text = generateResetPasswordEmailText({
 *   username: 'Gamer123',
 *   resetLink: 'https://clipsesh.cc/reset-password?token=xyz123',
 * });
 * ```
 */
export function generateResetPasswordEmailText({
  username,
  resetLink,
}: ResetPasswordEmailParams): string {
  const safeUsername = username || 'there';

  return `Hi ${safeUsername},

You have requested to reset your password on ClipSesh. Please click the link below or copy and paste it into your browser to set a new password:

${resetLink}

This link is valid for 1 hour.

If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.

- ClipSesh Team`;
}

/**
 * Helper to escape HTML characters in strings for email safety.
 *
 * @param str - Input string to sanitize.
 * @returns Escaped string.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
