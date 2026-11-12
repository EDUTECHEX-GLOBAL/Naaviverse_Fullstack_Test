const express = require('express');
const axios = require('axios');
const Visitor = require('../models/VisitorModel');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

const GEO_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const geoCache = new Map();
const inFlightLoggers = new Map();

// In-memory cache for server-side public IP resolution during localhost testing
let cachedLocalhostPublicIp = null;
let lastLocalhostIpFetchTime = 0;

// Standard browser User-Agent to avoid bot blocking on geolocation endpoints
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Clean and normalize IP string
const cleanIpString = (raw) => {
  if (!raw || typeof raw !== 'string') return '';
  let ip = raw.trim();

  // Strip IPv4-mapped IPv6 prefix: ::ffff:192.0.2.128 -> 192.0.2.128
  if (ip.startsWith('::ffff:')) {
    ip = ip.substring(7).trim();
  }

  // Strip port if IPv4 with port (e.g. 203.0.113.195:8080)
  if (/^(\d{1,3}\.){3}\d{1,3}:\d+$/.test(ip)) {
    ip = ip.split(':')[0].trim();
  }

  // Normalize IPv6 loopbacks and localhost
  if (ip === '::1' || ip.toLowerCase() === 'localhost') {
    return '127.0.0.1';
  }

  return ip;
};

// Check if an IP is a local loopback
const isLoopback = (ip) => {
  if (!ip) return false;
  return ip === '127.0.0.1' || ip === '::1' || ip.startsWith('127.');
};

// Comprehensive check for RFC 6890 / RFC 1918 / RFC 5735 private or reserved IPv4 addresses
const isPrivateOrReservedV4 = (ip) => {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => isNaN(n) || n < 0 || n > 255)) return true;
  const [a, b, c] = parts;

  if (a === 0) return true; // 0.0.0.0/8 (Current network)
  if (a === 10) return true; // 10.0.0.0/8 (Private network)
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 127) return true; // 127.0.0.0/8 (Loopback)
  if (a === 169 && b === 254) return true; // 169.254.0.0/16 (Link-local)
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12 (Private network)
  if (a === 192 && b === 0 && c === 0) return true; // 192.0.0.0/24 (IETF Protocol Assignments)
  if (a === 192 && b === 0 && c === 2) return true; // 192.0.2.0/24 (TEST-NET-1)
  if (a === 192 && b === 88 && c === 99) return true; // 192.88.99.0/24 (6to4 Relay Anycast)
  if (a === 192 && b === 168) return true; // 192.168.0.0/16 (Private network)
  if (a === 198 && b >= 18 && b <= 19) return true; // 198.18.0.0/15 (Network benchmark tests)
  if (a === 198 && b === 51 && c === 100) return true; // 198.51.100.0/24 (TEST-NET-2)
  if (a === 203 && b === 0 && c === 113) return true; // 203.0.113.0/24 (TEST-NET-3)
  if (a >= 224 && a <= 239) return true; // 224.0.0.0/4 (Multicast)
  if (a >= 240) return true; // 240.0.0.0/4 (Reserved / Future use / Broadcast)
  return false;
};

// Comprehensive check for RFC 4291 / RFC 4193 private or reserved IPv6 addresses
const isPrivateOrReservedV6 = (ip) => {
  const norm = ip.toLowerCase();
  if (norm === '::1' || norm === '::') return true;
  if (norm.startsWith('fe80:')) return true; // Link-local
  if (/^f[cd][0-9a-f]{2}:/i.test(norm)) return true; // Unique local (fc00::/7)
  if (norm.startsWith('ff')) return true; // Multicast
  return false;
};

// Strict public routable IP validation for IPv4 and IPv6
const isValidPublicIp = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  let clean = ip.trim();
  if (clean.startsWith('::ffff:')) {
    clean = clean.substring(7);
  }
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(clean)) {
    return !isPrivateOrReservedV4(clean);
  }
  if (clean.includes(':') && /^[0-9a-fA-F:]+$/.test(clean)) {
    return !isPrivateOrReservedV6(clean);
  }
  return false;
};

// Sanitize geolocation fields: guarantee no null, undefined, '-', '—', 'Local', or 'Localhost'
const cleanField = (val) => {
  if (val === undefined || val === null) return 'Unknown';
  const str = String(val).trim();
  if (
    !str ||
    str === '—' ||
    str === '-' ||
    str.toLowerCase() === 'local' ||
    str.toLowerCase() === 'localhost' ||
    str.toLowerCase() === 'null' ||
    str.toLowerCase() === 'undefined'
  ) {
    return 'Unknown';
  }
  return str;
};

// Identify automated traffic, crawlers, and search engine bots
const isBotUserAgent = (ua) => {
  if (!ua || typeof ua !== 'string') return false;
  const botPattern =
    /bot|crawler|spider|crawling|facebookexternalhit|whatsapp|telegrambot|slackbot|twitterbot|linkedinbot|pinterest|googlebot|bingbot|yandex|baidu|duckduckbot|ahrefs|semrush|dotbot|screaming frog|uptimerobot|pingdom|headlesschrome|phantomjs|lighthouse|petalbot|mj12bot|bytespider/i;
  return botPattern.test(ua);
};

// Server-side public IP resolution strictly for localhost testing
const getLocalhostPublicIp = async () => {
  if (cachedLocalhostPublicIp && Date.now() - lastLocalhostIpFetchTime < 10 * 60 * 1000) {
    return cachedLocalhostPublicIp;
  }

  // Provider 1: ipify
  try {
    const res = await axios.get('https://api.ipify.org?format=json', { timeout: 3000 });
    if (res.data && isValidPublicIp(res.data.ip)) {
      cachedLocalhostPublicIp = cleanIpString(res.data.ip);
      lastLocalhostIpFetchTime = Date.now();
      return cachedLocalhostPublicIp;
    }
  } catch (e) {}

  // Provider 2: icanhazip
  try {
    const res = await axios.get('https://icanhazip.com', { timeout: 3000 });
    const ip = cleanIpString(res.data);
    if (isValidPublicIp(ip)) {
      cachedLocalhostPublicIp = ip;
      lastLocalhostIpFetchTime = Date.now();
      return cachedLocalhostPublicIp;
    }
  } catch (e) {}

  // Provider 3: ipwho.is
  try {
    const res = await axios.get('https://ipwho.is/', { timeout: 3000 });
    if (res.data && res.data.success && isValidPublicIp(res.data.ip)) {
      cachedLocalhostPublicIp = cleanIpString(res.data.ip);
      lastLocalhostIpFetchTime = Date.now();
      return cachedLocalhostPublicIp;
    }
  } catch (e) {}

  return null;
};

// Extract the authentic client IP address handling reverse proxies and localhost testing
const extractClientIp = async (req) => {
  const socketRaw = req.socket?.remoteAddress || req.connection?.remoteAddress || '';
  const socketIp = cleanIpString(socketRaw);
  const isDirectLoopback = isLoopback(socketIp) || socketIp === '';

  // 1. Cloudflare edge header (high priority in production behind Cloudflare)
  if (req.headers['cf-connecting-ip']) {
    const cfIp = cleanIpString(req.headers['cf-connecting-ip']);
    if (isValidPublicIp(cfIp)) return cfIp;
  }

  // 2. Nginx edge header
  if (req.headers['x-real-ip']) {
    const realIp = cleanIpString(req.headers['x-real-ip']);
    if (isValidPublicIp(realIp)) return realIp;
  }

  // 3. Express req.ips (parsed from X-Forwarded-For by trust proxy)
  if (Array.isArray(req.ips) && req.ips.length > 0) {
    for (const ip of req.ips) {
      const candidate = cleanIpString(ip);
      if (isValidPublicIp(candidate)) return candidate;
    }
  }

  // 4. Express req.ip (if valid public IP)
  if (req.ip) {
    const directIp = cleanIpString(req.ip);
    if (isValidPublicIp(directIp)) return directIp;
  }

  // 5. Standard X-Forwarded-For fallback (comma-separated list: "client, proxy1, proxy2")
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor) {
    const parts = String(xForwardedFor).split(',');
    for (const part of parts) {
      const candidate = cleanIpString(part);
      if (isValidPublicIp(candidate)) return candidate;
    }
  }

  // 6. Direct socket address (if public)
  if (isValidPublicIp(socketIp)) return socketIp;

  // 7. Client-reported public IP (sent from frontend)
  const bodyIp = cleanIpString(req.body?.clientIp || req.body?.ip || req.query?.clientIp);
  if (isValidPublicIp(bodyIp)) {
    return bodyIp;
  }

  // 8. Localhost testing mode:
  // When hosting on localhost (development), requests from the local browser arrive via loopback.
  // We resolve the developer's actual public IP server-side for accurate analytics.
  // (In production, non-loopback requests without public IP return null and never use server IP)
  const isDevOrLocal =
    process.env.NODE_ENV !== 'production' || isDirectLoopback;

  if (isDevOrLocal && isDirectLoopback) {
    const localhostPublicIp = await getLocalhostPublicIp();
    if (localhostPublicIp && isValidPublicIp(localhostPublicIp)) {
      console.log(`[Visitor Tracking] Resolved public IP for localhost visitor: ${localhostPublicIp}`);
      return localhostPublicIp;
    }
  }

  return null;
};

// Retrieve geolocation with multi-provider cascade and response validation
const getGeoInfo = async (ip) => {
  if (!isValidPublicIp(ip)) {
    return {
      city: 'Unknown',
      region: 'Unknown',
      postalCode: 'Unknown',
      country: 'Unknown',
      countryCode: '',
      latitude: null,
      longitude: null,
      timezone: ''
    };
  }

  // Check in-memory cache
  const cached = geoCache.get(ip);
  if (cached && Date.now() - cached.cachedAt < GEO_CACHE_TTL_MS) {
    if (cached.geo.city !== 'Unknown' && cached.geo.country !== 'Unknown') {
      return cached.geo;
    }
  }

  let geo = null;

  // Provider 1: ipapi.co (primary high-accuracy provider)
  try {
    const res = await axios.get(`https://ipapi.co/${ip}/json/`, {
      timeout: 4500,
      headers: { 'User-Agent': BROWSER_UA }
    });
    // Validate response belongs to requested IP and contains country
    if (
      res.data &&
      !res.data.error &&
      res.data.country_name &&
      (!res.data.ip || cleanIpString(res.data.ip) === cleanIpString(ip))
    ) {
      geo = {
        city: cleanField(res.data.city),
        region: cleanField(res.data.region),
        postalCode: cleanField(res.data.postal),
        country: cleanField(res.data.country_name),
        countryCode: res.data.country_code || '',
        latitude: typeof res.data.latitude === 'number' ? res.data.latitude : null,
        longitude: typeof res.data.longitude === 'number' ? res.data.longitude : null,
        timezone: res.data.timezone || ''
      };
    }
  } catch (err) {
    // Continue to fallback
  }

  // Provider 2: ipwho.is (fallback 1)
  if (!geo || geo.city === 'Unknown' || geo.country === 'Unknown') {
    try {
      const res = await axios.get(`https://ipwho.is/${ip}`, {
        timeout: 4000
      });
      if (
        res.data &&
        res.data.success &&
        res.data.country &&
        (!res.data.ip || cleanIpString(res.data.ip) === cleanIpString(ip))
      ) {
        geo = {
          city: cleanField(res.data.city),
          region: cleanField(res.data.region),
          postalCode: cleanField(res.data.postal),
          country: cleanField(res.data.country),
          countryCode: res.data.country_code || '',
          latitude: typeof res.data.latitude === 'number' ? res.data.latitude : null,
          longitude: typeof res.data.longitude === 'number' ? res.data.longitude : null,
          timezone: res.data.timezone?.id || ''
        };
      }
    } catch (err) {
      // Continue to fallback
    }
  }

  // Provider 3: freeipapi.com (fallback 2)
  if (!geo || geo.city === 'Unknown' || geo.country === 'Unknown') {
    try {
      const res = await axios.get(`https://freeipapi.com/api/json/${ip}`, {
        timeout: 4000
      });
      if (
        res.data &&
        res.data.countryName &&
        (!res.data.ipAddress || cleanIpString(res.data.ipAddress) === cleanIpString(ip))
      ) {
        geo = {
          city: cleanField(res.data.cityName),
          region: cleanField(res.data.regionName),
          postalCode: cleanField(res.data.zipCode),
          country: cleanField(res.data.countryName),
          countryCode: res.data.countryCode || '',
          latitude: typeof res.data.latitude === 'number' ? res.data.latitude : null,
          longitude: typeof res.data.longitude === 'number' ? res.data.longitude : null,
          timezone: res.data.timeZone || ''
        };
      }
    } catch (err) {
      // All providers failed
    }
  }

  if (geo && (geo.city !== 'Unknown' || geo.country !== 'Unknown')) {
    geoCache.set(ip, { geo, cachedAt: Date.now() });
    return geo;
  }

  return {
    city: 'Unknown',
    region: 'Unknown',
    postalCode: 'Unknown',
    country: 'Unknown',
    countryCode: '',
    latitude: null,
    longitude: null,
    timezone: ''
  };
};

// GET /api/admin-visitors: Read-only query.
// Preserves original createdAt timestamps and does NOT mutate records on dashboard refresh.
router.get('/', async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 }).lean();
    res.json(visitors);
  } catch (error) {
    console.error('Failed to fetch visitors:', error);
    res.status(500).json({ message: 'Failed to fetch visitors', error });
  }
});

// POST /api/admin-visitors/admin-visitor: Record an authentic visitor on website access
router.post('/admin-visitor', async (req, res) => {
  try {
    // 1. Suppress automated crawlers, bots, and monitoring agents
    const userAgent = req.headers['user-agent'] || '';
    if (isBotUserAgent(userAgent)) {
      return res.status(200).json({ message: 'Automated crawler/bot ignored' });
    }

    // 2. Extract authentic visitor public IP
    const clientIp = await extractClientIp(req);

    // Reject non-public, loopback, or invalid IPs (Requirement 1: Do not treat localhost/private as real visitor IPs)
    if (!clientIp || !isValidPublicIp(clientIp)) {
      return res.status(200).json({ message: 'Non-public visitor ignored' });
    }

    // 3. Prevent concurrent duplicate records from the same client IP
    if (inFlightLoggers.has(clientIp)) {
      await inFlightLoggers.get(clientIp);
      return res.status(200).json({ message: 'Visitor already logged today' });
    }

    const logPromise = (async () => {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Check if this visitor was already logged today
      const alreadyLogged = await Visitor.findOne({
        ip: clientIp,
        createdAt: { $gte: twentyFourHoursAgo }
      });

      if (alreadyLogged) {
        // If already logged recently BUT previous geolocation was incomplete or 'Unknown',
        // retry the lookup and update the existing MongoDB record while preserving original createdAt!
        if (
          alreadyLogged.city === 'Unknown' ||
          alreadyLogged.country === 'Unknown' ||
          alreadyLogged.region === 'Unknown' ||
          alreadyLogged.postalCode === 'Unknown' ||
          !alreadyLogged.city
        ) {
          const geo = await getGeoInfo(clientIp);
          if (geo && (geo.city !== 'Unknown' || geo.country !== 'Unknown')) {
            await Visitor.updateOne(
              { _id: alreadyLogged._id },
              {
                $set: {
                  city: geo.city,
                  region: geo.region,
                  postalCode: geo.postalCode,
                  country: geo.country,
                  countryCode: geo.countryCode,
                  latitude: geo.latitude,
                  longitude: geo.longitude,
                  timezone: geo.timezone
                }
              }
            );
          }
        }
        return { message: 'Visitor already logged today' };
      }

      // Retrieve geolocation for the visitor's verified public IP
      const geo = await getGeoInfo(clientIp);

      console.log(`[Visitor Tracking] Saving visitor: ${clientIp} -> ${geo.city}, ${geo.region}, ${geo.country}`);

      const newVisitor = new Visitor({
        ip: clientIp,
        city: geo.city,
        region: geo.region,
        postalCode: geo.postalCode,
        country: geo.country,
        countryCode: geo.countryCode,
        latitude: geo.latitude,
        longitude: geo.longitude,
        timezone: geo.timezone,
        createdAt: new Date()
      });

      await newVisitor.save();
      return { message: 'Visitor data logged successfully', ip: clientIp, location: geo };
    })();

    inFlightLoggers.set(clientIp, logPromise);
    try {
      const result = await logPromise;
      return res.status(200).json(result);
    } finally {
      inFlightLoggers.delete(clientIp);
    }
  } catch (err) {
    console.error('Error logging visitor:', err.message);
    return res.status(500).json({ message: 'Error logging visitor data' });
  }
});

router.get('/count', async (req, res) => {
  try {
    const count = await Visitor.countDocuments();
    res.status(200).json({ count });
  } catch (err) {
    console.error('Error fetching visitor count', err);
    res.status(500).send('Error fetching visitor count');
  }
});

module.exports = router;
