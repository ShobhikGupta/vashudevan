/*
  VMG Contact form — REQUIRED Google Apps Script security + attachment gate.

  IMPORTANT:
  - This repository does NOT contain the deployed Apps Script doPost source.
  - Do NOT copy a Turnstile secret or private Drive folder ID into GitHub.
  - Store TURNSTILE_SECRET_KEY and CONTACT_UPLOAD_FOLDER_ID in Apps Script > Project Settings > Script Properties.
  - Call vmgValidateContactSecurity_(data) at the very TOP of the existing contact doPost flow, BEFORE writing to Sheets, emailing, forwarding, or otherwise storing data.
  - Only after validation succeeds, call vmgSaveContactAttachments_(data.attachments || []).
  - Preserve the existing normal destination / sheet / email workflow after these gates.
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

  if (!secret) return { ok: false, message: 'Security verification is not configured.' };
  if (!token) return { ok: false, message: 'Please complete the security verification and try again.' };

  try {
    var response = UrlFetchApp.fetch(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'post',
        payload: { secret: secret, response: token },
        muteHttpExceptions: true
      }
    );
    var body = JSON.parse(response.getContentText() || '{}');
    if (body.success !== true) return { ok: false, message: 'Please complete the security verification and try again.' };
    if (body.action && body.action !== 'contact_form') return { ok: false, message: 'Security verification failed.' };

    var allowedHosts = ['vashudevan.com', 'www.vashudevan.com', 'deploy-preview-12--exquisite-hotteok-531d58.netlify.app'];
    if (body.hostname && allowedHosts.indexOf(body.hostname) === -1) {
      return { ok: false, message: 'Security verification failed.' };
    }
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

  var attachmentCheck = vmgValidateAttachmentMetadata_(data.attachments || []);
  if (!attachmentCheck.ok) return attachmentCheck;

  var turnstile = vmgVerifyTurnstile_(turnstileToken);
  if (!turnstile.ok) return turnstile;

  var identity = vmgSha256_(email + '|' + phone).slice(0, 32);
  var duplicateHash = vmgSha256_(email + '|' + phone + '|' + message).slice(0, 40);
  var duplicateKey = 'vmg_contact_dup_' + duplicateHash;
  var rateKey = 'vmg_contact_rate_' + identity;

  lock.waitLock(5000);
  try {
    if (cache.get(duplicateKey)) return { ok: false, duplicate: true, message: 'This enquiry was already received recently.' };

    var count = Number(cache.get(rateKey) || '0');
    if (count >= 3) return { ok: false, rateLimited: true, message: 'Please wait before sending another enquiry.' };

    cache.put(duplicateKey, '1', 600);
    cache.put(rateKey, String(count + 1), 900);
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

function vmgValidateAttachmentMetadata_(attachments) {
  var list = Array.isArray(attachments) ? attachments : [];
  if (list.length > 5) return { ok: false, message: 'You can attach up to 5 files.' };

  var allowed = {
    'image/jpeg': true,
    'image/png': true,
    'image/webp': true,
    'image/heic': true,
    'image/heif': true,
    'application/pdf': true
  };
  var total = 0;

  for (var i = 0; i < list.length; i++) {
    var item = list[i] || {};
    var mimeType = vmgNormalize_(item.mimeType, 80).toLowerCase();
    var name = vmgNormalize_(item.name, 220);
    var size = Number(item.size || 0);
    var base64 = String(item.base64 || '');

    if (!allowed[mimeType]) return { ok: false, message: 'Unsupported attachment type.' };
    if (!name || !size || size < 1) return { ok: false, message: 'Invalid attachment.' };
    if (!base64 || base64.length > 15 * 1024 * 1024) return { ok: false, message: 'Invalid attachment payload.' };

    total += size;
    if (total > 10 * 1024 * 1024) return { ok: false, message: 'Attachments must be 10 MB total or less.' };
  }

  return { ok: true };
}

function vmgSanitizeFilename_(name) {
  var clean = String(name || 'file')
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, '_')
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
  return clean || 'file';
}

function vmgSaveContactAttachments_(attachments) {
  var list = Array.isArray(attachments) ? attachments : [];
  if (!list.length) return [];

  var validation = vmgValidateAttachmentMetadata_(list);
  if (!validation.ok) throw new Error(validation.message || 'Invalid attachment.');

  var folderId = PropertiesService
    .getScriptProperties()
    .getProperty('CONTACT_UPLOAD_FOLDER_ID');
  if (!folderId) throw new Error('Attachment storage is not configured.');

  var folder = DriveApp.getFolderById(folderId);
  var references = [];

  list.forEach(function (item) {
    var decoded = Utilities.base64Decode(String(item.base64 || ''));
    if (decoded.length !== Number(item.size || 0)) throw new Error('Attachment size validation failed.');

    var safeName = Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd-HHmmss') + '_' +
      Utilities.getUuid() + '_' + vmgSanitizeFilename_(item.name);
    var blob = Utilities.newBlob(decoded, item.mimeType, safeName);
    var file = folder.createFile(blob);

    // Do NOT add public sharing permissions. The containing Drive folder should remain private.
    references.push({
      name: item.name,
      storedName: safeName,
      mimeType: item.mimeType,
      size: Number(item.size || 0),
      fileId: file.getId(),
      url: file.getUrl()
    });
  });

  return references;
}

/*
  REQUIRED doPost integration example, immediately after parsing JSON:

  var gate = vmgValidateContactSecurity_(data);
  if (!gate.ok) {
    if (gate.silentBot) return vmgJson_(gate.response || { success: true });
    return vmgJson_({ success: false, message: gate.message || 'Submission rejected.' });
  }

  data.fullName = gate.clean.fullName;
  data.email = gate.clean.email;
  data.contact = gate.clean.phone;
  data.organization = gate.clean.organization;
  data.country = gate.clean.country;
  data.type = gate.clean.type;
  data.message = gate.clean.message;

  var attachmentReferences = [];
  try {
    attachmentReferences = vmgSaveContactAttachments_(data.attachments || []);
  } catch (uploadError) {
    return vmgJson_({ success: false, message: 'Attachments could not be stored securely.' });
  }

  data.attachmentReferences = attachmentReferences;
  data.attachmentUrls = attachmentReferences.map(function (item) { return item.url; }).join('\n');

  // ...continue EXISTING Sheet/email handling unchanged...
  // Store attachmentUrls (or JSON.stringify(attachmentReferences)) with the enquiry.
  // Include attachment links in the existing notification email if one exists.
  // Only return success AFTER the Sheet/email workflow actually succeeds:
  // return vmgJson_({ success: true, attachments: attachmentReferences });
*/
