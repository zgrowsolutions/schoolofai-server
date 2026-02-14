import appEvents from "./app.events";
import { SendWelcomeMMail } from "./actions/send-welcome-mail";
import { SendPasswordResetEmail } from "./actions/send-password-reset-mail";
import { config } from "../config/env";

appEvents.on("user_registered", (user) => {
  SendWelcomeMMail(user.name, user.email);
});

appEvents.on("passwordResetRequested", ({ userId, name, email, token }: { userId: string; name: string; email: string; token: string }) => {
  const passwordResetLink = `${config.ai365_client}/auth/password-reset?u=${userId}&t=${token}`;  
  SendPasswordResetEmail(name, email, passwordResetLink);
});

