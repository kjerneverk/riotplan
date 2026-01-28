/**
 * AI Plan Generator
 * 
 * Generates plan content using LLM providers
 */

import type { Provider, Request, ExecutionOptions } from '../types.js';

export interface GeneratedPlan {
    summary: string;
    approach: string;
    successCriteria: string;
    steps: GeneratedStep[];
}

export interface GeneratedStep {
    number: number;
    title: string;
    objective: string;
    background: string;
    tasks: GeneratedTask[];
    acceptanceCriteria: string[];
    testing: string;
    filesChanged: string[];
    notes: string;
}

export interface GeneratedTask {
    id: string;
    description: string;
}

export interface GenerationContext {
    planName: string;
    description: string;
    elaborations?: string[];
    stepCount?: number;
}

/**
 * Generate a plan using AI
 */
export async function generatePlan(
    context: GenerationContext,
    provider: Provider,
    options: ExecutionOptions = {}
): Promise<GeneratedPlan> {
    const prompt = buildPlanPrompt(context);
    
    const request: Request = {
        model: options.model || 'claude-sonnet-4-5',
        messages: [
            {
                role: 'system',
                content: SYSTEM_PROMPT,
            },
            {
                role: 'user',
                content: prompt,
            },
        ],
        responseFormat: {
            type: 'json_schema',
            json_schema: {
                name: 'plan_generation',
                description: 'Generate a detailed execution plan',
                schema: {
                    type: 'object',
                    properties: {
                        summary: { type: 'string' },
                        approach: { type: 'string' },
                        successCriteria: { type: 'string' },
                        steps: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    number: { type: 'number' },
                                    title: { type: 'string' },
                                    objective: { type: 'string' },
                                    background: { type: 'string' },
                                    tasks: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                id: { type: 'string' },
                                                description: { type: 'string' },
                                            },
                                            required: ['id', 'description'],
                                        },
                                    },
                                    acceptanceCriteria: {
                                        type: 'array',
                                        items: { type: 'string' },
                                    },
                                    testing: { type: 'string' },
                                    filesChanged: {
                                        type: 'array',
                                        items: { type: 'string' },
                                    },
                                    notes: { type: 'string' },
                                },
                                required: ['number', 'title', 'objective', 'background', 'tasks', 'acceptanceCriteria', 'testing', 'filesChanged', 'notes'],
                            },
                        },
                    },
                    required: ['summary', 'approach', 'successCriteria', 'steps'],
                },
            },
        },
        addMessage: function(message) {
            this.messages.push(message);
        },
    };

    const response = await provider.execute(request, options);
    
    return parsePlanResponse(response.content, context.stepCount || 5);
}

const SYSTEM_PROMPT = `You are an expert project planner and software architect. Your role is to analyze project requirements and create detailed, actionable execution plans.

When creating a plan:
1. Break down the work into clear, sequential steps
2. Provide specific, actionable tasks for each step
3. Define measurable acceptance criteria
4. Consider dependencies and ordering
5. Be concrete and specific, not vague or generic
6. Think about testing and verification at each stage

CRITICAL: You must output ONLY valid JSON. Do not include any text before or after the JSON object. Ensure all strings are properly escaped.`;

function buildPlanPrompt(context: GenerationContext): string {
    let prompt = `Create a detailed execution plan for the following project:

**Project Name**: ${context.planName}

**Description**:
${context.description}
`;

    if (context.elaborations && context.elaborations.length > 0) {
        prompt += `\n**Additional Context**:\n`;
        context.elaborations.forEach((elab, i) => {
            prompt += `\n${i + 1}. ${elab}\n`;
        });
    }

    prompt += `\n**Requirements**:
- Generate ${context.stepCount || 5} steps
- Each step should be focused and achievable
- Provide specific tasks, not generic placeholders
- Include concrete acceptance criteria
- Consider what files or components will be affected

Please provide:
1. Executive Summary (2-3 paragraphs explaining what this plan accomplishes)
2. Approach (how you'll tackle this work, key decisions)
3. Success Criteria (how we'll know the project is complete)
4. Detailed steps with:
   - Step title
   - Objective (what this step accomplishes)
   - Background (context needed)
   - Tasks (specific actions to take)
   - Acceptance criteria (how to verify completion)
   - Testing approach
   - Files that will be changed
   - Any notes or considerations

IMPORTANT: Output ONLY the JSON object below, with no markdown formatting, no code blocks, no additional text. Ensure all strings use proper JSON escaping for quotes and newlines.

JSON structure:
{
  "summary": "executive summary text",
  "approach": "approach description",
  "successCriteria": "success criteria description",
  "steps": [
    {
      "number": 1,
      "title": "Step Title",
      "objective": "what this step accomplishes",
      "background": "context and prerequisites",
      "tasks": [
        {"id": "01.1", "description": "specific task"},
        {"id": "01.2", "description": "another task"}
      ],
      "acceptanceCriteria": ["criterion 1", "criterion 2"],
      "testing": "how to verify this step",
      "filesChanged": ["file1.ts", "file2.ts"],
      "notes": "additional notes"
    }
  ]
}`;

    return prompt;
}

/**
 * Parse the LLM response into a structured plan
 */
function parsePlanResponse(content: string, _stepCount: number): GeneratedPlan {
    try {
        // Try to extract JSON from markdown code blocks if present
        let jsonContent = content.trim();
        
        // Remove markdown code blocks
        // Use indexOf to avoid polynomial regex
        const startMarker = jsonContent.indexOf('```');
        if (startMarker !== -1) {
            const endMarker = jsonContent.indexOf('```', startMarker + 3);
            if (endMarker !== -1) {
                jsonContent = jsonContent.substring(startMarker + 3, endMarker).trim();
                // Remove optional language identifier (json)
                if (jsonContent.startsWith('json')) {
                    jsonContent = jsonContent.substring(4).trim();
                }
            }
        }
        
        // Try to find JSON object (first { to last })
        const firstBrace = jsonContent.indexOf('{');
        const lastBrace = jsonContent.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonContent = jsonContent.substring(firstBrace, lastBrace + 1);
        }
        
        let parsed;
        try {
            parsed = JSON.parse(jsonContent);
        } catch {
            // If JSON parsing fails, try to clean up common issues
            jsonContent = jsonContent
                .replace(/\n/g, '\\n')  // Escape newlines
                .replace(/\t/g, '\\t')  // Escape tabs
                .replace(/\r/g, '\\r'); // Escape carriage returns
            
            parsed = JSON.parse(jsonContent);
        }
        
        // Validate structure
        if (!parsed.summary || !parsed.approach || !parsed.successCriteria || !parsed.steps) {
            throw new Error('Invalid plan structure: missing required fields');
        }
        
        // Ensure we have the right number of steps
        // Note: AI may generate different number of steps than requested
        
        return parsed as GeneratedPlan;
    } catch (error) {
        throw new Error(`Failed to parse plan response: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Format a generated plan into markdown content for SUMMARY.md
 */
export function formatSummary(plan: GeneratedPlan, planName: string): string {
    const title = planName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    return `# ${title} - Summary

## Executive Summary

${plan.summary}

## Approach

${plan.approach}

## Success Criteria

${plan.successCriteria}
`;
}

/**
 * Format step into markdown content
 */
export function formatStep(step: GeneratedStep): string {
    const num = String(step.number).padStart(2, '0');
    
    let content = `# Step ${num}: ${step.title}

## Objective

${step.objective}

## Background

${step.background}

## Tasks

`;

    step.tasks.forEach(task => {
        content += `### ${task.id} ${task.description}\n\n`;
    });

    content += `## Acceptance Criteria

`;
    step.acceptanceCriteria.forEach(criterion => {
        content += `- [ ] ${criterion}\n`;
    });

    content += `\n## Testing

${step.testing}

## Files Changed

`;
    step.filesChanged.forEach(file => {
        content += `- ${file}\n`;
    });

    if (step.notes) {
        content += `\n## Notes

${step.notes}
`;
    }

    return content;
}
