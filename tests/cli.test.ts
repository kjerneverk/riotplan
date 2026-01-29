/**
 * Tests for RiotPlan CLI
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createProgram } from "../src/cli/cli.js";

// Read version from package.json to match CLI behavior
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
    readFileSync(join(__dirname, "../package.json"), "utf-8")
);
const EXPECTED_VERSION = packageJson.version;

describe("CLI", () => {
    describe("program setup", () => {
        it("should create program with correct name", () => {
            const program = createProgram();
            expect(program.name()).toBe("riotplan");
        });

        it("should have version", () => {
            const program = createProgram();
            expect(program.version()).toBe(EXPECTED_VERSION);
        });

        it("should have description", () => {
            const program = createProgram();
            expect(program.description()).toContain("workflow");
        });
    });

    describe("command groups", () => {
        it("should have plan command group", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("plan");
        });

        it("should have status command", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("status");
        });

        it("should have step command group", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("step");
        });

        it("should have feedback command group", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("feedback");
        });
    });

    describe("plan subcommands", () => {
        it("should have init subcommand", () => {
            const program = createProgram();
            const planCmd = program.commands.find((c) => c.name() === "plan");
            expect(planCmd).toBeDefined();

            const subcommands = planCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("init");
        });

        it("should have validate subcommand", () => {
            const program = createProgram();
            const planCmd = program.commands.find((c) => c.name() === "plan");
            expect(planCmd).toBeDefined();

            const subcommands = planCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("validate");
        });
    });

    describe("step subcommands", () => {
        it("should have list subcommand", () => {
            const program = createProgram();
            const stepCmd = program.commands.find((c) => c.name() === "step");
            expect(stepCmd).toBeDefined();

            const subcommands = stepCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("list");
        });

        it("should have add subcommand", () => {
            const program = createProgram();
            const stepCmd = program.commands.find((c) => c.name() === "step");
            expect(stepCmd).toBeDefined();

            const subcommands = stepCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("add");
        });

        it("should have start subcommand", () => {
            const program = createProgram();
            const stepCmd = program.commands.find((c) => c.name() === "step");
            expect(stepCmd).toBeDefined();

            const subcommands = stepCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("start");
        });

        it("should have complete subcommand", () => {
            const program = createProgram();
            const stepCmd = program.commands.find((c) => c.name() === "step");
            expect(stepCmd).toBeDefined();

            const subcommands = stepCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("complete");
        });

        it("should have block subcommand", () => {
            const program = createProgram();
            const stepCmd = program.commands.find((c) => c.name() === "step");
            expect(stepCmd).toBeDefined();

            const subcommands = stepCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("block");
        });

        it("should have unblock subcommand", () => {
            const program = createProgram();
            const stepCmd = program.commands.find((c) => c.name() === "step");
            expect(stepCmd).toBeDefined();

            const subcommands = stepCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("unblock");
        });

        it("should have skip subcommand", () => {
            const program = createProgram();
            const stepCmd = program.commands.find((c) => c.name() === "step");
            expect(stepCmd).toBeDefined();

            const subcommands = stepCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("skip");
        });
    });

    describe("feedback subcommands", () => {
        it("should have create subcommand", () => {
            const program = createProgram();
            const feedbackCmd = program.commands.find(
                (c) => c.name() === "feedback"
            );
            expect(feedbackCmd).toBeDefined();

            const subcommands = feedbackCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("create");
        });

        it("should have list subcommand", () => {
            const program = createProgram();
            const feedbackCmd = program.commands.find(
                (c) => c.name() === "feedback"
            );
            expect(feedbackCmd).toBeDefined();

            const subcommands = feedbackCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("list");
        });

        it("should have show subcommand", () => {
            const program = createProgram();
            const feedbackCmd = program.commands.find(
                (c) => c.name() === "feedback"
            );
            expect(feedbackCmd).toBeDefined();

            const subcommands = feedbackCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("show");
        });
    });

    describe("elaborate command", () => {
        it("should have elaborate command", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("elaborate");
        });

        it("should have message option", () => {
            const program = createProgram();
            const elaborateCmd = program.commands.find((c) => c.name() === "elaborate");
            expect(elaborateCmd).toBeDefined();

            const options = elaborateCmd!.options.map((o) => o.long);
            expect(options).toContain("--message");
        });
    });

    describe("amend command", () => {
        it("should have amend command", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("amend");
        });

        it("should have message option", () => {
            const program = createProgram();
            const amendCmd = program.commands.find((c) => c.name() === "amend");
            expect(amendCmd).toBeDefined();

            const options = amendCmd!.options.map((o) => o.long);
            expect(options).toContain("--message");
        });

        it("should have step option", () => {
            const program = createProgram();
            const amendCmd = program.commands.find((c) => c.name() === "amend");
            expect(amendCmd).toBeDefined();

            const options = amendCmd!.options.map((o) => o.long);
            expect(options).toContain("--step");
        });
    });

    describe("amendments command", () => {
        it("should have amendments command group", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("amendments");
        });

        it("should have list subcommand", () => {
            const program = createProgram();
            const amendmentsCmd = program.commands.find((c) => c.name() === "amendments");
            expect(amendmentsCmd).toBeDefined();

            const subcommands = amendmentsCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("list");
        });
    });

    describe("generate command", () => {
        it("should have generate command", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("generate");
        });

        it("should have steps option", () => {
            const program = createProgram();
            const generateCmd = program.commands.find((c) => c.name() === "generate");
            expect(generateCmd).toBeDefined();

            const options = generateCmd!.options.map((o) => o.long);
            expect(options).toContain("--steps");
        });

        it("should have force option", () => {
            const program = createProgram();
            const generateCmd = program.commands.find((c) => c.name() === "generate");
            expect(generateCmd).toBeDefined();

            const options = generateCmd!.options.map((o) => o.long);
            expect(options).toContain("--force");
        });
    });

    describe("analysis command", () => {
        it("should have analysis command group", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("analysis");
        });

        it("should have show subcommand", () => {
            const program = createProgram();
            const analysisCmd = program.commands.find((c) => c.name() === "analysis");
            expect(analysisCmd).toBeDefined();

            const subcommands = analysisCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("show");
        });

        it("should have ready subcommand", () => {
            const program = createProgram();
            const analysisCmd = program.commands.find((c) => c.name() === "analysis");
            expect(analysisCmd).toBeDefined();

            const subcommands = analysisCmd!.commands.map((c) => c.name());
            expect(subcommands).toContain("ready");
        });
    });

    describe("create command", () => {
        it("should have create command", () => {
            const program = createProgram();
            const commands = program.commands.map((c) => c.name());
            expect(commands).toContain("create");
        });

        it("should have direct option", () => {
            const program = createProgram();
            const createCmd = program.commands.find((c) => c.name() === "create");
            expect(createCmd).toBeDefined();

            const options = createCmd!.options.map((o) => o.long);
            expect(options).toContain("--direct");
        });

        it("should have analyze option", () => {
            const program = createProgram();
            const createCmd = program.commands.find((c) => c.name() === "create");
            expect(createCmd).toBeDefined();

            const options = createCmd!.options.map((o) => o.long);
            expect(options).toContain("--analyze");
        });

        it("should have path option", () => {
            const program = createProgram();
            const createCmd = program.commands.find((c) => c.name() === "create");
            expect(createCmd).toBeDefined();

            const options = createCmd!.options.map((o) => o.long);
            expect(options).toContain("--path");
        });

        it("should accept optional name argument", () => {
            const program = createProgram();
            const createCmd = program.commands.find((c) => c.name() === "create");
            expect(createCmd).toBeDefined();
            expect(createCmd!.usage()).toContain("[name]");
        });
    });

    describe("global options", () => {
        it("should have verbose option", () => {
            const program = createProgram();
            const options = program.options.map((o) => o.long);
            expect(options).toContain("--verbose");
        });

        it("should have json option", () => {
            const program = createProgram();
            const options = program.options.map((o) => o.long);
            expect(options).toContain("--json");
        });

        it("should have no-color option", () => {
            const program = createProgram();
            const options = program.options.map((o) => o.long);
            expect(options).toContain("--no-color");
        });
    });
});
