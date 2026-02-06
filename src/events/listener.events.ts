import appEvents from "./app.events";
import { SendWelcomeMMail } from "./actions/send-welcome-mail";
appEvents.on("user_registered", (user) => {
  SendWelcomeMMail(user.name, user.email);
  console.log("New user registered:", user.email);

  // Example: send email, log, etc
});
