import { getBest, updateBest, getChar, setChar } from "../../static/js/prefs.js";

let failed = 0;
const ok = (c, m) => { if (c) console.log("PASS " + m); else { failed++; console.error("FAIL " + m); } };

// Fake store: localStorage-shaped with an internal map
const fakeStore = () => ({ m: {}, getItem(k) { return k in this.m ? this.m[k] : null; }, setItem(k, v) { this.m[k] = String(v); } });

// updateBest keeps the max across repeated calls
const s1 = fakeStore();
const b1 = updateBest(s1, 100);
ok(b1 === 100, "updateBest(100) returns 100");
const b2 = updateBest(s1, 50);
ok(b2 === 100, "updateBest(50) on max=100 returns 100 (max is kept)");
const b3 = updateBest(s1, 150);
ok(b3 === 150, "updateBest(150) on max=100 returns 150 (new max)");

// getBest reads the stored value
const s2 = fakeStore();
updateBest(s2, 42);
const readBack = getBest(s2);
ok(readBack === 42, "getBest reads the stored best score");

// getChar defaults to 0 when unset
const s3 = fakeStore();
ok(getChar(s3) === 0, "getChar defaults to 0 when unset");

// setChar/getChar roundtrip for 2
const s4 = fakeStore();
setChar(s4, 2);
ok(getChar(s4) === 2, "setChar(2) + getChar returns 2");

// setChar clamps 9 to 3
const s5 = fakeStore();
setChar(s5, 9);
ok(getChar(s5) === 3, "setChar(9) clamps to 3");

// setChar clamps -1 to 0
const s6 = fakeStore();
setChar(s6, -1);
ok(getChar(s6) === 0, "setChar(-1) clamps to 0");

// getChar on garbage stored value returns 0
const s7 = fakeStore();
s7.setItem("dp_char", "garbage");
ok(getChar(s7) === 0, "getChar on garbage value defaults to 0");

if (failed) { console.error(`PREFS SMOKE: ${failed} FAILED`); process.exit(1); }
console.log("PREFS SMOKE: ALL PASS");
