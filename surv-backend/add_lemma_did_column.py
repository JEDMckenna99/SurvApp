"""
Migration script to add lemma_did column to users table.
Run this on Heroku after deployment:
    heroku run python add_lemma_did_column.py
"""
import os
from sqlalchemy import create_engine, text

# Get database URL from environment
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./surv_dev.db")

# Fix Heroku's postgres:// URL to postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

# Add lemma_did column if it doesn't exist
migration_sql = """
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='users' AND column_name='lemma_did'
    ) THEN
        ALTER TABLE users ADD COLUMN lemma_did VARCHAR UNIQUE;
        CREATE INDEX IF NOT EXISTS ix_users_lemma_did ON users(lemma_did);
        RAISE NOTICE 'Added lemma_did column to users table';
    ELSE
        RAISE NOTICE 'lemma_did column already exists';
    END IF;
END $$;
"""

# SQLite version for local dev
sqlite_check = "SELECT sql FROM sqlite_master WHERE type='table' AND name='users';"

try:
    with engine.connect() as conn:
        # Check if using PostgreSQL or SQLite
        if "postgresql" in DATABASE_URL:
            print("Running PostgreSQL migration...")
            conn.execute(text(migration_sql))
            conn.commit()
            print("Migration completed successfully!")
        else:
            # SQLite - check if column exists
            print("Running SQLite migration...")
            result = conn.execute(text(sqlite_check)).fetchone()
            if result and "lemma_did" not in result[0]:
                conn.execute(text("ALTER TABLE users ADD COLUMN lemma_did VARCHAR UNIQUE;"))
                conn.commit()
                print("Added lemma_did column!")
            else:
                print("Column already exists or table not found")
except Exception as e:
    print(f"Migration error: {e}")
    # If the error is about DO block (PostgreSQL specific syntax), try simpler approach
    if "syntax" in str(e).lower():
        try:
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ADD COLUMN lemma_did VARCHAR UNIQUE;"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_lemma_did ON users(lemma_did);"))
                conn.commit()
                print("Migration completed (simple mode)!")
        except Exception as e2:
            if "already exists" in str(e2).lower() or "duplicate" in str(e2).lower():
                print("Column already exists - no migration needed!")
            else:
                print(f"Migration failed: {e2}")
