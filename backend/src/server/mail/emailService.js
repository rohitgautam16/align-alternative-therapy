// server/mail/emailService.js
'use strict';

const { sendMail } = require('../../mail/mailer'); 
const {
  personalizeBasicAdminTemplate,
  personalizeBasicUserAckTemplate,
  passwordResetTemplate,
  passwordChangedTemplate,
  welcomeSignupTemplate,
  welcomeSubscriptionTemplate,
} = require('./emailTemplates');

const ADMIN_EMAIL =
  process.env.PERSONALIZE_ADMIN_TO ||
  process.env.MAIL_FROM_EMAIL ||
  'admin@example.com';

/** 1) Personalization basic: admin + user */
async function sendPersonalizeBasicEmails({ id, name, email, mobile, notes, adminUrl }) {
  // → admin
  const adminTpl = personalizeBasicAdminTemplate({
    id,
    name,
    email,
    mobile,
    notes,
    adminUrl,
  });

  // → user acknowledgement
  const userTpl = personalizeBasicUserAckTemplate({ name });

  // send both emails in parallel and log failures
  const results = await Promise.allSettled([
    sendMail({
      to: ADMIN_EMAIL,
      subject: adminTpl.subject,
      html: adminTpl.html,
      text: adminTpl.text,
      replyTo: { email, name },
      tags: ['personalize-basic', 'lead'],
    }),
    sendMail({
      to: email,
      subject: userTpl.subject,
      html: userTpl.html,
      text: userTpl.text,
      tags: ['personalize-basic', 'user-ack'],
    }),
  ]);

  // Log results for debugging
  const summary = {
    adminEmailStatus: results[0]?.status === 'fulfilled' ? 'sent' : 'failed',
    userEmailStatus: results[1]?.status === 'fulfilled' ? 'sent' : 'failed',
    emailsError: null,
  };

  const errors = [];
  results.forEach((result, idx) => {
    const recipient = idx === 0 ? 'admin' : 'user';
    if (result.status === 'fulfilled') {
      console.log(`[personalize-basic] Email to ${recipient} sent successfully`);
    } else {
      const reason = result.reason?.message || String(result.reason);
      errors.push(`${recipient}: ${reason}`);
      console.error(`[personalize-basic] Email to ${recipient} failed:`, result.reason);
    }
  });

  if (errors.length) {
    summary.emailsError = errors.join(' | ');
  }

  return summary;
}

/** 2) Password reset token email (you pass resetLink) */
async function sendPasswordResetEmail({ user, resetLink }) {
  const tpl = passwordResetTemplate({ name: user.name, resetLink });

  await sendMail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: ['auth', 'password-reset'],
  });
}

/** 3) Password changed confirmation */
async function sendPasswordChangedEmail({ user }) {
  const tpl = passwordChangedTemplate({ name: user.name });

  await sendMail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: ['auth', 'password-changed'],
  });
}

/** 4) Welcome mail on signup */
async function sendWelcomeOnSignup({ user }) {
  const tpl = welcomeSignupTemplate({ name: user.full_name || user.name });

  await sendMail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: ['welcome', 'signup'],
  });
}

/** 5) Welcome mail when user takes a subscription */
async function sendWelcomeOnSubscription({ user, planName }) {
  const tpl = welcomeSubscriptionTemplate({ name: user.full_name || user.name, planName });

  await sendMail({
    to: user.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    tags: ['welcome', 'subscription'],
  });
}

module.exports = {
  sendPersonalizeBasicEmails,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendWelcomeOnSignup,
  sendWelcomeOnSubscription,
};
