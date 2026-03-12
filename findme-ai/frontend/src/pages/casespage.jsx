/**
 * pages/CasesPage.jsx — Grid of all missing-person cases
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCases, imageUrl } from '../utils/api';

export default function CasesPage() {
  const [cases, setCases]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState('all'); // all | active | found

  useEffect(() => {
    getCases()
      .then(setCases)
      .catch(err => setError('Could not load cases. Is the backend running?'))
      .finally(() => setLoading(false));
  }, []);

  const displayed = filter === 'all' ? cases : cases.filter(c => c.status === filter);

  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="eyebrow">Database</div>
        <h1>Missing Person Cases</h1>
        <p>{cases.length} total case{cases.length !== 1 ? 's' : ''} in the system.</p>
      </div>

      {/* Filter tabs */}
      <div className="filter-tabs" style={{display:'flex',gap:8,marginBottom:28}}>
        {['all','active','found'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn ${filter===f?'btn-primary':'btn-ghost'}`}
            style={{textTransform:'capitalize'}}>
            {f}
          </button>
        ))}
        <Link to="/report" className="btn btn-ghost" style={{marginLeft:'auto'}}>
          + Report Missing
        </Link>
      </div>

      {loading && <div className="spinner" />}

      {error && (
        <div style={{background:'#fff5f5',border:'1px solid #fc8181',borderRadius:8,padding:16,color:'#c53030',marginBottom:24}}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && displayed.length === 0 && (
        <div className="empty-state">
          <div className="icon">📂</div>
          <h3>No cases yet</h3>
          <p style={{marginTop:8,marginBottom:20}}>Be the first to report a missing person.</p>
          <Link to="/report" className="btn btn-primary">Report a Missing Person</Link>
        </div>
      )}

      <div className="grid-3">
        {displayed.map(c => <CaseCard key={c.id} c={c} />)}
      </div>
    </div>
  );
}

function CaseCard({ c }) {
  return (
    <Link to={`/cases/${c.id}`} className="case-card" style={{textDecoration:'none'}}>
      <div className="case-card-img">
        {c.photo_url
          ? <img src={c.photo_url} alt={c.name} />
          : <div className="case-card-placeholder">👤</div>
        }
        <span className={`badge badge-${c.status}`} style={{position:'absolute',top:10,right:10}}>
          {c.status}
        </span>
      </div>
      <div className="case-card-body">
        <h3>{c.name}</h3>
        {c.age && <div className="case-meta">Age {c.age}</div>}
        {c.last_seen && <div className="case-meta">📍 {c.last_seen}</div>}
        <div className="case-date">{new Date(c.created_at).toLocaleDateString()}</div>
      </div>
    </Link>
  );
}
