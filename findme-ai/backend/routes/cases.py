"""
routes/cases.py — Missing Person Case Endpoints
================================================
POST /api/cases        — create a new missing-person case
GET  /api/cases        — list all cases
GET  /api/cases/<id>   — get one case (with its matches)
PATCH /api/cases/<id>  — update status (active → found)
"""

import os
import cloudinary
import cloudinary.uploader
from flask import Blueprint, request, jsonify, current_app
from database import db, MissingCase, Match

cloudinary.config(
    cloud_name = os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key    = os.environ.get('CLOUDINARY_API_KEY'),
    api_secret = os.environ.get('CLOUDINARY_API_SECRET'),
)

cases_bp = Blueprint('cases', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


# ── POST /api/cases ───────────────────────────────────────────────────────────
@cases_bp.route('', methods=['POST'])
def create_case():
    if 'photo' not in request.files:
        return jsonify({'error': 'Photo is required'}), 400

    file = request.files['photo']
    if file.filename == '' or not allowed_file(file.filename):
        return jsonify({'error': 'Invalid or missing file'}), 400

    # Upload to Cloudinary
    upload_result = cloudinary.uploader.upload(file)
    filename = upload_result['secure_url']

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
    cases = MissingCase.query.order_by(MissingCase.created_at.desc()).all()
    return jsonify([c.to_dict() for c in cases])


# ── GET /api/cases/<id> ───────────────────────────────────────────────────────
@cases_bp.route('/<int:case_id>', methods=['GET'])
def get_case(case_id):
    case = MissingCase.query.get_or_404(case_id)
    data = case.to_dict()
    data['matches'] = [m.to_dict() for m in case.matches]
    return jsonify(data)


# ── PATCH /api/cases/<id> ─────────────────────────────────────────────────────
@cases_bp.route('/<int:case_id>', methods=['PATCH'])
def update_case(case_id):
    case = MissingCase.query.get_or_404(case_id)
    body = request.get_json(silent=True) or {}
    if 'status' in body:
        case.status = body['status']
    db.session.commit()
    return jsonify(case.to_dict())
