import pathlib
import pytest
from fastapi.testclient import TestClient

from server.config import Settings
from main import create_app


@pytest.fixture
def settings(tmp_path) -> Settings:
    return Settings(
        db_path=str(tmp_path / "test.db"),
        presave_url="https://presave.example/target",
        admin_user="admin",
        admin_pass="secret",
        secret_key="test-secret-key",
        public_base_url="http://testserver",
    )


@pytest.fixture
def client(settings) -> TestClient:
    return TestClient(create_app(settings))
