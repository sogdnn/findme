/**
 * pages/ReportPage.jsx
 * Form to report a missing person — uploads photo + details to Flask.
 */
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createCase } from '../utils/api';

export default function ReportPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '', age: '', description: '', last_seen: '',
    latitude: '', longitude: '',
  });
  const [photo, setPhoto]       = useState(null);
  const [preview, setPreview]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const fileRef = useRef();

  // Update text fields
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  // Handle photo selection
  function onFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
  }

  function onDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) { setPhoto(file); setPreview(URL.createObjectURL(file)); }
  }

  // Submit form to Flask API
  async function handleSubmit(e) {
    e.preventDefault();
    if (!photo)      { setError('Please upload a photo.'); return; }
    if (!form.name)  { setError('Name is required.');      return; }

    const fd = new FormData();
    fd.append('photo',       photo);
    fd.append('name',        form.name);
    fd.append('age',         form.age);
    fd.append('description', form.description);
    fd.append('last_seen',   form.last_seen);
    fd.append('latitude',    form.latitude  || '0');
    fd.append('longitude',   form.longitude || '0');

    try {
      setLoading(true);
      setError('');
      const res = await createCase(fd);
      setSuccess(`Case #${res.case.id} created for ${res.case.name}`);
      setTimeout(() => navigate(`/cases/${res.case.id}`), 1500);
    } catch (err) {
      setError('Failed to create case. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="eyebrow">Missing Person</div>
        <h1>Report a Missing Person</h1>
        <p>Fill in the details and upload a clear face photo. The AI will start matching immediately.</p>
      </div>

      {error   && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">✅ {success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="grid-2">
          {/* Left column — photo upload */}
          <div>
            <div
              className={`upload-zone ${preview ? 'active' : ''}`}
              onClick={() => fileRef.current.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={onDrop}
            >
              {preview
                ? <img src={preview} alt="preview" className="preview" />
                : <>
                    <div style={{fontSize:40,marginBottom:12}}>📷</div>
                    <div style={{color:'var(--text-muted)',fontSize:14}}>
                      Click or drag to upload a face photo
                    </div>
                    <div style={{fontSize:12,color:'var(--text-muted)',marginTop:6}}>
                      PNG, JPG, WEBP — max 16 MB
                    </div>
                  </>
              }
              <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={onFileChange} />
            </div>
          </div>

          {/* Right column — text fields */}
          <div className="card">
            <div className="form-group">
              <label>Full Name *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="e.g. Jane Doe" />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input type="number" value={form.age} onChange={set('age')} placeholder="e.g. 32" min="0" max="120" />
            </div>
            <div className="form-group">
              <label>Last Known Location</label>
              <input type="text" value={form.last_seen} onChange={set('last_seen')} placeholder="e.g. Central Park, New York" />
            </div>
            <div className="grid-2" style={{marginBottom:18}}>
              <div>
                <label>Latitude</label>
                <input type="number" value={form.latitude} onChange={set('latitude')} placeholder="40.7128" step="any" />
              </div>
              <div>
                <label>Longitude</label>
                <input type="number" value={form.longitude} onChange={set('longitude')} placeholder="-74.0060" step="any" />
              </div>
            </div>
            <div className="form-group">
              <label>Description / Additional Details</label>
              <textarea value={form.description} onChange={set('description')} rows={4}
                placeholder="Height, clothing, distinguishing features..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{width:'100%'}} disabled={loading}>
              {loading ? '⏳ Submitting…' : '📋 Submit Missing Person Report'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
