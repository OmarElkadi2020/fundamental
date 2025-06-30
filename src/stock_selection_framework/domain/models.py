from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any

class CriterionCategory(Enum):
    LYNCH_FISHER = "Lynch/Fisher"
    ONEIL_CANSLIM = "O'Neil/CANSLIM"

class ResultStatus(Enum):
    PASS = "Pass"
    FAIL = "Fail"
    PENDING = "Pending"

@dataclass
class Criterion:
    id: str
    name: str
    category: CriterionCategory
    description: str

@dataclass
class Company:
    ticker: str
    name: str
    industry: str
    story: str = ""

@dataclass
class CriterionResult:
    criterion_id: str
    status: ResultStatus
    value: Any = None
    notes: str = ""

@dataclass
class InvestmentCandidate:
    company: Company
    results: Dict[str, CriterionResult] = field(default_factory=dict)

    def add_criterion_result(self, result: CriterionResult):
        self.results[result.criterion_id] = result

    def get_criterion_result(self, criterion_id: str) -> CriterionResult:
        return self.results.get(criterion_id)
