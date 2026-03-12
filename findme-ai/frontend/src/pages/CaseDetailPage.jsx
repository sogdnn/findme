/**
 * pages/CaseDetailPage.jsx
 * Full profile for a single missing person, with:
 *  - photo, details, map pin
 *  - list of AI matches with similarity bars
 *  - confirm / dismiss match controls
 */
import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCase, updateMatch, updateCaseStatus, simColor } from '../utils/api';
import './CaseDetailPage.css';

// Lazy-load Leaflet only when needed (avoids SSR issues)
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
// Fix default marker icon path issue with webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export default function CaseDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading]   = useState(true);

  async function load() {
    const data = await getCase(id);
    setCaseData(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleMatchAction(matchId, status) {
    await updateMatch(matchId, status);
    load(); // refresh
  }

  async function markFound() {
    await updateCaseStatus(id, 'found');
    load();
  }

  if (loading) return <div className="spinner" style={{marginTop:80}} />;
  if (!caseData) return <div className="page-wrapper"><p>Case not found.</p></div>;

  const hasCoords = caseData.latitude && caseData.longitude &&
                    (caseData.latitude !== 0 || caseData.longitude !== 0);

  return (
    <div className="page-wrapper">
      {/* ── Back link ──────────────────────────── */}
      <div style={{padding:'24px 0 0'}}>
        <Link to="/cases" style={{color:'var(--text-muted)',fontSize:13}}>← All Cases</Link>
      </div>

      {/* ── Profile header ─────────────────────── */}
      <div className="detail-header">
        <div className="detail-photo">
          {caseData.photo_url
            ? <img src={caseData.photo_url} alt={caseData.name} />
            : <div className="detail-photo-placeholder">👤</div>
          }
        </div>

        <div className="detail-info">
          <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:8}}>
            <h1 style={{fontSize:28}}>{caseData.name}</h1>
            <span className={`badge badge-${caseData.status}`}>{caseData.status}</span>
          </div>

          {caseData.age      && <div className="info-row">🎂 Age: {caseData.age}</div>}
          {caseData.last_seen && <div className="info-row">📍 Last seen: {caseData.last_seen}</div>}
          {caseData.description && (
            <div className="info-row" style={{marginTop:12,color:'var(--text-muted)',lineHeight:1.7}}>
              {caseData.description}
            </div>
          )}
          <div className="info-row" style={{marginTop:12,fontSize:12,color:'var(--text-muted)'}}>
            Reported {new Date(caseData.created_at).toLocaleString()}
          </div>

          <div style={{display:'flex',gap:10,marginTop:20,flexWrap:'wrap'}}>
            {caseData.status === 'active' && (
              <button onClick={markFound} className="btn btn-success">✅ Mark as Found</button>
            )}
            <Link to="/sighting" className="btn btn-primary">📷 Submit a Sighting</Link>
          </div>
        </div>
      </div>

      {/* ── Map ────────────────────────────────── */}
      {hasCoords && (
        <div style={{marginTop:32}}>
          <h2 style={{marginBottom:16}}>Last Known Location</h2>
          <div className="map-wrapper">
            <MapContainer
              center={[caseData.latitude, caseData.longitude]}
              zoom={13}
              style={{height:'100%',width:'100%'}}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='© OpenStreetMap contributors'
              />
              <Marker position={[caseData.latitude, caseData.longitude]}>
                <Popup>{caseData.name} — last seen here</Popup>
              </Marker>
            </MapContainer>
          </div>
        </div>
      )}

      {/* ── AI Matches ─────────────────────────── */}
      <div style={{marginTop:40}}>
        <h2 style={{marginBottom:4}}>AI Match Results</h2>
        <p style={{color:'var(--text-muted)',fontSize:13,marginBottom:20}}>
          {caseData.matches?.length || 0} sighting{caseData.matches?.length !== 1 ? 's' : ''} matched this case.
        </p>

        {(!caseData.matches || caseData.matches.length === 0) && (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No matches yet</h3>
            <p style={{marginTop:8}}>Matches appear automatically when a sighting is uploaded.</p>
          </div>
        )}

        <div className="grid-2">
          {(caseData.matches || []).map(m => (
            <div key={m.id} className="card match-card">
              <div className="match-card-header">
                <div style={{fontSize:12,color:'var(--text-muted)'}}>Sighting #{m.sighting_id}</div>
                <span className={`badge badge-${m.status}`}>{m.status}</span>
              </div>

              {/* Sighting photo */}
              {m.sighting?.photo_url && (
                <img src={m.sighting.photo_url} alt="sighting"
                  style={{width:'100%',height:160,objectFit:'cover',borderRadius:6,margin:'12px 0'}} />
              )}

              {m.sighting?.location && (
                <div style={{fontSize:12,color:'var(--text-muted)',marginBottom:12}}>
                  📍 {m.sighting.location}
                </div>
              )}

              {/* Similarity bar */}
              <div className="sim-bar-wrap">
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                  <span style={{fontSize:13}}>Similarity</span>
                  <span style={{fontWeight:700,color:simColor(m.similarity)}}>{m.similarity}%</span>
                </div>
                <div className="sim-bar-bg">
                  <div className="sim-bar-fill" style={{width:`${m.similarity}%`,background:simColor(m.similarity)}} />
                </div>
              </div>

              {/* Action buttons */}
              {m.status === 'pending' && (
                <div style={{display:'flex',gap:8,marginTop:16}}>
                  <button onClick={() => handleMatchAction(m.id, 'confirmed')} className="btn btn-success" style={{flex:1}}>
                    ✅ Confirm
                  </button>
                  <button onClick={() => handleMatchAction(m.id, 'dismissed')} className="btn btn-ghost" style={{flex:1}}>
                    ✗ Dismiss
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
