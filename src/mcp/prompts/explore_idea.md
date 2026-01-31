# Explore Idea

## Purpose

Guide collaborative exploration of a new idea without premature commitment. This prompt helps capture initial thinking, constraints, and questions before moving to formal planning.

## When to Use

- User mentions a new concept or feature
- Starting to think about a problem
- Not ready to commit to a full plan yet
- Want to capture thoughts and gather evidence

## Workflow

### 1. Extract or Gather Idea Details

**FIRST: Check if the user already provided details in their message.**

Look for:
- A code/identifier (kebab-case name like "my-feature")
- A description of the concept

**If both are present in the user's message:**
- Extract them immediately
- Proceed directly to creating the idea
- Do NOT ask the user to repeat information they already provided

**If either is missing:**
- Have a natural conversation: "What idea would you like to explore? Give me a short name and brief description."
- When they respond, extract the code (convert to kebab-case if needed) and description
- Then create the idea

**Example extractions:**

User says: "explore_idea user-notifications I want to add real-time notifications"
→ code: "user-notifications", description: "I want to add real-time notifications"

User says: "explore_idea real-time notifications for users"
→ code: "real-time-notifications" (derived), description: "real-time notifications for users"

User says: "explore_idea"
→ Ask: "What idea would you like to explore? Give me a short name and brief description."

### 2. Create the Idea

Once you have both code and description, create the idea immediately:

```
riotplan_idea_create({
  code: "extracted-or-provided-code",
  description: "extracted or provided description"
})
```

### 3. Begin Exploration

After creating the idea, immediately begin the exploration conversation. Don't wait for further prompting.

Ask open-ended questions:
- "What's driving this idea?"
- "What constraints should we consider?"
- "What questions need answering?"
- "Do you have any evidence (docs, diagrams, examples)?"

### 4. Capture Responses in TWO Ways

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

### 5. Decide Next Steps

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
5. **Smart Extraction**: Use information the user already provided; don't make them repeat themselves

## Example Conversations

### Example 1: User Provides Everything Upfront

**User**: `/riotplan/explore_idea real-time-notifications Add push notifications for important updates`

**AI**: *Extracts code="real-time-notifications", description="Add push notifications for important updates"*
*Calls riotplan_idea_create immediately*

**AI**: "Let's explore this idea. What's driving the need for push notifications? What constraints should we consider?"

### Example 2: User Provides Partial Info

**User**: `/riotplan/explore_idea I want to add notifications`

**AI**: *Extracts description="I want to add notifications", derives code="add-notifications"*
*Calls riotplan_idea_create immediately*

**AI**: "Let's explore this notification idea. What's driving this? What problem does it solve?"

### Example 3: User Provides No Info

**User**: `/riotplan/explore_idea`

**AI**: "What idea would you like to explore? Give me a short name and brief description."

**User**: "I'm thinking about real-time notifications for users"

**AI**: *Extracts code="real-time-notifications", description="real-time notifications for users"*
*Calls riotplan_idea_create*

**AI**: "Great! Let's explore this. What's driving the need for real-time notifications?"

### Example 4: Rich Exploration with Narrative

**User**: "Users miss important updates. They have to refresh constantly. It's frustrating for them and we're getting complaints. I think we need some kind of push notification system but I'm not sure if it should be in-app only or also email."

**AI**: *Captures full narrative first:*
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

**AI**: "Good context. What constraints should we consider?"

**User**: "Must work on mobile. Can't require WebSockets everywhere. Also need to keep costs reasonable."

**AI**: *Captures narrative and extracts constraints*

## Anti-Patterns

❌ Don't ask for information the user already provided
❌ Don't immediately jump to solutions
❌ Don't create detailed plans yet
❌ Don't pressure for commitment
❌ Don't skip evidence gathering
❌ Don't stop after creating the idea—begin exploration immediately

✅ Do extract information from the user's message
✅ Do ask open questions
✅ Do capture all thinking
✅ Do surface constraints early
✅ Do gather supporting materials
✅ Do start the conversation immediately after creating the idea

## Transition Criteria

**To Shaping**: User wants to explore implementation approaches
**To Kill**: Idea not viable or not worth pursuing
**Stay in Idea**: Need more time to think, not ready yet
