/**
 * Custom Header Extension — ALPHA LLC edition
 *
 * Арт взят из nvim-дашборда (alpha-nvim, C:\Users\Ivan\AppData\Local\nvim\init.lua).
 * Футер — цитата из того же дашборда. Чтобы вернуть встроенный хедер:
 * удалить этот файл или выполнить /builtin-header в сессии.
 */

import type { ExtensionAPI, Theme } from "@mariozechner/pi-coding-agent";
import { VERSION } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";

function buildHeader(theme: Theme): string {
	// ── Logo ──────────────────────────────────────────────
	// ALPHA LLC — ANSI-shadow, в точности как в alpha-nvim.

	const art = [
		" █████╗ ██╗     ██████╗ ██╗  ██╗ █████╗   ██╗     ██╗      ██████╗ ",
		"██╔══██╗██║     ██╔══██╗██║  ██║██╔══██╗  ██║     ██║     ██╔════╝ ",
		"███████║██║     ██████╔╝███████║███████║  ██║     ██║     ██║      ",
		"██╔══██║██║     ██╔═══╝ ██╔══██║██╔══██║  ██║     ██║     ██║      ",
		"██║  ██║███████╗██║     ██║  ██║██║  ██║  ███████╗███████╗╚██████╗ ",
		"╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝  ╚══════╝╚══════╝ ╚═════╝ ",
	].map((line) => theme.bold(theme.fg("accent", line))).join("\n");

	const logo =
		"\n" + art + "\n\n" +
		theme.bold(theme.fg("accent", "pi")) +
		theme.fg("dim", ` v${VERSION}`) + "\n" +
		theme.fg("dim", "Talk is cheap. Show me the code. — Linus Torvalds");

	return logo;
}

export default function (pi: ExtensionAPI) {
	pi.on("session_start", async (_event, ctx) => {
		if (!ctx.hasUI) return;

		ctx.ui.setHeader((_tui, theme) => ({
			render(_width: number): string[] {
				return buildHeader(theme).split("\n");
			},
			invalidate() {},
		}));
	});

	// Command to restore the built-in header
	pi.registerCommand("builtin-header", {
		description: "Restore the built-in startup header",
		handler: async (_args, ctx) => {
			ctx.ui.setHeader(undefined);
			ctx.ui.notify("Built-in header restored", "info");
		},
	});
}
