import theme from "./theme.js";
import { work } from "./work.js";
import { cursor } from "./cursor.js";
import { selection } from "./selection.js";
import { enforceHttps } from "./enforceHttps.js";

const redirected = enforceHttps();

if (!redirected) {
  theme();
  selection();
  cursor();
  work();
}
