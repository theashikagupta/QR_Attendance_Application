import os
from flask import Flask, jsonify, request
from app.routes.qr_routes import qr_bp


def create_app():
    app = Flask(__name__)

    app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev_qr_secret")

    @app.route("/health", methods=["GET"])
    def health():
        return jsonify({"status": "ok", "service": "qr-service"})

    # Register blueprints
    app.register_blueprint(qr_bp, url_prefix="/api/qr")

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=7000, debug=True)
