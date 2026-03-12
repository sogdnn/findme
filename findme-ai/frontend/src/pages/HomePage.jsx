/**
 * pages/HomePage.jsx — Landing / dashboard page
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCases, getMatches } from '../utils/api';
import './HomePage.css';

export default function HomePage() {
  const [stats, setStats] = useState({ cases: 0, matches: 0, found: 0 });

  useEffect(() => {
    async function load() {
      try {
        const [cases, matches] = await Promise.all([getCases(), getMatches()]);
        setStats({
          cases:   cases.length,
          matches: matches.length,
          found:   cases.filter(c => c.status === 'found').length,
        });
      } catch (_) {}
    }
    load();
  }, []);

  return (
    <div className="home-page">
      {/* ── Hero ──────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-tag">AI-Powered Search</div>
          <h1 className="hero-title">
            Find the <span className="accent">missing.</span>
            <br />Faster, together.
          </h1>
          <p className="hero-sub">
            Submit a photo. Our AI compares it against every active case in
            seconds using face recognition. Every upload could bring someone home.
          </p>
          <div className="hero-actions">
            <Link to="/report"   className="btn btn-primary btn-lg">📋 Report a Missing Person</Link>
            <Link to="/sighting" className="btn btn-ghost  btn-lg">📷 I Saw Someone</Link>
          </div>
        </div>

        {/* Decorative scan-lines background */}
        <div className="hero-bg" aria-hidden="true">
          {[...Array(12)].map((_,i) => <div key={i} className="scan-line" style={{animationDelay:`${i*.3}s`}} />)}
        </div>
      </section>

      {/* ── Stats bar ─────────────────────────────────── */}
      <div className="page-wrapper">
        <div className="stats-bar">
          <Stat value={stats.cases}   label="Active Cases"      icon="📂" />
          <Stat value={stats.matches} label="AI Matches Found"  icon="🔍" />
          <Stat value={stats.found}   label="People Found"      icon="✅" />
          <Stat value="85%"           label="Match Threshold"   icon="🎯" />
        </div>

        {/* ── How it works ──────────────────────────────── */}
        <section className="how-it-works">
          <h2>How FindMe AI works</h2>
          <div className="steps">
            <Step n="01" title="Report" desc="A family or officer uploads a photo and details of the missing person. The profile is immediately active." />
            <Step n="02" title="Sight"  desc="Members of the public who think they've seen someone submit a sighting photo from anywhere." />
            <Step n="03" title="Match"  desc="Our AI (ArcFace / DeepFace) compares the sighting against every active case in real-time." />
            <Step n="04" title="Alert"  desc="If similarity ≥ 85 %, a potential match is flagged for review and shown on the map." />
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ value, label, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Step({ n, title, desc }) {
  return (
    <div className="step">
      <div className="step-n">{n}</div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
}
