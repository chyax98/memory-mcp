# Memory System Design: Project Context Scanning

## What This Is

A lightweight approach to building persistent context for LLM conversations about a codebase. Instead of re-scanning the entire workspace on every question, we capture key architectural knowledge once and reuse it.

The system uses `simple-memory` (an MCP server with SQLite storage) to store structured information about the project that persists between conversations.

## The Problem We're Solving

**Without persistent memory:**
- LLM scans workspace from scratch every session
- Same questions require same exploration work
- No accumulated understanding of the codebase
- Slow, expensive, repetitive

**What we needed:**
- Keep context between conversations
- Fast lookup of architectural knowledge
- Local storage (privacy requirement)
- Simple to set up and maintain
- No complex dependencies

## Design Decisions

### Choice 1: Breadth-First Initial Scan

**What we do:**
Scan the project structure once to create a high-level map:
- What services/components exist
- Key files and folders
- Technology stack and dependencies
- Configuration patterns
- Deployment structure

**Why breadth-first:**
- Covers the whole project quickly (~2 minutes)
- Creates enough context to answer directional questions
- Enables targeted deep-dives later
- Avoids getting stuck in implementation details

**Trade-off:**
- Initial memories are surface-level
- Don't capture "how it works" for complex subsystems
- Requires follow-up exploration for depth

**Rationale:**
You can't predict what questions will come up. Better to have a shallow map of everything than deep knowledge of one area.

### Choice 2: Depth on Demand

**What we do:**
When a question requires understanding a subsystem, we:
1. Search existing memories for context
2. Realize we need more depth
3. Read relevant implementation code
4. Store detailed findings as new memories
5. Answer the question with full context

**Example:**
- Question: "How does the authentication system work?"
- Found: Surface mention of "token validation"
- Triggered: Code exploration of auth middleware, token service, validation logic
- Stored: 7 detailed memories about authentication architecture
- Result: Next auth question is instant

**Trade-off:**
- First question about a topic is slower (requires exploration)
- Subsequent questions are fast (knowledge cached)
- Memory grows organically based on actual usage

**Rationale:**
Most of the codebase won't be discussed. Don't waste time documenting everything up front.

### Choice 3: Simple Keyword + Tag Storage

**What we use:**
SQLite database with:
- Text content (the actual knowledge)
- Tags for categorization (`project:X`, `layer:Y`, `service:Z`)
- Basic keyword search
- Auto-linking between related memories

**Why not vector embeddings:**
- Requires model downloads (500+ MB)
- Adds Python dependencies
- Complex setup and debugging
- Latency for embedding generation
- We're storing structured knowledge, not fuzzy concepts

**Trade-off:**
- Search is keyword-based, not semantic
- Can't find "similar" concepts without explicit links
- Need to use specific terminology

**What we gain:**
- Zero setup time (just works)
- Fully local and private
- Fast search (SQLite is mature)
- Transparent (can inspect with any SQLite tool)
- No ongoing compute cost

**Rationale:**
For project-specific knowledge with known terminology, tags and keywords work fine. The complexity of semantic search isn't worth the added maintenance burden.

### Choice 4: Layer-Based Organization

**How we structure memories:**
```
project:my-application
├── layer:overview (what the project does)
├── layer:api (REST endpoints, versioning)
├── layer:processing (business logic, data processing)
├── layer:common (shared libraries)
├── layer:infrastructure (deployment, cloud resources)
├── layer:testing (unit/integration tests)
├── layer:cicd (pipelines)
└── layer:configuration (settings, feature flags)
```

Plus service-specific tags: `service:auth`, `service:data-processor`

**Why this structure:**
- Mirrors how developers think about architecture
- Easy to find "all memories about X layer"
- Scales as project grows
- Supports cross-cutting concerns (security, telemetry)

**Trade-off:**
- Requires consistent tagging discipline
- Some concepts span multiple layers

**Rationale:**
Developers organize codebases in layers. Memory organization should match mental models.

## What We Store

### High-Level (Initial Scan)
- Service purposes and responsibilities
- Key directories and their contents
- Major dependencies (cloud services, packages)
- Configuration approaches
- Build and deployment patterns

### Detail-Level (On Demand)
- How specific subsystems work
- Interaction patterns between services
- Workflow and lifecycle patterns
- Authentication mechanisms
- API versioning strategy

### What We Don't Store
- Function signatures (too granular, changes often)
- Complete file contents (use semantic_search for that)
- Temporary state (current bugs, branch names)
- Implementation details that are self-evident from code

## Honest Assessment

### What Works Well

**Fast Context Retrieval**
- Questions about stored topics get instant answers
- No workspace re-scanning needed
- Accumulated knowledge compounds

**Privacy**
- Everything local (SQLite file on disk)
- No cloud dependencies
- You control the data

**Low Maintenance**
- No models to update
- No Python environment issues
- Simple file-based storage

**Transparent**
- Can inspect memory.db with any SQLite browser
- See exactly what's stored
- Delete/edit memories if needed

### Real Limitations

**Search Quality**
- Keyword matching, not semantic understanding
- Must use terms that appear in stored memories
- Can't find "things similar to X" without explicit tags
- Miss connections between concepts if not tagged

**Coverage Gaps**
- Initial scan is shallow by design
- Deep knowledge only for discussed topics
- Some areas may never get detailed memories
- Depends on what questions get asked

**Maintenance Required**
- Memories can become stale as code changes
- No automatic detection of outdated information
- Need to manually update or delete obsolete entries
- Quality depends on discipline during storage

**Scaling Limits**
- SQLite works well up to certain size
- Very large projects (100k+ files) may be slower
- Tag organization needs thought at scale

### When This Approach Makes Sense

**Good fit:**
- Project-level context (1-50 services)
- Known terminology and patterns
- Local/private work requirement
- Want simple, maintainable solution
- Iterative knowledge building

**Poor fit:**
- Need semantic similarity search
- Building customer-facing Q&A system
- Searching across hundreds of repositories
- Require AI-powered knowledge graphs
- Need real-time sync across team

## Implementation Notes

### Memory Creation Process

1. **Initial Project Scan**
   - Read README, CONTRIBUTING
   - List directory structure
   - Scan project structure for components
   - Identify key configuration files
   - Read package manifests for dependencies
   - Store ~20 foundational memories

2. **Deep Dive Triggered by Question**
   - Search existing memories first
   - Identify knowledge gaps
   - Use grep/file search to find relevant code
   - Read implementation files
   - Build mental model
   - Store detailed memories with specific tags
   - Link to related memories

3. **Memory Structure**
   ```
   Content: 2-4 sentences of factual information
   Tags: ["project:X", "layer:Y", "domain-concepts"]
   Auto-linked: To related memories via tag overlap
   ```

### Tag Strategy

**Required tags:**
- `project:<project-name>` (every memory)
- `layer:<architectural-layer>` (categorization)

**Optional tags:**
- `service:<service-name>` (service-specific)
- Domain concepts (authentication, caching, database, etc.)
- Technology names (docker, kubernetes, terraform, etc.)

**Avoid:**
- Overly specific tags (creates noise)
- Redundant tags (already in content)
- Temporal tags (2024-10, outdated)

## Lessons Learned

### What Worked

**Progressive knowledge building is efficient**
- Don't document everything up front
- Build depth where needed
- Knowledge accumulates naturally

**Tags are sufficient for structured knowledge**
- Vector embeddings are overkill for project context
- Known terminology makes keyword search viable
- Simplicity reduces maintenance burden

**Breadth-first then depth is the right pattern**
- Quick overview enables navigation
- Deep dives target actual usage
- Balances time investment with utility

### What Could Be Better

**Staleness detection**
- No mechanism to flag outdated memories
- Could track file modification times
- Could validate memories against current code

**Search improvements**
- Synonyms would help (auth/authentication/RBAC)
- Could pre-generate common query variations
- Tag suggestions during storage

**Team collaboration**
- Single-user system (local SQLite)
- No shared knowledge base
- Could export/import memories for sharing

## Comparison to Alternatives

### vs Vector Database (ChromaDB, Pinecone)

**Vector DB advantages:**
- Semantic search (find similar concepts)
- Better at fuzzy queries
- Handles synonyms naturally

**Our approach advantages:**
- No setup complexity (no Python, no models)
- Fully local (privacy guaranteed)
- Fast and transparent (SQLite)
- No compute overhead (no embeddings)

**When to use vector DB:**
- Building production RAG system
- Need semantic similarity
- Have dedicated infrastructure

### vs LangChain Memory

**LangChain advantages:**
- Integrated with framework
- Multiple backend options
- Conversation history features

**Our approach advantages:**
- No framework lock-in
- Simpler to understand and debug
- Direct control over storage
- Lighter weight

**When to use LangChain:**
- Already using LangChain ecosystem
- Need conversation memory features
- Want pre-built integrations

### vs Manual Documentation

**Manual docs advantages:**
- Human-curated quality
- Structured narratives
- Version controlled

**Our approach advantages:**
- Automated capture
- Grows organically
- Always up-to-date with exploration
- Optimized for LLM consumption

**When to use manual docs:**
- Onboarding new team members
- Public documentation
- Formal architecture records

## Design Philosophy

### Keep It Simple

- SQLite over complex databases
- Tags over embeddings
- Keyword search over semantic
- Local storage over cloud
- Transparent over magical

**Why:** Complexity is a maintenance burden. Simple systems are easier to debug, modify, and understand.

### Build Progressively

- Breadth scan first
- Depth on demand
- Knowledge compounds
- Quality over coverage

**Why:** Can't predict future questions. Better to build useful knowledge gradually than comprehensive docs that go unused.

### Optimize for Use Case

- Project context, not general knowledge
- Developer questions, not end-user queries
- Structured information, not fuzzy concepts
- Known terminology, not discovery

**Why:** General-purpose solutions add overhead. Purpose-built tools are more efficient for specific needs.

### Value Transparency

- Inspect storage directly (SQLite)
- See what's stored (no black box)
- Edit or delete manually (full control)
- No proprietary formats

**Why:** Trust requires understanding. When you can see how it works, you can fix problems and adapt the system.

## Conclusion

This memory system is:
- **Not sophisticated** (by design)
- **Not general-purpose** (by design)
- **Not feature-complete** (trade-off for simplicity)

It **is**:
- Pragmatic for the problem at hand
- Simple enough to maintain
- Private and local
- Good enough to be useful

The goal isn't to build the perfect knowledge system. It's to avoid re-scanning the workspace every conversation while keeping the solution maintainable.

If that's what you need, this approach works. If you need semantic search, team collaboration, or massive scale, you'll need something more complex.

Know the trade-offs. Choose accordingly.

---

*This document describes the general approach to building persistent context for LLM conversations. Adapt the specific tags and organization to your project's needs.*
