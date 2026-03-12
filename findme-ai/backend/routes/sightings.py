"""
routes/sightings.py — Public Sighting Endpoints
================================================
POST /api/sightings          — upload a sighting photo (triggers AI matching)
GET  /api/sightings          — list all sightings
GET  /api/sightings/<id>     — get one sighting
"""

import os
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify, current_app
from database import db, Sighting, MissingCase, Match
from face_engine import compare_faces

cloudinary.config(
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
)

sightings_bp = Blueprint('sightings', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MATCH_THRESHOLD = 85.0


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── POST /api/sightings ───────────────────────────────────────────────────────
@sightings_bp.route('', methods=['POST'])
def create_sighting():
    if 'photo' not in request.files:
        return jsonify({'error': 'Photo is required'}), 400

    file = request.files['photo']
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    # Upload to Cloudinary
    upload_result = cloudinary.uploader.upload(file)
    filename = upload_result['secure_url']

    # Save sighting record
    sighting = Sighting(
        photo_path = filename,
        location   = request.form.get('location', ''),
        latitude   = request.form.get('latitude',  0.0, type=float),
        longitude  = request.form.get('longitude', 0.0, type=float),
        notes      = request.form.get('notes', ''),
    )
    db.session.add(sighting)
    db.session.flush()

    # ── Auto-match against all active cases ───────────────────────────────────
    matches_found = []
    active_cases  = MissingCase.query.filter_by(status='active').all()

    for case in active_cases:
        result = compare_faces(case.photo_path, filename)

        if result['similarity'] >= MATCH_THRESHOLD:
            match = Match(
                case_id     = case.id,
                sighting_id = sighting.id,
                similarity  = result['similarity'],
                status      = 'pending',
            )
            db.session.add(match)
            matches_found.append({
                'case_id':    case.id,
                'case_name':  case.name,
                'similarity': result['similarity'],
                'model':      result['model'],
            })

    db.session.commit()

    return jsonify({
        'message':       'Sighting uploaded and compared',
        'sighting':      sighting.to_dict(),
        'matches_found': matches_found,
        'total_matches': len(matches_found),
    }), 201


# ── GET /api/sightings ────────────────────────────────────────────────────────
@sightings_bp.route('', methods=['GET'])
def list_sightings():
    sightings = Sighting.query.order_by(Sighting.uploaded_at.desc()).all()
    return jsonify([s.to_dict() for s in sightings])


# ── GET /api/sightings/<id> ───────────────────────────────────────────────────
@sightings_bp.route('/<int:sighting_id>', methods=['GET'])
def get_sighting(sighting_id):
    s = Sighting.query.get_or_404(sighting_id)
    data = s.to_dict()
    data['matches'] = [m.to_dict() for m in s.matches]
    return jsonify(data)
