# Memory Exploration Features - Implementation Plan

**Status**: Draft  
**Created**: October 6, 2025  
**Problem**: Users want to discover unexpected memories and connections
**Philosophy**: Enable serendipity, not structure

## The Real Problem

Users don't need **structured input** (templates). They need **better exploration and discovery**:
- "What did I forget about?"
- "What connections exist that I don't see?"
- "What was I thinking about 6 months ago?"
- "Show me something unexpected"

## Solution: Exploration Commands

### Phase 1: Quick Wins (2-3 hours)

#### 1. Random Memory (`random-memory`)
**Value**: High | **Complexity**: Low | **Time**: 30 min

Show random memories to trigger forgotten context.

```bash
node dist/index.js random-memory
node dist/index.js random-memory --count 5
node dist/index.js random-memory --tags "work"
```

**Implementation**:
```sql
SELECT * FROM memories 
WHERE (:tag IS NULL OR id IN (SELECT memory_id FROM tags WHERE tag = :tag))
ORDER BY RANDOM() 
LIMIT :limit
```

**MCP Tool**:
```json
{
  "name": "random-memory",
  "description": "Get random memories for serendipitous discovery",
  "inputSchema": {
    "properties": {
      "count": { "type": "number", "default": 1 },
      "tags": { "type": "array", "items": { "type": "string" } }
    }
  }
}
```

---

#### 2. Explore Memory (`explore-memory`)
**Value**: High | **Complexity**: Medium | **Time**: 1 hour

Traverse relationship graph to show memory neighborhoods.

```bash
node dist/index.js explore-memory --hash abc123
node dist/index.js explore-memory --hash abc123 --depth 2
```

**Implementation**:
- Start with a memory
- Find all related memories (depth 1)
- For each related memory, find their related memories (depth 2)
- Return as tree/graph structure

**Output Example**:
```json
{
  "root": {
    "hash": "abc123",
    "content": "API design meeting",
    "tags": ["meeting", "api"]
  },
  "related": [
    {
      "hash": "def456",
      "content": "REST vs GraphQL discussion",
      "relationshipType": "related",
      "related": [
        {
          "hash": "ghi789",
          "content": "GraphQL performance concerns"
        }
      ]
    }
  ]
}
```

---

#### 3. Time Travel (`memories-from`, `memories-between`)
**Value**: Medium | **Complexity**: Low | **Time**: 30 min

Rediscover old memories by date.

```bash
node dist/index.js memories-from --date "2024-10-06"  # One year ago
node dist/index.js memories-from --ago "30d"
node dist/index.js memories-between --start "2024-01" --end "2024-03"
```

**Implementation**:
```sql
-- From specific date
SELECT * FROM memories 
WHERE DATE(created_at) = :date
ORDER BY created_at DESC

-- From relative time
SELECT * FROM memories 
WHERE created_at >= datetime('now', '-30 days')
ORDER BY created_at DESC

-- Between dates
SELECT * FROM memories 
WHERE created_at BETWEEN :start AND :end
ORDER BY created_at DESC
```

---

### Phase 2: Pattern Discovery (2-3 hours)

#### 4. Tag Co-occurrence (`tag-connections`)
**Value**: Medium | **Complexity**: Medium | **Time**: 1 hour

Show which tags frequently appear together.

```bash
node dist/index.js tag-connections
node dist/index.js tag-connections --tag "work"
node dist/index.js tag-connections --min-count 5
```

**Output Example**:
```json
{
  "work": {
    "co_occurs_with": [
      { "tag": "meeting", "count": 15, "percentage": 45 },
      { "tag": "api", "count": 8, "percentage": 24 },
      { "tag": "bug", "count": 6, "percentage": 18 }
    ]
  }
}
```

**Implementation**:
```sql
-- Find tag pairs
SELECT t1.tag as tag1, t2.tag as tag2, COUNT(*) as count
FROM tags t1
JOIN tags t2 ON t1.memory_id = t2.memory_id
WHERE t1.tag < t2.tag  -- Avoid duplicates
GROUP BY t1.tag, t2.tag
HAVING count >= :min_count
ORDER BY count DESC
```

---

#### 5. Orphaned Memories (`orphans`)
**Value**: Low-Medium | **Complexity**: Low | **Time**: 30 min

Find memories with no tags and no relationships.

```bash
node dist/index.js orphans
```

**Implementation**:
```sql
SELECT m.* FROM memories m
LEFT JOIN tags t ON m.id = t.memory_id
LEFT JOIN relationships r ON (m.id = r.from_memory_id OR m.id = r.to_memory_id)
WHERE t.memory_id IS NULL AND r.id IS NULL
```

---

#### 6. Memory Timeline (`timeline`)
**Value**: Medium | **Complexity**: Low | **Time**: 30 min

Show memory activity over time.

```bash
node dist/index.js timeline
node dist/index.js timeline --groupby "month"
```

**Output Example**:
```json
{
  "2025-10": { "count": 15, "top_tags": ["work", "meeting"] },
  "2025-09": { "count": 22, "top_tags": ["bug", "fix"] },
  "2025-08": { "count": 18, "top_tags": ["idea", "project"] }
}
```

---

### Phase 3: Advanced Discovery (Optional)

#### 7. Similar Memories (`find-similar`)
**Value**: High | **Complexity**: Medium-High | **Time**: 2 hours

Find memories with similar content (beyond keyword search).

```bash
node dist/index.js find-similar --hash abc123
node dist/index.js find-similar --content "API design discussion"
```

**Options**:
- **Option A**: Use FTS5 `*` prefix matching and ranking
- **Option B**: Use simple word overlap scoring
- **Option C**: Local embeddings (much more complex)

**Start with Option A** (FTS5 already does similarity ranking).

---

#### 8. Memory Clusters (`find-clusters`)
**Value**: Medium | **Complexity**: High | **Time**: 3 hours

Auto-group related memories by relationship density.

```bash
node dist/index.js find-clusters
node dist/index.js find-clusters --min-size 3
```

**Implementation**: Graph clustering algorithm using relationships table.

---

## Priority Recommendation

**Implement these 3 first** (total ~2 hours):
1. ✅ Random Memory - Instant exploration value
2. ✅ Explore Memory - Leverage existing relationships
3. ✅ Time Travel - Simple but powerful rediscovery

**Then consider**:
4. Tag Connections - Shows unexpected patterns
5. Orphaned Memories - Housekeeping + discovery

**Skip for now**:
- Templates (doesn't solve exploration problem)
- Clusters (complex, needs visualization)
- Embeddings (overkill, FTS5 is fast enough)

## Why This Is Better Than Templates

| Feature | Problem Solved | Complexity | Value |
|---------|---------------|------------|-------|
| Templates | "I want consistent format" | Medium | Low (LLMs already format) |
| Random | "Show me something forgotten" | Low | High |
| Explore | "What's connected to this?" | Medium | High |
| Time Travel | "What was I thinking then?" | Low | Medium |
| Tag Connections | "What patterns exist?" | Medium | Medium |

**Exploration features solve YOUR actual need**: discovering unexpected value in stored memories.

## Implementation Priority

```
Week 1: Random + Time Travel (1 hour total)
Week 2: Explore Memory (1 hour)
Week 3: Tag Connections (1 hour)
```

All simple, all valuable, all aligned with the "show me what I forgot" goal.

---

**Next Step**: Implement `random-memory` first. It's 30 minutes and immediately useful.
