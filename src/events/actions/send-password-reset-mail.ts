const { SendMailClient } = require("zeptomail");

const url = "https://api.zeptomail.com/v1.1/email/template";
const token =
  "Zoho-enczapikey wSsVR60i/RajX6x/mTakLuY7nlhTVgylEB94iwSj6yCoHKzC/MczwRHKBQD0FKMeEW5sE2YR97p4zRgJgDtaiot5wgsEDCiF9mqRe1U4J3x17qnvhDzPWGhflBOIKo0IxQxjnWBmFMEh+g==";

export async function SendPasswordResetEmail(name: string, email: string, passwordResetLink: string) {
  try {
    const client = new SendMailClient({ url, token });
    client
      .sendMailWithTemplate({
        template_key:
          "2d6f.42f4937793f5682b.k1.154911b1-09ca-11f1-a59f-963d1902c9da.19c5d2f264b",
        from: {
          address: "noreply@schoolofai.io",
          name: "AI365 - School of AI",
        },
        to: [
          {
            email_address: {
              address: email,
              name: name,
            },
          },
        ],
        merge_info: { name: name, password_reset_link: passwordResetLink },
      })
      .then((resp: unknown) => console.log(`Password reset mail sent to ${email}`))
      .catch((error: any) =>
        console.log(`Password reset mail NOT SENT to ${email}`, error),
      );
  } catch {
    console.log("Error at sending password reset mail");
  }
}
