// Barrel file — re-exports all email functions for backward compatibility.
// New code should import directly from the submodules (e.g. @/lib/email/templates/booking)

// Client / infrastructure
export {
  sendEmail,
  addContactToResend,
  TOPICS,
  SEGMENTS,
} from './client'

// Theme / layout helpers
export {
  THEME,
  APP_URL,
  emailLayout,
  cta,
  infoBox,
  signoff,
  from,
} from './theme'

// Booking emails
export {
  sendBookingConfirmationEmail,
  sendNewBookingToProfessionalEmail,
  sendSessionReminder24hEmail,
  sendSessionReminder1hEmail,
  sendProfessionalReminder24hEmail,
  sendBookingCancelledEmail,
  sendPaymentConfirmationEmail,
  sendPaymentFailedEmail,
  sendRefundEmail,
  sendRequestReviewEmail,
  sendRescheduledEmail,
} from './templates/booking'

// Professional emails
export {
  sendProfileApprovedEmail,
  sendProfileNeedsChangesEmail,
  sendProfileRejectedEmail,
  sendIncompleteProfileReminderEmail,
} from './templates/professional'

// User emails
export {
  sendWelcomeEmail,
  sendCompleteAccountEmail,
  sendPasswordResetEmail,
} from './templates/user'

// Marketing / lifecycle emails
export {
  sendNewsletterEmail,
  sendWaitlistConfirmationEmail,
  sendWelcomeSeries1Email,
  sendWelcomeSeries2Email,
  sendWelcomeSeries3Email,
  sendReferralInviteEmail,
  sendFirstBookingNudgeEmail,
  sendReengagementEmail,
  sendLaunchEmail,
} from './templates/marketing'

// Review emails
export {
  sendNewReviewEmail,
} from './templates/review'
