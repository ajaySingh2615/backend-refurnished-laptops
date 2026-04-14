import { Resend } from "resend";

let resend = null;

function getClient() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    resend = new Resend(key);
  }
  return resend;
}

export async function sendWelcomeEmail({ to, name }) {
  const client = getClient();
  if (!client) {
    console.warn("[email] RESEND_API_KEY not set — skipping welcome email");
    return null;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { data, error } = await client.emails.send({
    from: fromEmail,
    to,
    subject: "Welcome to Refurbished Laptops!",
    html: `
      <h2>Welcome, ${name || "there"}!</h2>
      <p>Your account has been created successfully.</p>
      <p>Start browsing our collection of quality refurbished laptops and accessories.</p>
      <br/>
      <p>— The Refurbished Laptops Team</p>
    `,
  });

  if (error) {
    console.error("[email] Failed to send welcome email:", error);
    return null;
  }

  return data;
}
