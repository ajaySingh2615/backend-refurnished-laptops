import twilio from "twilio";

let client = null;

function getClient() {
  if (!client) {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token) {
      console.warn("[twilio] TWILIO credentials not set — SMS will not send");
      return null;
    }

    client = twilio(sid, token);
  }
  return client;
}

export async function sendOtpSms(phone, otp) {
  const twilioClient = getClient();

  if (!twilioClient) {
    console.warn(`[twilio] DEV MODE — OTP for ${phone}: ${otp}`);
    return null;
  }

  return twilioClient.messages.create({
    body: `Your verification code is ${otp}. It expires in 10 minutes.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });
}
