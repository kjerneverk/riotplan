/**
 * Template Application
 *
 * Apply a template to create a new plan.
 */

import { createPlan, type CreatePlanConfig } from "../plan/creator.js";
import { getTemplate, type PlanTemplate } from "./registry.js";

/**
 * Options for applying a template
 */
export interface ApplyTemplateOptions {
  /** Template ID to apply */
  templateId: string;

  /** Plan code (directory name) */
  code: string;

  /** Plan display name */
  name: string;

  /** Base path to create the plan in */
  basePath: string;

  /** Custom description (overrides template) */
  description?: string;

  /** Variable substitutions for template content */
  variables?: Record<string, string>;

  /** Additional tags to add */
  tags?: string[];
}

/**
 * Result of applying a template
 */
export interface ApplyTemplateResult {
  /** Whether application succeeded */
  success: boolean;

  /** Path to created plan */
  path?: string;

  /** Template that was applied */
  template?: PlanTemplate;

  /** Error message if failed */
  error?: string;
}

/**
 * Apply a template to create a new plan
 */
export async function applyTemplate(
    options: ApplyTemplateOptions,
): Promise<ApplyTemplateResult> {
    const { templateId, code, name, basePath, description, variables } = options;

    // Get template
    const template = getTemplate(templateId);
    if (!template) {
        return {
            success: false,
            error: `Template not found: ${templateId}`,
        };
    }

    try {
    // Build plan configuration from template
    // Note: tags are available on template but CreatePlanConfig doesn't support them yet
        const config: CreatePlanConfig = {
            code,
            name,
            basePath,
            description:
        description || substituteVariables(template.description, variables),
            steps: template.steps.map((step) => ({
                title: substituteVariables(step.title, variables),
                description: substituteVariables(step.description, variables),
            })),
        };

        // Create the plan
        const result = await createPlan(config);

        return {
            success: true,
            path: result.path,
            template,
        };
    } catch (error) {
        return {
            success: false,
            error:
        error instanceof Error
            ? error.message
            : "Unknown error applying template",
        };
    }
}

/**
 * Substitute variables in a string
 */
function substituteVariables(
    text: string,
    variables?: Record<string, string>,
): string {
    if (!variables) return text;

    let result = text;
    for (const [key, value] of Object.entries(variables)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return result;
}
