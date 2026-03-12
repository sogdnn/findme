/**
 * pages/SightingPage.jsx
 * Public users upload a sighting photo. On submit the Flask backend
 * immediately compares it against all active cases and returns matches.
 */
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createSighting, simColor } from '../utils/api';

export default function SightingPage() {
  const [photo, setPhoto]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [form, setForm]         = useState({ location: '', latitude: '', longitude: '', notes: '' });
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);   // API response after upload
  const [error, setError]       = useState('');
  const fileRef = useRef();

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!photo) { setError('Please upload a photo.'); return; }

    const fd = new FormData();
    fd.append('photo',    photo);
    fd.append('location', form.location);
    fd.append('latitude', form.latitude  || '0');
    fd.append('longitude',form.longitude || '0');
    fd.append('notes',    form.notes);

    try {
      setLoading(true);
      setError('');
      const res = await createSighting(fd);
      setResult(res);
    } catch (err) {
      setError('Upload failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="eyebrow">Public Sighting</div>
        <h1>Submit a Sighting</h1>
        <p>Upload a photo of someone you believe may be a missing person. Our AI will compare it instantly.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Result card (shown after submission) ─── */}
      {result && (
        <div className={`alert ${result.total_matches > 0 ? 'alert-success' : 'alert-info'}`} style={{marginBottom:28}}>
          {result.total_matches > 0
            ? `🚨 ${result.total_matches} possible match(es) found! Scroll down to review.`
            : '✅ Sighting uploaded. No matches found in active cases at this time.'}
        </div>
      )}

      <div className="grid-2">
        {/* ── Photo upload ─────────────────────── */}
        <div>
          <div
            className={`upload-zone ${preview ? 'active' : ''}`}
            onClick={() => fileRef.current.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const f=e.dataTransfer.files[0]; if(f){setPhoto(f);setPreview(URL.createObjectURL(f));} }}
          >
            {preview
              ? <img src={preview} alt="preview" className="preview" />
              : <>
                  <div style={{fontSize:40,marginBottom:12}}>📷</div>
                  <div style={{color:'var(--text-muted)',fontSize:14}}>Upload the sighting photo</div>
                </>
            }
            <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFileChange} />
          </div>
        </div>

        {/* ── Form fields ──────────────────────── */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Where did you see this person?</label>
              <input type="text" value={form.location} onChange={set('location')} placeholder="e.g. Times Square, NYC" />
            </div>
            <div className="grid-2" style={{marginBottom:18}}>
              <div>
                <label>Latitude</label>
                <input type="number" value={form.latitude} onChange={set('latitude')} placeholder="40.7580" step="any" />
              </div>
              <div>
                <label>Longitude</label>
                <input type="number" value={form.longitude} onChange={set('longitude')} placeholder="-73.9855" step="any" />
              </div>
            </div>
            <div className="form-group">
              <label>Additional notes</label>
              <textarea value={form.notes} onChange={set('notes')} rows={3}
                placeholder="Approximate time, clothing, direction they were heading…" />
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
              {loading ? '🔍 Comparing faces…' : '🔍 Upload & Compare'}
            </button>
          </form>
        </div>
      </div>

      {/* ── Match results (shown after submission) ─────────────── */}
      {result && result.matches_found && result.matches_found.length > 0 && (
        <div style={{marginTop:40}}>
          <h2 style={{marginBottom:20}}>🚨 Possible Matches</h2>
          <div className="grid-2">
            {result.matches_found.map((m, i) => (
              <div key={i} className="card match-result-card">
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                  <strong style={{fontSize:16}}>{m.case_name}</strong>
                  <span className="badge badge-active">Case #{m.case_id}</span>
                </div>
                <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}>
                  AI Model: {m.model}
                </div>
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontSize:13}}>Similarity</span>
                    <span style={{fontWeight:700,color:simColor(m.similarity)}}>{m.similarity}%</span>
                  </div>
                  <div className="sim-bar-bg">
                    <div className="sim-bar-fill"
                      style={{width:`${m.similarity}%`, background:simColor(m.similarity)}} />
                  </div>
                </div>
                <Link to={`/cases/${m.case_id}`} className="btn btn-primary" style={{marginTop:16,width:'100%',justifyContent:'center'}}>
                  View Case Profile →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
