import { GameApplication } from "./app/GameApplication.js";
const application = new GameApplication(
  document.querySelector("#app"),
  document.querySelector("#desert"),
);
if (import.meta.hot) import.meta.hot.dispose(() => application.dispose());
