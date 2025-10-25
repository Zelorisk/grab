import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, MapPin, Globe, Clock, Monitor, ExternalLink, Copy } from 'lucide-react';

function TrackingDetails() {
  const { linkId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    fetchTrackingData();
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchTrackingData, 5000);
    return () => clearInterval(interval);
  }, [linkId]);

  const fetchTrackingData = async () => {
    try {
      const response = await axios.get(`/api/tracking/${linkId}`);
      setData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      setLoading(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Link not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <RouterLink
            to="/"
            className="inline-flex items-center gap-2 text-purple-400 hover:text-purple-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </RouterLink>
          
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
            <h1 className="text-3xl font-bold text-white mb-4">
              {data.link.description || 'Tracking Details'}
            </h1>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Tracking Link:</span>
                <code className="bg-black/30 px-3 py-1 rounded text-purple-300">
                  {data.link.trackingLink || `http://localhost:3001/t/${linkId}`}
                </code>
                <button
                  onClick={() => copyToClipboard(data.link.trackingLink || `http://localhost:3001/t/${linkId}`, 'link')}
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {copiedId === 'link' ? (
                    <span className="text-green-400 text-xs">Copied!</span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Redirects to:</span>
                <a
                  href={data.link.redirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                >
                  {data.link.redirectUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex gap-6 mt-4 pt-4 border-t border-white/10">
              <div>
                <span className="text-gray-400 text-sm">Total Clicks:</span>
                <span className="ml-2 text-white font-semibold text-lg">{data.link.clicks}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Tracked IPs:</span>
                <span className="ml-2 text-white font-semibold text-lg">{data.tracking.length}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Created:</span>
                <span className="ml-2 text-white">{formatDate(data.link.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tracking Data */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white mb-4">
            Tracked Visits ({data.tracking.length})
          </h2>

          {data.tracking.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 text-center border border-white/20">
              <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No visits yet</h3>
              <p className="text-gray-300">Share your tracking link to start collecting data</p>
            </div>
          ) : (
            data.tracking.slice().reverse().map((entry) => (
              <div
                key={entry.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column - IP & Location */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Globe className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">IP Address</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-black/30 px-3 py-1 rounded text-purple-300 font-mono">
                          {entry.ip}
                        </code>
                        <button
                          onClick={() => copyToClipboard(entry.ip, entry.id)}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                        >
                          {copiedId === entry.id ? (
                            <span className="text-green-400 text-xs">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Precise Location (if available) */}
                    {entry.preciseLocation && (
                      <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-green-400" />
                          <h3 className="text-lg font-semibold text-green-400">📍 EXACT Location (GPS)</h3>
                        </div>
                        <div className="space-y-1 text-sm">
                          <div>
                            <span className="text-gray-300">Coordinates:</span>
                            <span className="ml-2 text-white font-bold font-mono">
                              {entry.preciseLocation.latitude.toFixed(8)}, {entry.preciseLocation.longitude.toFixed(8)}
                            </span>
                            <a
                              href={`https://www.google.com/maps?q=${entry.preciseLocation.latitude},${entry.preciseLocation.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-2 text-green-400 hover:text-green-300"
                            >
                              <ExternalLink className="w-3 h-3 inline" />
                            </a>
                          </div>
                          <div>
                            <span className="text-gray-300">Accuracy:</span>
                            <span className="ml-2 text-white font-semibold">
                              ±{entry.preciseLocation.accuracy ? entry.preciseLocation.accuracy.toFixed(1) : 'N/A'}m
                            </span>
                            {entry.preciseLocation.accuracy < 20 && (
                              <span className="ml-2 text-green-400 text-xs">● High Precision</span>
                            )}
                            {entry.preciseLocation.accuracy >= 20 && entry.preciseLocation.accuracy < 50 && (
                              <span className="ml-2 text-yellow-400 text-xs">● Medium Precision</span>
                            )}
                            {entry.preciseLocation.accuracy >= 50 && (
                              <span className="ml-2 text-orange-400 text-xs">● Low Precision</span>
                            )}
                          </div>
                          {entry.preciseLocation.altitude && (
                            <div>
                              <span className="text-gray-300">Altitude:</span>
                              <span className="ml-2 text-white">{Math.round(entry.preciseLocation.altitude)}m</span>
                            </div>
                          )}
                          {entry.preciseLocation.speed && (
                            <div>
                              <span className="text-gray-300">Speed:</span>
                              <span className="ml-2 text-white">{Math.round(entry.preciseLocation.speed * 3.6)} km/h</span>
                            </div>
                          )}
                          <div className="text-green-400 text-xs mt-2">
                            ✓ User granted location permission
                          </div>
                        </div>
                      </div>
                    )}

                    {entry.location && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className="w-5 h-5 text-purple-400" />
                          <h3 className="text-lg font-semibold text-white">
                            Location (IP-based {entry.preciseLocation ? '- Approximate' : ''})
                          </h3>
                        </div>
                        <div className="space-y-1 text-sm">
                          {entry.location.city && (
                            <div>
                              <span className="text-gray-400">City:</span>
                              <span className="ml-2 text-white">{entry.location.city}</span>
                            </div>
                          )}
                          {entry.location.district && (
                            <div>
                              <span className="text-gray-400">District:</span>
                              <span className="ml-2 text-white">{entry.location.district}</span>
                            </div>
                          )}
                          {entry.location.region && (
                            <div>
                              <span className="text-gray-400">Region:</span>
                              <span className="ml-2 text-white">{entry.location.region}</span>
                            </div>
                          )}
                          {entry.location.country && (
                            <div>
                              <span className="text-gray-400">Country:</span>
                              <span className="ml-2 text-white">
                                {entry.location.country} {entry.location.country_code && `(${entry.location.country_code})`}
                              </span>
                            </div>
                          )}
                          {entry.location.postal && (
                            <div>
                              <span className="text-gray-400">Postal Code:</span>
                              <span className="ml-2 text-white">{entry.location.postal}</span>
                            </div>
                          )}
                          {entry.location.latitude && entry.location.longitude && !entry.preciseLocation && (
                            <div>
                              <span className="text-gray-400">Coordinates (approx):</span>
                              <span className="ml-2 text-white">
                                {entry.location.latitude}, {entry.location.longitude}
                              </span>
                              <a
                                href={`https://www.google.com/maps?q=${entry.location.latitude},${entry.location.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-400 hover:text-blue-300"
                              >
                                <ExternalLink className="w-3 h-3 inline" />
                              </a>
                            </div>
                          )}
                          {entry.location.accuracy_radius && entry.location.accuracy_radius !== 'Unknown' && (
                            <div>
                              <span className="text-gray-400">Accuracy Radius:</span>
                              <span className="ml-2 text-white">{entry.location.accuracy_radius}km</span>
                            </div>
                          )}
                          {entry.location.timezone && (
                            <div>
                              <span className="text-gray-400">Timezone:</span>
                              <span className="ml-2 text-white">{entry.location.timezone}</span>
                            </div>
                          )}
                          {entry.location.org && (
                            <div>
                              <span className="text-gray-400">ISP:</span>
                              <span className="ml-2 text-white">{entry.location.org}</span>
                            </div>
                          )}
                          {entry.location.asn && entry.location.asn !== 'Unknown' && (
                            <div>
                              <span className="text-gray-400">ASN:</span>
                              <span className="ml-2 text-white text-xs">{entry.location.asn}</span>
                            </div>
                          )}
                          {entry.location.mobile && (
                            <div className="text-yellow-400 text-xs mt-2">
                              📱 Mobile connection detected
                            </div>
                          )}
                          {entry.location.proxy && (
                            <div className="text-orange-400 text-xs mt-2">
                              🔒 Proxy/VPN detected
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - Device & Time */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Timestamp</h3>
                      </div>
                      <p className="text-white">{formatDate(entry.timestamp)}</p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Monitor className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">Device Info</h3>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div>
                          <span className="text-gray-400">User Agent:</span>
                          <p className="text-white text-xs mt-1 bg-black/30 p-2 rounded break-all">
                            {entry.userAgent}
                          </p>
                        </div>
                        {entry.referer && entry.referer !== 'Direct' && (
                          <div>
                            <span className="text-gray-400">Referer:</span>
                            <p className="text-white text-xs mt-1">{entry.referer}</p>
                          </div>
                        )}
                        {entry.headers?.acceptLanguage && (
                          <div>
                            <span className="text-gray-400">Language:</span>
                            <span className="ml-2 text-white text-xs">{entry.headers.acceptLanguage}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default TrackingDetails;
