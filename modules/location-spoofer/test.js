/**
 * Test script for iOS Location Spoofer (Shadowrocket module)
 * Tests core logic, protobuf encoding/decoding, argument parsing, city presets,
 * ARPC wrapping/unwrapping, and mock response/request rewriting.
 */

const locationSpoofer = require("./location-spoofer.js");
const assert = require("assert");

console.log("==========================================");
console.log("   iOS Location Spoofer Test Suite        ");
console.log("==========================================\n");

let passed = 0;
let failed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`[\x1b[32mPASS\x1b[0m] ${name}`);
    passed++;
  } catch (err) {
    console.error(`[\x1b[31mFAIL\x1b[0m] ${name}`);
    console.error(`       Error: ${err.message}`);
    failed++;
  }
}

// 1. Test City Presets & Normalization
runTest("City lookup & coordinate normalization (Known Russian cities)", () => {
  const mskConfig = locationSpoofer.normalizeConfig({ "город": "москва" });
  assert.strictEqual(mskConfig.latitude, 55.7558);
  assert.strictEqual(mskConfig.longitude, 37.6173);
  assert.strictEqual(mskConfig.altitude, 156);

  const spbConfig = locationSpoofer.normalizeConfig({ "city": "питер" });
  assert.strictEqual(spbConfig.latitude, 59.9343);
  assert.strictEqual(spbConfig.longitude, 30.3351);
  assert.strictEqual(spbConfig.altitude, 11);

  const sochiConfig = locationSpoofer.normalizeConfig({ "город": "сочи" });
  assert.strictEqual(sochiConfig.latitude, 43.5855);
  assert.strictEqual(sochiConfig.longitude, 39.7231);
  assert.strictEqual(sochiConfig.altitude, 30);
});

runTest("City lookup (International cities)", () => {
  const tokyo = locationSpoofer.normalizeConfig({ "city": "tokyo" });
  assert.strictEqual(tokyo.latitude, 35.6762);
  assert.strictEqual(tokyo.longitude, 139.6503);

  const dubai = locationSpoofer.normalizeConfig({ "город": "дубай" });
  assert.strictEqual(dubai.latitude, 25.2048);
  assert.strictEqual(dubai.longitude, 55.2708);

  const cupertino = locationSpoofer.normalizeConfig({ "city": "cupertino" });
  assert.strictEqual(cupertino.latitude, 37.3349);
  assert.strictEqual(cupertino.longitude, -122.00902);
});

runTest("Manual coordinates fallback and placeholders check", () => {
  const manual = locationSpoofer.normalizeConfig({
    "город": "вручную",
    "широта": "45.1234",
    "долгота": "38.5678",
    "высота": "45"
  });
  assert.strictEqual(manual.latitude, 45.1234);
  assert.strictEqual(manual.longitude, 38.5678);
  assert.strictEqual(manual.altitude, 45);

  // Unresolved placeholder should fallback safely
  const placeholder = locationSpoofer.normalizeConfig({
    "город": "{{{город}}}",
    "широта": "{{{широта}}}",
    "долгота": "{{{долгота}}}",
    "высота": "{{{высота}}}"
  });
  assert.strictEqual(placeholder.latitude, locationSpoofer.DEFAULT_CONFIG.latitude);
  assert.strictEqual(placeholder.longitude, locationSpoofer.DEFAULT_CONFIG.longitude);
});

// 2. Test Argument String Parsing
runTest("Argument parsing from Shadowrocket query format", () => {
  const rawArg = "city:сочи;lat:43.5855;lon:39.7231;alt:30;mode:response";
  const parsed = locationSpoofer.parseArgumentString(rawArg);
  assert.strictEqual(parsed.city, "сочи");
  assert.strictEqual(parsed.latitude, "43.5855");
  assert.strictEqual(parsed.longitude, "39.7231");
  assert.strictEqual(parsed.altitude, "30");
  assert.strictEqual(parsed.mode, "response");

  const normalized = locationSpoofer.normalizeConfig(parsed);
  assert.strictEqual(normalized.latitude, 43.5855);
  assert.strictEqual(normalized.longitude, 39.7231);
});

runTest("Argument parsing from URL-encoded / positional format", () => {
  const positionalArg = "москва";
  const parsed = locationSpoofer.parseArgumentString(positionalArg);
  assert.strictEqual(parsed.city, "москва");

  const normalized = locationSpoofer.normalizeConfig(parsed);
  assert.strictEqual(normalized.latitude, 55.7558);
});

// 3. Test Protobuf Varint and Field Utilities
runTest("Protobuf Varint encoding and decoding (including signed int64)", () => {
  const coord = 55.7558;
  const coordInt = locationSpoofer.coordToInt(coord); // 5575580000
  assert.strictEqual(coordInt, 5575580000);

  const encoded = locationSpoofer.encodeVarintSignedInt64(coordInt);
  const decoded = locationSpoofer.decodeVarint(encoded, 0);
  assert.strictEqual(decoded.low, coordInt % 0x100000000);

  const negativeCoordInt = locationSpoofer.coordToInt(-122.00902);
  const encodedNeg = locationSpoofer.encodeVarintSignedInt64(negativeCoordInt);
  const decodedNeg = locationSpoofer.decodeVarint(encodedNeg, 0);
  assert.ok(decodedNeg.high !== 0);
});

// 4. Test Mock ARPC + Protobuf AppleWLoc Response Spoofing
runTest("Apple WLoc response patch (ARPC envelope & protobuf location rewrite)", () => {
  // Construct a dummy WiFi device protobuf message
  // Field 1: MAC (string/bytes), Field 2: Location Submessage { Field 1: lat, Field 2: lon, Field 3: accuracy }
  const dummyLat = locationSpoofer.coordToInt(10.0);
  const dummyLon = locationSpoofer.coordToInt(20.0);

  const locMsg = locationSpoofer.concatBytes([
    locationSpoofer.makeVarintField(1, dummyLat),
    locationSpoofer.makeVarintField(2, dummyLon),
    locationSpoofer.makeVarintField(3, 50)
  ]);

  const wifiMsg = locationSpoofer.concatBytes([
    locationSpoofer.makeLengthDelimitedField(1, new Uint8Array([0x00, 0x11, 0x22, 0x33, 0x44, 0x55])), // MAC
    locationSpoofer.makeLengthDelimitedField(2, locMsg)
  ]);

  // Root AppleWLoc message containing 2 WiFi devices (field 2)
  const rootPayload = locationSpoofer.concatBytes([
    locationSpoofer.makeLengthDelimitedField(2, wifiMsg),
    locationSpoofer.makeLengthDelimitedField(2, wifiMsg)
  ]);

  // Wrap inside ARPC envelope
  const arpcMsg = {
    version: 1,
    locale: "en_US",
    appIdentifier: "com.apple.locationd",
    osVersion: "18.0",
    functionId: 1,
    payload: rootPayload
  };
  const serializedArpc = locationSpoofer.serializeArpc(arpcMsg);

  // Run spoofAppleResponse targeting Moscow
  const config = locationSpoofer.normalizeConfig({ "город": "москва" });
  const result = locationSpoofer.spoofAppleResponse(serializedArpc, config);

  assert.strictEqual(result.wifiCount, 2);
  assert.strictEqual(result.kind, "arpc");

  // Verify unpacked payload has Moscow coordinates
  const unpackedArpc = locationSpoofer.parseArpc(result.response);
  const unpackedFields = locationSpoofer.parseFields(unpackedArpc.payload);
  assert.strictEqual(unpackedFields.length, 2);

  const firstWifiFields = locationSpoofer.parseFields(unpackedFields[0].valueBytes);
  const patchedLocField = locationSpoofer.firstFieldByNumber(firstWifiFields, 2);
  assert.ok(patchedLocField);

  const summary = locationSpoofer.locationSummary(patchedLocField.valueBytes);
  assert.ok(summary.startsWith("55.7558"), `Expected summary to start with 55.7558, got ${summary}`);
  assert.ok(summary.includes("37.6173"), `Expected summary to include 37.6173, got ${summary}`);
});

// 5. Test Synthetic Request Spoofing
runTest("Synthetic response generation from request body", () => {
  const dummyLoc = locationSpoofer.concatBytes([
    locationSpoofer.makeVarintField(1, locationSpoofer.coordToInt(1.0)),
    locationSpoofer.makeVarintField(2, locationSpoofer.coordToInt(1.0))
  ]);
  const wifiDevice = locationSpoofer.concatBytes([
    locationSpoofer.makeLengthDelimitedField(1, new Uint8Array([0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF])),
    locationSpoofer.makeLengthDelimitedField(2, dummyLoc)
  ]);
  const requestPayload = locationSpoofer.makeLengthDelimitedField(2, wifiDevice);
  const arpcRequest = locationSpoofer.serializeArpc({
    version: 1,
    locale: "ru_RU",
    appIdentifier: "com.apple.geod",
    osVersion: "17.4",
    functionId: 1,
    payload: requestPayload
  });

  const config = locationSpoofer.normalizeConfig({ "город": "сочи" });
  const synthetic = locationSpoofer.spoofArpcRequest(arpcRequest, config);

  assert.strictEqual(synthetic.wifiCount, 1);
  assert.ok(synthetic.response.length > 0);

  const unpacked = locationSpoofer.extractAppleWLocPayload(synthetic.response);
  assert.strictEqual(unpacked.kind, "synthetic");
  const summary = locationSpoofer.patchedPayloadSummary(unpacked.payload);
  assert.ok(summary.includes("43.5855"), `Expected summary to include Sochi latitude, got ${summary}`);
});

// 6. Test Unknown City Notification Throttling & Fallback
runTest("Unknown city fallback to manual coordinates and notification cooldown", () => {
  let notifications = [];
  let store = {};

  global.$notification = {
    post: (title, sub, body) => {
      notifications.push({ title, sub, body });
    }
  };
  global.$persistentStore = {
    read: (key) => store[key] || null,
    write: (key, val) => { store[key] = String(val); return true; }
  };

  const cfg1 = locationSpoofer.normalizeConfig({
    "город": "неизвестный_город_123",
    "широта": "44.1234",
    "долгота": "39.5678",
    "высота": "50"
  });
  assert.strictEqual(cfg1.latitude, 44.1234);
  assert.strictEqual(cfg1.longitude, 39.5678);

  // 1st response intercept -> should notify
  locationSpoofer.notifyUnknownCityOnce(cfg1);
  assert.strictEqual(notifications.length, 1);
  assert.ok(notifications[0].sub.includes("неизвестный_город_123"));

  // Subsequent responses with SAME unknown city -> throttled
  locationSpoofer.notifyUnknownCityOnce(cfg1);
  locationSpoofer.notifyUnknownCityOnce(cfg1);
  locationSpoofer.notifyUnknownCityOnce(cfg1);
  assert.strictEqual(notifications.length, 1, "Expected duplicate notifications to be throttled to 1");

  // Cleanup globals
  delete global.$notification;
  delete global.$persistentStore;
});

console.log("\n------------------------------------------");
console.log(`Total tests: ${passed + failed}`);
console.log(`Passed: \x1b[32m${passed}\x1b[0m`);
console.log(`Failed: \x1b[31m${failed}\x1b[0m`);
console.log("------------------------------------------");

if (failed > 0) {
  process.exit(1);
} else {
  console.log("\nAll tests passed successfully! ✅");
}
