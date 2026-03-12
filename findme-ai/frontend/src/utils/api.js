/**
 * utils/api.js — Centralised API calls to the Flask backend
 * All functions return the parsed JSON data or throw on error.
 */

const BASE = '/api';  // proxied to http://localhost:5000 in dev

// ── Generic helpers ───────────────────────────────────────────────────────────

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function patch(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function postForm(path, formData) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ── Cases ─────────────────────────────────────────────────────────────────────

export const getCases       = ()      => get('/cases');
export const getCase        = (id)    => get(`/cases/${id}`);
export const updateCaseStatus = (id, status) => patch(`/cases/${id}`, { status });

export function createCase(formData) {
  // formData is a FormData object (multipart — includes photo file)
  return postForm('/cases', formData);
}

// ── Sightings ─────────────────────────────────────────────────────────────────

export const getSightings = () => get('/sightings');

export function createSighting(formData) {
  return postForm('/sightings', formData);
}

// ── Matches ───────────────────────────────────────────────────────────────────

export const getMatches     = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return get(`/matches${qs ? '?' + qs : ''}`);
};

export const updateMatch    = (id, status) => patch(`/matches/${id}`, { status });

// ── Image URL helper ──────────────────────────────────────────────────────────

/** Convert a photo_url field (e.g. "/api/uploads/case_abc.jpg") to a full URL */
export function imageUrl(photoUrl) {
  if (!photoUrl) return null;
  // In development the proxy handles /api → localhost:5000
  return photoUrl;
}

// ── Similarity colour helper ──────────────────────────────────────────────────

export function simColor(similarity) {
  if (similarity >= 90) return '#38a169'; // green
  if (similarity >= 75) return '#f5a623'; // amber
  return '#e53e3e';                       // red
}
