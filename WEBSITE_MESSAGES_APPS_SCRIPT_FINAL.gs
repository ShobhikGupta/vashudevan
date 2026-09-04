/*
  VASHUDEVAN METGLOBAL LLP — WEBSITE MESSAGES BACKEND
  FINAL CONSOLIDATED REFERENCE

  IMPORTANT
  ---------
  This file is production-ready reference source, but committing it to GitHub does NOT
  deploy Google Apps Script. Copy/integrate it into the existing Apps Script project
  serving the website, configure Script Properties, deploy a new Web App version, and
  verify all four public form flows before enabling Contact in assets/js/config.js.

  Existing workbook: WEBSITE MESSAGES
  Spreadsheet ID: 1zPDKy_M7M5-l6tRyfwXHGm8S1LOuLU-GwELk1quJx8s

  Exact tabs:
    OPENING POP-UP MESSAGES
    CONTACT US MESSAGES
    FEEDBACK
    Trade Updates Subscription

  Required Script Properties:
    TURNSTILE_SECRET_KEY
    CONTACT_UPLOAD_FOLDER_ID

  Optional preview-only Script Property:
    TURNSTILE_ALLOW_TEST_HOSTNAME = true

  Set the optional preview property only while testing Cloudflare's documented test
  sitekey on Netlify. Remove it or set it to false before production verification.
  Never put the real Turnstile secret or private Drive folder ID in GitHub.
*/

var VMG_WEBSITE_MESSAGES_SPREADSHEET_ID_ = '1zPDKy_M7M5-l6tRyfwXHGm8S1LOuLU-GwELk1quJx8s';
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

function doPost(e) {
  try {
    var data = vmgParseRequest_(e);
    var target = vmgGetTargetSheetName_(data);
    if (!target) return vmgJson_({ success: false, message: 'Unknown submission source.' });

    var spreadsheet = SpreadsheetApp.openById(VMG_WEBSITE_MESSAGES_SPREADSHEET_ID_);
    var attachmentReferences = [];
    var gate;

    if (target === 'OPENING POP-UP MESSAGES') {
      gate = vmgValidatePopupSecurity_(data);
      if (!gate.ok) return vmgGateResponse_(gate);
      data = vmgApplyClean_(data, gate.clean);
    } else if (target === 'CONTACT US MESSAGES') {
      gate = vmgValidateContactSecurity_(data);
      if (!gate.ok) return vmgGateResponse_(gate);
      data = vmgApplyClean_(data, gate.clean);

      try {
        attachmentReferences = vmgSaveContactAttachments_(data.attachments || [], data);
      } catch (uploadError) {
        return vmgJson_({ success: false, message: 'Attachments could not be stored securely.' });
      }
    } else if (target === 'FEEDBACK') {
      gate = vmgValidateFeedbackSecurity_(data);
      if (!gate.ok) return vmgGateResponse_(gate);
      data = vmgApplyClean_(data, gate.clean);
    } else if (target === 'Trade Updates Subscription') {
      gate = vmgValidateSubscription_(data);
      if (!gate.ok) return vmgGateResponse_(gate);
      if (gate.duplicate) {
        return vmgJson_({ success: true, routedTo: target, duplicate: true, written: false });
      }
      data = vmgApplyClean_(data, gate.clean);
    } else {
      return vmgJson_({ success: false, message: 'Unknown submission source.' });
    }

    var write = vmgAppendRoutedSubmission_(spreadsheet, target, data, attachmentReferences);

    // Preserve/add existing notification email logic here if your deployed project has it.
    // Do not return success until any required write/notification work has completed.
    return vmgJson_({
      success: true,
      routedTo: target,
      row: write.row,
      attachmentCount: attachmentReferences.length
    });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return vmgJson_({ success: false, message: 'Submission could not be processed.' });
  }
}

function vmgParseRequest_(e) {
  var raw = '';
  try { raw = String((e && e.postData && e.postData.contents) || '').trim(); } catch (_) {}

  if (raw && raw.charAt(0) === '{') {
    try {
      var parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    } catch (_) {}
  }

  var params = {};
  var source = (e && e.parameter) || {};
  Object.keys(source).forEach(function (key) { params[key] = source[key]; });
  if (Object.keys(params).length) return params;

  throw new Error('Request body could not be parsed.');
}

function vmgGetTargetSheetName_(data) {
  var source = vmgNormalize_(data && data.source, 80).toLowerCase();
  var type = vmgNormalize_(data && data.type, 80).toLowerCase();

  // SOURCE is the primary router. If source is present but unknown, reject it.
  if (source) {
    if (source === 'popup') return 'OPENING POP-UP MESSAGES';
    if (source === 'main') return 'CONTACT US MESSAGES';
    if (source === 'website-feedback') return 'FEEDBACK';
    if (source === 'trade-updates-subscription') return 'Trade Updates Subscription';
    return null;
  }

  // Compatibility only for older feedback/subscription payloads with no source.
  if (type === 'website feedback') return 'FEEDBACK';
  if (type === 'trade updates subscription') return 'Trade Updates Subscription';
  return null;
}

function vmgGateResponse_(gate) {
  if (gate && gate.silentBot) return vmgJson_({ success: true, accepted: false });
  if (gate && gate.duplicate) return vmgJson_({ success: true, duplicate: true, written: false });
  return vmgJson_({ success: false, message: (gate && gate.message) || 'Submission rejected.' });
}

function vmgApplyClean_(data, clean) {
  var output = data || {};
  Object.keys(clean || {}).forEach(function (key) { output[key] = clean[key]; });
  return output;
}

function vmgJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function vmgNormalize_(value, maxLength) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim().slice(0, maxLength || 4000);
}

function vmgEmail_(value) {
  return vmgNormalize_(value, 255).toLowerCase();
}

function vmgEmailValid_(value) {
  return !!value && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function vmgSha256_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function vmgCacheGate_(options) {
  var cache = CacheService.getScriptCache();
  var lock = LockService.getScriptLock();
  var duplicateKey = options.duplicateKey || '';
  var duplicateSeconds = options.duplicateSeconds || 600;
  var rateKey = options.rateKey || '';
  var rateSeconds = options.rateSeconds || 900;
  var rateMax = options.rateMax || 3;

  lock.waitLock(5000);
  try {
    if (duplicateKey && cache.get(duplicateKey)) {
      return { ok: false, duplicate: true, message: 'This submission was already received recently.' };
    }

    if (rateKey) {
      var count = Number(cache.get(rateKey) || '0');
      if (count >= rateMax) return { ok: false, rateLimited: true, message: 'Please wait before submitting again.' };
      cache.put(rateKey, String(count + 1), rateSeconds);
    }

    if (duplicateKey) cache.put(duplicateKey, '1', duplicateSeconds);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function vmgVerifyTurnstile_(token, expectedAction) {
  var secret = PropertiesService.getScriptProperties().getProperty('TURNSTILE_SECRET_KEY');
  if (!secret) return { ok: false, message: 'Security verification is not configured.' };
  token = vmgNormalize_(token, 4096);
  if (!token) return { ok: false, message: 'Please complete the security verification and try again.' };

  try {
    var response = UrlFetchApp.fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'post',
      payload: { secret: secret, response: token },
      muteHttpExceptions: true
    });
    var body = JSON.parse(response.getContentText() || '{}');
    if (body.success !== true) return { ok: false, message: 'Please complete the security verification and try again.' };
    if (expectedAction && body.action !== expectedAction) return { ok: false, message: 'Security verification failed.' };

    var hostname = vmgNormalize_(body.hostname, 255).toLowerCase();
    var allowTestHostname = String(PropertiesService.getScriptProperties().getProperty('TURNSTILE_ALLOW_TEST_HOSTNAME') || '').toLowerCase() === 'true';
    var validHostname = hostname === 'vashudevan.com' || hostname === 'www.vashudevan.com' ||
      hostname === 'deploy-preview-12--exquisite-hotteok-531d58.netlify.app' ||
      /--exquisite-hotteok-531d58\.netlify\.app$/.test(hostname);

    if (hostname === 'dummy' && allowTestHostname) validHostname = true;
    if (!validHostname) return { ok: false, message: 'Security verification failed.' };
    return { ok: true };
  } catch (error) {
    return { ok: false, message: 'Security verification could not be completed.' };
  }
}

function vmgElapsedOkay_(startedAt, minimumMs) {
  var started = Number(startedAt || 0);
  var elapsed = Date.now() - started;
  return !!started && elapsed >= minimumMs && elapsed <= 24 * 60 * 60 * 1000;
}

function vmgPhoneParts_(data) {
  var e164 = vmgNormalize_(data.phoneE164 || data.contact || data.contactNumber || data.phone, 32).replace(/\s+/g, '');
  var dial = vmgNormalize_(data.phoneDialCode, 8).replace(/[^\d+]/g, '');
  var national = String(data.phoneNational == null ? '' : data.phoneNational).replace(/\D/g, '');

  if (dial && dial.charAt(0) !== '+') dial = '+' + dial.replace(/\D/g, '');
  if (!/^\+[1-9]\d{6,14}$/.test(e164)) return null;
  if (!/^\+[1-9]\d{0,3}$/.test(dial)) return null;
  if (national.length < 6 || national.length > 14) return null;
  if (dial + national !== e164) return null;

  return {
    e164: e164,
    dialCode: dial,
    national: national,
    display: dial + ' ' + national
  };
}

function vmgValidatePopupSecurity_(raw) {
  var data = raw || {};
  if (vmgNormalize_(data.website, 200)) return { ok: false, silentBot: true };
  if (!vmgElapsedOkay_(data.formStartedAt, 2000)) return { ok: false, message: 'Please review the form and try again.' };

  var country = vmgNormalize_(data.country || data.Country, 120);
  var email = vmgEmail_(data.email || data.EmailID || data['MAIL ID']);
  var phone = vmgPhoneParts_(data);
  var token = data['cf-turnstile-response'];

  if (!country) return { ok: false, message: 'Country is required.' };
  if (!phone) return { ok: false, message: 'Invalid phone number.' };
  if (!vmgEmailValid_(email)) return { ok: false, message: 'Invalid email address.' };

  var turnstile = vmgVerifyTurnstile_(token, 'popup_form');
  if (!turnstile.ok) return turnstile;

  var identity = vmgSha256_(email + '|' + phone.e164).slice(0, 32);
  var duplicate = vmgSha256_(email + '|' + phone.e164 + '|' + country.toLowerCase()).slice(0, 40);
  var cacheGate = vmgCacheGate_({
    duplicateKey: 'vmg_popup_dup_' + duplicate,
    duplicateSeconds: 600,
    rateKey: 'vmg_popup_rate_' + identity,
    rateSeconds: 900,
    rateMax: 3
  });
  if (!cacheGate.ok) return cacheGate;

  return {
    ok: true,
    clean: {
      source: 'popup',
      country: country,
      Country: country,
      email: email,
      phone: phone.e164,
      contact: phone.e164,
      contactNumber: phone.e164,
      phoneE164: phone.e164,
      phoneDialCode: phone.dialCode,
      phoneNational: phone.national,
      phoneDisplay: phone.display,
      'PHONE NUMBER': phone.display,
      'MAIL ID': email
    }
  };
}

function vmgValidateContactSecurity_(raw) {
  var data = raw || {};
  if (vmgNormalize_(data.website, 200)) return { ok: false, silentBot: true };
  if (!vmgElapsedOkay_(data.formStartedAt, 2500)) return { ok: false, message: 'Please review the form and try again.' };

  var fullName = vmgNormalize_(data.fullName || data.fullname, 81);
  var email = vmgEmail_(data.email || data.mailId);
  var phone = vmgPhoneParts_(data);
  var organization = vmgNormalize_(data.organization, 121);
  var country = vmgNormalize_(data.country || data.Country, 120);
  var type = vmgNormalize_(data.type, 32).toLowerCase();
  var message = vmgNormalize_(data.message, 3001);

  if (fullName.length < 2 || fullName.length > 80) return { ok: false, message: 'Invalid full name.' };
  if (!vmgEmailValid_(email)) return { ok: false, message: 'Invalid email address.' };
  if (!phone) return { ok: false, message: 'Invalid phone number.' };
  if (organization.length > 120) return { ok: false, message: 'Organization is too long.' };
  if (!country) return { ok: false, message: 'Country is required.' };
  if (!/^(buyer|seller|quotation|partnership|documentation|callback|investor|finance|general)$/.test(type)) return { ok: false, message: 'Invalid enquiry type.' };
  if (message.length < 10 || message.length > 3000) return { ok: false, message: 'Message must be between 10 and 3000 characters.' };

  var urls = message.match(/(?:https?:\/\/|www\.)\S+/gi) || [];
  if (urls.length > 4) return { ok: false, message: 'Message contains too many links.' };
  if (/(.)\1{40,}/.test(message)) return { ok: false, message: 'Message content could not be accepted.' };

  var attachmentCheck = vmgValidateAttachmentMetadata_(data.attachments || []);
  if (!attachmentCheck.ok) return attachmentCheck;

  var turnstile = vmgVerifyTurnstile_(data['cf-turnstile-response'], 'contact_form');
  if (!turnstile.ok) return turnstile;

  var identity = vmgSha256_(email + '|' + phone.e164).slice(0, 32);
  var duplicate = vmgSha256_(email + '|' + phone.e164 + '|' + message).slice(0, 40);
  var cacheGate = vmgCacheGate_({
    duplicateKey: 'vmg_contact_dup_' + duplicate,
    duplicateSeconds: 600,
    rateKey: 'vmg_contact_rate_' + identity,
    rateSeconds: 900,
    rateMax: 3
  });
  if (!cacheGate.ok) return cacheGate;

  return {
    ok: true,
    clean: {
      source: 'main',
      fullName: fullName,
      fullname: fullName,
      email: email,
      mailId: email,
      phone: phone.e164,
      contact: phone.e164,
      contactNumber: phone.e164,
      phoneE164: phone.e164,
      phoneDialCode: phone.dialCode,
      phoneNational: phone.national,
      phoneDisplay: phone.display,
      'PHONE NUMBER': phone.display,
      country: country,
      Country: country,
      organization: organization,
      type: type,
      message: message
    }
  };
}

function vmgValidateFeedbackSecurity_(raw) {
  var data = raw || {};
  if (vmgNormalize_(data.website, 200)) return { ok: false, silentBot: true };
  if (!vmgElapsedOkay_(data.formStartedAt, 1000)) return { ok: false, message: 'Please review the form and try again.' };

  var rating = vmgNormalize_(data.rating || data['FEEDBACK RATING'], 40);
  var email = vmgEmail_(data.email || data['MAIL ID']);
  var comments = vmgNormalize_(data.message || data.comments || data['MESSAGE'], 1501);
  var page = vmgNormalize_(data.page, 1000);

  if (rating !== 'Good' && rating !== 'Needs improvement') return { ok: false, message: 'Invalid feedback rating.' };
  if (!comments || comments.length > 1500) return { ok: false, message: 'Feedback comments are required and must be 1500 characters or fewer.' };
  if (email && !vmgEmailValid_(email)) return { ok: false, message: 'Invalid email address.' };

  var identity = vmgSha256_((email || 'anonymous') + '|' + rating).slice(0, 32);
  var duplicate = vmgSha256_(email + '|' + rating + '|' + comments).slice(0, 40);
  var cacheGate = vmgCacheGate_({
    duplicateKey: 'vmg_feedback_dup_' + duplicate,
    duplicateSeconds: 600,
    rateKey: 'vmg_feedback_rate_' + identity,
    rateSeconds: 900,
    rateMax: 5
  });
  if (!cacheGate.ok) return cacheGate;

  return {
    ok: true,
    clean: {
      source: 'website-feedback',
      type: 'Website Feedback',
      rating: rating,
      email: email,
      message: comments,
      comments: comments,
      page: page,
      'MAIL ID': email,
      'MESSAGE': comments,
      'FEEDBACK RATING': rating
    }
  };
}

function vmgValidateSubscription_(raw) {
  var data = raw || {};
  var email = vmgEmail_(data.email || data['MAIL ID']);
  var page = vmgNormalize_(data.page, 1000);
  if (!vmgEmailValid_(email)) return { ok: false, message: 'Invalid email address.' };

  var cache = CacheService.getScriptCache();
  var key = 'vmg_subscribe_' + vmgSha256_(email).slice(0, 40);
  if (cache.get(key)) {
    return { ok: true, duplicate: true, clean: { email: email } };
  }
  cache.put(key, '1', 3600);

  return {
    ok: true,
    clean: {
      source: 'trade-updates-subscription',
      type: 'Trade Updates Subscription',
      email: email,
      'MAIL ID': email,
      page: page
    }
  };
}

function vmgEnsureTargetSheet_(spreadsheet, sheetName) {
  var sheet = spreadsheet.getSheetByName(sheetName);
  if (sheet) return sheet;

  var headersBySheet = {
    'FEEDBACK': ['DATE', 'Rating', 'Email ID', 'Comments', 'Page'],
    'Trade Updates Subscription': ['DATE', 'Email ID', 'Page', 'Source']
  };
  var headers = headersBySheet[sheetName];
  if (!headers) throw new Error('Required sheet is missing: ' + sheetName);

  sheet = spreadsheet.insertSheet(sheetName);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function vmgAppendRoutedSubmission_(spreadsheet, sheetName, data, attachmentReferences) {
  var sheet = vmgEnsureTargetSheet_(spreadsheet, sheetName);
  var now = new Date();

  if (sheetName === 'OPENING POP-UP MESSAGES') {
    var popupRow = sheet.getLastRow() + 1;
    sheet.getRange(popupRow, 1).setValue(now);
    sheet.getRange(popupRow, 2).setValue(data.country || data.Country || '');
    sheet.getRange(popupRow, 3).setNumberFormat('@').setValue(data.phoneDisplay || '');
    sheet.getRange(popupRow, 4).setValue(data.email || data['MAIL ID'] || '');
    return { row: popupRow };
  }

  if (sheetName === 'CONTACT US MESSAGES') {
    var contactRow = sheet.getLastRow() + 1;
    sheet.getRange(contactRow, 1, 1, 9).setValues([[
      now,
      data.fullName || data.fullname || '',
      '',
      data.email || data.mailId || '',
      data.country || data.Country || '',
      data.organization || '',
      data.type || '',
      data.message || '',
      ''
    ]]);
    sheet.getRange(contactRow, 3).setNumberFormat('@').setValue(data.phoneDisplay || '');
    if (attachmentReferences && attachmentReferences.length) {
      vmgSetAttachmentLinks_(sheet.getRange(contactRow, 9), attachmentReferences);
    }
    return { row: contactRow };
  }

  if (sheetName === 'FEEDBACK') {
    var feedbackRow = sheet.getLastRow() + 1;
    sheet.getRange(feedbackRow, 1, 1, 5).setValues([[
      now,
      data.rating || '',
      data.email || '',
      data.comments || data.message || '',
      data.page || ''
    ]]);
    return { row: feedbackRow };
  }

  if (sheetName === 'Trade Updates Subscription') {
    var subscriptionRow = sheet.getLastRow() + 1;
    sheet.getRange(subscriptionRow, 1, 1, 4).setValues([[
      now,
      data.email || '',
      data.page || '',
      'trade-updates-subscription'
    ]]);
    return { row: subscriptionRow };
  }

  throw new Error('Unsupported target sheet.');
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
  var folderName = stamp + '_' + vmgSanitizeFolderPart_(data.fullName || data.fullname || 'Enquiry') + '_' + Utilities.getUuid().slice(0, 8);
  return parent.createFolder(folderName);
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

    // Files inherit the private parent folder's access. Do not call setSharing().
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

function vmgSetAttachmentLinks_(range, references) {
  var refs = Array.isArray(references) ? references : [];
  if (!refs.length) {
    range.setValue('');
    return;
  }

  var labels = refs.map(function (item) { return vmgNormalize_(item.name, 120) || 'Attachment'; });
  var text = labels.join('\n');
  var builder = SpreadsheetApp.newRichTextValue().setText(text);
  var cursor = 0;

  refs.forEach(function (item, index) {
    var label = labels[index];
    var end = cursor + label.length;
    if (item.url) builder.setLinkUrl(cursor, end, item.url);
    cursor = end + 1;
  });

  range.setRichTextValue(builder.build()).setWrap(true);
}
