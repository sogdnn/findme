/**
 * App.jsx — Root component with navigation and routing
 */
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomePage        from './pages/HomePage';
import ReportPage      from './pages/ReportPage';
import SightingPage    from './pages/SightingPage';
import CasesPage       from './pages/CasesPage';
import CaseDetailPage  from './pages/CaseDetailPage';
import MatchesPage     from './pages/MatchesPage';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        {/* ── Top navigation bar ─────────────────────────────── */}
        <nav className="navbar">
          <div className="nav-inner">
            <NavLink to="/" className="nav-logo">
              <span className="logo-icon">◎</span>
              <span>FindMe <strong>AI</strong></span>
            </NavLink>

            <div className="nav-links">
              <NavLink to="/cases"    className={({isActive})=>isActive?'nav-link active':'nav-link'}>Cases</NavLink>
              <NavLink to="/matches"  className={({isActive})=>isActive?'nav-link active':'nav-link'}>Matches</NavLink>
              <NavLink to="/report"   className="nav-cta">+ Report Missing</NavLink>
              <NavLink to="/sighting" className="nav-cta-ghost">📷 Submit Sighting</NavLink>
            </div>
          </div>
        </nav>

        {/* ── Page content ────────────────────────────────────── */}
        <main className="main-content">
          <Routes>
            <Route path="/"           element={<HomePage />} />
            <Route path="/report"     element={<ReportPage />} />
            <Route path="/sighting"   element={<SightingPage />} />
            <Route path="/cases"      element={<CasesPage />} />
            <Route path="/cases/:id"  element={<CaseDetailPage />} />
            <Route path="/matches"    element={<MatchesPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
