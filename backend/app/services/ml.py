from __future__ import annotations

from typing import List


class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            # Import sentence-transformers inside to keep app startup fast
            from sentence_transformers import SentenceTransformer
            cls._model = SentenceTransformer("all-MiniLM-L6-v2")
        return cls._model

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        if not text or not text.strip():
            # return a zero vector of dimension 384
            return [0.0] * 384
        
        try:
            model = cls.get_model()
            embedding_array = model.encode(text)
            return [float(x) for x in embedding_array]
        except Exception as e:
            print(f"Error generating embedding: {e}")
            # Fallback to zero vector
            return [0.0] * 384
