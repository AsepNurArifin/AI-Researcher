from __future__ import annotations

import logging
from typing import List

logger = logging.getLogger("hiresense")


class EmbeddingService:
    _model = None

    @classmethod
    def get_model(cls):
        if cls._model is None:
            from fastembed import TextEmbedding
            cls._model = TextEmbedding(
                model_name="BAAI/bge-small-en-v1.5",
                max_length=512,
            )
        return cls._model

    @classmethod
    def get_embedding(cls, text: str) -> List[float]:
        if not text or not text.strip():
            return [0.0] * 384

        try:
            model = cls.get_model()
            embedding_generator = model.embed(text)
            embedding = list(embedding_generator)[0]
            return [float(x) for x in embedding]
        except Exception as e:
            logger.error("Error generating embedding: %s", e)
            return [0.0] * 384
