"""Seed script: creates a default admin user."""
from app.database import SessionLocal, engine, Base
from app.models import User
from app.services.auth import hash_password


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        if not db.query(User).filter(User.username == "admin").first():
            admin = User(
                username="admin",
                hashed_password=hash_password("admin"),
                full_name="Admin User",
            )
            db.add(admin)
            db.commit()
            print("Created admin user (admin/admin)")

        print("Seed complete!")

    finally:
        db.close()


if __name__ == "__main__":
    seed()
