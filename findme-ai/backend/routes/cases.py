"""
routes/cases.py — Missing Person Case Endpoints
================================================
POST /api/cases        — create a new missing-person case
GET  /api/cases        — list all cases
GET  /api/cases/<id>   — get one case (with its matches)
PATCH /api/cases/<id>  — update status (active → found)
"""

import os
import base64
import io
from PIL import Image, ImageOps
from flask import Blueprint, request, jsonify
from database import db, MissingCase, Match

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

    # Resize, fix rotation and compress image before storing as base64
    img = Image.open(file)
    img = ImageOps.exif_transpose(img)
    img.thumbnail((400, 600))
    buffer = io.BytesIO()
    img.save(buffer, format='JPEG', quality=70)
    file_data = buffer.getvalue()
    filename = f"data:image/jpeg;base64,{base64.b64encode(file_data).decode('utf-8')}"

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
