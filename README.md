# grab

an ip tracking and geolocation web application that creates shareable tracking links to capture visitor information including ip addresses, precise gps coordinates, device details, and geographic data.

## what it does

this app lets you create tracking links that collect detailed information about anyone who clicks them:

- captures ip address and performs geolocation lookup
- requests browser gps location for precise coordinates (with user permission)
- records device information (user agent, language, referer)
- provides real-time tracking dashboard with live updates
- automatically redirects visitors to your chosen destination
- uses wifi positioning for desktop and gps for mobile devices

## features

- create unlimited tracking links with custom redirect urls
- view detailed analytics for each link (clicks, tracked ips, timestamps)
- precise location tracking with gps coordinates (accuracy down to meters)
- fallback ip-based geolocation when gps unavailable
- real-time dashboard that auto-refreshes every 5 seconds
- displays city, region, country, timezone, isp information
- detects mobile connections and proxy/vpn usage
- shows accuracy radius for location data
- copy tracking links to clipboard with one click
- clean, modern ui with gradient backgrounds
- coordinate offset correction for improved accuracy

## tech stack

### backend
- node.js with express
- in-memory storage (map data structures)
- axios for api requests
- nanoid for generating unique link ids
- cors enabled
- dotenv for configuration
- ipapi.co and ip-api.com for geolocation

### frontend
- react 18
- react router dom for navigation
- vite for build tooling
- tailwind css for styling
- lucide-react for icons
- axios for api calls

## installation

1. clone the repository

2. install dependencies:
```bash
npm install
cd client && npm install
```

3. set up environment variables:
```bash
cp .env.example .env
```

edit `.env` if needed (defaults work for local development)

## running locally

start both server and client in development mode:
```bash
npm run dev
```

or run them separately:
```bash
npm run server
npm run client
```

the app will be available at:
- frontend: http://localhost:5173
- backend: http://localhost:3001

## making it publicly accessible

to track visitors outside your local network, you need a public url using ngrok:

1. start the server:
```bash
npm run server
```

2. in another terminal, start ngrok:
```bash
npm run ngrok
```

3. copy the ngrok https url (e.g., https://abc123.ngrok-free.app)

4. update your `.env` file:
```
PUBLIC_URL=https://abc123.ngrok-free.app
```

5. restart the server

now your tracking links will use the public url and work from anywhere.

## how it works

### creating a tracking link

1. click "create new tracking link"
2. enter the destination url where visitors should be redirected
3. optionally add a description
4. the app generates a unique tracking link like `https://yourdomain/t/abc123xyz`

### what happens when someone clicks

1. visitor clicks your tracking link
2. server captures their ip address and headers
3. performs ip-based geolocation lookup
4. serves an html page that requests browser location permission
5. uses `watchPosition` api to continuously improve gps accuracy
6. waits up to 8 seconds for best accuracy (accepts <200m for wifi, <50m for gps)
7. sends precise coordinates back to server
8. redirects visitor to your destination url
9. all data is saved and visible in your dashboard

### tracking data collected

- ip address
- precise gps coordinates (latitude, longitude, accuracy)
- ip-based location (city, district, region, country, postal code)
- timezone and utc offset
- isp/organization name
- asn (autonomous system number)
- user agent string
- referer url
- accept-language header
- timestamp
- mobile/proxy/vpn detection

## api endpoints

### `POST /api/create-link`
creates a new tracking link
- body: `{ redirectUrl, description }`
- returns: `{ linkId, trackingLink, redirectUrl }`

### `GET /api/links`
retrieves all tracking links with stats

### `GET /api/tracking/:linkId`
gets detailed tracking data for a specific link

### `DELETE /api/links/:linkId`
deletes a tracking link and its data

### `GET /t/:linkId`
the tracking endpoint that captures visitor data and redirects

### `POST /api/update-location`
receives precise gps coordinates from browser

### `GET /api/health`
health check endpoint

## building for production

build the frontend:
```bash
npm run build
```

start the production server:
```bash
npm start
```

## important notes

### disclaimer
this tool is for authorized use only. always obtain proper consent before tracking individuals. use cases include:
- marketing campaign analytics with user consent
- personal link tracking for your own content
- legitimate business purposes with disclosure
- educational and research purposes

do not use this tool to:
- track individuals without their knowledge or consent
- violate privacy laws or regulations
- engage in stalking or harassment
- collect data for malicious purposes

### accuracy
- gps accuracy depends on device capabilities and user permissions
- desktop computers use wifi positioning (typically 50-200m accuracy)
- mobile devices with gps can achieve 5-50m accuracy
- ip-based geolocation is approximate (city-level, radius varies)
- vpn and proxy users will show incorrect locations
- coordinates include offset correction for improved precision

### limitations
- requires https for geolocation api (use ngrok for public testing)
- browser location permission must be granted for gps tracking
- data stored in memory (lost on server restart)
- free geolocation apis have rate limits
- some browsers may block location requests

### privacy considerations
- visitors see a "getting your location" message
- browser shows a permission prompt for location access
- no data is collected without visiting the link
- all tracking is transparent to the end user

## rate limits

using free geolocation apis:
- ipapi.co: 1,000 requests/day without api key
- ip-api.com: 45 requests/minute

for higher limits, sign up for an api key at ipapi.co and add to `.env`:
```
IPAPI_KEY=your_api_key_here
```

## data persistence

currently uses in-memory storage. all data is lost when the server restarts. for production use, consider implementing:
- database storage (mongodb, postgresql, etc.)
- file-based persistence
- cloud storage solutions

## troubleshooting

**tracking link shows 404**
- make sure PUBLIC_URL is set correctly in .env
- restart server after changing environment variables

**location not captured**
- ensure you're using https (ngrok provides this)
- check if user granted location permission
- some browsers block geolocation on http

**geolocation api errors**
- check rate limits on free apis
- verify internet connection
- consider adding an api key for higher limits

**coordinates seem off**
- coordinate offset is applied for accuracy correction
- ip-based location is approximate
- gps accuracy varies by device and environment

## license

mit
