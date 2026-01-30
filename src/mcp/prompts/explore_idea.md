# Explore Idea

## Purpose

Guide collaborative exploration of a new idea without premature commitment. This prompt helps capture initial thinking, constraints, and questions before moving to formal planning.

## When to Use

- User mentions a new concept or feature
- Starting to think about a problem
- Not ready to commit to a full plan yet
- Want to capture thoughts and gather evidence

## Workflow

### 1. Create the Idea

Ask the user for:
- A short code/identifier (kebab-case)
- Initial description of the concept

Create the idea:
```
riotplan_idea_create({
  code: "feature-name",
  description: "Initial concept description"
})
```

### 2. Explore Together

Ask open-ended questions:
- "What's driving this idea?"
- "What constraints should we consider?"
- "What questions need answering?"
- "Do you have any evidence (docs, diagrams, examples)?"

As the user responds, capture their thinking in TWO ways:

**FIRST: Capture the full narrative (preserve the raw conversation)**

When the user provides detailed responses, especially voice transcriptions or long explanations, capture the FULL TEXT as narrative:

```
riotplan_idea_add_narrative({
  content: "[User's complete response, verbatim or paraphrased if spoken]",
  source: "voice",  // or "typing", "paste", "import"
  context: "User explaining document type requirements"
})
```

**THEN: Extract structured information**

After capturing the narrative, extract key points into structured categories:

**For thoughts/notes:**
```
riotplan_idea_add_note({
  note: "User's thought or observation"
})
```

**For constraints:**
```
riotplan_idea_add_constraint({
  constraint: "Must work on mobile"
})
```

**For questions:**
```
riotplan_idea_add_question({
  question: "How will this integrate with existing API?"
})
```

**For evidence:**
```
riotplan_idea_add_evidence({
  evidencePath: "./path/to/diagram.png",
  description: "Architecture diagram showing current state"
})
```

**Why Both?**
- Narrative preserves full context and nuance
- Structured data makes information actionable
- Timeline shows both the conversation and the decisions

### 3. Decide Next Steps

After exploration, ask:
- "Does this feel worth pursuing?"
- "Are we ready to explore different approaches?" (→ shaping)
- "Should we set this aside for now?" (→ kill)

**If ready to shape:**
```
riotplan_shaping_start()
```

**If not viable:**
```
riotplan_idea_kill({
  reason: "Not feasible due to X"
})
```

**If needs more time:**
Just leave it in idea stage. Can return later.

## Key Principles

1. **No Commitment**: Ideas don't obligate execution
2. **Cheap Thinking**: Capture thoughts without formality
3. **Evidence Gathering**: Collect supporting materials
4. **Question-Driven**: Surface unknowns early

## Example Conversation

**User**: "I'm thinking about adding real-time notifications"

**AI**: "Let's explore that idea. I'll create a lightweight idea to capture your thinking."

*Creates idea*

**AI**: "What's driving this? What problem does it solve?"

**User**: "Users miss important updates. They have to refresh constantly. It's frustrating for them and we're getting complaints. I think we need some kind of push notification system but I'm not sure if it should be in-app only or also email."

*Captures narrative first:*
```
riotplan_idea_add_narrative({
  content: "Users miss important updates. They have to refresh constantly. It's frustrating for them and we're getting complaints. I think we need some kind of push notification system but I'm not sure if it should be in-app only or also email.",
  source: "typing",
  context: "User explaining the problem driving this idea"
})
```

*Then adds structured note:*
```
riotplan_idea_add_note({
  note: "Problem: Users missing updates, forced to refresh manually. Considering push notifications (in-app vs email unclear)"
})
```

**AI**: "What constraints should we consider?"

**User**: "Must work on mobile. Can't require WebSockets everywhere. Also need to keep costs reasonable."

*Captures narrative and extracts constraints*

**AI**: "Good constraints. Any questions we need to answer?"

**User**: "How do we handle offline users? What's the latency requirement?"

*Adds questions*

**AI**: "Do you have any examples or diagrams of how this might work?"

**User**: "Here's a diagram from a similar system" [attaches image]

*Adds evidence*

**AI**: "This is taking shape. Ready to explore different approaches for implementation?"

**User**: "Yes, let's look at options"

*Transitions to shaping*

## Anti-Patterns

❌ Don't immediately jump to solutions
❌ Don't create detailed plans yet
❌ Don't pressure for commitment
❌ Don't skip evidence gathering

✅ Do ask open questions
✅ Do capture all thinking
✅ Do surface constraints early
✅ Do gather supporting materials

## Transition Criteria

**To Shaping**: User wants to explore implementation approaches
**To Kill**: Idea not viable or not worth pursuing
**Stay in Idea**: Need more time to think, not ready yet
