from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# ==========================================
# 1. VALIDATION ENDPOINT TESTS
# ==========================================

def test_validate_broken_grammar_passes():
    """Ensures tute-foote English or minor typos still pass successfully."""
    payload = {"text": "how apply hoc for intern urgently help"}
    response = client.post("/api/v1/validate", json=payload)
    assert response.status_code == 200
    assert response.json()["valid"] is True

def test_validate_gibberish_blocked():
    """Ensures random keyboard smashes are caught by the shield."""
    payload = {"text": "hjsfgaydhshdb"}
    response = client.post("/api/v1/validate", json=payload)
    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert "gibberish" in response.json()["reason"].lower()

def test_validate_abuse_blocked():
    """Ensures toxic trolling phrases are blocked instantly."""
    payload = {"text": "hell you are this"}
    response = client.post("/api/v1/validate", json=payload)
    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert "abusive" in response.json()["reason"].lower() or "inappropriate" in response.json()["reason"].lower()

def test_validate_meaningless_statement_blocked():
    """Ensures dictionary words with zero question intent get flagged."""
    payload = {"text": "keepe I knew it to answer whom"}
    response = client.post("/api/v1/validate", json=payload)
    assert response.status_code == 200
    assert response.json()["valid"] is False
    assert "statement" in response.json()["reason"].lower()


# ==========================================
# 2. SEARCH ENDPOINT TESTS
# ==========================================

def test_search_core_database_success():
    """Tests semantic search matching against the default internship database."""
    payload = {"query": "stipend amount in summer"}
    response = client.post("/api/v1/search", json=payload)
    assert response.status_code == 200
    assert "recommendations" in response.json()
    # Should confidently match the stipend question from the core array
    assert any("stipend" in doc.lower() for doc in response.json()["recommendations"])

def test_search_custom_documents_success():
    """Tests semantic search running against an ad-hoc custom array of documents."""
    payload = {
        "query": "where is my laptop",
        "documents": [
            "The library is closed on Sundays.",
            "Collect your company assets and laptop from the IT desk.",
            "Submit your NOC forms to the admin block."
        ]
    }
    response = client.post("/api/v1/search", json=payload)
    assert response.status_code == 200
    assert len(response.json()["recommendations"]) > 0
    assert "IT desk" in response.json()["recommendations"][0]