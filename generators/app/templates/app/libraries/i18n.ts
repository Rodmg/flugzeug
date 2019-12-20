import * as i18n from "i18n";
import * as path from "path";

i18n.configure({
  locales: ["en", "es"],
  directory: path.join(__dirname, "/../locales"),
});

export default i18n;
