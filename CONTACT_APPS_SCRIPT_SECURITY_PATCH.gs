/*
  VMG Contact form — REQUIRED Google Apps Script security + private attachment gate.

  DEPLOYMENT REQUIREMENTS (server-side only):
  - Keep TURNSTILE_SECRET_KEY in Apps Script Script Properties.
  - Keep CONTACT_UPLOAD_FOLDER_ID in Apps Script Script Properties.
  - CONTACT_UPLOAD_FOLDER_ID should point to the private "VMG Website Enquiry Attachments" folder.
  - Do NOT put either secret/private folder ID in public GitHub source.
  - Run the security gate before Sheet writes, emails, or Drive storage.
  - Store attachment links in the existing CONTACT US MESSAGES > Attachments column.
*/

var VMG_MAX_ATTACHMENTS_ = 10;
var VMG_MAX_ATTACHMENT_TOTAL_BYTES_ = 25 * 1024 * 1024;
var VMG_MAX_ATTACHMENT_SINGLE_BYTES_ = 10 * 1024 * 1024;
var VMG_ALLOWED_ATTACHMENT_TYPES_ = {
  'image/jpeg': true,
  'image/png': true,
  'image/webp': true,
  'image/heic': true,
  'image/heif': true,
  'application/pdf': true
};

function vmgJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function vmgNormalize_(value, maxLength) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, maxLength || 4000);
}

function vmgSha256_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function vmgVerifyTurnstile_(token) {
  var secret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET_KEY');
  if (!secret) return { ok: false, message: 'Security verification is not configured.' };
  if (!token) return { ok: false, message: 'Please complete the security verification and try again.' };

  try {
    var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true
    });
    var body = JSON.parse(response.getContentText() || '{}');
    if (body.success !== true) return { ok: false, message: 'Please complete the security verification and try again.' };
    if (body.action && body.action !== 'contact_form') return { ok: false, message: 'Security verification failed.' };

    var allowedHosts = ['vashudevan.com', 'www.vashudevan.com', 'deploy-preview-12--exquisite-hotteok-531d58.netlify.app'];
    if (body.hostname && allowedHosts.indexOf(body.hostname) === -1) return { ok: false, message: 'Security verification failed.' };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Security verification could not be completed.' };
  }
}

function vmgValidateContactSecurity_(raw) {
  var data = raw || {};
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();

  if (vmgNormalize_(data.website, 200)) {
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
  if (list.length > VMG_MAX_ATTACHMENTS_) return { ok: false, message: 'You can attach up to 10 files.' };
  var total = 0;

  for (var i = 0; i < list.length; i++) {
    var item = list[i] || {};
    var mimeType = vmgNormalize_(item.mimeType, 80).toLowerCase();
    var name = vmgNormalize_(item.name, 220);
    var declaredSize = Number(item.size || 0);
    var base64 = String(item.base64 || '');

    if (!VMG_ALLOWED_ATTACHMENT_TYPES_[mimeType]) return { ok: false, message: 'Unsupported attachment type.' };
    if (!name || !declaredSize || declaredSize < 1 || !base64) return { ok: false, message: 'Invalid attachment.' };
    if (declaredSize > VMG_MAX_ATTACHMENT_SINGLE_BYTES_) return { ok: false, message: 'Each attachment must be 10 MB or less.' };

    total += declaredSize;
    if (total > VMG_MAX_ATTACHMENT_TOTAL_BYTES_) return { ok: false, message: 'Attachments must be 25 MB total or less.' };

    // Bound base64 input before decoding. 10 MB decoded is ~13.4 MB base64 plus small overhead.
    if (base64.length > 14 * 1024 * 1024) return { ok: false, message: 'Attachment payload is too large.' };
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

function vmgSanitizeFolderPart_(value) {
  return vmgSanitizeFilename_(vmgNormalize_(value, 80)).replace(/\.[A-Za-z0-9]{1,8}$/, '') || 'Enquiry';
}

function vmgCreateEnquiryAttachmentFolder_(data) {
  var parentId = PropertiesService.getScriptProperties().getProperty('CONTACT_UPLOAD_FOLDER_ID');
  if (!parentId) throw new Error('Attachment storage is not configured.');
  var parent = DriveApp.getFolderById(parentId);
  var stamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Kolkata', 'yyyy-MM-dd_HHmmss');
  var name = stamp + '_' + vmgSanitizeFolderPart_(data.fullName || data.fullname || 'Enquiry') + '_' + Utilities.getUuid().slice(0, 8);
  return parent.createFolder(name);
}

function vmgSaveContactAttachments_(attachments, data) {
  var list = Array.isArray(attachments) ? attachments : [];
  if (!list.length) return [];

  var validation = vmgValidateAttachmentMetadata_(list);
  if (!validation.ok) throw new Error(validation.message || 'Invalid attachment.');

  var folder = vmgCreateEnquiryAttachmentFolder_(data || {});
  var references = [];
  var decodedTotal = 0;

  list.forEach(function (item) {
    var decoded = Utilities.base64Decode(String(item.base64 || ''));
    var declaredSize = Number(item.size || 0);
    if (decoded.length !== declaredSize) throw new Error('Attachment size validation failed.');
    if (decoded.length > VMG_MAX_ATTACHMENT_SINGLE_BYTES_) throw new Error('Attachment exceeds 10 MB.');
    decodedTotal += decoded.length;
    if (decodedTotal > VMG_MAX_ATTACHMENT_TOTAL_BYTES_) throw new Error('Attachments exceed 25 MB total.');

    var safeName = Utilities.formatDate(new Date(), 'GMT', 'yyyyMMdd-HHmmss') + '_' + Utilities.getUuid() + '_' + vmgSanitizeFilename_(item.name);
    var blob = Utilities.newBlob(decoded, item.mimeType, safeName);
    var file = folder.createFile(blob);

    // Intentionally do not call setSharing(). Files inherit the private folder's access.
    references.push({
      name: item.name,
      storedName: safeName,
      mimeType: item.mimeType,
      size: decoded.length,
      fileId: file.getId(),
      url: file.getUrl()
    });
  });

  return references;
}

function vmgAttachmentRichText_(references) {
  var refs = Array.isArray(references) ? references : [];
  if (!refs.length) return SpreadsheetApp.newRichTextValue().setText('').build();

  var labels = refs.map(function (item) { return vmgNormalize_(item.name, 120) || 'Attachment'; });
  var text = labels.join('\n');
  var builder = SpreadsheetApp.newRichTextValue().setText(text);
  var cursor = 0;
  refs.forEach(function (item, index) {
    var label = labels[index];
    var end = cursor + label.length;
    builder.setLinkUrl(cursor, end, item.url);
    cursor = end + 1;
  });
  return builder.build();
}

function vmgWriteAttachmentLinks_(sheet, rowNumber, references) {
  if (!sheet || !rowNumber || !references || !references.length) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0];
  var attachmentColumn = headers.indexOf('Attachments') + 1;
  if (!attachmentColumn) throw new Error('Attachments column is missing from the enquiry sheet.');
  sheet.getRange(rowNumber, attachmentColumn).setRichTextValue(vmgAttachmentRichText_(references)).setWrap(true);
}

/*
  REQUIRED INTEGRATION INTO THE EXISTING deployed doPost(e):

  1) Parse request JSON into data.
  2) Run:

     var gate = vmgValidateContactSecurity_(data);
     if (!gate.ok) {
       if (gate.silentBot) return vmgJson_(gate.response || { success: true });
       return vmgJson_({ success: false, message: gate.message || 'Submission rejected.' });
     }

  3) Normalize the values used by the existing Sheet/email workflow:

     data.fullName = gate.clean.fullName;
     data.email = gate.clean.email;
     data.contact = gate.clean.phone;
     data.organization = gate.clean.organization;
     data.country = gate.clean.country;
     data.type = gate.clean.type;
     data.message = gate.clean.message;

  4) Save private files before returning success:

     var attachmentReferences = [];
     try {
       attachmentReferences = vmgSaveContactAttachments_(data.attachments || [], data);
     } catch (uploadError) {
       return vmgJson_({ success: false, message: 'Attachments could not be stored securely.' });
     }

  5) Continue the EXISTING CONTACT US MESSAGES row write unchanged. Capture the row number.
     Then call:

       vmgWriteAttachmentLinks_(contactSheet, writtenRowNumber, attachmentReferences);

     This writes one Attachments cell containing clickable original filenames. Binary/base64 data is never stored in the Sheet.

  6) Existing notification email may include attachmentReferences[].url links; do not attach raw 25 MB files.

  7) Return success only after the existing Sheet workflow and attachment-link write have actually succeeded:

     return vmgJson_({ success: true, attachmentCount: attachmentReferences.length });
*/
