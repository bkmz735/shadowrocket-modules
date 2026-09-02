/*
 * iOS 12 compatibility build. The protobuf int64 implementation deliberately
 * avoids BigInt syntax so JavaScriptCore on iOS 12 can parse this file.
 *
 * Intercept Apple /clls/wloc responses, unpack ARPC wrappers, replace WiFi hotspot
 * and Cell tower GPS coordinates, and repack into Apple-compatible format.
 *
 * Main Pipeline:
 *   ARPC unpack -> decode protobuf fields -> replace Location sub-message (lat/lon/accuracy)
 *   -> re-encode protobuf -> wrap back into original envelope (ARPC / marker / synthetic)
 */
(function () {
  "use strict";

        var CITY_PRESETS = {"moscow":{"lat":55.7558,"lon":37.6173,"alt":156},"москва":{"lat":55.7558,"lon":37.6173,"alt":156},"мск":{"lat":55.7558,"lon":37.6173,"alt":156},"spb":{"lat":59.9343,"lon":30.3351,"alt":11},"санкт-петербург":{"lat":59.9343,"lon":30.3351,"alt":11},"питер":{"lat":59.9343,"lon":30.3351,"alt":11},"спб":{"lat":59.9343,"lon":30.3351,"alt":11},"санкт петербург":{"lat":59.9343,"lon":30.3351,"alt":11},"novosibirsk":{"lat":55.0084,"lon":82.9357,"alt":150},"новосибирск":{"lat":55.0084,"lon":82.9357,"alt":150},"нск":{"lat":55.0084,"lon":82.9357,"alt":150},"ekaterinburg":{"lat":56.8389,"lon":60.6057,"alt":237},"екатеринбург":{"lat":56.8389,"lon":60.6057,"alt":237},"екб":{"lat":56.8389,"lon":60.6057,"alt":237},"ебург":{"lat":56.8389,"lon":60.6057,"alt":237},"kazan":{"lat":55.7887,"lon":49.1221,"alt":60},"казань":{"lat":55.7887,"lon":49.1221,"alt":60},"nizhny_novgorod":{"lat":56.3269,"lon":44.0059,"alt":120},"нижний новгород":{"lat":56.3269,"lon":44.0059,"alt":120},"нн":{"lat":56.3269,"lon":44.0059,"alt":120},"нижний":{"lat":56.3269,"lon":44.0059,"alt":120},"chelyabinsk":{"lat":55.1644,"lon":61.4368,"alt":220},"челябинск":{"lat":55.1644,"lon":61.4368,"alt":220},"челяба":{"lat":55.1644,"lon":61.4368,"alt":220},"samara":{"lat":53.1959,"lon":50.1002,"alt":100},"самара":{"lat":53.1959,"lon":50.1002,"alt":100},"ufa":{"lat":54.7388,"lon":55.9721,"alt":160},"уфа":{"lat":54.7388,"lon":55.9721,"alt":160},"rostov":{"lat":47.2357,"lon":39.7015,"alt":70},"ростов-на-дону":{"lat":47.2357,"lon":39.7015,"alt":70},"ростов":{"lat":47.2357,"lon":39.7015,"alt":70},"рнд":{"lat":47.2357,"lon":39.7015,"alt":70},"krasnodar":{"lat":45.0355,"lon":38.9753,"alt":30},"краснодар":{"lat":45.0355,"lon":38.9753,"alt":30},"крд":{"lat":45.0355,"lon":38.9753,"alt":30},"omsk":{"lat":54.9885,"lon":73.3242,"alt":90},"омск":{"lat":54.9885,"lon":73.3242,"alt":90},"krasnoyarsk":{"lat":56.0153,"lon":92.8932,"alt":140},"красноярск":{"lat":56.0153,"lon":92.8932,"alt":140},"крск":{"lat":56.0153,"lon":92.8932,"alt":140},"voronezh":{"lat":51.6608,"lon":39.2003,"alt":150},"воронеж":{"lat":51.6608,"lon":39.2003,"alt":150},"врн":{"lat":51.6608,"lon":39.2003,"alt":150},"perm":{"lat":58.0105,"lon":56.2502,"alt":150},"пермь":{"lat":58.0105,"lon":56.2502,"alt":150},"volgograd":{"lat":48.708,"lon":44.5133,"alt":50},"волгоград":{"lat":48.708,"lon":44.5133,"alt":50},"saratov":{"lat":51.5336,"lon":46.0343,"alt":50},"саратов":{"lat":51.5336,"lon":46.0343,"alt":50},"tyumen":{"lat":57.153,"lon":65.5343,"alt":80},"тюмень":{"lat":57.153,"lon":65.5343,"alt":80},"tolyatti":{"lat":53.5303,"lon":49.3461,"alt":90},"тольятти":{"lat":53.5303,"lon":49.3461,"alt":90},"barnaul":{"lat":53.3548,"lon":83.7698,"alt":180},"барнаул":{"lat":53.3548,"lon":83.7698,"alt":180},"izhevsk":{"lat":56.8527,"lon":53.2115,"alt":140},"ижевск":{"lat":56.8527,"lon":53.2115,"alt":140},"ulyanovsk":{"lat":54.3142,"lon":48.4031,"alt":130},"ульяновск":{"lat":54.3142,"lon":48.4031,"alt":130},"irkutsk":{"lat":52.287,"lon":104.305,"alt":440},"иркутск":{"lat":52.287,"lon":104.305,"alt":440},"khabarovsk":{"lat":48.4827,"lon":135.084,"alt":70},"хабаровск":{"lat":48.4827,"lon":135.084,"alt":70},"yaroslavl":{"lat":57.6261,"lon":39.8845,"alt":100},"ярославль":{"lat":57.6261,"lon":39.8845,"alt":100},"vladivostok":{"lat":43.1155,"lon":131.8855,"alt":30},"владивосток":{"lat":43.1155,"lon":131.8855,"alt":30},"влад":{"lat":43.1155,"lon":131.8855,"alt":30},"tomsk":{"lat":56.4977,"lon":84.9744,"alt":120},"томск":{"lat":56.4977,"lon":84.9744,"alt":120},"orenburg":{"lat":51.7682,"lon":55.097,"alt":130},"оренбург":{"lat":51.7682,"lon":55.097,"alt":130},"kemerovo":{"lat":55.3547,"lon":86.0872,"alt":140},"кемерово":{"lat":55.3547,"lon":86.0872,"alt":140},"novokuznetsk":{"lat":53.7596,"lon":87.1216,"alt":220},"новокузнецк":{"lat":53.7596,"lon":87.1216,"alt":220},"кузня":{"lat":53.7596,"lon":87.1216,"alt":220},"ryazan":{"lat":54.6295,"lon":39.7425,"alt":130},"рязань":{"lat":54.6295,"lon":39.7425,"alt":130},"astrakhan":{"lat":46.3497,"lon":48.0408,"alt":-20},"астрахань":{"lat":46.3497,"lon":48.0408,"alt":-20},"naberezhnye_chelny":{"lat":55.7437,"lon":52.4082,"alt":100},"набережные челны":{"lat":55.7437,"lon":52.4082,"alt":100},"челны":{"lat":55.7437,"lon":52.4082,"alt":100},"penza":{"lat":53.195,"lon":45.0183,"alt":150},"пенза":{"lat":53.195,"lon":45.0183,"alt":150},"lipetsk":{"lat":52.6103,"lon":39.5947,"alt":160},"липецк":{"lat":52.6103,"lon":39.5947,"alt":160},"tula":{"lat":54.1931,"lon":37.6173,"alt":170},"тула":{"lat":54.1931,"lon":37.6173,"alt":170},"kirov":{"lat":58.6035,"lon":49.6679,"alt":150},"киров":{"lat":58.6035,"lon":49.6679,"alt":150},"cheboksary":{"lat":56.1439,"lon":47.2489,"alt":140},"чебоксары":{"lat":56.1439,"lon":47.2489,"alt":140},"kaliningrad":{"lat":54.7104,"lon":20.4522,"alt":20},"калининград":{"lat":54.7104,"lon":20.4522,"alt":20},"кениг":{"lat":54.7104,"lon":20.4522,"alt":20},"sochi":{"lat":43.5855,"lon":39.7231,"alt":30},"сочи":{"lat":43.5855,"lon":39.7231,"alt":30},"адлер":{"lat":43.5855,"lon":39.7231,"alt":30},"surgut":{"lat":61.254,"lon":73.3962,"alt":40},"сургут":{"lat":61.254,"lon":73.3962,"alt":40},"sevastopol":{"lat":44.6167,"lon":33.5254,"alt":50},"севастополь":{"lat":44.6167,"lon":33.5254,"alt":50},"simferopol":{"lat":44.9521,"lon":34.1024,"alt":250},"симферополь":{"lat":44.9521,"lon":34.1024,"alt":250},"stavropol":{"lat":45.0428,"lon":41.9734,"alt":600},"ставрополь":{"lat":45.0428,"lon":41.9734,"alt":600},"makhachkala":{"lat":42.9849,"lon":47.5046,"alt":10},"махачкала":{"lat":42.9849,"lon":47.5046,"alt":10},"grozny":{"lat":43.3179,"lon":45.6982,"alt":130},"грозный":{"lat":43.3179,"lon":45.6982,"alt":130},"vladikavkaz":{"lat":43.0367,"lon":44.6678,"alt":670},"владикавказ":{"lat":43.0367,"lon":44.6678,"alt":670},"nalchik":{"lat":43.4853,"lon":43.6071,"alt":510},"нальчик":{"lat":43.4853,"lon":43.6071,"alt":510},"belgorod":{"lat":50.5954,"lon":36.5873,"alt":130},"белгород":{"lat":50.5954,"lon":36.5873,"alt":130},"kursk":{"lat":51.7304,"lon":36.1927,"alt":250},"курск":{"lat":51.7304,"lon":36.1927,"alt":250},"tver":{"lat":56.8587,"lon":35.9176,"alt":140},"тверь":{"lat":56.8587,"lon":35.9176,"alt":140},"ivanovo":{"lat":56.9972,"lon":40.9714,"alt":120},"иваново":{"lat":56.9972,"lon":40.9714,"alt":120},"bryansk":{"lat":53.2434,"lon":34.364,"alt":180},"брянск":{"lat":53.2434,"lon":34.364,"alt":180},"smolensk":{"lat":54.7826,"lon":32.0453,"alt":240},"смоленск":{"lat":54.7826,"lon":32.0453,"alt":240},"kaluga":{"lat":54.5138,"lon":36.2612,"alt":190},"калуга":{"lat":54.5138,"lon":36.2612,"alt":190},"murmansk":{"lat":68.9707,"lon":33.075,"alt":50},"мурманск":{"lat":68.9707,"lon":33.075,"alt":50},"arkhangelsk":{"lat":64.5399,"lon":40.5158,"alt":10},"архангельск":{"lat":64.5399,"lon":40.5158,"alt":10},"petrozavodsk":{"lat":61.7849,"lon":34.3469,"alt":60},"петрозаводск":{"lat":61.7849,"lon":34.3469,"alt":60},"chita":{"lat":52.0336,"lon":113.501,"alt":650},"чита":{"lat":52.0336,"lon":113.501,"alt":650},"yakutsk":{"lat":62.0355,"lon":129.6755,"alt":100},"якутск":{"lat":62.0355,"lon":129.6755,"alt":100},"minsk":{"lat":53.9006,"lon":27.559,"alt":220},"минск":{"lat":53.9006,"lon":27.559,"alt":220},"brest":{"lat":52.0976,"lon":23.7341,"alt":140},"брест":{"lat":52.0976,"lon":23.7341,"alt":140},"grodno":{"lat":53.6694,"lon":23.8131,"alt":130},"гродно":{"lat":53.6694,"lon":23.8131,"alt":130},"kiev":{"lat":50.4501,"lon":30.5234,"alt":179},"киев":{"lat":50.4501,"lon":30.5234,"alt":179},"kyiv":{"lat":50.4501,"lon":30.5234,"alt":179},"odessa":{"lat":46.4825,"lon":30.7233,"alt":40},"одесса":{"lat":46.4825,"lon":30.7233,"alt":40},"odesa":{"lat":46.4825,"lon":30.7233,"alt":40},"lviv":{"lat":49.8397,"lon":24.0297,"alt":290},"львов":{"lat":49.8397,"lon":24.0297,"alt":290},"львів":{"lat":49.8397,"lon":24.0297,"alt":290},"kharkiv":{"lat":49.9935,"lon":36.2304,"alt":150},"харьков":{"lat":49.9935,"lon":36.2304,"alt":150},"харків":{"lat":49.9935,"lon":36.2304,"alt":150},"dnipro":{"lat":48.4647,"lon":35.0462,"alt":60},"днепр":{"lat":48.4647,"lon":35.0462,"alt":60},"днепропетровск":{"lat":48.4647,"lon":35.0462,"alt":60},"almaty":{"lat":43.222,"lon":76.8512,"alt":785},"алматы":{"lat":43.222,"lon":76.8512,"alt":785},"алма-ата":{"lat":43.222,"lon":76.8512,"alt":785},"алмаата":{"lat":43.222,"lon":76.8512,"alt":785},"astana":{"lat":51.1694,"lon":71.4491,"alt":347},"астана":{"lat":51.1694,"lon":71.4491,"alt":347},"нур-султан":{"lat":51.1694,"lon":71.4491,"alt":347},"нурсултан":{"lat":51.1694,"lon":71.4491,"alt":347},"shymkent":{"lat":42.3417,"lon":69.5901,"alt":500},"шымкент":{"lat":42.3417,"lon":69.5901,"alt":500},"чимкент":{"lat":42.3417,"lon":69.5901,"alt":500},"tashkent":{"lat":41.2995,"lon":69.2401,"alt":450},"ташкент":{"lat":41.2995,"lon":69.2401,"alt":450},"samarkand":{"lat":39.6542,"lon":66.9597,"alt":700},"самарканд":{"lat":39.6542,"lon":66.9597,"alt":700},"bishkek":{"lat":42.8746,"lon":74.5698,"alt":800},"бишкек":{"lat":42.8746,"lon":74.5698,"alt":800},"tbilisi":{"lat":41.7151,"lon":44.8271,"alt":490},"тбилиси":{"lat":41.7151,"lon":44.8271,"alt":490},"batumi":{"lat":41.6416,"lon":41.6359,"alt":10},"батуми":{"lat":41.6416,"lon":41.6359,"alt":10},"yerevan":{"lat":40.1792,"lon":44.4991,"alt":989},"ереван":{"lat":40.1792,"lon":44.4991,"alt":989},"baku":{"lat":40.4093,"lon":49.8671,"alt":-28},"баку":{"lat":40.4093,"lon":49.8671,"alt":-28},"chisinau":{"lat":47.0105,"lon":28.8638,"alt":80},"кишинев":{"lat":47.0105,"lon":28.8638,"alt":80},"кишинэу":{"lat":47.0105,"lon":28.8638,"alt":80},"dubai":{"lat":25.2048,"lon":55.2708,"alt":5},"дубай":{"lat":25.2048,"lon":55.2708,"alt":5},"abu_dhabi":{"lat":24.4539,"lon":54.3773,"alt":10},"абу-даби":{"lat":24.4539,"lon":54.3773,"alt":10},"абудаби":{"lat":24.4539,"lon":54.3773,"alt":10},"istanbul":{"lat":41.0082,"lon":28.9784,"alt":40},"стамбул":{"lat":41.0082,"lon":28.9784,"alt":40},"antalya":{"lat":36.8969,"lon":30.7133,"alt":30},"анталья":{"lat":36.8969,"lon":30.7133,"alt":30},"анталия":{"lat":36.8969,"lon":30.7133,"alt":30},"phuket":{"lat":7.8804,"lon":98.3923,"alt":10},"пхукет":{"lat":7.8804,"lon":98.3923,"alt":10},"bangkok":{"lat":13.7563,"lon":100.5018,"alt":5},"бангкок":{"lat":13.7563,"lon":100.5018,"alt":5},"bali":{"lat":-8.6705,"lon":115.2126,"alt":20},"бали":{"lat":-8.6705,"lon":115.2126,"alt":20},"денпасар":{"lat":-8.6705,"lon":115.2126,"alt":20},"london":{"lat":51.5074,"lon":-0.1278,"alt":25},"лондон":{"lat":51.5074,"lon":-0.1278,"alt":25},"paris":{"lat":48.8566,"lon":2.3522,"alt":35},"париж":{"lat":48.8566,"lon":2.3522,"alt":35},"berlin":{"lat":52.52,"lon":13.405,"alt":34},"берлин":{"lat":52.52,"lon":13.405,"alt":34},"rome":{"lat":41.9028,"lon":12.4964,"alt":20},"рим":{"lat":41.9028,"lon":12.4964,"alt":20},"barcelona":{"lat":41.3879,"lon":2.1699,"alt":12},"барселона":{"lat":41.3879,"lon":2.1699,"alt":12},"madrid":{"lat":40.4168,"lon":-3.7038,"alt":650},"мадрид":{"lat":40.4168,"lon":-3.7038,"alt":650},"warsaw":{"lat":52.2297,"lon":21.0122,"alt":100},"варшава":{"lat":52.2297,"lon":21.0122,"alt":100},"prague":{"lat":50.0755,"lon":14.4378,"alt":200},"прага":{"lat":50.0755,"lon":14.4378,"alt":200},"vienna":{"lat":48.2082,"lon":16.3738,"alt":190},"вена":{"lat":48.2082,"lon":16.3738,"alt":190},"amsterdam":{"lat":52.3676,"lon":4.9041,"alt":2},"амстердам":{"lat":52.3676,"lon":4.9041,"alt":2},"newyork":{"lat":40.7128,"lon":-74.006,"alt":10},"нью-йорк":{"lat":40.7128,"lon":-74.006,"alt":10},"ньюйорк":{"lat":40.7128,"lon":-74.006,"alt":10},"nyc":{"lat":40.7128,"lon":-74.006,"alt":10},"los_angeles":{"lat":34.0522,"lon":-118.2437,"alt":71},"лос-анджелес":{"lat":34.0522,"lon":-118.2437,"alt":71},"ла":{"lat":34.0522,"lon":-118.2437,"alt":71},"la":{"lat":34.0522,"lon":-118.2437,"alt":71},"miami":{"lat":25.7617,"lon":-80.1918,"alt":2},"майами":{"lat":25.7617,"lon":-80.1918,"alt":2},"tokyo":{"lat":35.6762,"lon":139.6503,"alt":40},"токио":{"lat":35.6762,"lon":139.6503,"alt":40},"seoul":{"lat":37.5665,"lon":126.978,"alt":38},"сеул":{"lat":37.5665,"lon":126.978,"alt":38},"singapore":{"lat":1.3521,"lon":103.8198,"alt":15},"сингапур":{"lat":1.3521,"lon":103.8198,"alt":15},"hong_kong":{"lat":22.3193,"lon":114.1694,"alt":10},"гонконг":{"lat":22.3193,"lon":114.1694,"alt":10},"cupertino":{"lat":37.3349,"lon":-122.00902,"alt":72},"купертино":{"lat":37.3349,"lon":-122.00902,"alt":72},"apple":{"lat":37.3349,"lon":-122.00902,"alt":72}};

  function lookupCity(name) {
    if (!name) return null;
    var key = String(name).trim().toLowerCase();
    return CITY_PRESETS[key] || null;
  }

  var DEFAULT_CONFIG = {
    city: "custom",
    enabled: true,
    mode: "response",
    latitude: 55.7558,
    longitude: 37.6173,
    horizontalAccuracy: 39,
    verticalAccuracy: 1000,
    altitude: 156,
    unknownValue4: 3,
    motionActivityType: 63,
    motionActivityConfidence: 467,
    failOpen: true,
    debug: false,
    dumpRaw: false,
    dumpHeaders: false,
    prepareHeaders: false,
    rawLimit: 0
  };

  // Prefix prepended to a SPOOFED (synthesized) response. Mirrors the original Go
  // `initialBytes = 0001000000010000` from main.go:253.
  var APPLE_WLOC_PREFIX = bytesFromArray([0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00]);

  // Stable marker that precedes the AppleWLoc protobuf inside a REAL Apple /clls/wloc
  // response. After the marker come 2 bytes (uint16 BE payload length) then the payload.
  var APPLE_WLOC_MARKER = bytesFromArray([0x00, 0x00, 0x00, 0x01, 0x00, 0x00]);
  var ROOT_DROP_FIELDS = {};
  var CELL_RESPONSE_FIELDS = { 22: true, 24: true };
  // Location sub-messages only modify Latitude (1), Longitude (2), and Accuracy (3). Other fields
  // (altitude, vertical accuracy, motion state, etc.) are passed through as-is.
  // Over-modifying fields causes iOS validation to fail with "Location Unavailable".
  var LOCATION_REPLACED_FIELDS = { 1: true, 2: true, 3: true };

  function bytesFromArray(values) {
    return new Uint8Array(values);
  }

  function concatBytes(parts) {
    var total = 0;
    var i;
    for (i = 0; i < parts.length; i += 1) {
      total += parts[i].length;
    }

    var out = new Uint8Array(total);
    var offset = 0;
    for (i = 0; i < parts.length; i += 1) {
      out.set(parts[i], offset);
      offset += parts[i].length;
    }
    return out;
  }

  function bytesEqualPrefix(bytes, prefix) {
    if (!bytes || bytes.length < prefix.length) {
      return false;
    }
    for (var i = 0; i < prefix.length; i += 1) {
      if (bytes[i] !== prefix[i]) {
        return false;
      }
    }
    return true;
  }

  // Search for a byte sequence within bytes; returns first index or -1.
  // Searches forward to prefer the earliest (most likely correct) match.
  function findBytes(bytes, marker) {
    if (!bytes || !marker || marker.length === 0) {
      return -1;
    }
    for (var i = 0; i <= bytes.length - marker.length; i += 1) {
      var ok = true;
      for (var j = 0; j < marker.length; j += 1) {
        if (bytes[i + j] !== marker[j]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return i;
      }
    }
    return -1;
  }

  // Try to parse bytes as protobuf fields. Returns fields array or null on failure.
  function tryParseFields(bytes) {
    try {
      if (!bytes || bytes.length === 0) {
        return null;
      }
      var fields = parseFields(bytes);
      return fields.length > 0 ? fields : null;
    } catch (e) {
      return null;
    }
  }

  function binaryStringToBytes(value) {
    var out = new Uint8Array(value.length);
    for (var i = 0; i < value.length; i += 1) {
      out[i] = value.charCodeAt(i) & 0xff;
    }
    return out;
  }

  function bytesToBinaryString(bytes) {
    var chunkSize = 0x8000;
    var chunks = [];
    for (var i = 0; i < bytes.length; i += chunkSize) {
      var chunk = bytes.subarray(i, i + chunkSize);
      chunks.push(String.fromCharCode.apply(null, Array.prototype.slice.call(chunk)));
    }
    return chunks.join("");
  }

  function bytesToBase64(bytes) {
    var alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    var out = "";
    for (var i = 0; i < bytes.length; i += 3) {
      var b0 = bytes[i];
      var b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
      var b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
      var triplet = (b0 << 16) | (b1 << 8) | b2;
      out += alphabet[(triplet >> 18) & 0x3f];
      out += alphabet[(triplet >> 12) & 0x3f];
      out += i + 1 < bytes.length ? alphabet[(triplet >> 6) & 0x3f] : "=";
      out += i + 2 < bytes.length ? alphabet[triplet & 0x3f] : "=";
    }
    return out;
  }

  function hexPreview(bytes, limit) {
    if (!bytes) {
      return "<none>";
    }
    var out = [];
    var max = Math.min(bytes.length, limit || 16);
    for (var i = 0; i < max; i += 1) {
      out.push(("0" + bytes[i].toString(16)).slice(-2));
    }
    return out.join("");
  }

  function bodyToBytes(body) {
    if (body == null) {
      return null;
    }
    if (body instanceof Uint8Array) {
      return body;
    }
    if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) {
      return new Uint8Array(body);
    }
    if (typeof body === "string") {
      return binaryStringToBytes(body);
    }
    if (typeof body === "object" && typeof body.length === "number") {
      return new Uint8Array(body);
    }
    if (typeof body === "object" && body.bytes && typeof body.bytes.length === "number") {
      return new Uint8Array(body.bytes);
    }
    if (typeof body === "object" && body.data && typeof body.data.length === "number") {
      return new Uint8Array(body.data);
    }
    return null;
  }

  function messageBodyToBytes(message) {
    if (!message) {
      return null;
    }
    return (
      bodyToBytes(message.bodyBytes) ||
      bodyToBytes(message.body) ||
      bodyToBytes(message.rawBody) ||
      bodyToBytes(message.binaryBody)
    );
  }

  function readUInt16BE(bytes, offset) {
    if (offset + 2 > bytes.length) {
      throw new Error("uint16 out of range");
    }
    return (bytes[offset] << 8) | bytes[offset + 1];
  }

  function readUInt32BE(bytes, offset) {
    if (offset + 4 > bytes.length) {
      throw new Error("uint32 out of range");
    }
    return (
      (bytes[offset] * 0x1000000) +
      ((bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3])
    ) >>> 0;
  }

  function writeUInt16BE(value) {
    if (value < 0 || value > 0xffff) {
      throw new Error("uint16 value out of range: " + value);
    }
    return bytesFromArray([(value >> 8) & 0xff, value & 0xff]);
  }

  function writeUInt32BE(value) {
    return bytesFromArray([
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    ]);
  }

  function asciiBytes(value) {
    var out = new Uint8Array(value.length);
    for (var i = 0; i < value.length; i += 1) {
      out[i] = value.charCodeAt(i) & 0x7f;
    }
    return out;
  }

  // iOS 12 JavaScriptCore cannot parse BigInt literals. Represent uint64 values
  // as unsigned high/low 32-bit words so negative coordinates still use the
  // canonical 10-byte protobuf int64 encoding.
  var UINT32_BASE = 4294967296;
  var MAX_SAFE_INTEGER = 9007199254740991;

  function uint64FromUnsignedNumber(value) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0 || Math.floor(number) !== number || number > MAX_SAFE_INTEGER) {
      throw new Error("invalid unsigned varint value: " + value);
    }
    return {
      low: number >>> 0,
      high: Math.floor(number / UINT32_BASE) >>> 0
    };
  }

  function uint64FromSignedNumber(value) {
    var number = Math.trunc(Number(value));
    if (!Number.isFinite(number) || Math.abs(number) > MAX_SAFE_INTEGER) {
      throw new Error("invalid signed int64 value: " + value);
    }
    if (number >= 0) {
      return uint64FromUnsignedNumber(number);
    }

    var magnitude = uint64FromUnsignedNumber(-number);
    var low = (~magnitude.low + 1) >>> 0;
    var carry = low === 0 ? 1 : 0;
    return {
      low: low,
      high: (~magnitude.high + carry) >>> 0
    };
  }

  function uint64ToSafeNumber(words) {
    var value = (words.high >>> 0) * UINT32_BASE + (words.low >>> 0);
    if (value > MAX_SAFE_INTEGER) {
      throw new Error("uint64 exceeds safe integer range");
    }
    return value;
  }

  function uint64ToSignedNumber(words) {
    var low = words.low >>> 0;
    var high = words.high >>> 0;
    if ((high & 0x80000000) === 0) {
      return uint64ToSafeNumber({ low: low, high: high });
    }

    var magnitudeLow = (~low + 1) >>> 0;
    var carry = magnitudeLow === 0 ? 1 : 0;
    var magnitudeHigh = (~high + carry) >>> 0;
    var magnitude = magnitudeHigh * UINT32_BASE + magnitudeLow;
    if (magnitude > MAX_SAFE_INTEGER) {
      throw new Error("int64 exceeds safe integer range");
    }
    return -magnitude;
  }

  function encodeVarintWords(words) {
    var low = words.low >>> 0;
    var high = words.high >>> 0;
    var out = [];

    while (high !== 0 || low >= 0x80) {
      out.push((low & 0x7f) | 0x80);
      low = ((low >>> 7) | (high << 25)) >>> 0;
      high = high >>> 7;
    }
    out.push(low & 0x7f);
    return bytesFromArray(out);
  }

  function encodeVarintUnsigned(value) {
    return encodeVarintWords(uint64FromUnsignedNumber(value));
  }

  function encodeVarintSignedInt64(value) {
    return encodeVarintWords(uint64FromSignedNumber(value));
  }

  function decodeVarint(bytes, offset) {
    var low = 0;
    var high = 0;
    var shift = 0;
    var current = offset;
    var count = 0;

    while (current < bytes.length && count < 10) {
      var b = bytes[current];
      var payload = b & 0x7f;
      current += 1;
      count += 1;

      if (shift < 32) {
        low = (low | ((payload << shift) >>> 0)) >>> 0;
        if (shift > 25) {
          high = (high | (payload >>> (32 - shift))) >>> 0;
        }
      } else {
        if (shift === 63 && payload > 1) {
          throw new Error("varint exceeds uint64 range");
        }
        high = (high | ((payload << (shift - 32)) >>> 0)) >>> 0;
      }

      if ((b & 0x80) === 0) {
        return { low: low, high: high, offset: current };
      }
      shift += 7;
    }

    if (count >= 10) {
      throw new Error("varint too long");
    }
    throw new Error("unterminated varint");
  }

  function makeKey(fieldNumber, wireType) {
    return encodeVarintUnsigned(fieldNumber * 8 + wireType);
  }

  function makeVarintField(fieldNumber, value) {
    return concatBytes([makeKey(fieldNumber, 0), encodeVarintSignedInt64(value)]);
  }

  function makeLengthDelimitedField(fieldNumber, payload) {
    return concatBytes([makeKey(fieldNumber, 2), encodeVarintUnsigned(payload.length), payload]);
  }

  function parseFields(bytes) {
    var fields = [];
    var offset = 0;

    while (offset < bytes.length) {
      var keyStart = offset;
      var key = decodeVarint(bytes, offset);
      offset = key.offset;

      var keyValue = uint64ToSafeNumber(key);
      var fieldNumber = Math.floor(keyValue / 8);
      var wireType = keyValue & 0x7;
      if (fieldNumber === 0) {
        throw new Error("protobuf field number 0");
      }

      var valueStart = offset;
      var valueEnd;
      if (wireType === 0) {
        valueEnd = decodeVarint(bytes, offset).offset;
      } else if (wireType === 1) {
        valueEnd = offset + 8;
      } else if (wireType === 2) {
        var lengthInfo = decodeVarint(bytes, offset);
        var length = uint64ToSafeNumber(lengthInfo);
        valueStart = lengthInfo.offset;
        valueEnd = valueStart + length;
      } else if (wireType === 5) {
        valueEnd = offset + 4;
      } else {
        throw new Error("unsupported protobuf wire type: " + wireType);
      }

      if (valueEnd > bytes.length) {
        throw new Error("protobuf field exceeds buffer");
      }

      fields.push({
        fieldNumber: fieldNumber,
        wireType: wireType,
        keyStart: keyStart,
        valueStart: valueStart,
        valueEnd: valueEnd,
        end: valueEnd,
        raw: bytes.slice(keyStart, valueEnd),
        valueBytes: bytes.slice(valueStart, valueEnd)
      });
      offset = valueEnd;
    }

    return fields;
  }

  function firstFieldByNumber(fields, fieldNumber) {
    for (var i = 0; i < fields.length; i += 1) {
      if (fields[i].fieldNumber === fieldNumber) {
        return fields[i];
      }
    }
    return null;
  }

  function signedVarintFieldValue(field) {
    if (!field || field.wireType !== 0) {
      return null;
    }
    return uint64ToSignedNumber(decodeVarint(field.valueBytes, 0));
  }

  function locationSummary(locationPayload) {
    try {
      var fields = parseFields(locationPayload);
      var lat = signedVarintFieldValue(firstFieldByNumber(fields, 1));
      var lon = signedVarintFieldValue(firstFieldByNumber(fields, 2));
      if (lat == null || lon == null) {
        return "<missing>";
      }
      return (lat / 100000000).toFixed(8) + "," + (lon / 100000000).toFixed(8);
    } catch (err) {
      return "<parse-failed:" + err.message + ">";
    }
  }

  function patchedPayloadSummary(payload) {
    try {
      var rootFields = parseFields(payload);
      var parts = [];
      var wifi = firstFieldByNumber(rootFields, 2);
      if (wifi && wifi.wireType === 2) {
        var wifiLocation = firstFieldByNumber(parseFields(wifi.valueBytes), 2);
        parts.push("firstWifi=" + (wifiLocation ? locationSummary(wifiLocation.valueBytes) : "<missing>"));
      }
      var cell = firstCellResponseField(rootFields);
      if (cell && cell.wireType === 2) {
        var cellLocation = firstFieldByNumber(parseFields(cell.valueBytes), 5);
        parts.push("firstCell=" + (cellLocation ? locationSummary(cellLocation.valueBytes) : "<missing>"));
      }
      return parts.length ? parts.join(", ") : "no wifi/cell location fields";
    } catch (err) {
      return "summary failed: " + err.message;
    }
  }

  function isCellResponseField(fieldNumber) {
    return CELL_RESPONSE_FIELDS[fieldNumber] === true;
  }

  function firstCellResponseField(fields) {
    for (var i = 0; i < fields.length; i += 1) {
      if (isCellResponseField(fields[i].fieldNumber)) {
        return fields[i];
      }
    }
    return null;
  }

  function coordToInt(value) {
    // Use Math.trunc to accurately match Go: int64(coord * 1e8)
    return Math.trunc(Number(value) * 100000000);
  }

  function parseBoolean(value, defaultValue) {
    if (value === true || value === false) {
      return value;
    }
    if (typeof value === "string") {
      var normalized = value.trim().toLowerCase();
      if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
        return true;
      }
      if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
        return false;
      }
    }
    return defaultValue;
  }

  function normalizeConfig(input) {
    var cfg = {};
    var key;
    for (key in DEFAULT_CONFIG) {
      if (Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key)) {
        cfg[key] = DEFAULT_CONFIG[key];
      }
    }
    input = input || {};
    for (key in input) {
      if (Object.prototype.hasOwnProperty.call(input, key)) {
        cfg[key] = input[key];
      }
    }

    cfg.enabled = parseBoolean(cfg.enabled, true);
    cfg.failOpen = parseBoolean(cfg.failOpen, true);
    var rawCity = "";
    if (input && input["город"] !== undefined) rawCity = input["город"];
    else if (input && input.city !== undefined) rawCity = input.city;
    else if (cfg["город"] !== undefined) rawCity = cfg["город"];
    else if (cfg.city !== undefined) rawCity = cfg.city;
    try { rawCity = decodeURIComponent(rawCity); } catch (e) {}
    rawCity = String(rawCity || "").trim();
        if (isPlaceholderValue(rawCity)) rawCity = "";
        cfg.city = rawCity.toLowerCase();

    if (cfg["широта"] !== undefined && !isPlaceholderValue(cfg["широта"])) cfg.latitude = cfg["широта"];
        if (cfg["долгота"] !== undefined && !isPlaceholderValue(cfg["долгота"])) cfg.longitude = cfg["долгота"];
        if (cfg["высота"] !== undefined && !isPlaceholderValue(cfg["высота"])) cfg.altitude = cfg["высота"];
        if (isPlaceholderValue(cfg.latitude)) cfg.latitude = DEFAULT_CONFIG.latitude;
        if (isPlaceholderValue(cfg.longitude)) cfg.longitude = DEFAULT_CONFIG.longitude;
        if (isPlaceholderValue(cfg.altitude)) cfg.altitude = DEFAULT_CONFIG.altitude;

    var isManual = !cfg.city || cfg.city === "custom" || cfg.city === "вручную" || cfg.city === "none" || cfg.city === "-";
    if (!isManual) {
      var preset = lookupCity(cfg.city);
      if (preset) {
        cfg.latitude = preset.lat;
        cfg.longitude = preset.lon;
        if (preset.alt !== undefined) {
          cfg.altitude = preset.alt;
        }
      } else {
        // City not found in presets -> Safe fallback & Post notification
                        try {
          var storeObj = (typeof $persistentStore !== "undefined") ? $persistentStore : null;
          var notifObj = (typeof $notification !== "undefined") ? $notification : null;
          var lastCity = storeObj ? storeObj.read("SR_SPOOF_LAST_NOTIF") : null;
          if (lastCity !== cfg.city && notifObj) {
            var notifTitle = "iOS Location Spoofer";
            var notifSub = "Город «" + cfg.city + "» не найден в базе";
            var notifBody = "Применены ручные координаты: " + cfg.latitude + ", " + cfg.longitude + " (" + cfg.altitude + " м)";
            notifObj.post(notifTitle, notifSub, notifBody);
            if (storeObj) {
              storeObj.write(cfg.city, "SR_SPOOF_LAST_NOTIF");
            }
          }
        } catch (errNotif) {}
      }
    }

    var mode = String(cfg.mode || "response").toLowerCase();
    cfg.mode = mode === "request" || mode === "prepare" || mode === "probe" || mode === "inspect" ? mode : "response";
    cfg.latitude = Number(cfg.latitude);
    cfg.longitude = Number(cfg.longitude);
    cfg.horizontalAccuracy = Math.trunc(Number(cfg.horizontalAccuracy));
    cfg.verticalAccuracy = Math.trunc(Number(cfg.verticalAccuracy));
    cfg.altitude = Math.trunc(Number(cfg.altitude));
    cfg.unknownValue4 = Math.trunc(Number(cfg.unknownValue4));
    cfg.motionActivityType = Math.trunc(Number(cfg.motionActivityType));
    cfg.motionActivityConfidence = Math.trunc(Number(cfg.motionActivityConfidence));
    cfg.dumpRaw = cfg.dumpRaw === true || String(cfg.dumpRaw).toLowerCase() === "true";
    cfg.dumpHeaders = cfg.dumpHeaders === true || String(cfg.dumpHeaders).toLowerCase() === "true";
    cfg.prepareHeaders = cfg.prepareHeaders === true || String(cfg.prepareHeaders).toLowerCase() === "true";
    cfg.rawLimit = Math.trunc(Number(cfg.rawLimit || 0));
    if (!Number.isFinite(cfg.rawLimit) || cfg.rawLimit < 0) {
      cfg.rawLimit = 0;
    }

    if (!Number.isFinite(cfg.latitude) || cfg.latitude < -90 || cfg.latitude > 90) {
      throw new Error("invalid latitude");
    }
    if (!Number.isFinite(cfg.longitude) || cfg.longitude < -180 || cfg.longitude > 180) {
      throw new Error("invalid longitude");
    }
    return cfg;
  }

  function patchLocation(locationPayload, config) {
    // Minimal rewrite: replace Latitude (1), Longitude (2), Accuracy (3), Altitude (5).
    // If the sub-message lacks lat/lon, pass it through untouched to prevent corrupting
    // the response and causing iOS "Location Unavailable".
    var parts = [];
    var fields = locationPayload.length ? parseFields(locationPayload) : [];
    var hasLat = false;
    var hasLon = false;
    var hasAlt = false;
    var i;
    for (i = 0; i < fields.length; i += 1) {
      if (fields[i].fieldNumber === 1 && fields[i].wireType === 0) hasLat = true;
      if (fields[i].fieldNumber === 2 && fields[i].wireType === 0) hasLon = true;
      if (fields[i].fieldNumber === 5 && fields[i].wireType === 0) hasAlt = true;
    }
    if (!hasLat || !hasLon) {
      return locationPayload;
    }
    for (i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      if (field.fieldNumber === 1 && field.wireType === 0) {
        parts.push(makeVarintField(1, coordToInt(config.latitude)));
      } else if (field.fieldNumber === 2 && field.wireType === 0) {
        parts.push(makeVarintField(2, coordToInt(config.longitude)));
      } else if (field.fieldNumber === 3 && field.wireType === 0) {
        parts.push(makeVarintField(3, config.horizontalAccuracy));
      } else if (field.fieldNumber === 5 && field.wireType === 0) {
        parts.push(makeVarintField(5, config.altitude));
      } else {
        parts.push(field.raw);
      }
    }
    if (!hasAlt && Number.isFinite(config.altitude)) {
      parts.push(makeVarintField(5, config.altitude));
    }
    return concatBytes(parts);
  }

  function patchWifiDevice(wifiPayload, config) {
    var fields = parseFields(wifiPayload);
    var parts = [];

    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      if (field.fieldNumber === 2 && field.wireType === 2) {
        parts.push(makeLengthDelimitedField(2, patchLocation(field.valueBytes, config)));
      } else {
        parts.push(field.raw);
      }
    }

    return concatBytes(parts);
  }

  function patchCellTower(cellPayload, config) {
    var fields = parseFields(cellPayload);
    var parts = [];

    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      if (field.fieldNumber === 5 && field.wireType === 2) {
        parts.push(makeLengthDelimitedField(5, patchLocation(field.valueBytes, config)));
      } else {
        parts.push(field.raw);
      }
    }

    return concatBytes(parts);
  }

  function patchAppleWLocPayload(payload, config) {
    var fields = parseFields(payload);
    var parts = [];
    var wifiCount = 0;
    var cellCount = 0;

    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i];
      if (field.fieldNumber === 2 && field.wireType === 2) {
        parts.push(makeLengthDelimitedField(2, patchWifiDevice(field.valueBytes, config)));
        wifiCount += 1;
      } else if (isCellResponseField(field.fieldNumber) && field.wireType === 2) {
        parts.push(makeLengthDelimitedField(field.fieldNumber, patchCellTower(field.valueBytes, config)));
        cellCount += 1;
      } else {
        // Preserve all other root fields as-is to avoid dropping verification info required by iOS
        parts.push(field.raw);
      }
    }

    return { payload: concatBytes(parts), wifiCount: wifiCount, cellCount: cellCount };
  }

  function readPascalString(bytes, state) {
    var length = readUInt16BE(bytes, state.offset);
    state.offset += 2;
    if (state.offset + length > bytes.length) {
      throw new Error("ARPC pascal string exceeds buffer");
    }

    var chars = [];
    for (var i = 0; i < length; i += 1) {
      chars.push(String.fromCharCode(bytes[state.offset + i]));
    }
    state.offset += length;
    return chars.join("");
  }

  function writePascalString(value) {
    var bytes = asciiBytes(value);
    return concatBytes([writeUInt16BE(bytes.length), bytes]);
  }

  function parseArpc(bytes) {
    var state = { offset: 0 };
    var version = readUInt16BE(bytes, state.offset);
    state.offset += 2;
    var locale = readPascalString(bytes, state);
    var appIdentifier = readPascalString(bytes, state);
    var osVersion = readPascalString(bytes, state);
    var functionId = readUInt32BE(bytes, state.offset);
    state.offset += 4;
    var payloadLength = readUInt32BE(bytes, state.offset);
    state.offset += 4;

    if (state.offset + payloadLength > bytes.length) {
      throw new Error("ARPC payload exceeds buffer");
    }

    return {
      version: version,
      locale: locale,
      appIdentifier: appIdentifier,
      osVersion: osVersion,
      functionId: functionId,
      payload: bytes.slice(state.offset, state.offset + payloadLength)
    };
  }

  function serializeArpc(arpc) {
    return concatBytes([
      writeUInt16BE(arpc.version),
      writePascalString(arpc.locale),
      writePascalString(arpc.appIdentifier),
      writePascalString(arpc.osVersion),
      writeUInt32BE(arpc.functionId),
      writeUInt32BE(arpc.payload.length),
      arpc.payload
    ]);
  }

  function buildAppleWLocResponse(payload, prefix) {
    return concatBytes([prefix || APPLE_WLOC_PREFIX, writeUInt16BE(payload.length), payload]);
  }

  function extractPrefixedAppleWLocPayload(responseBytes) {
    if (!responseBytes || responseBytes.length < 10) {
      return null;
    }
    if (responseBytes[0] !== 0x00 || responseBytes[1] !== 0x01) {
      return null;
    }
    if (responseBytes[6] !== 0x00 || responseBytes[7] !== 0x00) {
      return null;
    }

    var payloadLength = readUInt16BE(responseBytes, 8);
    var payloadOffset = 10;
    if (payloadLength <= 0 || payloadOffset + payloadLength > responseBytes.length) {
      return null;
    }

    var payload = responseBytes.slice(payloadOffset, payloadOffset + payloadLength);
    if (tryParseFields(payload) === null) {
      return null;
    }

    return {
      kind: "synthetic",
      payload: payload,
      prefix: responseBytes.slice(0, 8),
      suffix: responseBytes.slice(payloadOffset + payloadLength)
    };
  }

  // Extract the AppleWLoc protobuf payload from a /clls/wloc response body.
  // Returns a typed result: { kind, payload, ... } so the caller can write back
  // in the correct format.
  //
  // Supported shapes:
  //   "arpc"      – Full ARPC envelope (same format as requests). The real Apple
  //                 response uses this. Contains arpc metadata for write-back.
  //   "synthetic" – Our own spoofed response: APPLE_WLOC_PREFIX (8 bytes) + uint16 len.
  //   "marker"    – Fallback: marker search 00 00 00 01 00 00 + uint16 len.
  //                 Keeps the prefix/suffix bytes for write-back.
  //   "bare"      – Bare protobuf payload (field tag 0x12 = wifi device, wire type 2).
  function extractAppleWLocPayload(responseBytes) {
    if (!responseBytes || responseBytes.length < 2) {
      throw new Error("Apple WLoc response too short");
    }

    // Shape 1: prefixed WLoc response. The original Go implementation emits
    // 0001000000010000, while Apple's live responses may use 0001000000030000.
    var prefixed = extractPrefixedAppleWLocPayload(responseBytes);
    if (prefixed) {
      return prefixed;
    }

    // Shape 2: ARPC envelope – try the proper structured parser first.
    // The Apple /clls/wloc response uses the same ARPC framing as the request.
    try {
      var arpc = parseArpc(responseBytes);
      if (arpc.payload.length > 0 && tryParseFields(arpc.payload) !== null) {
        return {
          kind: "arpc",
          payload: arpc.payload,
          arpc: arpc
        };
      }
    } catch (e) {
      // ARPC parse failed – continue with fallback strategies.
    }

    // Shape 3: marker search fallback. The ARPC functionId (00 00 00 01) may be
    // followed by uint16/uint32 payload length. Try to find and validate.
    var markerIdx = findBytes(responseBytes, APPLE_WLOC_MARKER);
    if (markerIdx >= 0) {
      var lenOffset = markerIdx + APPLE_WLOC_MARKER.length;
      if (lenOffset + 2 <= responseBytes.length) {
        var realLen = readUInt16BE(responseBytes, lenOffset);
        var realPayloadOffset = lenOffset + 2;
        if (realLen > 0 && realPayloadOffset + realLen <= responseBytes.length) {
          var candidatePayload = responseBytes.slice(realPayloadOffset, realPayloadOffset + realLen);
          // Only accept if the candidate parses as valid protobuf.
          if (tryParseFields(candidatePayload) !== null) {
            return {
              kind: "marker",
              payload: candidatePayload,
              prefix: responseBytes.slice(0, markerIdx),
              markerAndLen: responseBytes.slice(markerIdx, realPayloadOffset),
              suffix: responseBytes.slice(realPayloadOffset + realLen)
            };
          }
        }
      }
    }

    // Shape 4: bare protobuf payload (best effort).
    if (looksLikeAppleWLocPayload(responseBytes)) {
      return {
        kind: "bare",
        payload: responseBytes
      };
    }

    throw new Error("missing Apple WLoc response prefix");
  }

  // Heuristic: a valid AppleWLoc payload starts with a protobuf tag whose wire type
  // is 0 or 2 and field number is > 0. Field 2 (wifi) tag is 0x12.
  function looksLikeAppleWLocPayload(bytes) {
    if (!bytes || bytes.length === 0) {
      return false;
    }
    var tag = bytes[0];
    var fieldNumber = tag >> 3;
    var wireType = tag & 0x7;
    return fieldNumber > 0 && (wireType === 0 || wireType === 2);
  }

  function spoofArpcRequest(requestBytes, configInput) {
    var config = normalizeConfig(configInput);
    var arpc = parseArpc(requestBytes);
    var patched = patchAppleWLocPayload(arpc.payload, config);
    return {
      response: buildAppleWLocResponse(patched.payload),
      payload: patched.payload,
      wifiCount: patched.wifiCount,
      cellCount: patched.cellCount,
      arpc: arpc
    };
  }

    // Raw byte scanning fallback.
  // Fallback scenario: If future iOS versions modify the /clls/wloc envelope structure and standard
  // parsers fail, scanning the buffer directly for mutable WLOC protobuf fields (wifi field 2 / cell 22/24)
  // allows replacing coordinates and wrapping into a standard synthetic response.
  // Matches dist script behavior.
  function scanPatchAppleWLoc(responseBytes, config) {
    if (!responseBytes || responseBytes.length < 8) {
      throw new Error("body too short for raw scan: " + (responseBytes ? responseBytes.length : 0));
    }
    var offsets = [];
    var i;
    var frameLimit = Math.min(96, Math.max(0, responseBytes.length - 10));
    for (i = 0; i <= frameLimit; i += 2) {
      offsets.push(i);
    }
    var rawLimit = Math.min(256, Math.max(0, responseBytes.length - 4));
    for (i = 0; i <= rawLimit; i += 1) {
      if (offsets.indexOf(i) < 0) {
        offsets.push(i);
      }
    }
    var errs = [];
    for (i = 0; i < offsets.length; i += 1) {
      var offset = offsets[i];
      try {
        var slice = responseBytes.slice(offset);
        if (!looksLikeAppleWLocPayload(slice)) {
          continue;
        }
        var patched = patchAppleWLocPayload(slice, config);
        if (patched.wifiCount > 0 || patched.cellCount > 0) {
          return {
            response: buildAppleWLocResponse(patched.payload),
            payload: patched.payload,
            wifiCount: patched.wifiCount,
            cellCount: patched.cellCount,
            kind: "raw",
            offset: offset
          };
        }
      } catch (err) {
        if (errs.length < 6) {
          errs.push("@" + offset + ":" + err.message);
        }
      }
    }
    throw new Error("raw scan found no patchable WLoc payload" + (errs.length ? ("; " + errs.join(" | ")) : ""));
  }

  function buildPatchedResponse(extraction, patched, config) {
    var response;
    if (extraction.kind === "arpc") {
      // Write back in ARPC format, preserving the original envelope metadata.
      var arpcOut = {
        version: extraction.arpc.version,
        locale: extraction.arpc.locale,
        appIdentifier: extraction.arpc.appIdentifier,
        osVersion: extraction.arpc.osVersion,
        functionId: extraction.arpc.functionId,
        payload: patched.payload
      };
      response = serializeArpc(arpcOut);
    } else if (extraction.kind === "marker") {
      // Rebuild: original prefix + marker bytes + new uint16 len + patched payload + suffix.
      var newLenBytes = writeUInt16BE(patched.payload.length);
      response = concatBytes([
        extraction.prefix,
        extraction.markerAndLen.slice(0, APPLE_WLOC_MARKER.length),
        newLenBytes,
        patched.payload,
        extraction.suffix
      ]);
    } else {
      // synthetic / bare – use the simple prefix format.
      response = buildAppleWLocResponse(patched.payload, extraction.prefix);
    }
    return {
      response: response,
      payload: patched.payload,
      wifiCount: patched.wifiCount,
      cellCount: patched.cellCount,
      kind: extraction.kind,
      prefix: extraction.prefix ? hexPreview(extraction.prefix, 8) : ""
    };
  }

  function spoofAppleResponse(responseBytes, configInput) {
    var config = normalizeConfig(configInput);
    var extraction = null;
    var strictError = null;
    try {
      extraction = extractAppleWLocPayload(responseBytes);
    } catch (err) {
      strictError = err;
    }

    if (extraction) {
      var patched = patchAppleWLocPayload(extraction.payload, config);
      if (patched.wifiCount > 0 || patched.cellCount > 0) {
        return buildPatchedResponse(extraction, patched, config);
      }
      strictError = new Error("no patchable location fields via " + extraction.kind);
    }

    // Standard envelopes did not match -> Raw byte scan fallback
    var raw = scanPatchAppleWLoc(responseBytes, config);
    return {
      response: raw.response,
      payload: raw.payload,
      wifiCount: raw.wifiCount,
      cellCount: raw.cellCount,
      kind: raw.kind,
      offset: raw.offset,
      strictError: strictError ? strictError.message : null
    };
  }

  function parseArgumentString(argument) {
    var result = {};
    if (!argument || typeof argument !== "string") {
      return result;
    }

    var tailKeys = [
      "debug",
      "mode",
      "enabled",
      "latitude",
      "longitude",
      "город",
      "широта",
      "долгота",
      "высота",
      "city",
      "altitude",
      "address",
      "configHost",
      "configToken",
      "horizontalAccuracy",
      "verticalAccuracy",
      "unknownValue4",
      "motionActivityType",
      "motionActivityConfidence",
      "failOpen",
      "dumpRaw",
      "dumpHeaders",
      "prepareHeaders",
      "rawLimit"
    ];
    var configUrlKey = "configUrl=";
    var configUrlIdx = argument.indexOf(configUrlKey);
    if (configUrlIdx >= 0) {
      var valueStart = configUrlIdx + configUrlKey.length;
      var tail = argument.slice(valueStart);
      var end = -1;
      var i;
      for (i = 0; i < tailKeys.length; i += 1) {
        var marker = "&" + tailKeys[i] + "=";
        var pos = tail.indexOf(marker);
        if (pos >= 0 && (end < 0 || pos < end)) {
          end = pos;
        }
      }
      var configUrlValue = end >= 0 ? tail.slice(0, end) : tail;
      try {
        result.configUrl = decodeURIComponent(configUrlValue);
      } catch (err) {
        result.configUrl = configUrlValue;
      }
      argument = argument.slice(0, configUrlIdx) + (end >= 0 ? tail.slice(end + 1) : "");
    }

    var pairs = argument.split(/[&;]/);
        var positional = [];
        for (var j = 0; j < pairs.length; j += 1) {
          var part = pairs[j];
          if (!part) continue;
          var eq = part.indexOf("=");
          if (eq >= 0) {
            var key = part.slice(0, eq);
            var value = part.slice(eq + 1);
            try { result[decodeURIComponent(key)] = decodeURIComponent(value); } catch (err2) { result[key] = value; }
          } else {
            try { positional.push(decodeURIComponent(part)); } catch (errPos) { positional.push(part); }
          }
        }
        if (positional.length > 0) {
          if (result["город"] === undefined && result.city === undefined && positional[0]) result["город"] = positional[0];
          if (result["широта"] === undefined && result.latitude === undefined && positional[1]) result["широта"] = positional[1];
          if (result["долгота"] === undefined && result.longitude === undefined && positional[2]) result["долгота"] = positional[2];
          if (result["высотава"] === undefined && result.altitude === undefined && positional[3]) result["высота"] = positional[3];
        }
        return result;
  }

  function resolveConfigUrl(args) {
    args = args || {};
    var direct = String(args.configUrl || args.cfg || args.url || "").trim();
    if (direct) {
      return direct;
    }
    var host = String(args.configHost || "").trim().replace(/\/+$/, "");
    var token = String(args.configToken || "").trim();
    if (host && token) {
      return host + "/loc.json?token=" + encodeURIComponent(token);
    }
    return "";
  }

  function isPlaceholderValue(value) {
    return typeof value === "string" && /^\{[^}]+\}$/.test(value.trim());
  }

  function readPluginStoreArg(name) {
    if (typeof $persistentStore === "undefined" || !$persistentStore.read) {
      return null;
    }
    try {
      var value = $persistentStore.read(name);
      if (value == null || value === "") {
        return null;
      }
      return String(value);
    } catch (err) {
      return null;
    }
  }

  function enrichArgsFromPluginStore(args) {
    var keys = [
      "enabled",
      "latitude",
      "longitude",
      "город",
      "широта",
      "долгота",
      "высота",
      "city",
      "altitude",
      "address",
      "configHost",
      "configToken",
      "configUrl",
      "debug"
    ];
    var i;
    args = args || {};
    for (i = 0; i < keys.length; i += 1) {
      var key = keys[i];
      var current = args[key];
      if (current == null || current === "" || isPlaceholderValue(current)) {
        var stored = readPluginStoreArg(key);
        if (stored != null && !isPlaceholderValue(stored)) {
          args[key] = stored;
        }
      }
    }
    return args;
  }

  function readScriptArguments() {
    var out = {};
    if (typeof $argument !== "undefined" && $argument != null) {
      if (typeof $argument === "string") {
        out = parseArgumentString($argument);
      } else if (typeof $argument === "object") {
        var key;
        for (key in $argument) {
          if (Object.prototype.hasOwnProperty.call($argument, key)) {
            var value = $argument[key];
            out[key] = value == null ? "" : String(value);
          }
        }
      } else {
        out = parseArgumentString(String($argument));
      }
    }
    return enrichArgsFromPluginStore(out);
  }

  function logScriptArguments(debug) {
    if (!debug) {
      return;
    }
    var args = readScriptArguments();
    var raw =
      typeof $argument === "undefined" || $argument == null
        ? "<none>"
        : typeof $argument === "object"
          ? JSON.stringify($argument)
          : String($argument);
    console.log("Location spoofer $argument raw: " + raw);
    console.log(
      "Location spoofer args parsed: lat=" +
        args.latitude +
        ", lng=" +
        args.longitude +
        ", configUrl=" +
        (resolveConfigUrl(args) || "<none>")
    );
  }

  function detectRuntime() {
    if (typeof $environment !== "undefined" && $environment && $environment.product) {
      return String($environment.product);
    }
    if (typeof $loon !== "undefined") {
      return "Loon";
    }
    return "Unknown";
  }

  function isLoonRuntime() {
    return detectRuntime() === "Loon";
  }

  function isGzipBytes(bytes) {
    return bytes && bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
  }

  function readGeocodeCache() {
    if (typeof $persistentStore === "undefined" || !$persistentStore.read) {
      return null;
    }
    try {
      var raw = $persistentStore.read("location_spoofer_geocode");
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      return null;
    }
  }

  function writeGeocodeCache(entry) {
    if (typeof $persistentStore === "undefined" || !$persistentStore.write) {
      return;
    }
    try {
      $persistentStore.write("location_spoofer_geocode", JSON.stringify(entry));
    } catch (err) {
      // ignore cache write failures
    }
  }

  function fetchElevation(lat, lng, callback) {
    if (typeof $httpClient === "undefined" || !$httpClient.get) {
      callback(null);
      return;
    }
    var url =
      "https://api.open-meteo.com/v1/elevation?latitude=" +
      encodeURIComponent(String(lat)) +
      "&longitude=" +
      encodeURIComponent(String(lng));
    $httpClient.get({ url: url, timeout: 4000 }, function (error, response, body) {
      if (error || !body) {
        callback(null);
        return;
      }
      try {
        var data = JSON.parse(body);
        if (data && data.elevation && data.elevation.length) {
          callback(Math.round(Number(data.elevation[0])));
          return;
        }
      } catch (err) {
        // ignore parse failures
      }
      callback(null);
    });
  }

  function geocodeAddress(address, debug, callback) {
    var query = String(address || "").trim();
    if (!query) {
      callback(null);
      return;
    }

    var cached = readGeocodeCache();
    if (cached && cached.address === query && Number.isFinite(Number(cached.latitude)) && Number.isFinite(Number(cached.longitude))) {
      if (debug) {
        console.log("Location spoofer geocode cache hit: " + query + " -> " + cached.latitude + "," + cached.longitude);
      }
      callback(cached);
      return;
    }

    if (typeof $httpClient === "undefined" || !$httpClient.get) {
      if (debug) {
        console.log("Location spoofer geocode skipped: $httpClient unavailable");
      }
      callback(null);
      return;
    }

    var url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=0&q=" +
      encodeURIComponent(query);
    $httpClient.get(
      {
        url: url,
        timeout: 8000,
        headers: { "User-Agent": "ios-location-spoofer/1.0 (Loon plugin)" }
      },
      function (error, response, body) {
        if (error || !body) {
          if (debug) {
            console.log("Location spoofer geocode failed: " + (error || "empty body"));
          }
          callback(null);
          return;
        }
        try {
          var results = JSON.parse(body);
          if (!results || !results.length) {
            if (debug) {
              console.log("Location spoofer geocode no result for: " + query);
            }
            callback(null);
            return;
          }
          var hit = results[0];
          var lat = Number(hit.lat);
          var lng = Number(hit.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            callback(null);
            return;
          }
          var entry = {
            address: query,
            latitude: lat,
            longitude: lng,
            displayName: hit.display_name || query
          };
          fetchElevation(lat, lng, function (altitude) {
            if (altitude != null) {
              entry.altitude = altitude;
            }
            writeGeocodeCache(entry);
            if (debug) {
              console.log(
                "Location spoofer geocode resolved: " +
                  query +
                  " -> " +
                  lat +
                  "," +
                  lng +
                  (altitude != null ? ", alt=" + altitude : "")
              );
            }
            callback(entry);
          });
        } catch (err) {
          if (debug) {
            console.log("Location spoofer geocode parse failed: " + err.message);
          }
          callback(null);
        }
      }
    );
  }

  function mergeConfig(base, extra) {
    var out = {};
    var key;
    for (key in base) {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        out[key] = base[key];
      }
    }
    extra = extra || {};
    for (key in extra) {
      if (Object.prototype.hasOwnProperty.call(extra, key)) {
        out[key] = extra[key];
      }
    }
    return out;
  }

  function decodeBase64(value) {
    if (typeof atob === "function") {
      return atob(value);
    }
    if (typeof Buffer !== "undefined") {
      return Buffer.from(value, "base64").toString("utf8");
    }
    throw new Error("base64 decoder unavailable");
  }

  function configFromArgs(args) {
    var cfg = {};
    var scalarKeys = [
      "enabled",
      "mode",
      "latitude",
      "longitude",
      "город",
      "широта",
      "долгота",
      "высота",
      "city",
      "address",
      "horizontalAccuracy",
      "verticalAccuracy",
      "altitude",
      "unknownValue4",
      "motionActivityType",
      "motionActivityConfidence",
      "failOpen",
      "debug",
      "dumpRaw",
      "dumpHeaders",
      "prepareHeaders",
      "rawLimit"
    ];

    if (args.config) {
      cfg = mergeConfig(cfg, JSON.parse(args.config));
    }
    if (args.configBase64) {
      cfg = mergeConfig(cfg, JSON.parse(decodeBase64(args.configBase64)));
    }
    for (var i = 0; i < scalarKeys.length; i += 1) {
      var key = scalarKeys[i];
      if (Object.prototype.hasOwnProperty.call(args, key)) {
        cfg[key] = args[key];
      }
    }
    return cfg;
  }

  function readRemoteConfigCache(url) {
    if (!url || typeof $persistentStore === "undefined" || !$persistentStore.read) {
      return null;
    }
    try {
      var raw = $persistentStore.read("location_spoofer_remote_cfg");
      if (!raw) {
        return null;
      }
      var entry = JSON.parse(raw);
      if (!entry || entry.url !== url || !entry.data) {
        return null;
      }
      if (Date.now() - entry.ts > 300000) {
        return null;
      }
      return entry.data;
    } catch (err) {
      return null;
    }
  }

  function writeRemoteConfigCache(url, data) {
    if (!url || typeof $persistentStore === "undefined" || !$persistentStore.write) {
      return;
    }
    try {
      $persistentStore.write(
        "location_spoofer_remote_cfg",
        JSON.stringify({ url: url, data: data, ts: Date.now() })
      );
    } catch (err) {
      // ignore cache write failures
    }
  }

  function fetchRemoteConfig(url, timeout, debug, callback) {
    if (!url || typeof $httpClient === "undefined" || !$httpClient.get) {
      callback(null, "http client unavailable");
      return;
    }
    $httpClient.get({ url: url, timeout: timeout || 3000 }, function (error, response, body) {
      if (error || !body) {
        callback(null, error || "empty body");
        return;
      }
      try {
        callback(JSON.parse(body), null);
      } catch (err) {
        callback(null, err.message);
      }
    });
  }

  function refreshRemoteConfigCache(url, debug) {
    fetchRemoteConfig(url, 5000, debug, function (data, err) {
      if (data) {
        writeRemoteConfigCache(url, data);
        return;
      }
      if (debug) {
        console.log("Location spoofer remote config refresh failed: " + err);
      }
    });
  }

  function applyAddressFromCache(cfg, address, debug) {
    if (!address) {
      return;
    }
    var cached = readGeocodeCache();
    if (cached && cached.address === address && Number.isFinite(Number(cached.latitude)) && Number.isFinite(Number(cached.longitude))) {
      cfg.latitude = cached.latitude;
      cfg.longitude = cached.longitude;
      if (cached.altitude != null) {
        cfg.altitude = cached.altitude;
      }
      if (debug) {
        console.log("Location spoofer geocode cache hit: " + address);
      }
      return;
    }
    if (debug) {
      console.log("Location spoofer geocode cache miss: " + address + " (use manual lat/lng until cron refreshes)");
    }
  }

  function loadRuntimeConfigSync() {
    var args = readScriptArguments();
    var cfg = mergeConfig(DEFAULT_CONFIG, configFromArgs(args));
    var configUrl = resolveConfigUrl(args);
    var debug = parseBoolean(cfg.debug, false);
    var address = String(args.address || "").trim();

    applyAddressFromCache(cfg, address, debug);

    if (configUrl) {
      var remoteCfg = readRemoteConfigCache(configUrl);
      if (remoteCfg) {
        cfg = mergeConfig(cfg, remoteCfg);
        if (debug) {
          console.log(
            "Location spoofer remote config cache hit -> " +
              remoteCfg.latitude +
              "," +
              remoteCfg.longitude
          );
        }
      }
    }

    return { cfg: cfg, configUrl: configUrl, debug: debug };
  }

  function loadRuntimeConfig(callback) {
    var loaded = loadRuntimeConfigSync();
    var cfg = loaded.cfg;
    var configUrl = loaded.configUrl;
    var debug = loaded.debug;

    function finish() {
      try {
        callback(normalizeConfig(cfg));
      } catch (err) {
        if (debug) {
          console.log("Location spoofer config invalid: " + err.message + " | cfg lat/lng=" + cfg.latitude + "," + cfg.longitude);
        }
        if (!Number.isFinite(Number(cfg.latitude)) || !Number.isFinite(Number(cfg.longitude))) {
          cfg.latitude = DEFAULT_CONFIG.latitude;
          cfg.longitude = DEFAULT_CONFIG.longitude;
        }
        callback(normalizeConfig(cfg));
      }
    }

    logScriptArguments(debug);

    
    if (!configUrl) {
      finish();
      return;
    }

    if (readRemoteConfigCache(configUrl)) {
      refreshRemoteConfigCache(configUrl, debug);
      finish();
      return;
    }

    if (debug) {
      console.log("Location spoofer remote config fetching: " + configUrl);
    }
    fetchRemoteConfig(configUrl, 3000, debug, function (data, err) {
      if (data) {
        writeRemoteConfigCache(configUrl, data);
        cfg = mergeConfig(cfg, data);
        if (debug) {
          console.log(
            "Location spoofer remote config loaded -> " + data.latitude + "," + data.longitude
          );
        }
      } else if (debug) {
        console.log("Location spoofer remote config fetch failed: " + err + " (using manual lat/lng)");
      }
      finish();
    });
  }

  function runMaintenanceCron() {
    var args = readScriptArguments();
    var debug = parseBoolean(args.debug, false);
    var pending = 0;

    function maybeDone() {
      pending -= 1;
      if (pending <= 0) {
        $done({});
      }
    }

    var configUrl = resolveConfigUrl(args);
    if (configUrl) {
      pending += 1;
      fetchRemoteConfig(configUrl, 8000, debug, function (data, err) {
        if (data) {
          writeRemoteConfigCache(configUrl, data);
          if (debug) {
            console.log(
              "Location spoofer config cron cached -> " + data.latitude + "," + data.longitude
            );
          }
        } else if (debug) {
          console.log("Location spoofer config cron failed: " + err);
        }
        maybeDone();
      });
    }

    var address = String(args.address || "").trim();
    if (address) {
      pending += 1;
      geocodeAddress(address, debug, function () {
        maybeDone();
      });
    }

    if (pending === 0) {
      $done({});
    }
  }

  function runGeocodeCron() {
    runMaintenanceCron();
  }

  function headersWithBinaryBody(sourceHeaders, length) {
    var headers = {};
    var key;
    sourceHeaders = sourceHeaders || {};
    for (key in sourceHeaders) {
      if (Object.prototype.hasOwnProperty.call(sourceHeaders, key)) {
        var lower = key.toLowerCase();
        if (lower !== "content-length" && lower !== "content-encoding" && lower !== "transfer-encoding") {
          headers[key] = sourceHeaders[key];
        }
      }
    }
    headers["Content-Type"] = "application/octet-stream";
    headers["Content-Length"] = String(length);
    return headers;
  }

  function setHeader(headers, name, value) {
    headers = headers || {};
    var lower = name.toLowerCase();
    var existingKey = null;
    for (var key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key) && key.toLowerCase() === lower) {
        existingKey = key;
        break;
      }
    }
    headers[existingKey || name] = value;
    return headers;
  }

  function prepareRequestHeaders(headers) {
    return setHeader(headers || {}, "Accept-Encoding", "identity");
  }

  function donePreparedRequestPassThrough() {
    var headers = prepareRequestHeaders((typeof $request !== "undefined" && $request.headers) || {});
    $done({
      headers: headers
    });
  }

  // Decode an HTTP response body that may be gzip/deflate/br encoded.
  // Shadowrocket/Surge expose $utils.ungzip; Loon falls back to DecompressionStream.
  function decompressBody(body, contentEncoding) {
    if (body == null) {
      return body;
    }
    var enc = contentEncoding ? String(contentEncoding).toLowerCase() : "";
    if (enc === "identity" || enc === "") {
      return body;
    }
    try {
      if (enc.indexOf("gzip") >= 0 && typeof $utils !== "undefined" && $utils.ungzip) {
        return $utils.ungzip(body);
      }
      if (enc.indexOf("deflate") >= 0 && typeof $utils !== "undefined" && $utils.inflate) {
        return $utils.inflate(body);
      }
      if (enc.indexOf("br") >= 0 && typeof $utils !== "undefined" && $utils.brotliDecompress) {
        return $utils.brotliDecompress(body);
      }
    } catch (err) {
      if (typeof console !== "undefined") {
        console.log("Location spoofer decompress failed (" + enc + "): " + err.message);
      }
    }
    return body;
  }

  function prepareResponseBodySync(config) {
    var respHeaders = ($response && $response.headers) || {};
    var contentEncoding = headerValue(respHeaders, "Content-Encoding");
    var rawRespBody = $response && ($response.body != null ? $response.body : $response.bodyBytes);
    logHttpDump("response-wire-original", $response, config);
    logRawDump("response-wire-original", bodyToBytes(rawRespBody), config);

    var bytes = bodyToBytes(rawRespBody);
    if (!bytes || bytes.length < 2) {
      return;
    }

    if (isGzipBytes(bytes) || (contentEncoding && String(contentEncoding).toLowerCase().indexOf("gzip") >= 0)) {
      var decoded = bodyToBytes(decompressBody(rawRespBody, contentEncoding || "gzip"));
      if (decoded && decoded.length > 2 && !isGzipBytes(decoded)) {
        $response.body = decoded;
        if (config.debug) {
          console.log("Location spoofer decompressed body: " + bytes.length + " -> " + decoded.length + " bytes");
        }
        return;
      }
      if (config.debug) {
        console.log(
          "Location spoofer gzip body still compressed (len=" +
            bytes.length +
            "); ensure http-request prepare script is enabled"
        );
      }
      return;
    }

    if (contentEncoding) {
      var plain = bodyToBytes(decompressBody(rawRespBody, contentEncoding));
      if (plain) {
        $response.body = plain;
      }
    }
  }

  function headerValue(headers, name) {
    if (!headers) {
      return undefined;
    }
    var lower = name.toLowerCase();
    for (var key in headers) {
      if (Object.prototype.hasOwnProperty.call(headers, key) && key.toLowerCase() === lower) {
        return headers[key];
      }
    }
    return undefined;
  }

  function donePassThrough() {
    $done({});
  }

  function valueType(value) {
    if (value == null) {
      return String(value);
    }
    if (value instanceof Uint8Array) {
      return "Uint8Array";
    }
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return "ArrayBuffer";
    }
    return typeof value;
  }

  function valueLength(value) {
    if (value == null) {
      return 0;
    }
    if (typeof value === "string" || typeof value.length === "number") {
      return value.length;
    }
    if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
      return value.byteLength;
    }
    return 0;
  }

  function objectKeys(value) {
    if (!value || typeof value !== "object") {
      return "";
    }
    var keys = [];
    for (var key in value) {
      if (Object.prototype.hasOwnProperty.call(value, key)) {
        keys.push(key);
      }
    }
    return keys.join(",");
  }

  function fieldHistogram(fields) {
    var counts = {};
    var order = [];
    for (var i = 0; i < fields.length; i += 1) {
      var key = String(fields[i].fieldNumber) + "/" + String(fields[i].wireType);
      if (!counts[key]) {
        counts[key] = 0;
        order.push(key);
      }
      counts[key] += 1;
    }
    var parts = [];
    for (var j = 0; j < order.length; j += 1) {
      parts.push(order[j] + "x" + counts[order[j]]);
    }
    return parts.join(",");
  }

  function countFields(fields, fieldNumber) {
    var count = 0;
    for (var i = 0; i < fields.length; i += 1) {
      if (fields[i].fieldNumber === fieldNumber) {
        count += 1;
      }
    }
    return count;
  }

  function countCellResponseFields(fields) {
    var count = 0;
    for (var i = 0; i < fields.length; i += 1) {
      if (isCellResponseField(fields[i].fieldNumber)) {
        count += 1;
      }
    }
    return count;
  }

  function appleWLocPayloadInspect(payload) {
    try {
      var fields = parseFields(payload);
      var parts = [
        "payloadLen=" + payload.length,
        "fields=" + fieldHistogram(fields),
        "wifi=" + countFields(fields, 2),
        "cellResp=" + countCellResponseFields(fields),
        "cellReq=" + countFields(fields, 25),
        "hasCounts=" + (countFields(fields, 3) + "/" + countFields(fields, 4)),
        "deviceType=" + countFields(fields, 33),
        patchedPayloadSummary(payload)
      ];
      return parts.join(", ");
    } catch (err) {
      return "payload parse failed: " + err.message;
    }
  }

  function logRawDump(label, bytes, config) {
    if (!config.dumpRaw || !bytes) {
      return;
    }
    var limit = config.rawLimit || 0;
    var emitted = limit > 0 && bytes.length > limit ? bytes.slice(0, limit) : bytes;
    var encoded = bytesToBase64(emitted);
    var chunkSize = 3000;
    var chunks = Math.max(1, Math.ceil(encoded.length / chunkSize));
    console.log("Location spoofer raw " + label + " base64 begin: len=" + bytes.length + ", emitted=" + emitted.length + ", chunks=" + chunks + ", truncated=" + (emitted.length !== bytes.length));
    for (var i = 0; i < encoded.length; i += chunkSize) {
      var chunkIndex = Math.floor(i / chunkSize) + 1;
      console.log("Location spoofer raw " + label + " base64 chunk " + chunkIndex + "/" + chunks + ": " + encoded.slice(i, i + chunkSize));
    }
    console.log("Location spoofer raw " + label + " base64 end");
  }

  function jsonString(value) {
    try {
      return JSON.stringify(value || {});
    } catch (err) {
      return "<json-failed:" + err.message + ">";
    }
  }

  function logHttpDump(label, message, config) {
    if (!config.dumpHeaders && !config.dumpRaw) {
      return;
    }
    message = message || {};
    var request = typeof $request !== "undefined" ? $request : {};
    var method = message.method || request.method || "<none>";
    var url = message.url || request.url || "<none>";
    var status = message.status || message.statusCode || "<none>";
    console.log("Location spoofer raw " + label + " meta: method=" + method + ", url=" + url + ", status=" + status);
    if (config.dumpHeaders) {
      console.log("Location spoofer raw " + label + " headers: " + jsonString(message.headers || {}));
    }
  }

  function inspectResponseBytes(bytes, config) {
    if (!bytes) {
      console.log("Location spoofer inspect response body unavailable");
      return;
    }
    console.log("Location spoofer inspect response body: len=" + bytes.length + ", head=" + hexPreview(bytes, 48));
    logRawDump("response", bytes, config);
    try {
      var extraction = extractAppleWLocPayload(bytes);
      console.log("Location spoofer inspect response extraction: kind=" + extraction.kind + ", prefix=" + (extraction.prefix ? hexPreview(extraction.prefix, 8) : "<none>") + ", payloadLen=" + extraction.payload.length + ", suffixLen=" + (extraction.suffix ? extraction.suffix.length : 0));
      console.log("Location spoofer inspect response payload: " + appleWLocPayloadInspect(extraction.payload));
    } catch (err) {
      console.log("Location spoofer inspect response extraction failed: " + err.message);
      var directFields = tryParseFields(bytes);
      if (directFields) {
        console.log("Location spoofer inspect response direct fields: " + fieldHistogram(directFields));
      }
    }
  }

  function inspectRequestBytes(bytes, config) {
    if (!bytes) {
      console.log("Location spoofer inspect request body unavailable");
      return;
    }
    console.log("Location spoofer inspect request body: len=" + bytes.length + ", head=" + hexPreview(bytes, 48));
    logRawDump("request", bytes, config);
    try {
      var arpc = parseArpc(bytes);
      console.log("Location spoofer inspect request arpc: version=" + arpc.version + ", functionId=" + arpc.functionId + ", locale=" + arpc.locale + ", app=" + arpc.appIdentifier + ", os=" + arpc.osVersion + ", payloadLen=" + arpc.payload.length);
      console.log("Location spoofer inspect request payload: " + appleWLocPayloadInspect(arpc.payload));
    } catch (err) {
      console.log("Location spoofer inspect request arpc failed: " + err.message);
      var directFields = tryParseFields(bytes);
      if (directFields) {
        console.log("Location spoofer inspect request direct fields: " + fieldHistogram(directFields));
      }
    }
  }

  function doneInspect(config, hasResponse) {
    if (hasResponse) {
      logHttpDump("response", $response, config);
      inspectResponseBytes(messageBodyToBytes($response), config);
    } else {
      logHttpDump("request", $request, config);
      inspectRequestBytes(messageBodyToBytes($request), config);
      if (config.prepareHeaders) {
        donePreparedRequestPassThrough();
        return;
      }
    }
    donePassThrough();
  }

  function doneResponseProbe(config) {
    var response = typeof $response !== "undefined" ? $response : {};
    var headers = response.headers || {};
    if (config.debug) {
      console.log("Location spoofer probe response keys: " + objectKeys(response));
      console.log("Location spoofer probe headers: status=" + (response.status || response.statusCode || "<none>") + ", content-length=" + (headerValue(headers, "Content-Length") || "<none>") + ", content-type=" + (headerValue(headers, "Content-Type") || "<none>") + ", content-encoding=" + (headerValue(headers, "Content-Encoding") || "none"));
      console.log("Location spoofer probe body slots: body=" + valueType(response.body) + "/" + valueLength(response.body) + ", bodyBytes=" + valueType(response.bodyBytes) + "/" + valueLength(response.bodyBytes) + ", rawBody=" + valueType(response.rawBody) + "/" + valueLength(response.rawBody) + ", binaryBody=" + valueType(response.binaryBody) + "/" + valueLength(response.binaryBody));
      var bytes = messageBodyToBytes(response);
      console.log("Location spoofer probe selected body: " + (bytes ? bytes.length : 0) + " bytes, head=" + (bytes ? hexPreview(bytes, 32) : "<none>"));
    }
    donePassThrough();
  }

  function doneSyntheticResponse(bytes, info) {
    var headers = headersWithBinaryBody({}, bytes.length);
    if (info && info.debug) {
      headers["X-Location-Spoofer-Wifi-Count"] = String(info.wifiCount);
      headers["X-Location-Spoofer-Cell-Count"] = String(info.cellCount || 0);
    }
    if (isLoonRuntime()) {
      $done({
        status: 200,
        headers: headers,
        body: bytes
      });
      return;
    }
    $done({
      response: {
        status: 200,
        headers: headers,
        body: bytes
      }
    });
  }

  function doneRewriteResponse(bytes, info) {
    var sourceHeaders = typeof $response !== "undefined" ? $response.headers : {};
    var headers = headersWithBinaryBody(sourceHeaders, bytes.length);
    if (info && info.debug) {
      headers["X-Location-Spoofer-Wifi-Count"] = String(info.wifiCount);
      headers["X-Location-Spoofer-Cell-Count"] = String(info.cellCount || 0);
    }
    if (info && info.targetLat != null && info.targetLng != null) {
      headers["X-Location-Spoofer-Target"] = String(info.targetLat) + "," + String(info.targetLng);
    }
    if (isLoonRuntime()) {
      $done({
        status: ($response && $response.status) || 200,
        headers: headers,
        body: bytes
      });
      return;
    }
    $done({
      headers: headers,
      body: bytes
    });
  }

  function continueResponseRewrite(config) {
    var responseBody = messageBodyToBytes($response);
    if (!responseBody || responseBody.length < 2) {
      if (config.debug) {
        console.log(
          "Location spoofer response body too short: " +
            (responseBody ? responseBody.length : 0) +
            " bytes, head=" +
            (responseBody ? hexPreview(responseBody) : "<none>")
        );
      }
      donePassThrough();
      return;
    }
    if (config.debug) {
      console.log("Location spoofer response body: " + responseBody.length + " bytes, head=" + hexPreview(responseBody, 32));
      if (isLoonRuntime()) {
        console.log("Location spoofer runtime: Loon");
      }
    }
    logHttpDump("response-original", $response, config);
    logRawDump("response-original", responseBody, config);
    var responseResult = spoofAppleResponse(responseBody, config);
    if (config.debug) {
      console.log(
        "Location spoofer patched " +
          responseResult.wifiCount +
          " wifi devices, " +
          responseResult.cellCount +
          " cell towers, kind=" +
          responseResult.kind +
          ", prefix=" +
          (responseResult.prefix || "<none>") +
          ", response=" +
          responseResult.response.length +
          " bytes"
      );
      console.log("Location spoofer patched locations: " + patchedPayloadSummary(responseResult.payload));
    }
    logRawDump("response-patched", responseResult.response, config);
    doneRewriteResponse(responseResult.response, {
      wifiCount: responseResult.wifiCount,
      cellCount: responseResult.cellCount,
      debug: config.debug,
      targetLat: config.latitude,
      targetLng: config.longitude
    });
  }

  function prepareResponseBody(config) {
    prepareResponseBodySync(config);
  }

  function runShadowrocket() {
    var hasRequest = typeof $request !== "undefined" && $request != null;
    var hasResponse = typeof $response !== "undefined" && $response != null;

    if (!hasRequest && !hasResponse) {
      runMaintenanceCron();
      return;
    }

    if (hasRequest && !hasResponse) {
      var prepArgs = readScriptArguments();
      if (parseBoolean(prepArgs.debug, false)) {
        console.log("Location spoofer prepare -> Accept-Encoding: identity");
      }
      donePreparedRequestPassThrough();
      return;
    }

    loadRuntimeConfig(function (config) {
      try {
        if (!config.enabled) {
          donePassThrough();
          return;
        }

        if (config.mode === "inspect") {
          doneInspect(config, hasResponse);
          return;
        }

        if (hasResponse) {
          if (config.debug) {
            console.log(
              "Location spoofer intercept -> lat=" +
                config.latitude +
                ", lng=" +
                config.longitude +
                ", url=" +
                (($request && $request.url) || "<none>")
            );
          }
          if (config.mode === "probe") {
            doneResponseProbe(config);
            return;
          }
          if (config.mode !== "response") {
            donePassThrough();
            return;
          }
              try {
      var notifAlert = (typeof $notification !== "undefined") ? $notification : null;
      if (notifAlert) {
        var alertTitle = "[DEBUG] Location Spoofer";
        var rawArg = (typeof $argument !== "undefined") ? String($argument) : "<UNDEFINED>";
                var alertSub = "city: " + (config.city || "empty") + " | lat: " + config.latitude.toFixed(2);
                var alertBody = "arg: " + rawArg.slice(0, 100);
        var alertBody = "Перехвачен URL: " + (($request && $request.url) ? $request.url.slice(0, 50) : "none");
        notifAlert.post(alertTitle, alertSub, alertBody);
      }
    } catch (eDebugNotif) {}
          prepareResponseBody(config);
          continueResponseRewrite(config);
          return;
        }

        if (config.mode !== "request") {
          donePassThrough();
          return;
        }
        var requestBody = messageBodyToBytes($request);
        if (config.debug) {
          console.log("Location spoofer request mode body length: " + (requestBody ? requestBody.length : 0));
        }
        if (!requestBody) {
          if (config.debug) {
            console.log("Location spoofer request body unavailable");
          }
          donePassThrough();
          return;
        }
        if (requestBody.length < 2) {
          if (config.debug) {
            console.log("Location spoofer request body too short: " + requestBody.length + " bytes, head=" + hexPreview(requestBody));
          }
          donePassThrough();
          return;
        }
        logHttpDump("request-original", $request, config);
        logRawDump("request-original", requestBody, config);
        var requestResult = spoofArpcRequest(requestBody, config);
        if (config.debug) {
          console.log("Location spoofer request synthetic response: patched " + requestResult.wifiCount + " wifi devices, " + requestResult.cellCount + " cell towers, response=" + requestResult.response.length + " bytes");
          console.log("Location spoofer patched locations: " + patchedPayloadSummary(requestResult.payload));
        }
        logRawDump("request-synthetic-response", requestResult.response, config);
        doneSyntheticResponse(requestResult.response, {
          wifiCount: requestResult.wifiCount,
          cellCount: requestResult.cellCount,
          debug: config.debug
        });
      } catch (err) {
        if (config.debug) {
          var diagBody = hasResponse ? messageBodyToBytes($response) : messageBodyToBytes($request);
          console.log("Location spoofer failed: " + err.message + " | bodyLen=" + (diagBody ? diagBody.length : 0) + " head=" + (diagBody ? hexPreview(diagBody, 32) : "<none>"));
        }
        if (config.failOpen !== false) {
          donePassThrough();
          return;
        }
        $done({
          response: {
            status: "HTTP/1.1 500 Internal Server Error",
            headers: { "Content-Type": "text/plain" },
            body: "location spoofer failed: " + err.message
          }
        });
      }
    });
  }

  var api = {
    DEFAULT_CONFIG: DEFAULT_CONFIG,
    APPLE_WLOC_PREFIX: APPLE_WLOC_PREFIX,
    APPLE_WLOC_MARKER: APPLE_WLOC_MARKER,
    bodyToBytes: bodyToBytes,
    messageBodyToBytes: messageBodyToBytes,
    hexPreview: hexPreview,
    bytesToBinaryString: bytesToBinaryString,
    bytesToBase64: bytesToBase64,
    binaryStringToBytes: binaryStringToBytes,
    concatBytes: concatBytes,
    readUInt16BE: readUInt16BE,
    writeUInt16BE: writeUInt16BE,
    encodeVarintUnsigned: encodeVarintUnsigned,
    encodeVarintSignedInt64: encodeVarintSignedInt64,
    decodeVarint: decodeVarint,
    makeVarintField: makeVarintField,
    makeLengthDelimitedField: makeLengthDelimitedField,
    parseFields: parseFields,
    tryParseFields: tryParseFields,
    firstFieldByNumber: firstFieldByNumber,
    locationSummary: locationSummary,
    patchedPayloadSummary: patchedPayloadSummary,
    coordToInt: coordToInt,
    normalizeConfig: normalizeConfig,
    patchLocation: patchLocation,
    patchWifiDevice: patchWifiDevice,
    patchCellTower: patchCellTower,
    patchAppleWLocPayload: patchAppleWLocPayload,
    parseArpc: parseArpc,
    serializeArpc: serializeArpc,
    buildAppleWLocResponse: buildAppleWLocResponse,
    extractAppleWLocPayload: extractAppleWLocPayload,
    spoofArpcRequest: spoofArpcRequest,
    spoofAppleResponse: spoofAppleResponse,
    parseArgumentString: parseArgumentString,
    readScriptArguments: readScriptArguments,
    geocodeAddress: geocodeAddress,
    prepareRequestHeaders: prepareRequestHeaders
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  } else {
    runShadowrocket();
  }
}());
