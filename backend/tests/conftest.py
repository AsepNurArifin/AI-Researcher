import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base, DATABASE_URL, get_db
from app.main import app

# Create a clean engine for testing
engine = create_engine(DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    # Since we are using Supabase PostgreSQL, we run tests inside a transaction
    # that rolls back automatically, so we don't drop tables.
    yield


@pytest.fixture
def db():
    # Connect to the database
    connection = engine.connect()
    # Begin a transaction
    transaction = connection.begin()
    # Bind a new session to the connection
    session = TestingSessionLocal(bind=connection)

    yield session

    # Close session and rollback transaction
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    from fastapi.testclient import TestClient

    # Override get_db to return our transactional session
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
