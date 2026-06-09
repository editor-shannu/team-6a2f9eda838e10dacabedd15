import re
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline
from sentence_transformers import SentenceTransformer, util
import torch

# Import the structural protection rule from your shield helper file
from shield import is_structural_garbage

# ==========================================
# 1. INITIALIZATION & AI MODEL SETUP
# ==========================================

app = FastAPI(title="Smart FAQ Microservice")

print("Loading Content Moderation AI (Zero-Shot Classifier)...")
classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-1")

print("Loading Semantic Search AI (Sentence Transformers)...")
search_model = SentenceTransformer('all-MiniLM-L6-v2')

# Official College/Internship Dataset provided by Team Leader
faq_database = [
    "What is the procedure to apply for an internship NOC?",
    "Can I get a stipend during my college summer internship?",
    "Where do I submit the final internship completion certificate?",
    "How many days does it take to process an academic NOC for higher studies?",
    "What happens if I fail to clear the final semester examinations?"
]

# Pre-calculate mathematical matrices for the official database at boot up
faq_embeddings = search_model.encode(faq_database, convert_to_tensor=True)


# ==========================================
# 2. DATA SCHEMAS (Pydantic Models)
# ==========================================

class QuestionInput(BaseModel):
    text: str

class SearchInput(BaseModel):
    query: str
    documents: list[str] = None  # Safely defaults to None if frontend doesn't pass it


# ==========================================
# ENDPOINT 1: THE NOISE & MODERATION FILTER
# ==========================================

@app.post("/api/v1/validate")
def validate_user_question(data: QuestionInput):
    """
    Cleanses incoming user queries. Permits broken grammar but flags
    keyboard smashes, abusive text, and irrelevant statements.
    """
    text = data.text.strip()
    
    # Step A: Fast Structural Shield Check
    is_garbage, shield_reason = is_structural_garbage(text)
    if is_garbage:
        return {"valid": False, "reason": shield_reason}
    
    # Step B: AI Semantic Evaluation (Handles advanced edge cases seamlessly)
    labels = [
        "legitimate inquiry or help request", 
        "toxic insult or abuse", 
        "random keyboard smash or gibberish",
        "irrelevant statement or meaningless text"
    ]
    ai_result = classifier(text, candidate_labels=labels)
    top_label = ai_result['labels'][0]
    
    # Step C: Silent Decision Matrix (No raw score exposures to frontend)
    if top_label == "random keyboard smash or gibberish":
        return {"valid": False, "reason": "Unreadable gibberish noise detected."}
        
    elif top_label == "toxic insult or abuse":
        return {"valid": False, "reason": "Inappropriate language or abusive behavior detected."}
        
    elif top_label == "irrelevant statement or meaningless text":
        return {"valid": False, "reason": "Input is a random statement, not a valid FAQ question or request for help."}
        
    elif top_label == "legitimate inquiry or help request":
        # Imperfect grammar passes smoothly as it maps directly to a helpful intent
        return {"valid": True, "reason": "Input accepted successfully."}
        
    else:
        return {"valid": False, "reason": "Could not verify this input as a valid question."}


# ==========================================
# ENDPOINT 2: SMART INTENT SEARCH
# ==========================================

@app.post("/api/v1/search")
def smart_search(data: SearchInput):
    """
    Computes semantic similarity calculations against either the core 
    internship database or an ad-hoc custom list of document strings.
    """
    # Use custom documents list if passed by client, otherwise fall back to core database
    docs = data.documents if data.documents is not None else faq_database
    if not docs:
        return {"recommendations": []}

    # Step A: Vector weights extraction logic
    if data.documents is not None:
        # Generate temporary tensor embeddings on the fly for custom string layouts
        doc_embeddings = search_model.encode(docs, convert_to_tensor=True)
    else:
        # Use optimized pre-calculated memory arrays for the core database
        doc_embeddings = faq_embeddings

    # Step B: Execute Cosine Similarity calculations
    query_embedding = search_model.encode(data.query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, doc_embeddings)[0]
    
    # Step C: Dynamic match slicing setup
    k = min(2, len(docs))
    if k == 0:
        return {"recommendations": []}

    top_results = torch.topk(cos_scores, k=k)
    scores = top_results[0]
    indices = top_results[1]

    # Step D: Safeguard logic block for handling singular tensor list outputs
    if k == 1:
        if not hasattr(scores, '__len__') or scores.dim() == 0:
            scores = [scores]
            indices = [indices]

    # Step E: Filter matches against strict 0.45 confidence floor gate
    recommendations = []
    for score, idx in zip(scores, indices):
        if float(score) >= 0.45:
            # Append only clean text string, matching the team leader's format requirement
            recommendations.append(docs[int(idx)])
            
    return {"recommendations": recommendations}