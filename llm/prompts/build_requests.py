"""Regenerates llm/prompts/*.request.json from llm/schemas/*.schema.json.

Run this after editing any schema in llm/schemas/, so the tool input_schema
embedded in each request package never drifts from the source of truth.

Usage: python llm/prompts/build_requests.py   (from the repo root, or anywhere)
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SCHEMA_DIR = os.path.normpath(os.path.join(HERE, "..", "schemas"))
OUT_DIR = HERE

COMMON_RULES = """RULES (apply to every field):
1. Use only information explicitly present in the Grant Agreement text below. Never infer, guess, or use outside/general knowledge about this project.
2. Any field you cannot find a value for in the text must be set to the literal string "tbd" (for arrays with nothing found, return an empty array [] — not an array containing "tbd"). Do not fabricate a plausible-looking value under any circumstance.
3. Express all schedules/durations as month numbers relative to project start (M1, M2, ...) exactly as the Grant Agreement does. Never invent or convert to calendar dates yourself.
4. Copy IDs, codes and enum values (WP1, T1.1, D2.3, MS1, PU, SEN, R, DEC, [C6.1], ...) verbatim as they appear in the source text.
5. Respond ONLY by calling the provided tool with arguments matching its input_schema. Do not add any prose before or after the tool call.
"""

INFO_SYSTEM = f"""You are the extraction engine for VILABS' GA Exporter tool. You receive the full text of an EU Horizon Europe/Euratom Grant Agreement (Preamble, Terms & Conditions, Data Sheet, Annex 1 Part A and Part B), already converted from PDF to Markdown, and must extract the fields needed to fill VILABS' internal "INFO" project document.

{COMMON_RULES}
FIELD-SPECIFIC GUIDANCE:
- ownEntity is NOT given to you — you must find it yourself. Scan the Preamble and the Data Sheet §2 "List of participants" table for the participant whose legal name or short name contains "VILABS" (case-insensitive), regardless of country or legal suffix (it may appear as "VILABS (CY) LTD", "VILABS OE", a Bulgarian entity, etc.). Use that row's PIC, country and role (COO/BEN). If no such participant exists in this Grant Agreement, set every ownEntity sub-field to "tbd".
- coordinator is the participant with role "COO" in the same participants table (this is a different entity from ownEntity unless VILABS itself is the coordinator).
- website / socialMedia / repository / mailingLists never appear in a Grant Agreement — check the text anyway, but expect "tbd" for all of them.
- duration and reportingPeriods come from Data Sheet §1 (General data) and §4.2 (Periodic reporting and payments schedule table).
- workPackages and their tasks come from Annex 1 Part A "List of work packages" and the per-WP task descriptions (Objectives/Description sections), which state each task's leader and month range.
- ownEffortSummary: 1-3 sentences, written from ownEntity's perspective, summarizing which WPs/tasks ownEntity leads or is assigned to (mirror the style of "<short name> leads WPx and is assigned to all WPs and Tasks of the Project, except WPy"). "tbd" if the text gives no WP-level detail for ownEntity specifically.
- roles: only include named individuals if the Grant Agreement's consortium/coordinator description (Annex 1 Part B, typically §3.2.1 "Coordinator" and/or advisory board) explicitly names people affiliated with ownEntity. Do NOT attribute another beneficiary's named staff (e.g. the coordinator's Project Manager) to ownEntity. If nobody is named for ownEntity, return an empty array.
"""

GANTT_SYSTEM = f"""You are the extraction engine for VILABS' GA Exporter tool. You receive the full text of an EU Horizon Europe/Euratom Grant Agreement (Preamble, Terms & Conditions, Data Sheet, Annex 1 Part A), already converted from PDF to Markdown, and must extract the project's full work plan (work packages, tasks, deliverables, milestones, reporting periods) to fill a Gantt chart Excel workbook.

{COMMON_RULES}
FIELD-SPECIFIC GUIDANCE:
- totalMonths and projectStartDate come from the Data Sheet §1 (project duration / starting date).
- reportingPeriods come from the Data Sheet §4.2 reporting schedule table.
- workPackages, and each WP's tasks (with their own month ranges and leaders where stated), come from Annex 1 Part A "List of work packages" plus the per-WP "Description" sections.
- deliverables come from Annex 1 Part A "List of deliverables" — copy id, title, WP, lead beneficiary short name, type code and dissemination level code verbatim, and dueDate as a plain month number.
- milestones come from Annex 1 Part A "List of milestones" — copy id, name, WP, lead beneficiary, "Means of Verification" and due month verbatim.
- workPackages[].milestoneIds: for each milestone, note which WP its "Work Package No" column points to, and add that milestone's id to that WP's milestoneIds array.
- This is a project-wide document, not tied to any single beneficiary — do not filter work packages/tasks/deliverables/milestones by who leads them.
"""

KPI_SYSTEM = f"""You are the extraction engine for VILABS' GA Exporter tool. You receive the full text of an EU Horizon Europe/Euratom Grant Agreement (Preamble, Terms & Conditions, Data Sheet, Annex 1 Part A and Part B), already converted from PDF to Markdown, and must extract every quantified or qualitatively-scaled impact/communication/dissemination indicator to seed a KPI monitoring Excel workbook. The Grant Agreement is a planning document — it only ever states targets, never progress, so 'achieved' and 'monthlyValues' are always empty placeholders you fill mechanically (never extracted from the text).

{COMMON_RULES}
FIELD-SPECIFIC GUIDANCE:
- Source material is Annex 1 Part B, typically §2 "Impact" (each "EXPECTED OUTCOME"/"EXPECTED Impact" block's "Scale:"/"Significance:" bullet points, which state numeric targets like ">1000 followers", "10 innovators benefited", "2 knowledge sharing workshops") and §2.2 "Measures to maximise impact" (any Communication/Dissemination Indicators table, e.g. one listing TOOL / Indicator(s) / values).
- Every indicator with a stated target/scale number becomes one entry in categories[].kpis[]. Set target to the target text verbatim (keep qualifiers like "Y1:", ">", "≥"). Set code to the indicator's bracket code (e.g. "[C6.1]", "[D1]") if the surrounding text carries one, otherwise omit code.
- Group indicators into categories the way the Grant Agreement itself groups them (e.g. one category per Expected Outcome/Impact block, or by communication channel/tool if a dedicated indicators table exists) — do not force them into a fixed, predetermined set of category names; name each category descriptively based on what the source text actually groups together.
- achieved is always 0 and monthlyValues is always an array of exactly totalMonths null values — you compute these mechanically, you do not read them from the text.
- totalMonths and projectStartDate come from the Data Sheet §1 (project duration / starting date).
"""

USER_TEMPLATE = "Grant Agreement (parsed to Markdown):\n\n{{grant_agreement_markdown}}"

TOOLS = {
    "info": {
        "name": "generate_info_json",
        "description": "Return the structured INFO document data extracted from the Grant Agreement, matching the given schema exactly.",
    },
    "gantt": {
        "name": "generate_gantt_json",
        "description": "Return the structured Gantt chart data (work packages, tasks, deliverables, milestones, reporting periods) extracted from the Grant Agreement, matching the given schema exactly.",
    },
    "kpi": {
        "name": "generate_kpi_json",
        "description": "Return the structured KPI monitoring data (categories of impact/communication/dissemination indicators with their targets) extracted from the Grant Agreement, matching the given schema exactly.",
    },
}

SYSTEMS = {"info": INFO_SYSTEM, "gantt": GANTT_SYSTEM, "kpi": KPI_SYSTEM}


def main():
    for name in ["info", "gantt", "kpi"]:
        with open(os.path.join(SCHEMA_DIR, f"{name}.schema.json"), encoding="utf-8") as f:
            schema = json.load(f)
        schema.pop("$schema", None)
        schema.pop("$id", None)

        package = {
            "$comment": (
                f"Ready-to-send Anthropic Messages API request pieces for "
                f"generate{name.capitalize()}Json(). Backend substitutes "
                f"{{{{grant_agreement_markdown}}}} in user_message.content with the "
                f"parsed GA markdown, then sends: {{model, system, tools: [tool], "
                f"tool_choice: {{type:'tool', name: tool.name}}, messages: [user_message]}}. "
                f"Regenerate with build_requests.py after editing the schema."
            ),
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 8192,
            "system": SYSTEMS[name].strip(),
            "tools": [
                {
                    "name": TOOLS[name]["name"],
                    "description": TOOLS[name]["description"],
                    "input_schema": schema,
                }
            ],
            "tool_choice": {"type": "tool", "name": TOOLS[name]["name"]},
            "user_message": {"role": "user", "content": USER_TEMPLATE},
        }

        out_path = os.path.join(OUT_DIR, f"{name}.request.json")
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(package, f, ensure_ascii=False, indent=2)
        print("wrote", out_path)


if __name__ == "__main__":
    main()
