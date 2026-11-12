import { Country } from "country-state-city";

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

export const validateEmail = (email) => {
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

export const validatePersonName = (name, fieldLabel = "Full name") => {
  if (!name || typeof name !== "string" || !name.trim()) {
    return {
      isValid: false,
      message: `${fieldLabel} is required.`,
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      message: `${fieldLabel} must be at least 2 characters long.`,
    };
  }

  // Letters only, including valid spaces between names. Rejects numbers and special characters.
  const nameRegex = /^[a-zA-Z]+(?: [a-zA-Z]+)*$/;
  if (!nameRegex.test(trimmed)) {
    if (/[0-9]/.test(trimmed)) {
      return {
        isValid: false,
        message: `${fieldLabel} cannot contain numbers. Only letters and spaces are allowed.`,
      };
    }
    if (/[^a-zA-Z\s]/.test(trimmed)) {
      return {
        isValid: false,
        message: `${fieldLabel} cannot contain special characters. Only letters and spaces are allowed.`,
      };
    }
    return {
      isValid: false,
      message: `${fieldLabel} can only contain letters and a single space between names.`,
    };
  }

  return { isValid: true, cleanName: trimmed };
};

export const validateBusinessName = (name) => {
  if (!name || typeof name !== "string" || !name.trim()) {
    return {
      isValid: false,
      message: "Business name is required (*).",
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return {
      isValid: false,
      message: "Business name must be at least 2 characters long.",
    };
  }

  if (trimmed.length > 100) {
    return {
      isValid: false,
      message: "Business name cannot exceed 100 characters.",
    };
  }

  // Must contain letters or alphanumeric characters (cannot be only special symbols like !$#^*+=|><":?/_-)
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return {
      isValid: false,
      message: "Business name must contain letters or numbers, not only symbols.",
    };
  }

  // Reject malicious or keyboard-mashing symbols: < > ^ = + | ~ `
  if (/[<>^=+`~|]/.test(trimmed)) {
    return {
      isValid: false,
      message: "Business name cannot contain invalid characters (< > ^ = + | ~ `).",
    };
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

/**
 * Resolves a country name or ISO code to a canonical 2-letter uppercase ISO code.
 */
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

/**
 * Returns country-specific postal rules based on country name or ISO code.
 */
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

/**
 * Sanitizes postal code input based on country rules:
 * - India: only digits, max 6 digits.
 * - Numeric countries: only digits up to maxLength.
 * - Alphanumeric countries: uppercase letters, digits, spaces, hyphens up to maxLength.
 * - Generic/default: letters, digits, spaces, hyphens up to 12 characters.
 */
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

/**
 * Validates postal code / pincode based on country-specific official rules:
 * Supports:
 *   1) validatePostalCode(val, countryOrIso, required, fieldLabel)
 *   2) validatePostalCode(val, countryOrIso)
 *   3) validatePostalCode(val, required, fieldLabel)
 *   4) validatePostalCode(val, rulesObject)
 */
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

  // Country specific regex validation if defined
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

  // Fallback length and character checks
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

export {
  COUNTRY_NAME_TO_ISO,
  NO_POSTAL_COUNTRIES,
  COUNTRY_POSTAL_RULES,
  resolveCountryCode,
  getCountryPostalRules,
  sanitizePostalCode,
  validatePostalCode,
};

export const validateWebsite = (url) => {
  if (!url || typeof url !== "string" || !url.trim()) {
    return { isValid: true, cleanUrl: "" }; // Optional
  }
  const trimmed = url.trim();
  const urlRegex = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/i;
  if (!urlRegex.test(trimmed)) {
    return {
      isValid: false,
      message: "Please enter a valid website URL (e.g. https://example.com or example.com).",
    };
  }
  return { isValid: true, cleanUrl: trimmed };
};

// ── Country-specific mobile phone number digit rules ──────────────────────────
// Maps ISO-2 country codes to array of valid national mobile digit lengths
export const COUNTRY_MOBILE_RULES = {
  // North America & Caribbean (NANP + others)
  US: [10], CA: [10], MX: [10], AG: [10], AI: [10], AS: [10], BB: [10], BM: [10],
  BS: [10], DM: [10], DO: [10], GD: [10], GU: [10], JM: [10], KN: [10], KY: [10],
  LC: [10], MP: [10], MS: [10], PR: [10], SX: [10], TC: [10], TT: [7, 10], VC: [10],
  VG: [10], VI: [10], CU: [8], HT: [8],
  // Asia
  IN: [10], CN: [11], JP: [10], KR: [9, 10], SG: [8], MY: [9, 10], ID: [9, 10, 11, 12],
  PH: [10], VN: [9], TH: [9], PK: [10], BD: [10], LK: [9], NP: [10], MM: [8, 9, 10],
  HK: [8], TW: [9], MO: [8], KH: [8, 9], LA: [9, 10], MN: [8], AF: [9], BT: [8],
  BN: [7], MV: [7], TL: [7, 8],
  // Middle East
  AE: [9], SA: [9], QA: [8], KW: [8], BH: [8], OM: [8], IL: [9], JO: [9],
  LB: [7, 8], IQ: [10], IR: [10], SY: [9], YE: [9], PS: [9],
  // Europe
  GB: [10], DE: [10, 11], FR: [9], IT: [9, 10], ES: [9], NL: [9], BE: [9],
  CH: [9], AT: [10, 11, 12, 13], SE: [9], NO: [8], DK: [8], FI: [9, 10],
  IE: [9], PT: [9], PL: [9], CZ: [9], SK: [9], HU: [9], RO: [9], BG: [8, 9],
  GR: [10], TR: [10], RU: [10], UA: [9], BY: [9], RS: [8, 9], HR: [8, 9],
  SI: [8], BA: [8], AL: [9], MK: [8], ME: [8], IS: [7], LU: [9], MT: [8],
  CY: [8], EE: [7, 8], LV: [8], LT: [8], MD: [8], GE: [9], AM: [8], AZ: [9],
  KZ: [10], UZ: [9], KG: [9], TJ: [9], TM: [8], AD: [6], FO: [6], GI: [8],
  GL: [6], LI: [7, 8, 9], MC: [8, 9], SM: [6, 10], VA: [10], XK: [8],
  // Oceania
  AU: [9], NZ: [8, 9, 10], FJ: [7], PG: [8], NC: [6], PF: [8], WS: [7],
  TO: [5, 7], VU: [7], SB: [7], KI: [5, 8], FM: [7], PW: [7], MH: [7], NR: [7], TV: [5, 6],
  // Central & South America
  BR: [10, 11], AR: [10], CL: [9], CO: [10], PE: [9], VE: [10], EC: [9],
  BO: [8], PY: [9], UY: [8], CR: [8], PA: [8], GT: [8], HN: [8], SV: [8],
  NI: [8], BZ: [7], GY: [7], SR: [7], AW: [7], CW: [7, 8], BQ: [7, 8],
  // Africa
  ZA: [9], NG: [10], EG: [10], KE: [9], GH: [9], ET: [9], TZ: [9], UG: [9],
  DZ: [9], MA: [9], TN: [8], SD: [9], AO: [9], MZ: [9], ZW: [9], ZM: [9],
  SN: [9], CM: [9], CI: [10], RW: [9], MG: [9], MU: [8], NA: [9], BW: [8],
  BJ: [8], BF: [8], BI: [8], CV: [7], CF: [8], TD: [8], CD: [9], CG: [9],
  DJ: [8], GQ: [9], ER: [7], GA: [7, 8], GM: [7], GN: [9], GW: [7], LR: [7, 8],
  LY: [9], MW: [9], ML: [8], MR: [8], NE: [8], SL: [8], SO: [8, 9], SS: [9],
  SZ: [8], TG: [8], SC: [7], ST: [7], KM: [7], LS: [8],
};

/**
 * Resolves country phone digit rules by country ISO code, ISD calling code,
 * country name, or a country object.
 */
export const getCountryPhoneRules = (identifier) => {
  if (!identifier) {
    return {
      lengths: [10],
      minLength: 10,
      maxLength: 10,
      formatDescription: "exactly 10 digits",
      placeholder: "9876543210",
      isoCode: "IN",
      isdCode: "+91",
    };
  }

  let isoCode = "";
  let isdCode = "";
  let countryName = "";

  if (typeof identifier === "object" && identifier !== null) {
    isoCode = (identifier.isoCode || identifier.countryIso || identifier.phoneIso || "").toUpperCase();
    isdCode = identifier.code || identifier.phonecode || identifier.isdCode || "";
    countryName = identifier.name || identifier.country || "";
  } else if (typeof identifier === "string") {
    const raw = identifier.trim();
    if (COUNTRY_MOBILE_RULES[raw.toUpperCase()]) {
      isoCode = raw.toUpperCase();
    } else if (raw.startsWith("+") || /^\d+$/.test(raw)) {
      isdCode = raw;
    } else if (raw.length === 2 && /^[a-zA-Z]{2}$/.test(raw)) {
      isoCode = raw.toUpperCase();
    } else {
      countryName = raw;
    }
  }

  let allCountries = [];
  try {
    allCountries = Country.getAllCountries();
  } catch (e) {
    allCountries = [];
  }

  // If countryName given, find country by name
  if (!isoCode && countryName && allCountries.length > 0) {
    const match = allCountries.find(
      (c) => c.name.toLowerCase() === countryName.toLowerCase()
    );
    if (match) {
      isoCode = match.isoCode;
      if (!isdCode) isdCode = match.phonecode;
    }
  }

  // If isdCode given without isoCode, try finding matching countries
  let matchedLengths = null;
  if (isoCode && COUNTRY_MOBILE_RULES[isoCode]) {
    matchedLengths = COUNTRY_MOBILE_RULES[isoCode];
    if (!isdCode && allCountries.length > 0) {
      const match = allCountries.find((c) => c.isoCode === isoCode);
      if (match?.phonecode) isdCode = match.phonecode;
    }
  } else if (isdCode) {
    const cleanIsd = isdCode.replace(/\D/g, "");
    const matchingCountries = allCountries.filter(
      (c) => (c.phonecode || "").replace(/\D/g, "") === cleanIsd
    );
    if (matchingCountries.length > 0) {
      if (!isoCode) isoCode = matchingCountries[0].isoCode;
      const combined = [];
      matchingCountries.forEach((c) => {
        if (COUNTRY_MOBILE_RULES[c.isoCode]) {
          combined.push(...COUNTRY_MOBILE_RULES[c.isoCode]);
        }
      });
      if (combined.length > 0) {
        matchedLengths = [...new Set(combined)].sort((a, b) => a - b);
      }
    }
  }

  const lengths = matchedLengths && matchedLengths.length > 0
    ? matchedLengths
    : [7, 8, 9, 10, 11, 12, 13, 14, 15];

  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);

  let formatDescription = "";
  if (lengths.length === 1 || minLength === maxLength) {
    formatDescription = `exactly ${minLength} digits`;
  } else if (maxLength - minLength === lengths.length - 1) {
    formatDescription = `${minLength} to ${maxLength} digits`;
  } else {
    formatDescription = `${lengths.join(" or ")} digits`;
  }

  let placeholder = "9876543210";
  const cleanIsdDigits = (isdCode || "").replace(/\D/g, "");
  if (isoCode === "US" || isoCode === "CA" || cleanIsdDigits === "1") {
    placeholder = "(555) 123-4567";
  } else if (isoCode === "GB" || cleanIsdDigits === "44") {
    placeholder = "07123 456789";
  } else if (isoCode === "IN" || cleanIsdDigits === "91") {
    placeholder = "98765-43210";
  } else if (isoCode === "AU" || cleanIsdDigits === "61") {
    placeholder = "412-345-678";
  } else if (isoCode === "DE" || cleanIsdDigits === "49") {
    placeholder = "151 23456789";
  } else if (lengths[0] === 8) {
    placeholder = "9876-5432";
  } else if (lengths[0] === 9) {
    placeholder = "987-654-321";
  } else if (lengths[0] === 10) {
    placeholder = "98765-43210";
  } else if (lengths[0] === 11) {
    placeholder = "98765-432100";
  } else if (lengths[0] === 7) {
    placeholder = "987-6543";
  }

  const formattedIsd = isdCode
    ? (isdCode.startsWith("+") ? isdCode : `+${isdCode}`)
    : "";

  return {
    lengths,
    minLength,
    maxLength,
    formatDescription,
    placeholder,
    isoCode: isoCode || "",
    isdCode: formattedIsd,
  };
};

/**
 * Sanitizes phone number input:
 * - Allows digits, spaces, hyphens (-), and parentheses ().
 * - Caps the total count of actual digits to maxDigits while preserving formatting characters.
 */
export const sanitizePhoneInput = (val, maxDigits = 15) => {
  if (!val || typeof val !== "string") return "";
  const allowed = val.replace(/[^0-9\s\-()]/g, "");
  let digitCount = 0;
  let result = "";
  for (const char of allowed) {
    if (/\d/.test(char)) {
      if (digitCount < maxDigits) {
        result += char;
        digitCount++;
      }
    } else {
      result += char;
    }
  }
  return result;
};

/**
 * Checks if a keydown event should be permitted in a phone input.
 * Allows control keys (Backspace, Delete, Tab, Arrow keys, Enter, etc.),
 * allowed formatting characters (spaces, hyphens, parentheses),
 * and digits (as long as max digit count hasn't been reached).
 */
export const isPhoneKeyAllowed = (e, currentVal = "", maxDigits = 15) => {
  if (
    e.key === "Backspace" ||
    e.key === "Delete" ||
    e.key === "Tab" ||
    e.key === "ArrowLeft" ||
    e.key === "ArrowRight" ||
    e.key === "ArrowUp" ||
    e.key === "ArrowDown" ||
    e.key === "Enter" ||
    e.key === "Home" ||
    e.key === "End" ||
    e.ctrlKey ||
    e.metaKey
  ) {
    return true;
  }

  if (e.key === " " || e.key === "-" || e.key === "(" || e.key === ")") {
    return true;
  }

  if (/^\d$/.test(e.key)) {
    const target = e.target;
    const hasSelection = target && target.selectionStart !== target.selectionEnd;
    const currentDigits = (currentVal || "").replace(/\D/g, "");
    if (currentDigits.length >= maxDigits && !hasSelection) {
      return false;
    }
    return true;
  }

  return false;
};

/**
 * Dynamically validates maximum and minimum digit length based on country rules / ISD code.
 * Validates ONLY the actual digits (stripping spaces, hyphens, parentheses).
 */
export const validatePhoneDigits = (
  val,
  countryRulesOrIsd,
  countryName = "the selected country",
  required = true
) => {
  const raw = (val || "").trim();
  const digitsOnly = raw.replace(/\D/g, "");

  if (!digitsOnly) {
    if (required) {
      return { isValid: false, message: "Please enter your phone number.", digitsOnly: "" };
    }
    return { isValid: true, cleanDigits: "", formattedPhone: "" };
  }

  let rules = countryRulesOrIsd;
  if (!rules || typeof rules === "string" || !rules.minLength) {
    rules = getCountryPhoneRules(rules);
  }

  const lengths = rules?.lengths || [7, 8, 9, 10, 11, 12, 13, 14, 15];
  const minLength = rules?.minLength || Math.min(...lengths);
  const maxLength = rules?.maxLength || Math.max(...lengths);
  const desc = rules?.formatDescription || (minLength === maxLength ? `exactly ${minLength} digits` : `${minLength} to ${maxLength} digits`);

  if (minLength === maxLength) {
    if (digitsOnly.length !== minLength) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} must be ${desc}.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
  } else {
    if (digitsOnly.length < minLength) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} must be at least ${minLength} digits.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
    if (digitsOnly.length > maxLength) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} cannot exceed ${maxLength} digits.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
    if (lengths.length > 0 && !lengths.includes(digitsOnly.length)) {
      return {
        isValid: false,
        message: `Phone number for ${countryName} must be ${desc}.`,
        digitsOnly,
        minLength,
        maxLength,
      };
    }
  }

  return { isValid: true, digitsOnly, rawPhone: raw, minLength, maxLength };
};

/**
 * Builds standard sorted country ISD dial code options enriched with validation rules.
 */
export const buildDialCodeOptions = () => {
  const allCountries = Country.getAllCountries().sort((a, b) => a.name.localeCompare(b.name));
  const seen = new Set();
  const list = [];
  allCountries.forEach((c) => {
    if (c.phonecode) {
      const formattedCode = c.phonecode.startsWith("+") ? c.phonecode : `+${c.phonecode}`;
      const key = `${c.isoCode}-${formattedCode}`;
      if (!seen.has(key)) {
        seen.add(key);
        const rules = getCountryPhoneRules(c.isoCode);
        list.push({
          code: formattedCode,
          isoCode: c.isoCode,
          name: c.name,
          flag: c.flag || "",
          label: `${formattedCode} (${c.isoCode} - ${c.name})`,
          lengths: rules.lengths,
          minLength: rules.minLength,
          maxLength: rules.maxLength,
          formatDescription: rules.formatDescription,
          placeholder: rules.placeholder,
        });
      }
    }
  });
  return list.sort((a, b) => a.name.localeCompare(b.name));
};

let _cachedDialCodeOptions = null;
export const getDialCodeOptions = () => {
  if (!_cachedDialCodeOptions) {
    _cachedDialCodeOptions = buildDialCodeOptions();
  }
  return _cachedDialCodeOptions;
};
