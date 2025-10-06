# Auto-Capture Feature - Implementation Plan

**Status**: Draft  
**Created**: October 6, 2025  
**Problem**: Users must explicitly ask to save memories - major friction point
**Solution**: Smart auto-capture with LLM-driven decision making

## The Core Problem

**Current flow**:
```
User: "I prefer REST APIs over GraphQL"
User: "Hey, save that preference to memory"  ← FRICTION
LLM: *calls store-memory*
```

**What we want**:
```
User: "I prefer REST APIs over GraphQL"
LLM: *silently stores preference with tags: preferences, api*
(conversation continues naturally)
```

## Solution: Hybrid Auto-Capture

### Approach A: Configuration-Driven (Explicit Rules)
**File**: `memory-config.json` or environment variables

```json
{
  "autoCapture": {
    "enabled": true,
    "mode": "smart",
    "silent": true,
    "categories": {
      "preferences": true,
      "decisions": true,
      "entities": true,
      "learnings": true,
      "conversations": false
    }
  }
}
```

### Approach B: LLM-Driven (System Prompt)
**File**: MCP server includes in tool descriptions

```markdown
Memory Storage Guidelines for LLM:

You have access to long-term memory. Store information automatically:

AUTO-CAPTURE (no user request needed):
✓ User preferences, opinions, likes/dislikes
✓ Decisions made during conversation
✓ Facts about people, projects, tools
✓ Learnings, insights, realizations
✓ Action items, commitments, TODOs

SKIP (don't store):
✗ Casual greetings, small talk
✗ Temporary information (like current weather)
✗ Sensitive personal data (unless user explicitly requests)
✗ Questions or clarifications

BEHAVIOR:
- Store silently (don't announce "I saved that")
- Use descriptive tags for retrieval
- Link related memories when obvious
- Be thoughtful, not aggressive
```

## Implementation Options

### Option 1: System Prompt Only (Zero Code) ⭐ RECOMMENDED
**Complexity**: None  
**Time**: 5 minutes  
**Value**: High

Just update the MCP tool description to include auto-capture guidelines:

```typescript
// In src/tools/store-memory/index.ts
export const storeMemoryTool = {
  name: 'store-memory',
  description: `Store content in memory with tags. 
  
  AUTO-CAPTURE GUIDELINES:
  Use this tool proactively during conversation to capture:
  - User preferences, opinions, favorites
  - Decisions or commitments made
  - Facts about people, projects, or tools mentioned
  - Learnings, insights, or realizations
  - Action items or TODOs
  
  Store silently without announcing. Tag appropriately.
  Skip casual chitchat or temporary information.`,
  inputSchema: { /* existing schema */ }
};
```

**That's it.** Modern LLMs are good enough to follow these instructions.

---

### Option 2: Post-Conversation Summary (Automatic)
**Complexity**: Low  
**Time**: 1 hour  
**Value**: Medium

Add a new tool: `summarize-conversation`

```bash
# Automatically called at end of conversation or every N messages
{
  "name": "summarize-conversation",
  "description": "Automatically store conversation summary",
  "inputSchema": {
    "properties": {
      "keyPoints": { "type": "array", "items": { "type": "string" } },
      "entities": { "type": "object" },
      "decisions": { "type": "array" },
      "actions": { "type": "array" }
    }
  }
}
```

LLM calls this periodically or at conversation end.

---

### Option 3: Conversation Buffer (Continuous Capture)
**Complexity**: Medium  
**Time**: 2 hours  
**Value**: High (but noisy)

Store ALL conversation messages, with smart consolidation:

```typescript
// New service method
storeConversationTurn(
  userMessage: string,
  assistantMessage: string,
  metadata: { topic?: string, entities?: string[] }
) {
  // Store with special tags: conversation, auto, date
  // Later consolidate or summarize
}
```

Add consolidation command:
```bash
node dist/index.js consolidate-memories --period "today" --strategy "summarize"
```

---

### Option 4: Memory Suggestions (Semi-Auto)
**Complexity**: Medium  
**Time**: 1-2 hours  
**Value**: Medium (requires user interaction)

Add a `suggest-memory` tool that LLM can call:

```json
{
  "name": "suggest-memory",
  "description": "Suggest a memory to user for approval",
  "inputSchema": {
    "properties": {
      "content": { "type": "string" },
      "tags": { "type": "array" },
      "reason": { "type": "string" }
    }
  }
}
```

LLM output:
```
💡 I noticed you mentioned preferring REST APIs. Should I remember this?
```

User confirms, then it's stored.

---

## Recommended Implementation: **Option 1 + Option 2**

### Phase 1: Update System Prompt (5 minutes)
Modify tool description to include auto-capture guidelines.

**Result**: LLM starts proactively storing memories without friction.

### Phase 2: Add Conversation Summaries (1 hour)
Add `summarize-conversation` tool for periodic auto-summaries.

**Result**: Long conversations are automatically captured even if LLM misses individual moments.

---

## Example: Before & After

### Before (Current)
```
User: I really prefer REST APIs over GraphQL. They're simpler to debug.
LLM: That's a good point about debugging simplicity. REST APIs do have...
[memory lost - user forgot to ask to save it]

Later...
User: What do I think about GraphQL?
LLM: I don't have any information about your preferences on GraphQL.
```

### After (Auto-Capture)
```
User: I really prefer REST APIs over GraphQL. They're simpler to debug.
LLM: That's a good point about debugging simplicity. REST APIs do have...
[*silently stores: "User prefers REST APIs over GraphQL for debugging simplicity"*]
[*tags: preferences, api, rest, graphql*]

Later...
User: What do I think about GraphQL?
LLM: [searches memory] Based on our previous conversation, you prefer REST APIs 
     over GraphQL because they're simpler to debug.
```

---

## System Prompt Template

Add this to MCP client configuration or server initialization:

```markdown
# Long-Term Memory System

You have access to a long-term memory system via the `store-memory` tool.

## Auto-Capture Policy

Proactively store important information WITHOUT waiting for user request:

**Always Capture:**
- User preferences (likes, dislikes, favorites, opinions)
- Decisions made during conversation
- Facts about people mentioned (names, roles, relationships)
- Facts about projects or work (names, status, goals)
- Learnings or insights ("I learned that...", "I realized...")
- Action items, commitments, or TODOs
- Technical knowledge or discoveries

**Never Capture:**
- Casual greetings or farewells
- Weather, time, date queries
- Purely transactional exchanges
- Sensitive personal information (unless explicitly requested)

**Behavior:**
- Store silently - don't announce "I've saved that to memory"
- Use clear, descriptive tags for easy retrieval
- Link related memories when connections are obvious
- Be thoughtful about what's worth long-term storage

**Example:**
User: "I prefer TypeScript over JavaScript for its type safety"
You: [continues conversation naturally]
Background: *store-memory("User prefers TypeScript over JavaScript for type safety", tags: ["preferences", "typescript", "javascript"])*
```

---

## Configuration Options

### Environment Variables
```bash
MEMORY_AUTO_CAPTURE=true          # Enable auto-capture
MEMORY_AUTO_CAPTURE_SILENT=true   # Don't announce saves
MEMORY_AUTO_CAPTURE_SUMMARY=true  # Periodic conversation summaries
MEMORY_SUMMARY_INTERVAL=15        # Minutes between auto-summaries
```

### JSON Config (Future)
```json
{
  "memory": {
    "autoCapture": {
      "enabled": true,
      "silent": true,
      "categories": {
        "preferences": true,
        "decisions": true,
        "people": true,
        "projects": true,
        "learnings": true
      },
      "summarization": {
        "enabled": true,
        "interval": 15,
        "minMessages": 10
      }
    }
  }
}
```

---

## Testing Auto-Capture

### Manual Test Scenarios
```
Scenario 1: Preference
User: "I really like using dark mode for coding"
Expected: Auto-store with tags: preferences, coding
Verify: search-memory --tags preferences

Scenario 2: Decision
User: "Let's go with PostgreSQL instead of MySQL for this project"
Expected: Auto-store with tags: decisions, database, project
Verify: search-memory --tags decisions

Scenario 3: Learning
User: "Oh interesting, I just learned that SQLite supports full-text search"
Expected: Auto-store with tags: learning, sqlite, fts
Verify: search-memory --tags learning

Scenario 4: Skip Chitchat
User: "Hey, how are you?"
Expected: No storage
Verify: No new memories created
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| LLM over-stores (too aggressive) | High noise | Clear system prompt with examples |
| LLM under-stores (too conservative) | Missed information | Monitor and adjust prompt |
| Sensitive data stored | Privacy issue | Explicit exclusion rules, user can delete |
| User wants manual control | Feature rejection | Make it configurable (on/off/ask) |

---

## Success Metrics

1. **Reduced friction**: Users stop saying "save that to memory"
2. **Higher capture rate**: More memories stored per conversation
3. **Better recall**: LLM can reference past preferences/decisions
4. **User satisfaction**: Natural conversation flow maintained

---

## Rollout Plan

### Week 1: System Prompt Update (Option 1)
- Update `store-memory` tool description
- Deploy to test environment
- Monitor LLM behavior (over/under storing)

### Week 2: Tune & Monitor
- Adjust system prompt based on observations
- Add examples to prompt if needed
- Document patterns

### Week 3 (Optional): Add Summaries (Option 2)
- Implement `summarize-conversation` tool
- Add periodic trigger logic
- Test with longer conversations

---

## Alternative: Do Nothing (But Fix the Prompt)

The simplest solution might be educating users through better documentation:

**Add to README**:
```markdown
## Pro Tip: Proactive Memory Storage

Don't wait for users to ask "save this to memory". Modern LLMs with 
MCP access should proactively store important information:

- Preferences and opinions
- Decisions and commitments  
- Facts about people and projects
- Learnings and insights

Store silently and tag appropriately for later retrieval.
```

This shifts the burden to MCP client configuration, not your server code.

---

## Recommendation

**Start with Option 1 (System Prompt Update)**:
- Zero code changes
- Immediate value
- Reversible if it doesn't work
- LLMs are smart enough to follow guidelines

If that works well, add Option 2 (Conversation Summaries) for long-running chats.

**Implementation time: 5 minutes for Option 1, 1 hour for Option 2**

---

**Next Step**: Update `store-memory` tool description with auto-capture guidelines.
