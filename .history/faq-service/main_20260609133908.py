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
# Used to catch insults, keyboard smashes, and random unrelated statements
classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-1")

print("Loading Semantic Search AI (Sentence Transformers)...")
# Used to convert text questions into high-dimensional mathematical vectors
search_model = SentenceTransformer('all-MiniLM-L6-v2')

# Mock Knowledge Base / Database
faq_database = [
    {"question": "How do I create a feature branch in Git?", "answer": "Use git checkout -b branch-name.", "phase": "bronze"},
    {"question": "How do I lock package versions?", "answer": "Run pip freeze > requirements.txt.", "phase": "bronze"},
    {"question": "How do I deploy an API to AWS EC2?", "answer": "Set up a Docker container and expose port 8000.", "phase": "silver"},
    {"question": "How do I set up a CI/CD pipeline?", "answer": "Use GitHub Actions with workflow YAML files.", "phase": "gold"}
]

# Performance Optimization: Pre-calculate vector mathematical matrices at system boot
# This extracts only the text questions and runs them through the embedding model
faq_embeddings = search_model.encode([faq["question"] for faq in faq_database], convert_to_tensor=True)


# ==========================================
# 2. DATA SCHEMAS (Pydantic Models)
# ==========================================

class QuestionInput(BaseModel):
    text: str

class SearchInput(BaseModel):
    query: str
    phase: str  # Valid fields: "bronze", "silver", or "gold"


# ==========================================
# ENDPOINT 1: THE CONTENT MODERATION FILTER
# ==========================================

@app.post("/api/v1/validate")
def validate_user_question(data: QuestionInput):
    """
    Cleanses incoming user inputs. Safely permits poor grammar while rejecting 
    keyboard smashes, toxic abuse, and entirely meaningless phrases.
    """
    text = data.text.strip()
    
    # Step A: Fast Structural Check (Catches short texts or repeated letters quickly)
    is_garbage, shield_reason = is_structural_garbage(text)
    if is_garbage:
        return {"valid": False, "reason": shield_reason}
    
    # Step B: AI Semantic Evaluation
    # Categorizes the text layout based on calculated probability thresholds
    labels = [
        "legitimate inquiry or help request", 
        "toxic insult or abuse", 
        "random keyboard smash or gibberish",
        "irrelevant statement or meaningless text"
    ]
    ai_result = classifier(text, candidate_labels=labels)
    top_label = ai_result['labels'][0]
    
    # Step C: Silent Decision Matrix (Hides raw mathematical scores from users)
    if top_label == "random keyboard smash or gibberish":
        return {"valid": False, "reason": "Unreadable gibberish noise detected."}
        
    elif top_label == "toxic insult or abuse":
        return {"valid": False, "reason": "Inappropriate language or abusive behavior detected."}
        
    elif top_label == "irrelevant statement or meaningless text":
        return {"valid": False, "reason": "Input is a random statement, not a valid FAQ question or request for help."}
        
    elif top_label == "legitimate inquiry or help request":
        # Broken/imperfect grammar maps directly to this intent block and passes smoothly!
        return {"valid": True, "reason": "Input accepted successfully."}
        
    else:
        return {"valid": False, "reason": "Could not verify this input as a valid question."}


# ==========================================
# ENDPOINT 2: SMART HIERARCHICAL SEMANTIC SEARCH
# ==========================================

@app.post("/api/v1/search")
def smart_intent_search(data: SearchInput):
    """
    Performs context-aware vector calculations. Respects hierarchical phase levels:
    - Bronze tier sees only Bronze items.
    - Silver tier sees Bronze + Silver items.
    - Gold tier unlocks the entire database map.
    """
    query = data.query.strip()
    user_phase = data.phase.lower()
    
    # Step A: Map cumulative access permissions across tiers
    allowed_phases = ["bronze"]
    if user_phase == "silver":
        allowed_phases = ["bronze", "silver"]
    elif user_phase == "gold":
        allowed_phases = ["bronze", "silver", "gold"]

    # Step B: Locate matched database positions matching the phase hierarchy
    matched_indices = [i for i, faq in enumerate(faq_database) if faq["phase"] in allowed_phases]
    if not matched_indices:
        return {"recommendations": []}
        
    # Step C: Slice existing mathematical vector matrices to match the permitted range
    sliced_embeddings = faq_embeddings[matched_indices]
    
    # Step D: Convert query to vector weights and execute Cosine Similarity check
    query_embedding = search_model.encode(query, convert_to_tensor=True)
    cos_scores = util.cos_sim(query_embedding, sliced_embeddings)[0]
    
    # Step E: Filter results using a strict 0.45 similarity ceiling gate
    recommendations = []
    for sub_idx, score in enumerate(cos_scores):
        score_val = float(score)
        if score_val >= 0.45:
            # Re-map the relative sub-index location back to the absolute global database ID
            real_db_idx = matched_indices[sub_idx]
            original_faq = faq_database[real_db_idx]
            
            recommendations.append({
                "faq_id": real_db_idx,
                "question": original_faq["question"],
                "answer": original_faq["answer"],
                "similarity_score": round(score_val, 2)
            })
            
    return {"recommendations": recommendations}