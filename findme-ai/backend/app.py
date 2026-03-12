"""
FindMe AI - Backend Flask Application
=====================================
Main entry point for the FindMe AI REST API.
"""

import os
from flask import Flask, send_from_directory
from flask_cors import CORS
from database import init_db
from routes.cases import cases_bp
from routes.sightings import sightings_bp
from routes.matches import matches_bp

def create_app():
    app = Flask(__name__)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///findme.db'
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

    init_db(app)

    app.register_blueprint(cases_bp,     url_prefix='/api/cases')
    app.register_blueprint(sightings_bp, url_prefix='/api/sightings')
    app.register_blueprint(matches_bp,   url_prefix='/api/matches')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'service': 'FindMe AI'}

    @app.route('/api/uploads/<path:filename>')
    def serve_upload(filename):
        upload_dir = os.path.join(app.root_path, app.config['UPLOAD_FOLDER'])
        return send_from_directory(upload_dir, filename)

    return app


if __name__ == '__main__':
    app = create_app()
port = int(os.environ.get("PORT", 5000))
app.run(host="0.0.0.0", port=port, debug=False)
