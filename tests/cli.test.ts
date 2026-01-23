/**
 * Tests for RiotPlan CLI
 */

import { describe, it, expect } from "vitest";
import { createProgram } from "../src/cli/cli.js";

describe("CLI", () => {
    describe("program setup", () => {
        it("should create program with correct name", () => {
            const program = createProgram();
            expect(program.name()).toBe("riotplan");
        });

        it("should have version", () => {
            const program = createProgram();
            expect(program.version()).toBe("0.0.4");
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
