import os

basedir = os.path.abspath(os.path.dirname(__file__))

SECRET_KEY = "secret123"

# Database Configurations from Env
DATABASE_URL = os.getenv("DATABASE_URL")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")

if DATABASE_URL:
    # SQLAlchemy requires postgresql:// or postgresql+psycopg2:// instead of postgres://
    if DATABASE_URL.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace("postgres://", "postgresql+psycopg2://", 1)
    elif DATABASE_URL.startswith("postgresql://"):
        SQLALCHEMY_DATABASE_URI = DATABASE_URL.replace("postgresql://", "postgresql+psycopg2://", 1)
    else:
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    print("[DATABASE] Connected via DATABASE_URL")
elif DB_USER and DB_NAME:
    # fallback to individual postgres variables
    SQLALCHEMY_DATABASE_URI = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    print(f"[DATABASE] Connected to PostgreSQL: {DB_USER}@{DB_HOST}:{DB_PORT}/{DB_NAME}")
else:
    SQLALCHEMY_DATABASE_URI = "sqlite:///" + os.path.join(basedir, "database", "db.sqlite3").replace("\\", "/")
    print("[DATABASE] Connected to SQLite (Fallback)")

SQLALCHEMY_TRACK_MODIFICATIONS = False

# ✅ Connection Pool settings — critical for Render (prevents stale connection drops)
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_pre_ping": True,    # Test connection before use (avoids stale connection errors)
    "pool_recycle": 300,      # Recycle connections every 5 min (Render drops idle connections)
    "pool_size": 5,           # Max 5 persistent connections
    "max_overflow": 10,       # Up to 10 overflow connections under load
    "connect_args": {},
}
