// Simple email service - In production, use services like SendGrid, Mailgun, etc.
// For now, this is a mock implementation

const sendInviteEmail = async ({
  to,
  teamName,
  eventName,
  inviterName,
  token,
}) => {
  try {
    console.log(`Mock Email Sent:
    To: ${to}
    Subject: Invitation to join team "${teamName}" for ${eventName}
    
    Hi there!
    
    ${inviterName} has invited you to join their team "${teamName}" for the event "${eventName}".
    
    To accept or decline this invitation, please click the link below:
    ${process.env.FRONTEND_URL || "http://localhost:5173"}/invite/${token}
    
    This invitation will expire in 7 days.
    
    Best regards,
    Legacy Team`);

    return { success: true };
  } catch (error) {
    console.error("Email sending failed:", error);
    throw error;
  }
};

const sendEmail = async (emailData) => {
  try {
    console.log(`Mock Admin Invite Email Sent:
    To: ${emailData.email}
    Subject: ${emailData.subject}
    
    ${emailData.html || emailData.message}
    
    Best regards,
    Legacy Team`);

    return { success: true };
  } catch (error) {
    console.error("Admin invite email sending failed:", error);
    throw error;
  }
};

module.exports = {
  sendInviteEmail,
  sendEmail,
};
