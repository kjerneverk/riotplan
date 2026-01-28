/**
 * RiotPlan Templates
 *
 * Starter templates for creating new plans.
 */

export {
    TEMPLATE_REGISTRY,
    getTemplate,
    listTemplates,
    type PlanTemplate,
} from "./registry.js";
export {
    applyTemplate,
    type ApplyTemplateOptions,
    type ApplyTemplateResult,
} from "./apply.js";
export {
    BasicTemplate,
    FeatureTemplate,
    RefactoringTemplate,
    MigrationTemplate,
    SprintTemplate,
} from "./templates/index.js";

/** Version */
export const VERSION = "0.0.1";
