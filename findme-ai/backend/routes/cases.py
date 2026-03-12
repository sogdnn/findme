"""
routes/cases.py — Missing Person Case Endpoints
================================================
POST /api/cases        — create a new missing-person case
GET  /api/cases        — list all cases
GET  /api/cases/<id>   — get one case (with its matches)
PATCH /api/cases/<id>  — update status (active → found)
"""

import os
import uuid
from flask import Blueprint, request, jsonify, current_app, send_from_directory
from werkzeug.utils import secure_filename
from database import db, MissingCase, Match

cases_bp = Blueprint('cases', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── POST /api/cases ───────────────────────────────────────────────────────────
@cases_bp.route('', methods=['POST'])
def create_case():
    """
    Accepts multipart/form-data with:
      - photo        (file, required)
      - name         (string, required)
      - age          (int, optional)
      - description  (string, optional)
      - last_seen    (string, optional)
      - latitude     (float, optional)
      - longitude    (float, optional)
    """
    # Validate that a photo was provided
    if 'photo' not in request.files:
        return jsonify({'error': 'Photo is required'}), 400

    file = request.files['photo']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid or missing file'}), 400

    # Save photo with a UUID filename to avoid collisions
    ext      = file.filename.rsplit('.', 1)[1].lower()
    filename = f"case_{uuid.uuid4().hex}.{ext}"
    upload_dir = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_dir, exist_ok=True)
    file.save(os.path.join(upload_dir, filename))

    # Persist to database
    case = MissingCase(
        name        = request.form.get('name', 'Unknown'),
        age         = request.form.get('age',  type=int),
        description = request.form.get('description', ''),
        last_seen   = request.form.get('last_seen', ''),
        latitude    = request.form.get('latitude',  0.0, type=float),
        longitude   = request.form.get('longitude', 0.0, type=float),
        photo_path  = filename,
        status      = 'active',
    )
    db.session.add(case)
    db.session.commit()

    return jsonify({'message': 'Case created', 'case': case.to_dict()}), 201


# ── GET /api/cases ────────────────────────────────────────────────────────────
@cases_bp.route('', methods=['GET'])
def list_cases():
    """Return all missing-person cases, newest first."""
    cases = MissingCase.query.order_by(MissingCase.created_at.desc()).all()
    return jsonify([c.to_dict() for c in cases])


# ── GET /api/cases/<id> ───────────────────────────────────────────────────────
@cases_bp.route('/<int:case_id>', methods=['GET'])
def get_case(case_id):
    """Return a single case with its matches."""
    case = MissingCase.query.get_or_404(case_id)
    data = case.to_dict()
    # Attach any matches found for this case
    data['matches'] = [m.to_dict() for m in case.matches]
    return jsonify(data)


# ── PATCH /api/cases/<id> ─────────────────────────────────────────────────────
@cases_bp.route('/<int:case_id>', methods=['PATCH'])
def update_case(case_id):
    """Update a case's status (e.g. mark as found)."""
    case = MissingCase.query.get_or_404(case_id)
    body = request.get_json(silent=True) or {}
    if 'status' in body:
        case.status = body['status']
    db.session.commit()
    return jsonify(case.to_dict())


# ── GET /api/uploads/<filename> ───────────────────────────────────────────────
@cases_bp.route('/uploads/<path:filename>')
def serve_upload(filename):
    """Serve uploaded image files (used by the frontend <img> tags)."""
    return send_from_directory(
        os.path.join(current_app.root_path, current_app.config['UPLOAD_FOLDER']),
        filename
    )
