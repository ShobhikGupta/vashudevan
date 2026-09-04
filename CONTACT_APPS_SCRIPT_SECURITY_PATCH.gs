/*
  VMG Contact form — REQUIRED Google Apps Script security gate.

  IMPORTANT:
  - This repository does NOT contain the deployed Apps Script doPost source.
  - Do NOT copy a Turnstile secret into this file or GitHub.
  - Store TURNSTILE_SECRET_KEY in Apps Script > Project Settings > Script Properties.
  - Call vmgValidateContactSecurity_(data) at the very TOP of the existing contact
    doPost flow, BEFORE writing to Sheets, emailing, forwarding, or otherwise storing data.
  - Preserve the existing normal destination / sheet / email workflow after this gate.
*/

function vmgJson_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function vmgNormalize_(value, maxLength) {
  return String(value == null ? '' : value)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength || 4000);
}

function vmgSha256_(value) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(value || ''),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function vmgVerifyTurnstile_(token) {
  var secret = PropertiesService
    .getScriptProperties()
    .getProperty('TURNSTILE_SECRET_KEY');

  if (!secret) {
    return { ok: false, message: 'Security verification is not configured.' };
  }
  if (!token) {
    return { ok: false, message: 'Please complete the security verification and try again.' };
  }

  try {
    var response = UrlFetchApp.fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'post',
        payload: {
          secret: secret,
          response: token
        },
        muteHttpExceptions: true
      }
    );
    var body = JSON.parse(response.getContentText() || '{}');
    if (body.success !== true) {
      return { ok: false, message: 'Please complete the security verification and try again.' };
    }
    // Optional hardening once production hostname/action are confirmed:
    // if (body.hostname !== 'vashudevan.com') return { ok: false, message: 'Security verification failed.' };
    // if (body.action && body.action !== 'contact_form') return { ok: false, message: 'Security verification failed.' };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Security verification could not be completed.' };
  }
}

function vmgValidateContactSecurity_(raw) {
  var data = raw || {};
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();

  var honeypot = vmgNormalize_(data.website, 200);
  if (honeypot) {
    // Deliberately successful-looking response so bots learn nothing useful.
    return { ok: false, silentBot: true, response: { success: true } };
  }

  var startedAt = Number(data.formStartedAt || 0);
  var elapsedMs = Date.now() - startedAt;
  if (!startedAt || elapsedMs < 2500 || elapsedMs > 24 * 60 * 60 * 1000) {
    return { ok: false, message: 'Please review the form and try again.' };
  }

  var fullName = vmgNormalize_(data.fullName || data.fullname, 81);
  var email = vmgNormalize_(data.email || data.mailId, 255).toLowerCase();
  var phone = vmgNormalize_(data.contact || data.contactNumber || data.phone, 32);
  var organization = vmgNormalize_(data.organization, 121);
  var country = vmgNormalize_(data.country || data.Country, 120);
  var type = vmgNormalize_(data.type, 32);
  var message = vmgNormalize_(data.message, 3001);
  var turnstileToken = vmgNormalize_(data['cf-turnstile-response'], 4096);

  if (fullName.length < 2 || fullName.length > 80) return { ok: false, message: 'Invalid full name.' };
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: 'Invalid email address.' };
  if (!phone || phone.length > 31 || !/^\+[1-9]\d{6,14}$/.test(phone)) return { ok: false, message: 'Invalid phone number.' };
  if (organization.length > 120) return { ok: false, message: 'Organization is too long.' };
  if (!country) return { ok: false, message: 'Country is required.' };
  if (!/^(buyer|seller|quotation|partnership|documentation|callback|investor|finance|general)$/.test(type)) return { ok: false, message: 'Invalid enquiry type.' };
  if (message.length < 10 || message.length > 3000) return { ok: false, message: 'Message must be between 10 and 3000 characters.' };

  var urls = message.match(/(?:https?:\/\/|www\.)\S+/gi) || [];
  if (urls.length > 4) return { ok: false, message: 'Message contains too many links.' };
  if (/(.)\1{40,}/.test(message)) return { ok: false, message: 'Message content could not be accepted.' };

  var turnstile = vmgVerifyTurnstile_(turnstileToken);
  if (!turnstile.ok) return turnstile;

  var identity = vmgSha256_(email + '|' + phone).slice(0, 32);
  var duplicateHash = vmgSha256_(email + '|' + phone + '|' + message).slice(0, 40);
  var duplicateKey = 'vmg_contact_dup_' + duplicateHash;
  var rateKey = 'vmg_contact_rate_' + identity;

  lock.waitLock(5000);
  try {
    if (cache.get(duplicateKey)) {
      return { ok: false, duplicate: true, message: 'This enquiry was already received recently.' };
    }

    var count = Number(cache.get(rateKey) || '0');
    if (count >= 3) {
      return { ok: false, rateLimited: true, message: 'Please wait before sending another enquiry.' };
    }

    // Reserve the duplicate/rate slots immediately before the normal storage/send path.
    // If your existing doPost can still fail after this point, move these two cache.put
    // calls to immediately after that workflow succeeds.
    cache.put(duplicateKey, '1', 600);       // 10 minutes
    cache.put(rateKey, String(count + 1), 900); // 15 minutes
  } finally {
    lock.releaseLock();
  }

  return {
    ok: true,
    clean: {
      fullName: fullName,
      email: email,
      phone: phone,
      organization: organization,
      country: country,
      type: type,
      message: message
    }
  };
}

/*
  INSERT THIS AT THE TOP OF YOUR EXISTING doPost(e), immediately after parsing JSON:

  var gate = vmgValidateContactSecurity_(data);
  if (!gate.ok) {
    if (gate.silentBot) return vmgJson_(gate.response || { success: true });
    return vmgJson_({ success: false, message: gate.message || 'Submission rejected.' });
  }

  // Optional: replace user-supplied values with normalized values:
  data.fullName = gate.clean.fullName;
  data.email = gate.clean.email;
  data.contact = gate.clean.phone;
  data.organization = gate.clean.organization;
  data.country = gate.clean.country;
  data.type = gate.clean.type;
  data.message = gate.clean.message;

  // ...then continue your EXISTING Sheet/email handling unchanged...
  // return vmgJson_({ success: true });
*/
