// Headless runner: executes the pure self-test assertions under Node (no browser).
import { run } from "../../static/js/selftest.js";

let failed = 0;
run((cond, msg) => {
  if (cond) console.log("PASS " + msg);
  else { failed++; console.error("FAIL " + msg); }
});
if (failed) { console.error(`SELFTEST: ${failed} FAILED`); process.exit(1); }
console.log("SELFTEST: ALL PASS");
