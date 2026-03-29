/**
 * pages/MatchesPage.jsx
 * Shows all AI-detected matches across the system, plus a map of sighting locations.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMatches, updateMatch, simColor } from '../utils/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function MatchesPage() {
  const [matches,  setMatches]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [filter,   setFilter]   = useState('all');

  async function load() {
    try {
      const data = await getMatches();
      setMatches(data);
    } catch (err) {
      setError('Could not load matches. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function act(id, status) {
    try {
      await updateMatch(id, status);
      load();
    } catch (err) {
      alert('Failed to update match status.');
    }
  }

  const displayed = filter === 'all' ? matches : matches.filter(m => m.status === filter);

  const pins = matches
    .filter(m => m.sighting?.latitude && m.sighting.latitude !== 0)
    .map(m => ({
      lat: m.sighting.latitude,
      lng: m.sighting.longitude,
      label: `${m.case?.name} — ${m.similarity}% match`,
      color: simColor(m.similarity),
    }));

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="eyebrow">AI Results</div>
        <h1>Match Results</h1>
        <p>{matches.length} total AI match{matches.length !== 1 ? 'es' : ''} detected.</p>
      </div>

      {pins.length > 0 && (
        <div style={{marginBottom:36}}>
          <h2 style={{marginBottom:14}}>Sighting Locations</h2>
          <div style={{height:320,borderRadius:'var(--radius)',overflow:'hidden',border:'1px solid var(--border)'}}>
            <MapContainer center={[pins[0].lat, pins[0].lng]} zoom={5}
              style={{height:'100%',width:'100%'}}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap' />
              {pins.map((p, i) => (
                <Marker key={i} position={[p.lat, p.lng]}>
                  <Popup>{p.label}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      )}

      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {['all','pending','confirmed','dismissed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn ${filter===f?'btn-primary':'btn-ghost'}`}
            style={{textTransform:'capitalize',fontSize:13}}>
            {f}
          </button>
        ))}
      </div>

      {loading && <div className="spinner" />}

      {error && (
        <div style={{background:'#fff5f5',border:'1px solid #fc8181',borderRadius:8,padding:16,color:'#c53030',marginBottom:24}}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <h3>No matches found</h3>
          <p style={{marginTop:8}}>Upload sighting photos to trigger AI face comparison.</p>
          <Link to="/sighting" className="btn btn-primary" style={{marginTop:20}}>
            📷 Submit a Sighting
          </Link>
        </div>
      )}

      <div style={{display:'flex',flexDirection:'column',gap:16}}>
        {displayed.map(m => (
          <div key={m.id} className="card" style={{display:'grid',gridTemplateColumns:'120px 1fr',gap:20,alignItems:'start'}}>
            <div style={{borderRadius:8,overflow:'hidden',aspectRatio:'1',background:'var(--bg-raised)'}}>
              {m.sighting?.photo_url
                ? <img src={m.sighting.photo_url} alt="sighting"
                    style={{width:'100%',height:'100%',objectFit:'cover'}} />
                : <div style={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:32}}>📷</div>
              }
            </div>

            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap'}}>
                <Link to={`/cases/${m.case_id}`} style={{fontFamily:'Syne,sans-serif',fontWeight:700,fontSize:17}}>
                  {m.case?.name || `Case #${m.case_id}`}
                </Link>
                <span className={`badge badge-${m.status}`}>{m.status}</span>
                <span style={{fontSize:12,color:'var(--text-muted)',marginLeft:'auto'}}>
                  Match #{m.id}
                </span>
              </div>

              {m.sighting?.location && (
                <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:10}}>
                  📍 Sighted at: {m.sighting.location}
                </div>
              )}

              <div style={{maxWidth:320}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:13}}>Similarity score</span>
                  <span style={{fontWeight:700,color:simColor(m.similarity)}}>{m.similarity}%</span>
                </div>
                <div className="sim-bar-bg">
                  <div className="sim-bar-fill" style={{width:`${m.similarity}%`,background:simColor(m.similarity)}} />
                </div>
              </div>

              {m.status === 'pending' && (
                <div style={{display:'flex',gap:8,marginTop:14}}>
                  <button onClick={() => act(m.id,'confirmed')} className="btn btn-success" style={{fontSize:13,padding:'8px 16px'}}>
                    ✅ Confirm Match
                  </button>
                  <button onClick={() => act(m.id,'dismissed')} className="btn btn-ghost" style={{fontSize:13,padding:'8px 16px'}}>
                    ✗ Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

