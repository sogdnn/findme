"""
routes/sightings.py — Public Sighting Endpoints
================================================
POST /api/sightings          — upload a sighting photo (triggers AI matching)
GET  /api/sightings          — list all sightings
GET  /api/sightings/<id>     — get one sighting
"""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from database import db, Sighting, MissingCase, Match
from face_engine import compare_faces

sightings_bp = Blueprint('sightings', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
MATCH_THRESHOLD = 85.0   # % similarity required to flag as a possible match


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── POST /api/sightings ───────────────────────────────────────────────────────
@sightings_bp.route('', methods=['POST'])
def create_sighting():
    """
    Upload a sighting photo. After saving, the backend automatically
    compares it against every active missing-person case and stores
    any match above the threshold.

    Form fields:
      - photo     (file, required)
      - location  (string, optional)
      - latitude  (float, optional)
      - longitude (float, optional)
      - notes     (string, optional)
    """
    if 'photo' not in request.files:
        return jsonify({'error': 'Photo is required'}), 400

    file = request.files['photo']
    if not file or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400

    # Persist photo to disk
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"sight_{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    sight_path = os.path.join(upload_dir, filename)
    file.save(sight_path)

    # Save sighting record
    sighting = Sighting(
        photo_path = filename,
        location   = request.form.get('location', ''),
        latitude   = request.form.get('latitude',  0.0, type=float),
        longitude  = request.form.get('longitude', 0.0, type=float),
        notes      = request.form.get('notes', ''),
    )
    db.session.add(sighting)
    db.session.flush()  # get sighting.id before commit

    # ── Auto-match against all active cases ───────────────────────────────────
    matches_found = []
    active_cases  = MissingCase.query.filter_by(status='active').all()

    for case in active_cases:
        case_path = os.path.join(upload_dir, case.photo_path)

        # Call the AI face comparison engine
        result = compare_faces(case_path, sight_path)

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
