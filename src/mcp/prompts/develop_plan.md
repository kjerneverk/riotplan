# Develop Plan

## Purpose

Guide collaborative refinement of a generated plan through structured feedback capture and narrative evolution. This prompt helps iterate on plans after initial generation, capturing the full evolution of thinking as the plan is refined through conversation.

## When to Use

- After a plan has been generated (via `riotplan_create`)
- User wants to provide feedback on the plan
- Plan needs refinement based on new insights
- Iterating on plan structure or content
- Capturing deliberation and decision-making process

## Workflow

### 1. Review Current Plan

Start by understanding the current plan state:

```typescript
riotplan_status({
  path: "./path/to/plan"
})
```

Read key plan files to understand scope and approach:
- `SUMMARY.md` - Overall goals and scope
- `EXECUTION_PLAN.md` - Strategy and approach
- `STATUS.md` - Current progress
- Individual step files in `plan/` directory

### 2. Gather Feedback Conversationally

Engage the user in natural conversation about the plan. Ask open-ended questions:

- "What aspects of the plan need refinement?"
- "Are there steps that should be added, removed, or reordered?"
- "Is the overall approach right, or should we reconsider?"
- "What specific content needs adjustment?"

**Capture the full conversation**, not just the final feedback. Use narrative chunks to preserve context:

```typescript
riotplan_idea_add_narrative({
  path: "./path/to/plan",
  content: "User expressed concern about the testing approach. They mentioned that integration tests should come before unit tests in their workflow because they want to validate the full system first. This is different from typical TDD but makes sense for their use case of refactoring an existing system.",
  context: "Discussing testing strategy in plan refinement",
  speaker: "assistant"
})
```

### 3. Capture Feedback as Narrative

As the user provides feedback, capture it as narrative chunks in the timeline. This preserves the full conversational context:

```typescript
// Capture user's feedback
riotplan_idea_add_narrative({
  path: "./path/to/plan",
  content: "[User's exact feedback or paraphrased if spoken]",
  speaker: "user",
  context: "Feedback on plan structure"
})

// Capture your understanding and response
riotplan_idea_add_narrative({
  path: "./path/to/plan",
  content: "I understand - you want to reorder the testing steps because integration tests provide more value in your refactoring context. I'll move step 8 (integration tests) before step 7 (unit tests) and update the rationale.",
  speaker: "assistant",
  context: "Responding to feedback"
})
```

### 4. Create Checkpoints at Key Moments

Before making significant changes, create a checkpoint:

```typescript
riotplan_checkpoint_create({
  path: "./path/to/plan",
  name: "before-testing-reorder",
  message: "Captured state before reordering testing steps based on user feedback about integration-first approach"
})
```

Create checkpoints:
- Before structural changes (reordering, adding/removing steps)
- After completing a round of feedback
- When user wants to try a different direction
- At natural stopping points

### 5. Make Changes Based on Feedback

After capturing feedback and creating a checkpoint, make the requested changes:

**For structural changes:**
- Edit `EXECUTION_PLAN.md` if strategy changes
- Add/remove/reorder step files in `plan/` directory
- Update `STATUS.md` step table
- Update step dependencies

**For content changes:**
- Edit specific step files
- Update `SUMMARY.md` if scope changes
- Refine task descriptions and acceptance criteria

**Document what changed:**
```typescript
riotplan_idea_add_narrative({
  path: "./path/to/plan",
  content: "Made the following changes: 1) Reordered steps 7 and 8 (integration tests now come first), 2) Updated EXECUTION_PLAN.md to reflect integration-first testing strategy, 3) Modified step 8 to include rationale for integration-first approach in refactoring context.",
  speaker: "assistant",
  context: "Changes made in response to feedback"
})
```

### 6. Confirm Changes with User

After making changes, confirm with the user:

1. **Summarize what changed**: "I've reordered the testing steps and updated the execution plan to reflect your integration-first approach."

2. **Show key changes**: Reference the specific files or sections that changed

3. **Ask for confirmation**: "Does this address your feedback? Is there anything else you'd like to adjust?"

4. **Capture the confirmation**:
```typescript
riotplan_idea_add_narrative({
  path: "./path/to/plan",
  content: "User confirmed the changes address their feedback. They're satisfied with the new testing order and the updated rationale.",
  speaker: "assistant",
  context: "Confirming changes"
})
```

### 7. Iterate Until Satisfied

Continue the conversation, gathering feedback and making changes until the user is satisfied. The timeline will capture the full evolution of thinking.

### 8. Create Final Checkpoint

When refinement is complete, create a final checkpoint:

```typescript
riotplan_checkpoint_create({
  path: "./path/to/plan",
  name: "refinement-complete",
  message: "Plan refinement complete after incorporating user feedback on testing strategy, step ordering, and content clarity"
})
```

## Key Principles

### 1. Capture Full Conversation

Don't just capture the final feedback - capture the **entire conversation**:
- Questions you ask
- User's responses
- Your understanding and interpretation
- Clarifications and follow-ups
- Decisions and rationale

This creates a rich narrative history that shows **how** the plan evolved, not just **what** changed.

### 2. Use Checkpoints Liberally

Checkpoints are lightweight - create them often:
- Before trying something new
- After completing a round of changes
- At natural stopping points
- When user wants to explore alternatives

They provide recovery points and document the journey.

### 3. Be Conversational

This is a dialogue, not a form. Make it feel natural:
- Ask open-ended questions
- Seek clarification when needed
- Explain your reasoning
- Show your thinking process

### 4. Preserve Context

The narrative chunks preserve context that structured feedback loses:
- **Why** a change was requested
- **How** you understood the feedback
- **What** alternatives were considered
- **When** decisions were made

### 5. Support Exploration

Users may want to try different directions:
- Create checkpoint before exploring
- Capture the exploration in narrative
- If it doesn't work, restore checkpoint
- Try a different approach

The timeline preserves all paths explored, not just the final one.

## Example Conversation

**AI**: "I've reviewed the plan. It has 10 steps covering the full implementation. What feedback do you have?"

**User**: "The overall structure looks good, but I'm concerned about the testing approach. We're refactoring an existing system, so I think integration tests should come before unit tests. We need to validate the full system works before diving into unit-level details."

**AI**: *Captures narrative*
```typescript
riotplan_idea_add_narrative({
  content: "User expressed concern about testing approach. In their refactoring context, integration tests should come before unit tests to validate full system first. This differs from typical TDD but makes sense for their use case.",
  speaker: "assistant",
  context: "Discussing testing strategy"
})
```

**AI**: "That makes sense for a refactoring context. Let me create a checkpoint before making changes, then I'll reorder the testing steps and update the rationale."

*Creates checkpoint*
```typescript
riotplan_checkpoint_create({
  name: "before-testing-reorder",
  message: "Before reordering testing steps based on integration-first feedback"
})
```

**AI**: "I've reordered steps 7 and 8 so integration tests come first. I've also updated the EXECUTION_PLAN.md to explain the integration-first approach for refactoring. Does this address your concern?"

*Captures changes*
```typescript
riotplan_idea_add_narrative({
  content: "Reordered testing steps: integration tests (now step 7) before unit tests (now step 8). Updated execution plan to document integration-first rationale for refactoring context.",
  speaker: "assistant",
  context: "Changes made"
})
```

**User**: "Perfect! One more thing - step 3 mentions 'update the API' but doesn't specify which endpoints. Can you add more detail?"

**AI**: *Captures feedback and makes change*

**User**: "Great! I think we're ready to start executing."

**AI**: *Creates final checkpoint*
```typescript
riotplan_checkpoint_create({
  name: "refinement-complete",
  message: "Plan refinement complete. Reordered testing steps and added API endpoint details."
})
```

## Feedback Types (For Your Understanding)

While you don't need to explicitly categorize feedback, it's helpful to understand the types:

**Structural Feedback** (affects multiple steps):
- Reordering steps
- Adding/removing phases
- Changing overall approach
- Adjusting scope

**Content Feedback** (specific details):
- Clarifying task descriptions
- Adding missing details
- Fixing incorrect information
- Improving acceptance criteria

**Clarification Requests**:
- "What does this mean?"
- "Why this approach?"
- "How does this work?"

All types should be captured as narrative chunks in the conversation flow.

## Anti-Patterns

❌ **Don't**: Make changes without capturing the conversation first
✅ **Do**: Capture user feedback as narrative before making changes

❌ **Don't**: Just capture "User wants X" - that loses context
✅ **Do**: Capture the full reasoning: "User wants X because Y, which makes sense given Z"

❌ **Don't**: Skip checkpoints to save time
✅ **Do**: Create checkpoints before significant changes - they're lightweight and valuable

❌ **Don't**: Assume you understand - ask clarifying questions
✅ **Do**: Confirm your understanding: "So you want X because Y, is that right?"

❌ **Don't**: Only capture the final state
✅ **Do**: Capture the journey - all paths explored, even dead ends

## Transition Criteria

**Continue Developing**: User has more feedback to provide

**Ready to Execute**: User is satisfied with the plan and ready to start execution
- Consider using the `execute_plan` prompt for guided execution

**Back to Shaping**: Feedback reveals the approach needs reconsideration
- Create checkpoint, then use `shape_approach` prompt to explore alternatives

**Pause for Later**: User wants to stop and come back later
- Create checkpoint with current state
- Timeline preserves all context for resuming

## Advanced: Evidence Gathering During Refinement

If feedback reveals need for more information, gather evidence:

```typescript
// User mentions a similar project
riotplan_idea_add_evidence({
  path: "./path/to/plan",
  evidencePath: "/path/to/similar-project",
  description: "User referenced similar project that used integration-first testing successfully",
  source: "user reference"
})

// You search for information
riotplan_idea_add_evidence({
  path: "./path/to/plan",
  evidencePath: "inline",
  content: "[Your web search findings about integration-first testing in refactoring]",
  description: "Research on integration-first testing approaches for legacy system refactoring",
  source: "web search",
  gatheringMethod: "model-assisted"
})
```

## Notes

- Plans use the same `.history/timeline.jsonl` format as ideas
- Narrative chunks work the same way for plans as for ideas
- Checkpoints capture the full plan state (all step files, SUMMARY, EXECUTION_PLAN, STATUS)
- The timeline shows the complete evolution from initial generation through refinement
- This approach creates a rich audit trail of how the plan evolved
- Future enhancements may add automatic checkpoint creation after each feedback round
