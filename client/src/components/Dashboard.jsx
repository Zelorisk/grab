import { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import { Link, Copy, Trash2, Eye, Globe, Plus, ExternalLink } from 'lucide-react';

function Dashboard() {
  const [links, setLinks] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState('');
  const [description, setDescription] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await axios.get('/api/links');
      setLinks(response.data);
    } catch (error) {
      console.error('Error fetching links:', error);
    }
  };

  const createLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('/api/create-link', {
        redirectUrl,
        description
      });
      
      setLinks([...links, {
        ...response.data,
        clicks: 0,
        trackingCount: 0,
        createdAt: new Date().toISOString()
      }]);
      
      setRedirectUrl('');
      setDescription('');
      setShowCreateForm(false);
      
      // Auto-copy the new link
      copyToClipboard(response.data.trackingLink, response.data.linkId);
    } catch (error) {
      console.error('Error creating link:', error);
      alert('Error creating link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const deleteLink = async (linkId) => {
    if (!confirm('Are you sure you want to delete this link?')) return;
    
    try {
      await axios.delete(`/api/links/${linkId}`);
      setLinks(links.filter(link => link.id !== linkId));
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const copyToClipboard = (text, linkId) => {
    navigator.clipboard.writeText(text);
    setCopiedId(linkId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-10 h-10 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">IP Tracker</h1>
          </div>
          <p className="text-gray-300">Create tracking links and monitor IP addresses with geolocation data</p>
        </div>

        {/* Create Link Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create New Tracking Link
          </button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">Create Tracking Link</h2>
            <form onSubmit={createLink} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Redirect URL *
                </label>
                <input
                  type="url"
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <p className="text-xs text-gray-400 mt-1">The URL where visitors will be redirected</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Campaign name or notes"
                  className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Links List */}
        <div className="space-y-4">
          {links.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-12 text-center border border-white/20">
              <Link className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No tracking links yet</h3>
              <p className="text-gray-300">Create your first tracking link to get started</p>
            </div>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20 hover:border-purple-400/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Link className="w-5 h-5 text-purple-400" />
                      <h3 className="text-lg font-semibold text-white">
                        {link.description || 'Untitled Link'}
                      </h3>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Tracking Link:</span>
                        <code className="bg-black/30 px-2 py-1 rounded text-purple-300">
                          {link.trackingLink || `http://localhost:3001/t/${link.id}`}
                        </code>
                        <button
                          onClick={() => copyToClipboard(link.trackingLink || `http://localhost:3001/t/${link.id}`, link.id)}
                          className="text-purple-400 hover:text-purple-300 transition-colors"
                          title="Copy link"
                        >
                          {copiedId === link.id ? (
                            <span className="text-green-400 text-xs">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Redirects to:</span>
                        <a
                          href={link.redirectUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {link.redirectUrl}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <RouterLink
                      to={`/tracking/${link.id}`}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View Tracking
                    </RouterLink>
                    <button
                      onClick={() => deleteLink(link.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex gap-6 text-sm border-t border-white/10 pt-4">
                  <div>
                    <span className="text-gray-400">Clicks:</span>
                    <span className="ml-2 text-white font-semibold">{link.clicks || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Tracked IPs:</span>
                    <span className="ml-2 text-white font-semibold">{link.trackingCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Created:</span>
                    <span className="ml-2 text-white">{formatDate(link.createdAt)}</span>
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

export default Dashboard;
