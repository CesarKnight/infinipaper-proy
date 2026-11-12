from functools import partial

from langchain_core.language_models import BaseChatModel
from langgraph.graph import END, START, StateGraph

from infinipaper_agents.config import Settings
from infinipaper_agents.graph.nodes import (
    Fetcher,
    NodeContext,
    aggregate_context,
    extract_markdown,
    finalize,
    load_request,
    plan_outline,
    repair,
    route_decision,
    route_sources,
    structure_note,
    unsupported,
    validate,
    validate_decision,
)
from infinipaper_agents.graph.state import GraphState
from infinipaper_agents.tools.fetch import fetch_source


def build_graph(
    settings: Settings,
    model: BaseChatModel,
    fetcher: Fetcher | None = None,
):
    ctx = NodeContext(
        settings=settings,
        model=model,
        fetcher=fetcher
        or (lambda source: fetch_source(source, settings.max_input_chars)),
    )

    workflow = StateGraph(GraphState)
    workflow.add_node("load_request", partial(load_request, ctx=ctx))
    workflow.add_node("route_sources", partial(route_sources, ctx=ctx))
    workflow.add_node("unsupported", partial(unsupported, ctx=ctx))
    workflow.add_node("extract_markdown", partial(extract_markdown, ctx=ctx))
    workflow.add_node("aggregate_context", partial(aggregate_context, ctx=ctx))
    workflow.add_node("plan_outline", partial(plan_outline, ctx=ctx))
    workflow.add_node("structure_note", partial(structure_note, ctx=ctx))
    workflow.add_node("validate", partial(validate, ctx=ctx))
    workflow.add_node("repair", partial(repair, ctx=ctx))
    workflow.add_node("finalize", partial(finalize, ctx=ctx))

    workflow.add_edge(START, "load_request")
    workflow.add_edge("load_request", "route_sources")
    workflow.add_conditional_edges(
        "route_sources",
        route_decision,
        {
            "markdown": "extract_markdown",
            "unsupported": "unsupported",
        },
    )
    workflow.add_edge("unsupported", END)
    workflow.add_edge("extract_markdown", "aggregate_context")
    workflow.add_edge("aggregate_context", "plan_outline")
    workflow.add_edge("plan_outline", "structure_note")
    workflow.add_edge("structure_note", "validate")
    workflow.add_conditional_edges(
        "validate",
        partial(validate_decision, ctx=ctx),
        {
            "ok": "finalize",
            "retry": "repair",
            "fail": "finalize",
        },
    )
    workflow.add_edge("repair", "validate")
    workflow.add_edge("finalize", END)

    return workflow.compile()
