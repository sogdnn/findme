"""
routes/matches.py — Match Management Endpoints
===============================================
GET   /api/matches            — list all matches (with filters)
GET   /api/matches/<id>       — get one match
PATCH /api/matches/<id>       — update match status (confirm / dismiss)
POST  /api/matches/compare    — on-demand comparison between a case and sighting
"""

from flask import Blueprint, request, jsonify, current_app
import os
from database import db, Match, MissingCase, Sighting
from face_engine import compare_faces

matches_bp = Blueprint('matches', __name__)


# ── GET /api/matches ──────────────────────────────────────────────────────────
@matches_bp.route('', methods=['GET'])
def list_matches():
    """
    Return all matches.
    Optional query params:
      ?status=pending|confirmed|dismissed
      ?case_id=<int>
    """
    query = Match.query

    status  = request.args.get('status')
    case_id = request.args.get('case_id', type=int)

    if status:
        query = query.filter_by(status=status)
    if case_id:
        query = query.filter_by(case_id=case_id)

    matches = query.order_by(Match.similarity.desc()).all()
    return jsonify([m.to_dict() for m in matches])


# ── GET /api/matches/<id> ─────────────────────────────────────────────────────
@matches_bp.route('/<int:match_id>', methods=['GET'])
def get_match(match_id):
    m = Match.query.get_or_404(match_id)
    return jsonify(m.to_dict())


# ── PATCH /api/matches/<id> ───────────────────────────────────────────────────
@matches_bp.route('/<int:match_id>', methods=['PATCH'])
def update_match(match_id):
    """Confirm or dismiss a match. Body: { "status": "confirmed" | "dismissed" }"""
    m    = Match.query.get_or_404(match_id)
    body = request.get_json(silent=True) or {}
    if 'status' in body and body['status'] in ('confirmed', 'dismissed', 'pending'):
        m.status = body['status']
        # If confirmed, optionally mark the whole case as found
        if body['status'] == 'confirmed' and body.get('mark_found'):
            m.case.status = 'found'
    db.session.commit()
    return jsonify(m.to_dict())


# ── POST /api/matches/compare ─────────────────────────────────────────────────
@matches_bp.route('/compare', methods=['POST'])
def manual_compare():
    """
    On-demand comparison between a specific case and sighting.
    Body (JSON): { "case_id": 1, "sighting_id": 2 }
    """
    body        = request.get_json(silent=True) or {}
    case_id     = body.get('case_id')
    sighting_id = body.get('sighting_id')

    if not case_id or not sighting_id:
        return jsonify({'error': 'case_id and sighting_id required'}), 400

    case     = MissingCase.query.get_or_404(case_id)
    sighting = Sighting.query.get_or_404(sighting_id)

    upload_dir  = current_app.config['UPLOAD_FOLDER']
    case_path   = os.path.join(upload_dir, case.photo_path)
    sight_path  = os.path.join(upload_dir, sighting.photo_path)

    result = compare_faces(case_path, sight_path)

    return jsonify({
        'case_id':     case_id,
        'sighting_id': sighting_id,
        'similarity':  result['similarity'],
        'is_match':    result['is_match'],
        'model':       result['model'],
        'error':       result.get('error'),
    })
