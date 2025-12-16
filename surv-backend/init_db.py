"""
Initialize the database by creating all tables
"""
from app.database import engine, Base
from app.models import User, Customer, Job, Invoice

def init_database():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("[OK] Database tables created successfully!")
    print("\nTables created:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")

if __name__ == "__main__":
    init_database()

