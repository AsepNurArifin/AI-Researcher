from __future__ import annotations

from unittest.mock import patch

from app.services.ml import EmbeddingService


def test_get_embedding_empty():
    assert EmbeddingService.get_embedding("") == [0.0] * 384
    assert EmbeddingService.get_embedding("   ") == [0.0] * 384


def test_get_embedding_successful():
    emb = EmbeddingService.get_embedding("Python Developer")
    assert len(emb) == 384
    assert any(x != 0.0 for x in emb)


@patch.object(EmbeddingService, "get_model")
def test_get_embedding_fallback(mock_get_model):
    mock_get_model.side_effect = Exception("Model loading error")
    emb = EmbeddingService.get_embedding("Some text")
    assert emb == [0.0] * 384
