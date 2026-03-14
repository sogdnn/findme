"""
database.py — SQLite schema via SQLAlchemy
==========================================
Defines three tables:
  - MissingCase   : a reported missing person
  - Sighting      : a photo uploaded by a member of the public
  - Match         : a confirmed (AI-detected) link between a case and a sighting
"""

from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()


# ──────────────────────────────────────────────
# Table 1 — Missing person cases
# ──────────────────────────────────────────────
class MissingCase(db.Model):
    __tablename__ = 'missing_cases'

    id          = db.Column(db.Integer, primary_key=True)
    name        = db.Column(db.String(120), nullable=False)
    age         = db.Column(db.Integer)
    description = db.Column(db.Text)
    last_seen   = db.Column(db.String(200))
    latitude    = db.Column(db.Float, default=0.0)
    longitude   = db.Column(db.Float, default=0.0)
    photo_path  = db.Column(db.Text, nullable=False)
    status      = db.Column(db.String(20), default='active')
    created_at  = db.Column(db.DateTime, default=datetime.utcnow)

    matches     = db.relationship('Match', backref='case', lazy=True)

    def to_dict(self):
        return {
            'id':          self.id,
            'name':        self.name,
            'age':         self.age,
            'description': self.description,
            'last_seen':   self.last_seen,
            'latitude':    self.latitude,
            'longitude':   self.longitude,
            'photo_url':   self.photo_path,
            'status':      self.status,
            'created_at':  self.created_at.isoformat(),
        }


# ──────────────────────────────────────────────
# Table 2 — Sightings uploaded by the public
# ──────────────────────────────────────────────
class Sighting(db.Model):
    __tablename__ = 'sightings'

    id          = db.Column(db.Integer, primary_key=True)
    photo_path  = db.Column(db.Text, nullable=False)
    location    = db.Column(db.String(200))
    latitude    = db.Column(db.Float, default=0.0)
    longitude   = db.Column(db.Float, default=0.0)
    notes       = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

    matches     = db.relationship('Match', backref='sighting', lazy=True)

    def to_dict(self):
        return {
            'id':          self.id,
            'photo_url':   self.photo_path,
            'location':    self.location,
            'latitude':    self.latitude,
            'longitude':   self.longitude,
            'notes':       self.notes,
            'uploaded_at': self.uploaded_at.isoformat(),
        }


# ──────────────────────────────────────────────
# Table 3 — AI-generated matches
# ──────────────────────────────────────────────
class Match(db.Model):
    __tablename__ = 'matches'

    id           = db.Column(db.Integer, primary_key=True)
    case_id      = db.Column(db.Integer, db.ForeignKey('missing_cases.id'), nullable=False)
    sighting_id  = db.Column(db.Integer, db.ForeignKey('sightings.id'),     nullable=False)
    similarity   = db.Column(db.Float,   nullable=False)
    status       = db.Column(db.String(20), default='pending')
    created_at   = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id':          self.id,
            'case_id':     self.case_id,
            'sighting_id': self.sighting_id,
            'similarity':  round(self.similarity, 2),
            'status':      self.status,
            'created_at':  self.created_at.isoformat(),
            'case':        self.case.to_dict()     if self.case     else None,
            'sighting':    self.sighting.to_dict() if self.sighting else None,
        }


def init_db(app):
    """Bind SQLAlchemy to the Flask app and create all tables."""
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)
    with app.app_context():
        db.create_all()
