# Auto-Capture Manual Test Script

**Purpose**: Validate that the LLM automatically captures memories during natural conversation  
**Prerequisites**: Simple Memory MCP server connected to Claude Desktop or similar MCP client  
**Duration**: ~10 minutes

---

## Setup

1. Configure your MCP client with simple-memory-mcp
2. Start a fresh conversation
3. Use a clean test database: `MEMORY_DB=./test-manual.db`

---

## Test Conversation Script

### 🎯 Phase 1: Preferences (Should Auto-Capture)

**You:**
> Hey! I'm working on a new web project. I really prefer using TypeScript over JavaScript because the type safety helps catch bugs early.

**Expected LLM Behavior:**
- ✅ Responds naturally about TypeScript
- ✅ **Silently** calls `store-memory` in background
- ✅ Stores: "User prefers TypeScript over JavaScript for type safety and bug prevention"
- ✅ Tags: `["preferences", "typescript", "javascript", "development"]`
- ❌ Does NOT say "I've saved that to memory"

---

**You:**
> For styling, I always go with Tailwind CSS. It's so much faster than writing custom CSS.

**Expected LLM Behavior:**
- ✅ Continues conversation naturally
- ✅ **Silently** stores preference
- ✅ Stores: "User prefers Tailwind CSS over custom CSS for speed"
- ✅ Tags: `["preferences", "css", "tailwind", "styling"]`

---

### 🎯 Phase 2: Decisions (Should Auto-Capture)

**You:**
> Alright, I've decided to use Next.js for this project. It has the best developer experience for React apps.

**Expected LLM Behavior:**
- ✅ Responds about Next.js
- ✅ **Silently** stores decision
- ✅ Stores: "User decided to use Next.js for project due to best React developer experience"
- ✅ Tags: `["decisions", "nextjs", "react", "project", "framework"]`

---

**You:**
> For the database, let's go with PostgreSQL. We need strong ACID guarantees for this app.

**Expected LLM Behavior:**
- ✅ Discusses PostgreSQL appropriately
- ✅ **Silently** stores decision
- ✅ Stores: "User chose PostgreSQL for database due to ACID guarantees requirement"
- ✅ Tags: `["decisions", "database", "postgresql", "project"]`

---

### 🎯 Phase 3: Learning (Should Auto-Capture)

**You:**
> Oh interesting! I just learned that Next.js 13 has Server Components built-in. That's going to change how we structure apps.

**Expected LLM Behavior:**
- ✅ Engages with the learning
- ✅ **Silently** stores learning
- ✅ Stores: "User learned Next.js 13 has built-in Server Components which changes app structure"
- ✅ Tags: `["learning", "nextjs", "server-components", "architecture"]`

---

### 🎯 Phase 4: People/Project Facts (Should Auto-Capture)

**You:**
> My colleague Sarah recommended this stack. She's been using it at her company for 6 months now.

**Expected LLM Behavior:**
- ✅ Acknowledges Sarah's recommendation
- ✅ **Silently** stores fact
- ✅ Stores: "Sarah (colleague) recommended the tech stack, has 6 months experience with it"
- ✅ Tags: `["people", "sarah", "recommendations", "project"]`

---

### ❌ Phase 5: Chitchat (Should NOT Capture)

**You:**
> How's the weather looking today?

**Expected LLM Behavior:**
- ✅ Responds about weather
- ❌ Does NOT store (temporary information)

---

**You:**
> Cool, thanks!

**Expected LLM Behavior:**
- ✅ Responds naturally
- ❌ Does NOT store (casual acknowledgment)

---

### 🎯 Phase 6: Action Items (Should Auto-Capture)

**You:**
> I need to set up the PostgreSQL database this week before we can start on the API routes.

**Expected LLM Behavior:**
- ✅ Acknowledges the TODO
- ✅ **Silently** stores action item
- ✅ Stores: "User needs to set up PostgreSQL database this week before starting API routes"
- ✅ Tags: `["todo", "action-items", "postgresql", "database", "project"]`

---

## 🔍 Verification Phase

Now test if the LLM can recall the captured information:

### Test 1: Preference Recall

**You:**
> What are my preferences for web development?

**Expected LLM Behavior:**
- ✅ Searches memories with tags: `preferences`
- ✅ Responds: "You prefer TypeScript over JavaScript for type safety, and Tailwind CSS over custom CSS for speed"

---

### Test 2: Decision Recall

**You:**
> What tech stack did I choose for the project?

**Expected LLM Behavior:**
- ✅ Searches memories with tags: `decisions`, `project`
- ✅ Responds: "You decided on Next.js for the framework and PostgreSQL for the database"

---

### Test 3: People Recall

**You:**
> Who recommended this stack to me?

**Expected LLM Behavior:**
- ✅ Searches memories with tags: `people`, `recommendations`
- ✅ Responds: "Your colleague Sarah recommended it, and she has 6 months of experience using it"

---

### Test 4: Learning Recall

**You:**
> What did I learn about Next.js recently?

**Expected LLM Behavior:**
- ✅ Searches memories with tags: `learning`, `nextjs`
- ✅ Responds: "You learned that Next.js 13 has built-in Server Components"

---

### Test 5: TODO Recall

**You:**
> What do I need to do this week?

**Expected LLM Behavior:**
- ✅ Searches memories with tags: `todo`, `action-items`
- ✅ Responds: "You need to set up the PostgreSQL database before starting on the API routes"

---

## 🧪 Manual Verification

After the conversation, you can verify what was actually stored:

```bash
# Set test database
export MEMORY_DB=./test-manual.db

# Check all stored memories
node dist/index.js search-memory --query "" --limit 20

# Check preferences
node dist/index.js search-memory --tags "preferences"

# Check decisions
node dist/index.js search-memory --tags "decisions"

# Check learnings
node dist/index.js search-memory --tags "learning"

# Check action items
node dist/index.js search-memory --tags "todo"

# Check stats
node dist/index.js memory-stats
```

---

## ✅ Success Criteria

| Criteria | Expected | How to Verify |
|----------|----------|---------------|
| Preferences captured | 2 memories | Search `--tags preferences` |
| Decisions captured | 2 memories | Search `--tags decisions` |
| Learning captured | 1 memory | Search `--tags learning` |
| People facts captured | 1 memory | Search `--tags people` |
| Action items captured | 1 memory | Search `--tags todo` |
| Chitchat NOT captured | 0 memories | Check total count ~7 not ~9 |
| Silent storage | Never announced | Review conversation |
| Recall works | All queries answered | Test verification phase |
| Good tags used | Descriptive tags | Review stored memories |

**Expected Total**: ~7 memories stored (preferences + decisions + learning + people + todo)

---

## ⚠️ Common Issues

### Issue: LLM announces storage
```
❌ "I've saved your preference for TypeScript to memory"
```
**Problem**: LLM not following silent behavior guidelines  
**Solution**: May need to strengthen "SILENTLY" emphasis in tool description

### Issue: LLM doesn't capture automatically
```
❌ No memories stored after Phase 1-6
```
**Problem**: LLM not recognizing auto-capture guidelines  
**Solution**: Check tool descriptions are loaded (run `node test-auto-capture.mjs`)

### Issue: LLM captures chitchat
```
❌ "How's the weather" stored as memory
```
**Problem**: LLM not filtering appropriately  
**Solution**: May need to strengthen "NEVER CAPTURE" section

### Issue: Poor tag quality
```
❌ Tags like ["misc", "stuff", "things"]
```
**Problem**: LLM not using descriptive tags  
**Solution**: Emphasize tag examples in tool description

---

## 📊 Test Results Template

```
Date: __________
MCP Client: __________
LLM Model: __________

Phase 1 (Preferences): ☐ Pass ☐ Fail
Phase 2 (Decisions):   ☐ Pass ☐ Fail  
Phase 3 (Learning):    ☐ Pass ☐ Fail
Phase 4 (People):      ☐ Pass ☐ Fail
Phase 5 (Chitchat):    ☐ Pass ☐ Fail (should NOT store)
Phase 6 (TODOs):       ☐ Pass ☐ Fail

Verification Tests:
- Preference recall:   ☐ Pass ☐ Fail
- Decision recall:     ☐ Pass ☐ Fail
- People recall:       ☐ Pass ☐ Fail
- Learning recall:     ☐ Pass ☐ Fail
- TODO recall:         ☐ Pass ☐ Fail

Silent storage:        ☐ Yes ☐ No (announced)
Tag quality:           ☐ Good ☐ Needs improvement

Notes:
_________________________________
_________________________________
```

---

## 🎯 Next Steps After Testing

1. **If everything works**: Ship it! 🚀
2. **If LLM over-captures**: Strengthen "NEVER CAPTURE" section
3. **If LLM under-captures**: Add more examples to "ALWAYS CAPTURE"
4. **If storage announced**: Emphasize "SILENTLY" behavior
5. **If poor tags**: Add tag examples to tool description

---

**Happy Testing!** This conversation should demonstrate auto-capture working naturally without user friction.
