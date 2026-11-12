const GMAIL_TYPOS = new Set([
  'gail.com', 'gamail.com', 'gamil.com', 'gmai.com', 'gmaill.com', 'gmal.com',
  'gmaik.com', 'gmeil.com', 'gmial.com', 'gmaild.com', 'gmaol.com',
  'gmaul.com', 'gamil.co', 'gamail.in', 'gmaill.in', 'gmai.in',
  'gimail.com', 'gemail.com', 'gmail.co', 'gmail.in', 'gmail.con',
  'gmail.cpm', 'gmail.ocm', 'gmail.comm', 'gmail.coom',
  'gmai.org', 'gmail.org', 'gmai.net', 'gmail.net'
]);

const YAHOO_TYPOS = new Set([
  'yaho.com', 'yahooo.com', 'yhaoo.com', 'yaho.in', 'yaho.co.in',
  'yahoo.con', 'yahoo.cpm', 'yahoo.ocm', 'yahoo.comm', 'yaho.co'
]);

const OUTLOOK_TYPOS = new Set([
  'outlok.com', 'outloo.com', 'hotmial.com', 'hotmaill.com', 'hotmali.com',
  'hotmai.com', 'outlook.con', 'hotmail.con'
]);

const REDIFF_TYPOS = new Set([
  'redifmail.com', 'rediffmai.com', 'redif.com', 'rediffmail.con'
]);

const TLD_TYPOS = {
  'con': '.com',
  'cpm': '.com',
  'ocm': '.com',
  'comm': '.com',
  'coom': '.com',
  'inn': '.in',
  'og': '.org',
  'orgg': '.org',
  'neet': '.net',
  'eduu': '.edu',
};

// Valid single-segment TLDs
const VALID_TLDS = new Set([
  'com', 'in', 'net', 'org', 'edu', 'gov', 'mil', 'co', 'io', 'ai', 'biz', 'info',
  'me', 'tech', 'dev', 'app', 'xyz', 'online', 'site', 'store', 'cloud', 'digital',
  'network', 'world', 'link', 'live', 'pro', 'ac', 'us', 'uk', 'ca', 'au', 'de',
  'fr', 'jp', 'eu', 'sg', 'ae', 'global', 'agency', 'space', 'club', 'design', 'art',
  'cc', 'tv', 'vc', 'gg', 'is', 'ch', 'nl', 'se', 'no', 'es', 'it', 'ie', 'nz',
  'za', 'br', 'mx', 'corp', 'inc', 'ltd', 'int', 'asia'
]);

// Valid multi-segment TLDs (e.g. .co.in, .org.in)
const VALID_COMPOUND_TLDS = new Set([
  'co.in', 'ac.in', 'edu.in', 'gov.in', 'net.in', 'org.in', 'res.in', 'gen.in',
  'co.uk', 'org.uk', 'ac.uk', 'gov.uk', 'me.uk', 'net.uk',
  'com.au', 'net.au', 'org.au', 'edu.au', 'gov.au',
  'co.nz', 'org.nz', 'net.nz', 'ac.nz',
  'co.za', 'org.za', 'net.za', 'ac.za',
  'com.sg', 'edu.sg', 'gov.sg', 'net.sg', 'org.sg',
  'com.my', 'edu.my', 'gov.my', 'net.my', 'org.my',
  'co.jp', 'ac.jp', 'ne.jp', 'or.jp',
  'com.br', 'org.br', 'net.br', 'edu.br',
  'com.mx', 'org.mx', 'net.mx', 'edu.mx',
  'com.pk', 'org.pk', 'edu.pk',
  'com.ng', 'org.ng', 'edu.ng',
  'com.sa', 'org.sa', 'edu.sa',
  'com.ae', 'net.ae', 'org.ae', 'gov.ae', 'ac.ae'
]);

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { isValid: false, message: 'Please enter your email address.' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic syntax check: local@domain.tld
  const generalRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9-]+\.)+([a-zA-Z]{2,})$/;
  if (!generalRegex.test(trimmed)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address (e.g. name@gmail.com, .in, .org, .net).'
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }

  const [localPart, domainPart] = parts;

  // Local part cannot start or end with a dot, and cannot have consecutive dots
  if (localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..')) {
    return { isValid: false, message: 'Please enter a valid email address.' };
  }

  // Check known typos of popular email providers
  if (GMAIL_TYPOS.has(domainPart)) {
    return {
      isValid: false,
      message: 'Did you mean @gmail.com? Please enter a valid email address.'
    };
  }

  if (YAHOO_TYPOS.has(domainPart)) {
    return {
      isValid: false,
      message: 'Did you mean @yahoo.com? Please enter a valid email address.'
    };
  }

  if (OUTLOOK_TYPOS.has(domainPart)) {
    return {
      isValid: false,
      message: 'Did you mean @outlook.com or @hotmail.com? Please enter a valid email address.'
    };
  }

  if (REDIFF_TYPOS.has(domainPart)) {
    return {
      isValid: false,
      message: 'Did you mean @rediffmail.com? Please enter a valid email address.'
    };
  }

  // Provider-specific strict rules
  if (domainPart.startsWith('gmail.') && domainPart !== 'gmail.com') {
    return {
      isValid: false,
      message: 'Invalid domain. Gmail addresses must end with @gmail.com.'
    };
  }

  // Extract domain segments and TLDs
  const domainSegments = domainPart.split('.');
  const tld = domainSegments[domainSegments.length - 1];
  const secondLast = domainSegments.length > 2 ? domainSegments[domainSegments.length - 2] : '';
  const compoundTLD = secondLast ? `${secondLast}.${tld}` : '';

  // Check for common TLD typos (.con -> .com, .og -> .org, .inn -> .in)
  if (TLD_TYPOS[tld]) {
    return {
      isValid: false,
      message: `Did you mean ${TLD_TYPOS[tld]}? Please check your email extension.`
    };
  }

  // Verify that the top-level domain is recognized (.com, .in, .org, .net, etc.)
  if (!VALID_TLDS.has(tld) && !VALID_COMPOUND_TLDS.has(compoundTLD)) {
    return {
      isValid: false,
      message: 'Please enter an email with a valid domain (e.g. .com, .in, .org, .net, .edu).'
    };
  }

  return { isValid: true, cleanEmail: trimmed };
};

const validatePersonName = (name, fieldLabel = "Full name") => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { isValid: false, message: `${fieldLabel} is required.` };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return { isValid: false, message: `${fieldLabel} must be at least 2 characters long.` };
  }

  // Letters only, including valid spaces between names. Rejects numbers and special characters.
  const nameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;
  if (!nameRegex.test(trimmed)) {
    if (/[0-9]/.test(trimmed)) {
      return { isValid: false, message: `${fieldLabel} cannot contain numbers. Only letters and spaces are allowed.` };
    }
    if (/[^a-zA-Z\s]/.test(trimmed)) {
      return { isValid: false, message: `${fieldLabel} cannot contain special characters. Only letters and spaces are allowed.` };
    }
    return { isValid: false, message: `${fieldLabel} can only contain letters and a single space between names.` };
  }

  return { isValid: true, cleanName: trimmed };
};

const validateBusinessName = (name) => {
  if (!name || typeof name !== 'string' || !name.trim()) {
    return { isValid: false, message: 'Business name is required.' };
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, message: 'Business name must be at least 2 characters long.' };
  }
  if (trimmed.length > 100) {
    return { isValid: false, message: 'Business name cannot exceed 100 characters.' };
  }
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return { isValid: false, message: 'Business name must contain letters or numbers, not only symbols.' };
  }
  if (/[<>^=+`~|]/.test(trimmed)) {
    return { isValid: false, message: 'Business name cannot contain invalid characters (< > ^ = + | ~ `).' };
  }
  return { isValid: true, cleanName: trimmed };
};

const COUNTRY_NAME_TO_ISO = {
  'india': 'IN',
  'united states': 'US',
  'united states of america': 'US',
  'usa': 'US',
  'us': 'US',
  'united kingdom': 'GB',
  'uk': 'GB',
  'great britain': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'germany': 'DE',
  'france': 'FR',
  'spain': 'ES',
  'italy': 'IT',
  'netherlands': 'NL',
  'holland': 'NL',
  'ireland': 'IE',
  'singapore': 'SG',
  'japan': 'JP',
  'china': 'CN',
  'brazil': 'BR',
  'mexico': 'MX',
  'south africa': 'ZA',
  'new zealand': 'NZ',
  'switzerland': 'CH',
  'austria': 'AT',
  'sweden': 'SE',
  'norway': 'NO',
  'denmark': 'DK',
  'finland': 'FI',
  'poland': 'PL',
  'portugal': 'PT',
  'belgium': 'BE',
  'greece': 'GR',
  'turkey': 'TR',
  'saudi arabia': 'SA',
  'malaysia': 'MY',
  'philippines': 'PH',
  'indonesia': 'ID',
  'thailand': 'TH',
  'south korea': 'KR',
  'korea': 'KR',
  'pakistan': 'PK',
  'bangladesh': 'BD',
  'sri lanka': 'LK',
  'russia': 'RU',
  'egypt': 'EG',
  'israel': 'IL',
  'chile': 'CL',
  'colombia': 'CO',
  'vietnam': 'VN',
  'argentina': 'AR',
  'malta': 'MT',
  'united arab emirates': 'AE',
  'uae': 'AE',
  'qatar': 'QA',
  'bahrain': 'BH',
  'kuwait': 'KW',
  'oman': 'OM',
  'hong kong': 'HK',
  'macau': 'MO',
};

const NO_POSTAL_COUNTRIES = new Set([
  'GD', 'AE', 'QA', 'BH', 'KW', 'OM', 'BS', 'BZ', 'BJ', 'BW', 'BF', 'BI', 'CM',
  'CF', 'KM', 'CG', 'CD', 'CI', 'DJ', 'DM', 'GQ', 'ER', 'FJ', 'GA', 'GM', 'GH',
  'GY', 'HK', 'KI', 'KP', 'MO', 'ML', 'MR', 'MU', 'NR', 'RW', 'ST', 'SC', 'SL',
  'SB', 'SO', 'SR', 'SY', 'TL', 'TG', 'TO', 'TV', 'UG', 'VU', 'YE', 'ZW'
]);

const COUNTRY_POSTAL_RULES = {
  IN: {
    label: "PIN Code *",
    placeholder: "e.g. 521301 (6 digits)",
    required: true,
    minLength: 6,
    maxLength: 6,
    numericOnly: true,
    regex: /^[1-9][0-9]{5}$/,
    formatDescription: "exactly 6 digits (e.g. 521301)",
    errorMessage: "Indian PIN code must be exactly 6 digits (e.g. 521301) and cannot start with 0."
  },
  US: {
    label: "ZIP Code *",
    placeholder: "e.g. 90210 or 90210-1234",
    required: true,
    minLength: 5,
    maxLength: 10,
    numericOnly: false,
    allowHyphen: true,
    regex: /^\d{5}(-\d{4})?$/,
    formatDescription: "5 digits (e.g. 90210) or ZIP+4 (e.g. 90210-1234)",
    errorMessage: "ZIP Code must be 5 digits (e.g. 90210) or ZIP+4 format (e.g. 90210-1234)."
  },
  GB: {
    label: "Postcode *",
    placeholder: "e.g. SW1A 1AA",
    required: true,
    minLength: 5,
    maxLength: 8,
    alphanumeric: true,
    allowSpace: true,
    regex: /^[A-Z]{1,2}[0-9][A-Z0-9]?\s?[0-9][A-Z]{2}$/i,
    formatDescription: "UK postcode format (e.g. SW1A 1AA)",
    errorMessage: "Please enter a valid UK postcode (e.g. SW1A 1AA)."
  },
  CA: {
    label: "Postal Code *",
    placeholder: "e.g. K1A 0B1",
    required: true,
    minLength: 6,
    maxLength: 7,
    alphanumeric: true,
    allowSpace: true,
    regex: /^[A-CEGHJ-NPR-TVXY][0-9][A-CEGHJ-NPR-TV-Z]\s?[0-9][A-CEGHJ-NPR-TV-Z][0-9]$/i,
    formatDescription: "Canadian postal format (e.g. K1A 0B1)",
    errorMessage: "Canadian postal code must follow the format A1A 1A1 (e.g. K1A 0B1)."
  },
  AU: {
    label: "Postal Code *",
    placeholder: "e.g. 2000 (4 digits)",
    required: true,
    minLength: 4,
    maxLength: 4,
    numericOnly: true,
    regex: /^\d{4}$/,
    formatDescription: "exactly 4 digits (e.g. 2000)",
    errorMessage: "Australian postal code must be exactly 4 digits (e.g. 2000)."
  },
  DE: {
    label: "Postal Code *",
    placeholder: "e.g. 10115 (5 digits)",
    required: true,
    minLength: 5,
    maxLength: 5,
    numericOnly: true,
    regex: /^\d{5}$/,
    formatDescription: "exactly 5 digits (e.g. 10115)",
    errorMessage: "German postal code must be exactly 5 digits (e.g. 10115)."
  },
  FR: {
    label: "Postal Code *",
    placeholder: "e.g. 75001 (5 digits)",
    required: true,
    minLength: 5,
    maxLength: 5,
    numericOnly: true,
    regex: /^\d{5}$/,
    formatDescription: "exactly 5 digits (e.g. 75001)",
    errorMessage: "French postal code must be exactly 5 digits (e.g. 75001)."
  },
  ES: {
    label: "Postal Code *",
    placeholder: "e.g. 28001 (5 digits)",
    required: true,
    minLength: 5,
    maxLength: 5,
    numericOnly: true,
    regex: /^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/,
    formatDescription: "5 digits (01000 - 52999)",
    errorMessage: "Spanish postal code must be 5 digits between 01000 and 52999 (e.g. 28001)."
  },
  IT: {
    label: "CAP / Postal Code *",
    placeholder: "e.g. 00187 (5 digits)",
    required: true,
    minLength: 5,
    maxLength: 5,
    numericOnly: true,
    regex: /^\d{5}$/,
    formatDescription: "exactly 5 digits (e.g. 00187)",
    errorMessage: "Italian postal code must be exactly 5 digits (e.g. 00187)."
  },
  NL: {
    label: "Postal Code *",
    placeholder: "e.g. 1012 AB",
    required: true,
    minLength: 6,
    maxLength: 7,
    alphanumeric: true,
    allowSpace: true,
    regex: /^[1-9][0-9]{3}\s?[A-Z]{2}$/i,
    formatDescription: "4 digits followed by 2 letters (e.g. 1012 AB)",
    errorMessage: "Netherlands postal code must be 4 digits followed by 2 letters (e.g. 1012 AB)."
  },
  IE: {
    label: "Eircode *",
    placeholder: "e.g. D02 X285",
    required: true,
    minLength: 7,
    maxLength: 8,
    alphanumeric: true,
    allowSpace: true,
    regex: /^([AC-FHKNPRTV-Y]\d{2}|D6W)\s?[0-9AC-FHKNPRTV-Y]{4}$/i,
    formatDescription: "Irish Eircode (e.g. D02 X285)",
    errorMessage: "Irish Eircode must follow the format D02 X285 (7 alphanumeric characters)."
  },
  MT: {
    label: "Postal Code *",
    placeholder: "e.g. VLT 1115",
    required: true,
    minLength: 7,
    maxLength: 8,
    alphanumeric: true,
    allowSpace: true,
    regex: /^[A-Z]{3}\s?\d{4}$/i,
    formatDescription: "3 letters followed by 4 digits (e.g. VLT 1115)",
    errorMessage: "Maltese postal code must be 3 letters followed by 4 digits (e.g. VLT 1115)."
  },
  SG: {
    label: "Postal Code *",
    placeholder: "e.g. 238801 (6 digits)",
    required: true,
    minLength: 6,
    maxLength: 6,
    numericOnly: true,
    regex: /^\d{6}$/,
    formatDescription: "exactly 6 digits (e.g. 238801)",
    errorMessage: "Singapore postal code must be exactly 6 digits (e.g. 238801)."
  },
  JP: {
    label: "Postal Code *",
    placeholder: "e.g. 100-0001",
    required: true,
    minLength: 7,
    maxLength: 8,
    allowHyphen: true,
    regex: /^\d{3}-?\d{4}$/,
    formatDescription: "7 digits (e.g. 100-0001)",
    errorMessage: "Japanese postal code must be 7 digits (e.g. 100-0001)."
  },
  CN: {
    label: "Postal Code *",
    placeholder: "e.g. 100000 (6 digits)",
    required: true,
    minLength: 6,
    maxLength: 6,
    numericOnly: true,
    regex: /^\d{6}$/,
    formatDescription: "exactly 6 digits (e.g. 100000)",
    errorMessage: "Chinese postal code must be exactly 6 digits (e.g. 100000)."
  },
  BR: {
    label: "CEP / Postal Code *",
    placeholder: "e.g. 01310-200",
    required: true,
    minLength: 8,
    maxLength: 9,
    allowHyphen: true,
    regex: /^\d{5}-?\d{3}$/,
    formatDescription: "8 digits (e.g. 01310-200)",
    errorMessage: "Brazilian CEP must be 8 digits (e.g. 01310-200)."
  },
  MX: {
    label: "Postal Code *",
    placeholder: "e.g. 06000 (5 digits)",
    required: true,
    minLength: 5,
    maxLength: 5,
    numericOnly: true,
    regex: /^\d{5}$/,
    formatDescription: "exactly 5 digits (e.g. 06000)",
    errorMessage: "Mexican postal code must be exactly 5 digits (e.g. 06000)."
  },
  AR: {
    label: "Postal Code *",
    placeholder: "e.g. 1024 or C1024CWN",
    required: true,
    minLength: 4,
    maxLength: 8,
    alphanumeric: true,
    regex: /^\d{4}$|^[A-Z]\d{4}[A-Z]{3}$/i,
    formatDescription: "4 digits or 8-character alphanumeric (e.g. C1024CWN)",
    errorMessage: "Argentine postal code must be 4 digits or 8 alphanumeric characters (e.g. C1024CWN)."
  },
  PL: {
    label: "Postal Code *",
    placeholder: "e.g. 00-001",
    required: true,
    minLength: 5,
    maxLength: 6,
    allowHyphen: true,
    regex: /^\d{2}-?\d{3}$/,
    formatDescription: "5 digits (e.g. 00-001)",
    errorMessage: "Polish postal code must follow the format 00-001."
  },
  PT: {
    label: "Postal Code *",
    placeholder: "e.g. 1000-001",
    required: true,
    minLength: 7,
    maxLength: 8,
    allowHyphen: true,
    regex: /^\d{4}-?\d{3}$/,
    formatDescription: "7 digits (e.g. 1000-001)",
    errorMessage: "Portuguese postal code must follow the format 1000-001."
  },
  SE: {
    label: "Postal Code *",
    placeholder: "e.g. 111 22",
    required: true,
    minLength: 5,
    maxLength: 6,
    allowSpace: true,
    regex: /^\d{3}\s?\d{2}$/,
    formatDescription: "5 digits (e.g. 111 22)",
    errorMessage: "Swedish postal code must be 5 digits (e.g. 111 22)."
  },
  GR: {
    label: "Postal Code *",
    placeholder: "e.g. 105 57",
    required: true,
    minLength: 5,
    maxLength: 6,
    allowSpace: true,
    regex: /^\d{3}\s?\d{2}$/,
    formatDescription: "5 digits (e.g. 105 57)",
    errorMessage: "Greek postal code must be 5 digits (e.g. 105 57)."
  },
};

// 4-digit numeric countries
['ZA', 'NZ', 'CH', 'AT', 'BE', 'NO', 'DK', 'PH', 'BD'].forEach((c) => {
  if (!COUNTRY_POSTAL_RULES[c]) {
    COUNTRY_POSTAL_RULES[c] = {
      label: "Postal Code *",
      placeholder: "e.g. 4 digits",
      required: true,
      minLength: 4,
      maxLength: 4,
      numericOnly: true,
      regex: /^\d{4}$/,
      formatDescription: "exactly 4 digits",
      errorMessage: "Postal code must be exactly 4 digits."
    };
  }
});

// 5-digit numeric countries
['FI', 'TR', 'SA', 'MY', 'ID', 'TH', 'KR', 'PK', 'LK', 'EG'].forEach((c) => {
  if (!COUNTRY_POSTAL_RULES[c]) {
    COUNTRY_POSTAL_RULES[c] = {
      label: "Postal Code *",
      placeholder: "e.g. 5 digits",
      required: true,
      minLength: 5,
      maxLength: 5,
      numericOnly: true,
      regex: /^\d{5}$/,
      formatDescription: "exactly 5 digits",
      errorMessage: "Postal code must be exactly 5 digits."
    };
  }
});

// 6-digit numeric countries
['RU', 'CO'].forEach((c) => {
  if (!COUNTRY_POSTAL_RULES[c]) {
    COUNTRY_POSTAL_RULES[c] = {
      label: "Postal Code *",
      placeholder: "e.g. 6 digits",
      required: true,
      minLength: 6,
      maxLength: 6,
      numericOnly: true,
      regex: /^\d{6}$/,
      formatDescription: "exactly 6 digits",
      errorMessage: "Postal code must be exactly 6 digits."
    };
  }
});

// 7-digit numeric countries
['IL', 'CL'].forEach((c) => {
  if (!COUNTRY_POSTAL_RULES[c]) {
    COUNTRY_POSTAL_RULES[c] = {
      label: "Postal Code *",
      placeholder: "e.g. 7 digits",
      required: true,
      minLength: 7,
      maxLength: 7,
      numericOnly: true,
      regex: /^\d{7}$/,
      formatDescription: "exactly 7 digits",
      errorMessage: "Postal code must be exactly 7 digits."
    };
  }
});

const resolveCountryCode = (countryOrIso) => {
  if (!countryOrIso || typeof countryOrIso !== 'string') return '';
  const trimmed = countryOrIso.trim();
  if (trimmed.length === 2) return trimmed.toUpperCase();
  const lower = trimmed.toLowerCase();
  if (COUNTRY_NAME_TO_ISO[lower]) return COUNTRY_NAME_TO_ISO[lower];
  for (const [name, iso] of Object.entries(COUNTRY_NAME_TO_ISO)) {
    if (lower === name || lower.startsWith(name) || name.startsWith(lower)) {
      return iso;
    }
  }
  return '';
};

const getCountryPostalRules = (countryOrIso) => {
  const iso = resolveCountryCode(countryOrIso);

  if (NO_POSTAL_COUNTRIES.has(iso)) {
    return {
      label: "Postal Code (Optional)",
      placeholder: "Optional / Not applicable",
      required: false,
      minLength: 0,
      maxLength: 12,
      formatDescription: "optional",
      isoCode: iso,
    };
  }

  if (iso && COUNTRY_POSTAL_RULES[iso]) {
    return { ...COUNTRY_POSTAL_RULES[iso], isoCode: iso };
  }

  return {
    label: "Postal Code *",
    placeholder: "Enter postal code",
    required: true,
    minLength: 2,
    maxLength: 12,
    regex: /^[a-zA-Z0-9\- ]{2,12}$/,
    formatDescription: "2 to 12 alphanumeric characters",
    errorMessage: "Please enter a valid postal code (2 to 12 alphanumeric characters).",
    isoCode: iso || "",
  };
};

const sanitizePostalCode = (val, countryOrIso = '') => {
  if (!val || typeof val !== 'string') return '';
  const rules = getCountryPostalRules(countryOrIso);
  const maxLen = rules?.maxLength || 12;

  if (rules?.numericOnly) {
    return val.replace(/\D/g, '').slice(0, maxLen);
  }

  if (rules?.allowHyphen && !rules?.alphanumeric) {
    return val.replace(/[^0-9\-]/g, '').slice(0, maxLen);
  }

  if (rules?.alphanumeric) {
    return val.replace(/[^a-zA-Z0-9\- ]/g, '').toUpperCase().slice(0, maxLen);
  }

  return val.replace(/[^a-zA-Z0-9\- ]/g, '').slice(0, maxLen);
};

const validatePostalCode = (val, arg2, arg3, arg4) => {
  let countryIdentifier = '';
  let required = true;
  let fieldLabel = 'Postal code';

  if (typeof arg2 === 'boolean') {
    required = arg2;
    if (typeof arg3 === 'string') fieldLabel = arg3;
    if (typeof arg4 === 'string') countryIdentifier = arg4;
  } else if (typeof arg2 === 'string') {
    countryIdentifier = arg2;
    if (typeof arg3 === 'boolean') {
      required = arg3;
      if (typeof arg4 === 'string') fieldLabel = arg4;
    } else if (typeof arg3 === 'string') {
      fieldLabel = arg3;
      if (typeof arg4 === 'boolean') required = arg4;
    }
  } else if (typeof arg2 === 'object' && arg2 !== null) {
    countryIdentifier = arg2.isoCode || arg2.country || arg2.name || '';
    if (typeof arg2.required === 'boolean') required = arg2.required;
    if (typeof arg2.label === 'string') fieldLabel = arg2.label;
    if (typeof arg3 === 'boolean') required = arg3;
    if (typeof arg4 === 'string') fieldLabel = arg4;
  }

  const rules = getCountryPostalRules(countryIdentifier);
  if (rules && rules.label && fieldLabel === 'Postal code') {
    fieldLabel = rules.label.replace(/\s*\*$/, '');
  }
  if (rules && typeof rules.required === 'boolean' && typeof arg2 !== 'boolean' && typeof arg3 !== 'boolean') {
    required = rules.required;
  }

  const raw = val != null ? String(val) : '';
  const trimmed = raw.trim();

  if (!trimmed) {
    if (required) {
      return { isValid: false, message: `${fieldLabel} is required (*).`, cleanPostalCode: '' };
    }
    return { isValid: true, cleanPostalCode: '' };
  }

  if (rules?.regex) {
    if (!rules.regex.test(trimmed)) {
      return {
        isValid: false,
        message: rules.errorMessage || `Please enter a valid ${fieldLabel}.`,
        cleanPostalCode: trimmed,
      };
    }
    return { isValid: true, cleanPostalCode: trimmed };
  }

  const minLen = rules?.minLength || 2;
  const maxLen = rules?.maxLength || 12;
  if (trimmed.length < minLen || trimmed.length > maxLen) {
    return {
      isValid: false,
      message: `${fieldLabel} must be between ${minLen} and ${maxLen} characters.`,
      cleanPostalCode: trimmed,
    };
  }

  const postalRegex = /^[a-zA-Z0-9\- ]+$/;
  if (!postalRegex.test(trimmed)) {
    return {
      isValid: false,
      message: `${fieldLabel} can only contain letters, numbers, hyphens (-) and spaces.`,
      cleanPostalCode: trimmed,
    };
  }

  return { isValid: true, cleanPostalCode: trimmed };
};

module.exports = {
  validateEmail,
  validatePersonName,
  validateBusinessName,
  validatePostalCode,
  sanitizePostalCode,
  getCountryPostalRules,
  resolveCountryCode,
  COUNTRY_NAME_TO_ISO,
  NO_POSTAL_COUNTRIES,
  COUNTRY_POSTAL_RULES,
};

