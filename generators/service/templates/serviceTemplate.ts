import { log } from "@/libraries/Log";

class <%- serviceName %> {
  constructor() {
    // Initialize things that don't require other services or db to be initialized here
    // For everything else, use init()
  }

  init() {
    // Do your service initialization here
    // Call this on main.ts
    log.debug("Service initialized");
  }
}

const <%- serviceInstanceName %> = new <%- serviceName %>();
export default <%- serviceInstanceName %>;
