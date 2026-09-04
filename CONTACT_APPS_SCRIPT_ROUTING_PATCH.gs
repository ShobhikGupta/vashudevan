/*
  VMG WEBSITE MESSAGES — routing + readable phone display patch

  STATUS: SOURCE PATCH ONLY. Committing this file does NOT deploy Google Apps Script.

  Add these functions to the deployed Apps Script project that currently serves
  window.AppConfig.googleScriptUrl. Keep the existing security/attachment functions
  from CONTACT_APPS_SCRIPT_SECURITY_PATCH.gs.

  Existing spreadsheet: WEBSITE MESSAGES
  Required tabs:
    OPENING POP-UP MESSAGES
    CONTACT US MESSAGES
    FEEDBACK
    Trade Updates Subscription
*/

function vmgGetTargetSheetName_(data) {
  var source = String((data && data.source) || '').trim().toLowerCase();
  var type = String((data && data.type) || '').trim().toLowerCase();

  if (source === 'popup') return 'OPENING POP-UP MESSAGES';
  if (source === 'website-feedback' || type === 'website feedback') return 'FEEDBACK';
  if (source === 'trade-updates-subscription' || type === 'trade updates subscription') return 'Trade Updates Subscription';
  if (source === 'main') return 'CONTACT US MESSAGES';

  // Safe fallback: unknown payloads must never spill into unrelated tabs.
  return 'CONTACT US MESSAGES';
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

function vmgPhoneDisplay_(data) {
  var explicit = String((data && data.phoneDisplay) || '').trim();
  if (explicit) return explicit;

  var dial = String((data && data.phoneDialCode) || '').trim();
  var national = String((data && data.phoneNational) || '').replace(/\D/g, '');
  if (dial && dial.charAt(0) !== '+') dial = '+' + dial.replace(/\D/g, '');
  if (dial && national) return dial + ' ' + national;

  // Compatibility fallback for an older client. New clients send phoneDisplay.
  return String((data && (data.phoneE164 || data.contact || data.contactNumber || data.phone || data['PHONE NUMBER'])) || '').trim();
}

function vmgSetAttachmentLinks_(range, references) {
  var refs = Array.isArray(references) ? references : [];
  if (!refs.length) {
    range.setValue('');
    return;
  }

  var parts = [];
  var spans = [];
  var cursor = 0;
  refs.forEach(function (item, index) {
    var label = String(item.name || ('Attachment ' + (index + 1)));
    if (index) {
      parts.push('\n');
      cursor += 1;
    }
    parts.push(label);
    spans.push({ start: cursor, end: cursor + label.length, url: item.url || '' });
    cursor += label.length;
  });

  var builder = SpreadsheetApp.newRichTextValue().setText(parts.join(''));
  spans.forEach(function (span) {
    if (span.url) builder.setLinkUrl(span.start, span.end, span.url);
  });
  range.setRichTextValue(builder.build());
}

function vmgAppendRoutedSubmission_(spreadsheet, data, attachmentReferences) {
  var sheetName = vmgGetTargetSheetName_(data);
  var sheet = vmgEnsureTargetSheet_(spreadsheet, sheetName);
  var now = new Date();
  var phoneDisplay = vmgPhoneDisplay_(data);

  if (sheetName === 'FEEDBACK') {
    sheet.appendRow([
      now,
      data.rating || data['FEEDBACK RATING'] || '',
      data.email || data['MAIL ID'] || '',
      data.message || data.comments || data['MESSAGE'] || '',
      data.page || ''
    ]);
    return sheetName;
  }

  if (sheetName === 'Trade Updates Subscription') {
    sheet.appendRow([
      now,
      data.email || data['MAIL ID'] || '',
      data.page || '',
      data.source || 'trade-updates-subscription'
    ]);
    return sheetName;
  }

  if (sheetName === 'OPENING POP-UP MESSAGES') {
    var popupRow = sheet.getLastRow() + 1;
    sheet.getRange(popupRow, 1, 1, 4).setValues([[
      now,
      data.country || data.Country || '',
      phoneDisplay,
      data.email || data['MAIL ID'] || ''
    ]]);
    sheet.getRange(popupRow, 3).setNumberFormat('@').setValue(phoneDisplay);
    return sheetName;
  }

  // CONTACT US MESSAGES — actual Contact enquiries only.
  var refs = Array.isArray(attachmentReferences) ? attachmentReferences : [];
  var contactRow = sheet.getLastRow() + 1;
  sheet.getRange(contactRow, 1, 1, 9).setValues([[
    now,
    data.fullName || data.fullname || '',
    phoneDisplay,
    data.email || data.mailId || '',
    data.country || data.Country || '',
    data.organization || '',
    data.type || '',
    data.message || '',
    ''
  ]]);
  sheet.getRange(contactRow, 3).setNumberFormat('@').setValue(phoneDisplay);
  if (refs.length) vmgSetAttachmentLinks_(sheet.getRange(contactRow, 9), refs);
  return sheetName;
}

/*
  REQUIRED doPost(e) INTEGRATION
  ------------------------------
  The deployed doPost must parse the request exactly once, then route it.

  Example integration skeleton:

  function doPost(e) {
    try {
      var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');
      var source = String(data.source || '').toLowerCase();
      var targetSheet = vmgGetTargetSheetName_(data);
      var attachmentReferences = [];

      // Contact is the security-sensitive form. Preserve the current Turnstile,
      // honeypot, minimum-time, duplicate and rate-limit checks.
      if (targetSheet === 'CONTACT US MESSAGES') {
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

        try {
          attachmentReferences = vmgSaveContactAttachments_(data.attachments || []);
        } catch (uploadError) {
          return vmgJson_({ success: false, message: 'Attachments could not be stored securely.' });
        }
      }

      // Preserve any existing validation used specifically by popup, feedback or
      // subscription. Do NOT force Contact Turnstile rules onto those forms.

      var ss = SpreadsheetApp.openById('YOUR_EXISTING_WEBSITE_MESSAGES_SPREADSHEET_ID');
      var writtenTo = vmgAppendRoutedSubmission_(ss, data, attachmentReferences);

      // Preserve the existing notification/email logic here, if any.
      return vmgJson_({ success: true, routedTo: writtenTo });
    } catch (error) {
      return vmgJson_({ success: false, message: 'Submission could not be processed.' });
    }
  }

  IMPORTANT:
  - Replace YOUR_EXISTING_WEBSITE_MESSAGES_SPREADSHEET_ID with the ID already used
    by the deployed project; do not create a second workbook.
  - Store TURNSTILE_SECRET_KEY and CONTACT_UPLOAD_FOLDER_ID only in Apps Script
    Script Properties. Do not put either secret/private ID into GitHub.
  - Do not move, clear or delete historical rows. This router applies to NEW writes.
  - Deploy a NEW Apps Script Web App version after saving the code.
  - Only after deployment and end-to-end verification should the frontend set
    window.AppConfig.contactSecurityReady = true.
*/
