import { generateDocumentation } from "flugzeug";
import { config } from "@/config";

generateDocumentation({
  url: config.urls.url,
  port: config.urls.port,
  apiRoot: config.urls.apiRoot,
  protocol: config.urls.protocol,
});