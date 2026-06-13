import { Resend } from 'resend';

export async function sendCompletionEmail(userEmail: string, statementName: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email Mock] Statement ${statementName} completed for ${userEmail}. Add RESEND_API_KEY to send real emails.`);
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: 'LedgerLens AI <notifications@resend.dev>', // resend.dev allows testing without domain verification
      to: [userEmail],
      subject: 'Statement Processing Complete - LedgerLens AI',
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #FF541B;">Processing Complete!</h2>
          <p>Great news! The AI has finished processing your statement: <strong>${statementName}</strong>.</p>
          <p>All transactions have been successfully extracted and categorized.</p>
          <p>
            <a href="https://ledgerlens-ai-web.vercel.app/dashboard/statements" style="display: inline-block; padding: 10px 20px; background-color: #3054ff; color: #fff; text-decoration: none; border-radius: 5px;">
              View Dashboard
            </a>
          </p>
        </div>
      `
    });
    console.log(`Successfully sent completion email to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send email via Resend:", error);
  }
}
