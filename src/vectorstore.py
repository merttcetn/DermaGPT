import os
from dotenv import load_dotenv
from pinecone import Pinecone
from sentence_transformers import SentenceTransformer

load_dotenv()

PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
INDEX_NAME = "dermagpt-safe"
NAMESPACE = "default"
MIN_SCORE_THRESHOLD = 0.6  # tweak this value to filter out low score matches

# Initialize Pinecone client
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(INDEX_NAME)

# Load embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_top_k_matches(user_message: str, k: int = 5):
    """
    Embeds the user message and retrieves top-k most similar QA pairs from Pinecone.
    Returns a list of (question, answer) tuples with min similarity score filter.
    """
    # Embed the user message
    query_vector = embedding_model.encode(user_message).tolist()

    # Query Pinecone
    response = index.query(
        vector=query_vector,
        top_k=k,
        namespace=NAMESPACE,
        include_metadata=True
    )

    matches = []
    for match in response.matches:
        if match.score < MIN_SCORE_THRESHOLD:
            continue  # low score matches are filtered out
        meta = match.metadata
        question = meta.get("question")
        answer = meta.get("answer")
        if question and answer:
            matches.append((question, answer))

    return matches
