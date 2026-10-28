from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class DemoDepartment(BaseModel):
    id: str
    name: str
    supported_categories: List[str]
    sample_service_area: str
    description: str
    routing_rules: str
    sla_hours: int = 48
    is_demo: bool = True


DEMO_DEPARTMENTS: List[DemoDepartment] = [
    DemoDepartment(
        id="demo-pwd-roads",
        name="Demo Road Maintenance Department (PWD / Infrastructure)",
        supported_categories=[
            "Pothole / Road Damage",
            "Broken Public Property / Footpath",
        ],
        sample_service_area="Demo Metropolitan Zone North & West",
        description="Responsible for municipal asphalt surfacing, crater repairs, lane painting, and road sub-base maintenance.",
        routing_rules="Routes issues involving road craters, potholes, asphalt erosion, and vehicular pavement hazards.",
        sla_hours=48,
    ),
    DemoDepartment(
        id="demo-nagar-nigam",
        name="Demo Municipal Sanitation & Solid Waste Department",
        supported_categories=[
            "Garbage / Illegal Dumping",
            "Other",
        ],
        sample_service_area="Demo Metropolitan Central & South",
        description="Oversees neighborhood cleanliness, garbage clearance, overflowing bins, and unauthorized refuse heaps.",
        routing_rules="Routes issues involving solid waste, accumulated garbage, public hygiene debris, and bio-hazards.",
        sla_hours=24,
    ),
    DemoDepartment(
        id="demo-power-electricity",
        name="Demo Electricity & Streetlighting Board",
        supported_categories=[
            "Streetlight / Electrical Hazard",
        ],
        sample_service_area="Demo Metropolitan Grid & Feeder Area",
        description="Maintains street illumination, electric poles, low-hanging transmission cables, and distribution transformer safety.",
        routing_rules="Routes issues involving dark roadways, broken lamp posts, exposed wiring, and sparking transformers.",
        sla_hours=12,
    ),
    DemoDepartment(
        id="demo-jal-board",
        name="Demo Water Supply & Sewerage Board (Jal Board)",
        supported_categories=[
            "Water Leakage / Drainage",
        ],
        sample_service_area="Demo Municipal Water Utility Division",
        description="Manages municipal potable water distribution pipes, storm drains, manhole covers, and open sewer overflows.",
        routing_rules="Routes issues involving contaminated water stagnation, burst pipelines, open drainage, and blocked sewers.",
        sla_hours=24,
    ),
    DemoDepartment(
        id="demo-public-works",
        name="Demo Public Works & Civic Assets Department",
        supported_categories=[
            "Broken Public Property / Footpath",
            "Other",
        ],
        sample_service_area="Demo Municipal Civic Assets Division",
        description="Repairs public structures, pedestrian footpaths, park fencing, broken bus shelters, and municipal boundary walls.",
        routing_rules="Routes issues involving municipal pedestrian walkways, damaged civic structures, and park installations.",
        sla_hours=72,
    ),
]


class DepartmentMatchResult(BaseModel):
    matched_department: DemoDepartment
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    explanation: str
    requires_confirmation: bool
    candidate_departments: List[DemoDepartment] = Field(default_factory=list)


def get_demo_departments() -> List[DemoDepartment]:
    """Returns the full seed directory of demo municipal departments."""
    return DEMO_DEPARTMENTS


def get_department_by_id(dept_id: str) -> Optional[DemoDepartment]:
    for dept in DEMO_DEPARTMENTS:
        if dept.id == dept_id:
            return dept
    return None


def match_department(
    category: str,
    description: str = "",
    location: Optional[str] = None,
) -> DepartmentMatchResult:
    """
    Evaluates issue category, description text, and location context against
    the seed demo department directory. Computes confidence and explains routing rationale.
    """
    clean_cat = (category or "").lower().strip()
    clean_desc = (description or "").lower().strip()
    clean_loc = (location or "").lower().strip()
    combined_text = f"{clean_cat} {clean_desc} {clean_loc}"

    scores: Dict[str, float] = {}

    for dept in DEMO_DEPARTMENTS:
        score = 0.0
        # Category alignment
        for supported in dept.supported_categories:
            if supported.lower() in clean_cat or clean_cat in supported.lower():
                score += 0.55
                break

        # Keyword checks
        if dept.id == "demo-pwd-roads":
            keywords = ["pothole", "road", "crater", "asphalt", "tar", "car", "vehicle", "highway", "lane", "traffic"]
            matched_kw = sum(1 for kw in keywords if kw in combined_text)
            score += min(0.40, matched_kw * 0.08)

        elif dept.id == "demo-nagar-nigam":
            keywords = ["garbage", "dump", "trash", "waste", "bin", "smell", "odor", "debris", "litter", "rubbish"]
            matched_kw = sum(1 for kw in keywords if kw in combined_text)
            score += min(0.40, matched_kw * 0.08)

        elif dept.id == "demo-power-electricity":
            keywords = ["light", "streetlight", "electric", "wire", "cable", "pole", "spark", "transformer", "shock", "dark"]
            matched_kw = sum(1 for kw in keywords if kw in combined_text)
            score += min(0.40, matched_kw * 0.08)

        elif dept.id == "demo-jal-board":
            keywords = ["water", "leak", "drain", "sewer", "pipe", "overflow", "manhole", "dirty water", "flooding", "tap"]
            matched_kw = sum(1 for kw in keywords if kw in combined_text)
            score += min(0.40, matched_kw * 0.08)

        elif dept.id == "demo-public-works":
            keywords = ["footpath", "sidewalk", "bench", "park", "shelter", "wall", "property", "pedestrian", "railing"]
            matched_kw = sum(1 for kw in keywords if kw in combined_text)
            score += min(0.40, matched_kw * 0.08)

        scores[dept.id] = min(0.99, round(score, 2))

    # Sort departments by score descending
    sorted_depts = sorted(DEMO_DEPARTMENTS, key=lambda d: scores[d.id], reverse=True)
    best_dept = sorted_depts[0]
    second_dept = sorted_depts[1]
    best_score = scores[best_dept.id]
    second_score = scores[second_dept.id]

    # Ambiguity evaluation: check if multiple departments share category, location is missing, or scores are close
    has_multiple_category_matches = sum(
        1 for d in DEMO_DEPARTMENTS if any(supported.lower() in clean_cat or clean_cat in supported.lower() for supported in d.supported_categories)
    ) > 1
    location_missing = not location or not location.strip()

    is_ambiguous = (
        (best_score - second_score < 0.25 and best_score > 0.35)
        or (best_score < 0.40)
        or has_multiple_category_matches
        or location_missing
    )

    if location_missing and is_ambiguous:
        explanation = (
            f"Location context is missing. While '{best_dept.name}' is plausible, please confirm your department."
        )
        candidates = sorted_depts[:2]
    elif is_ambiguous:
        explanation = (
            f"The issue overlaps jurisdictional areas between '{best_dept.name}' and '{second_dept.name}'. "
            f"Please verify the appropriate authority before submitting."
        )
        candidates = sorted_depts[:2]
    else:
        explanation = (
            f"Matched to '{best_dept.name}' based on category '{category}' and key issue signals. "
            f"Routing rules: {best_dept.routing_rules}"
        )
        candidates = [best_dept]

    return DepartmentMatchResult(
        matched_department=best_dept,
        confidence_score=max(0.45, best_score),
        explanation=explanation,
        requires_confirmation=is_ambiguous,
        candidate_departments=candidates,
    )
