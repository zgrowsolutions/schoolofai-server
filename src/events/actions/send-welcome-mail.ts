import { SendMailClient } from "zeptomail";
const url = "https://api.zeptomail.com/v1.1/email/template";
const token =
  "Zoho-enczapikey wSsVR60i/RajX6x/mTakLuY7nlhTVgylEB94iwSj6yCoHKzC/MczwRHKBQD0FKMeEW5sE2YR97p4zRgJgDtaiot5wgsEDCiF9mqRe1U4J3x17qnvhDzPWGhflBOIKo0IxQxjnWBmFMEh+g==";

export async function SendWelcomeMMail(name: string, email: string) {
  console.log("Welcom mail init");
  console.log(name, email);
  const client = SendMailClient({ url, token });
  client
    .sendMailWithTemplate({
      template_key:
        "2d6f.42f4937793f5682b.k1.84cd6ff0-0302-11f1-aeef-5254005934b4.19c30c0f46f",
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
      merge_info: { name: name },
    })
    .then((resp: unknown) => console.log(`Welcome mail sent to ${email}`))
    .catch((error: any) =>
      console.log(`Welcome mail NOT SENT to ${email}`, error),
    );
}
