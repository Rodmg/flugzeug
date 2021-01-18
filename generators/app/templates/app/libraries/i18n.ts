import i18n from "i18n";
import path from "path";

i18n.configure({
  locales: ["en", "es"],
  directory: path.join(__dirname, "/../locales"),
});

export default i18n;
