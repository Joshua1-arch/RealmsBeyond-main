import * as Brevo from '@getbrevo/brevo';

const apiInstance = new Brevo.TransactionalEmailsApi();

// Set up authentication
// The key identifier is typically 0 or 'api-key' for this SDK generator
apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY || '');

export async function sendEmail(email: string, subject: string, htmlContent: string) {
  const sendSmtpEmail = new Brevo.SendSmtpEmail();

  sendSmtpEmail.subject = subject;
  sendSmtpEmail.htmlContent = htmlContent;
  sendSmtpEmail.sender = { name: process.env.BREVO_SENDER_NAME || 'Beyond Realms', email: process.env.BREVO_SENDER_EMAIL || 'noreply@beyondrealms.com' };
  sendSmtpEmail.to = [{ email }];

  try {
    await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent to ${email}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendVerificationEmail(email: string, token: string, name: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify?token=${token}`;

  // Brand Palette
  // Primary / Header / Footer: #041a45
  // Secondary Navy:            #1a2a3a
  // Accent Gold/Cream:         #edcea4
  // Card Background:           #fdfbf7
  // Body Background:           #f0ece4
  // Body Text:                 #1a2a3a
  // Muted Text:                #3f5071

  const htmlContent = `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>Verify Your Email — Beyond Realms</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />
  <style>
    /* Reset */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { margin: 0; padding: 0; background-color: #f0ece4; font-family: 'Inter', Arial, sans-serif; }
    table { border-collapse: collapse; }
    img { border: 0; display: block; }
    a { text-decoration: none; }

    /* Utilities */
    .wrapper   { width: 100%; background-color: #f0ece4; padding: 40px 16px; }
    .container { max-width: 600px; margin: 0 auto; }

    /* Header */
    .header {
      background-color: #041a45;
      padding: 36px 40px 28px;
      text-align: center;
      border-radius: 4px 4px 0 0;
    }
    .header-brand {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 26px;
      font-weight: 600;
      color: #edcea4;
      letter-spacing: 4px;
      text-transform: uppercase;
    }
    .header-tagline {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10px;
      font-weight: 400;
      color: rgba(237, 206, 164, 0.65);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 6px;
    }
    .header-rule {
      width: 40px;
      height: 1px;
      background-color: #edcea4;
      margin: 16px auto 0;
      opacity: 0.5;
    }

    /* Card Body */
    .card {
      background-color: #fdfbf7;
      padding: 48px 40px 40px;
    }
    .card-label {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10px;
      font-weight: 600;
      color: #edcea4;
      letter-spacing: 4px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    .card-heading {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 34px;
      font-weight: 500;
      color: #041a45;
      line-height: 1.2;
      margin-bottom: 20px;
    }
    .card-body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 15px;
      font-weight: 400;
      color: #3f5071;
      line-height: 1.75;
      margin-bottom: 12px;
    }
    .card-name {
      font-weight: 600;
      color: #1a2a3a;
    }

    /* Divider */
    .divider {
      border: none;
      border-top: 1px solid rgba(4, 26, 69, 0.1);
      margin: 32px 0;
    }

    /* CTA Button */
    .btn-wrap { text-align: center; margin: 36px 0; }
    .btn-cta {
      display: inline-block;
      background-color: #041a45;
      color: #fdfbf7 !important;
      font-family: 'Inter', Arial, sans-serif;
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 5px;
      text-transform: uppercase;
      padding: 16px 40px;
      border-radius: 2px;
      border: 1px solid #041a45;
      cursor: pointer;
    }

    /* URL fallback */
    .url-fallback {
      background-color: #f0ece4;
      border-left: 3px solid #edcea4;
      padding: 14px 18px;
      border-radius: 2px;
      margin-top: 28px;
    }
    .url-fallback p {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 12px;
      color: #3f5071;
      margin-bottom: 6px;
      letter-spacing: 0.5px;
    }
    .url-fallback a {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 12px;
      color: #041a45;
      word-break: break-all;
      text-decoration: underline;
    }

    /* Expiry Notice */
    .notice {
      background-color: rgba(237, 206, 164, 0.2);
      border: 1px solid rgba(237, 206, 164, 0.6);
      border-radius: 2px;
      padding: 14px 18px;
      margin-top: 28px;
    }
    .notice p {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 12px;
      color: #3f5071;
      line-height: 1.6;
    }

    /* Footer */
    .footer {
      background-color: #041a45;
      padding: 28px 40px;
      text-align: center;
      border-radius: 0 0 4px 4px;
    }
    .footer-rule {
      width: 40px;
      height: 1px;
      background-color: rgba(237, 206, 164, 0.4);
      margin: 0 auto 20px;
    }
    .footer-text {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 11px;
      color: rgba(253, 251, 247, 0.5);
      line-height: 1.7;
      letter-spacing: 0.5px;
    }
    .footer-text a {
      color: rgba(237, 206, 164, 0.7);
      text-decoration: underline;
    }
    .footer-brand {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 13px;
      font-weight: 500;
      color: rgba(237, 206, 164, 0.5);
      letter-spacing: 3px;
      text-transform: uppercase;
      margin-top: 16px;
    }

    /* Responsive */
    @media only screen and (max-width: 480px) {
      .card        { padding: 32px 24px 28px; }
      .header      { padding: 28px 24px 22px; }
      .footer      { padding: 22px 24px; }
      .card-heading { font-size: 26px; }
      .btn-cta     { padding: 14px 28px; letter-spacing: 4px; }
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">

      <!-- Header -->
      <div class="header">
        <div class="header-brand">Beyond Realms</div>
        <div class="header-tagline">Transcending Boundaries. Building Realms.</div>
        <div class="header-rule"></div>
      </div>

      <!-- Card -->
      <div class="card">
        <div class="card-label">Account Verification</div>
        <h1 class="card-heading">Confirm Your<br>Email Address</h1>

        <p class="card-body">
          Dear <span class="card-name">${name}</span>,
        </p>
        <p class="card-body">
          Thank you for registering with Beyond Realms. To complete your account setup and gain full access to our platform, please verify your email address by clicking the button below.
        </p>

        <!-- CTA -->
        <div class="btn-wrap">
          <a href="${verificationUrl}" class="btn-cta">Verify My Email</a>
        </div>

        <hr class="divider" />

        <!-- URL Fallback -->
        <div class="url-fallback">
          <p>If the button above does not work, copy and paste the following link into your browser:</p>
          <a href="${verificationUrl}">${verificationUrl}</a>
        </div>

        <!-- Expiry Notice -->
        <div class="notice">
          <p>
            This verification link is valid for <strong>24 hours</strong> from the time this email was sent.
            If your link has expired, you may request a new one from the sign-in page.
            If you did not create an account with Beyond Realms, no action is required — you can safely disregard this message.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="footer">
        <div class="footer-rule"></div>
        <p class="footer-text">
          This is an automated message. Please do not reply directly to this email.<br />
          If you require assistance, contact us at
          <a href="mailto:support@beyondrealms.com">support@beyondrealms.com</a>
        </p>
        <div class="footer-brand">Beyond Realms LTD</div>
      </div>

    </div>
  </div>
</body>
</html>`;

  await sendEmail(email, 'Verify Your Email Address — Beyond Realms', htmlContent);
}
