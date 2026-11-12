from infinipaper_agents.tools.markdown import (
    analyze_markdown,
    strip_json_fences,
    validate_markdown,
)


def test_analyze_markdown_detects_structure() -> None:
    text = (
        "# Tema\n\n"
        "## Resumen\n\n"
        "Ver https://example.com/fuente\n\n"
        "```python\nprint('hola')\n```\n"
    )
    stats = analyze_markdown(text)
    assert stats["heading_count"] == 2
    assert stats["fence_count"] == 2
    assert stats["links"] == ["https://example.com/fuente"]
    assert stats["duplicate_headings"] == []


def test_validate_markdown_accepts_valid_result() -> None:
    original = (
        "# Tema\n\n"
        "La fotosíntesis convierte la luz solar en energía química.\n"
        "https://example.com/fuente\n\n"
        "```python\nprint('hola')\n```\n\n"
        "Conceptos: clorofila, glucosa, oxígeno."
    )
    candidate = (
        "# Tema\n\n"
        "## Resumen\n"
        "La fotosíntesis convierte la luz solar en energía química.\n\n"
        "## Conceptos clave\n"
        "- clorofila\n- glucosa\n- oxígeno\n\n"
        "## Referencias\n"
        "https://example.com/fuente\n\n"
        "```python\nprint('hola')\n```\n"
    )
    report = validate_markdown(original, candidate)
    assert report.valid is True
    assert report.coverage > 0.7


def test_validate_markdown_detects_unclosed_fence() -> None:
    report = validate_markdown("# Tema\n\nTexto", "# Tema\n\n```python\nprint('x')")
    assert report.valid is False
    assert any(issue.code == "UNCLOSED_CODE_FENCE" for issue in report.issues)


def test_validate_markdown_warns_about_missing_links() -> None:
    report = validate_markdown(
        "# Tema\n\nhttps://example.com/fuente",
        "# Tema\n\n## Resumen\nTexto sin enlace",
    )
    assert any(issue.code == "MISSING_LINK" for issue in report.issues)


def test_strip_json_fences() -> None:
    assert strip_json_fences('```json\n{"ok":true}\n```') == '{"ok":true}'
