/**
 * Prime protocol injector.
 *
 * Appends ~/.pi/agent/PRIME.md to the system prompt of MAIN sessions only,
 * so every pi session runs as "prime" — an orchestrator that works through
 * the subagent swarm instead of doing everything itself (see agents/prime.md).
 *
 * Subagent children must NOT receive the protocol: a scout told to delegate
 * stops doing work. Injection is skipped when the process is a child:
 *   1. pane children run with PI_SUBAGENT_SESSION set by the subagents launcher;
 *   2. headless (task_batch) children always receive an agent identity via
 *      --append-system-prompt → systemPromptOptions.appendSystemPrompt;
 *   3. tool-allowlisted children have no `subagent` tool at all → selectedTools.
 * All three guards are checked — belt and suspenders. If the protocol file is
 * missing or empty, the extension is a harmless no-op.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const PROTOCOL_PATH = join(getAgentDir(), "PRIME.md");

export default function primeProtocol(pi: ExtensionAPI) {
	pi.on("before_agent_start", (event) => {
		// Guard 1: pane-based subagent children.
		if (process.env.PI_SUBAGENT_SESSION) return;

		// Guard 2: headless children — they always carry an identity prompt.
		const append = event.systemPromptOptions?.appendSystemPrompt;
		if (append && append.trim().length > 0) return;

		// Guard 3: no subagent tool → nothing to orchestrate with.
		const tools = event.systemPromptOptions?.selectedTools ?? [];
		if (tools.length > 0 && !tools.includes("subagent")) return;

		if (!existsSync(PROTOCOL_PATH)) return;
		let protocol: string;
		try {
			protocol = readFileSync(PROTOCOL_PATH, "utf8").trim();
		} catch {
			return;
		}
		if (!protocol) return;

		return { systemPrompt: `${event.systemPrompt}\n\n${protocol}` };
	});
}
