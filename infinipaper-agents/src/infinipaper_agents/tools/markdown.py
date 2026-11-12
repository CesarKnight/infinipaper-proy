import re
from collections import Counter

from infinipaper_agents.schemas import ValidationIssue, ValidationReport

HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", re.MULTILINE)
FENCE_RE = re.compile(r"^```", re.MULTILINE)
LINK_RE = re.compile(r"https?://[^\s)\]>]+")
WORD_RE = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]{4,}")


def strip_json_fences(text: str) -> str:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```[a-zA-Z0-9_-]*\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)
    return cleaned.strip()


def analyze_markdown(text: str) -> dict:
    headings = [
        {"level": len(match.group(1)), "text": match.group(2).strip()}
        for match in HEADING_RE.finditer(text)
    ]
    links = sorted(set(LINK_RE.findall(text)))
    duplicate_headings = [
        heading
        for heading, count in Counter(
            item["text"].lower() for item in headings
        ).items()
        if count > 1
    ]
    return {
        "heading_count": len(headings),
        "headings": headings,
        "fence_count": len(FENCE_RE.findall(text)),
        "links": links,
        "word_count": len(re.findall(r"\S+", text)),
        "duplicate_headings": duplicate_headings,
    }


def _heading_issues(text: str) -> list[ValidationIssue]:
    headings = [
        len(match.group(1)) for match in HEADING_RE.finditer(text)
    ]
    issues: list[ValidationIssue] = []
    if not headings:
        issues.append(
            ValidationIssue(
                code="NO_HEADINGS",
                message="El resultado no contiene encabezados Markdown",
            )
        )
        return issues

    if headings[0] != 1:
        issues.append(
            ValidationIssue(
                code="INVALID_HEADING_START",
                message="El documento debe comenzar con un encabezado H1",
            )
        )

    previous = headings[0]
    for level in headings[1:]:
        if level > previous + 1:
            issues.append(
                ValidationIssue(
                    code="INVALID_HEADING_JUMP",
                    message=f"Salto de encabezado inválido: H{previous} → H{level}",
                )
            )
            break
        previous = level
    return issues


def validate_markdown(original: str, candidate: str) -> ValidationReport:
    issues = _heading_issues(candidate)

    if len(FENCE_RE.findall(candidate)) % 2 != 0:
        issues.append(
            ValidationIssue(
                code="UNCLOSED_CODE_FENCE",
                message="Hay un bloque de código sin cerrar",
            )
        )

    missing_links = sorted(
        set(LINK_RE.findall(original)) - set(LINK_RE.findall(candidate))
    )
    if missing_links:
        issues.append(
            ValidationIssue(
                code="MISSING_LINK",
                message=f"Se perdieron {len(missing_links)} enlaces del original",
                severity="warning",
            )
        )

    original_words = set(WORD_RE.findall(original.lower()))
    candidate_words = set(WORD_RE.findall(candidate.lower()))
    coverage = (
        len(original_words & candidate_words) / len(original_words)
        if original_words
        else 1.0
    )
    if coverage < 0.7:
        issues.append(
            ValidationIssue(
                code="LOW_COVERAGE",
                message=f"La cobertura del contenido original es baja ({coverage:.0%})",
                severity="warning",
            )
        )

    hard_errors = [issue for issue in issues if issue.severity == "error"]
    return ValidationReport(
        valid=not hard_errors,
        coverage=round(coverage, 4),
        issues=issues,
    )
