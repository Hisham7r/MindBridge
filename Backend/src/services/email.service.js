import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// Use Resend's shared test domain until a custom domain is verified.
// Change to 'MindBridge <noreply@yourdomain.com>' once the domain is set up.
const FROM = 'MindBridge <onboarding@resend.dev>'

async function send(payload) {
  if (!resend) {
    console.log('[email] RESEND_API_KEY not set — skipping send:', payload.subject, '→', payload.to)
    return
  }
  const { error } = await resend.emails.send(payload)
  if (error) throw Object.assign(new Error(error.message), { status: 502 })
}

export async function sendTherapistApproved({ name, email }) {
  await send({
    from: FROM,
    to: email,
    subject: 'Your MindBridge application has been approved!',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#6366F1">Welcome to MindBridge, ${name}!</h2>
        <p>Great news — your therapist application has been <strong>approved</strong>.</p>
        <p>You can now log in to your dashboard, manage your availability, and start accepting patients.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login"
           style="display:inline-block;margin-top:16px;padding:12px 24px;background:#6366F1;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Log in to your dashboard
        </a>
        <p style="margin-top:32px;color:#6b7280;font-size:13px">MindBridge — Online Therapy Platform</p>
      </div>
    `,
  })
}

export async function sendTherapistRejected({ name, email, reason }) {
  await send({
    from: FROM,
    to: email,
    subject: 'Update on your MindBridge application',
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
        <h2 style="color:#6366F1">MindBridge Application Update</h2>
        <p>Hi ${name},</p>
        <p>Thank you for applying to join MindBridge as a therapist. After reviewing your application, we are unable to proceed at this time.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p>If you believe this decision was made in error or would like to reapply in the future, please contact us at <a href="mailto:support@mindbridge.pk">support@mindbridge.pk</a>.</p>
        <p style="margin-top:32px;color:#6b7280;font-size:13px">MindBridge — Online Therapy Platform</p>
      </div>
    `,
  })
}
