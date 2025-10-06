# Memory Templates Feature - Implementation Plan

**Status**: Draft  
**Created**: October 6, 2025  
**Complexity**: Low-Medium  
**Priority**: High Value

## Overview

Add predefined memory templates that provide structured content formats for common use cases (meetings, bugs, ideas, todos, learning notes). This feature maintains simplicity while adding significant value for both CLI and LLM-based MCP usage.

## Design Principles

- **Backward Compatible**: Existing `--content` usage must continue to work unchanged
- **Optional**: Templates are opt-in; users can always use freeform content
- **No Breaking Changes**: No database schema changes required
- **Simple First**: Start with 5 core templates, extensible design for future additions
- **DRY**: Single source of truth for template definitions

## Goals

1. Provide structured content formatting for common memory types
2. Reduce cognitive load for users (both human and LLM)
3. Ensure consistency in stored memories
4. Improve searchability through predictable structure
5. Maintain sub-5-second build times and fast operations

## Template Design

### Core Templates (Phase 1)

| Template | Use Case | Required Params | Auto Tags |
|----------|----------|-----------------|-----------|
| `meeting` | Meeting notes | `with`, `topic` | `meeting` |
| `bug` | Bug reports | `title`, `steps` | `bug`, `issue` |
| `idea` | Ideas/proposals | `title` | `idea` |
| `todo` | Tasks/action items | `task` | `todo`, `task` |
| `learn` | Learning notes | `concept` | `learning`, `knowledge` |

### Template Structure

```typescript
interface MemoryTemplate {
  name: string;
  description: string;
  format: string;  // Template string with {placeholder} syntax
  requiredParams: string[];
  optionalParams: string[];
  defaultTags: string[];
  examples?: string[];  // For documentation
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (1-2 hours)

#### 1.1 Create Template System
**File**: `src/utils/templates.ts` (NEW)

**Components**:
- Template interface definition
- Template registry with 5 core templates
- `processTemplate()` function to fill placeholders
- `listTemplates()` function to get available templates
- Validation for required/optional parameters

**Key Features**:
- Auto-fill date if not provided
- Remove unfilled optional placeholders
- Clean up empty lines in output
- Merge template tags with user-provided tags

#### 1.2 Add Template Tests
**File**: `src/tests/template-tests.ts` (NEW)

**Test Coverage**:
- Template parameter validation (required vs optional)
- Placeholder replacement
- Tag merging
- Empty parameter cleanup
- Invalid template handling
- Edge cases (special characters, empty strings)

### Phase 2: CLI Integration (1 hour)

#### 2.1 Update store-memory CLI Parser
**File**: `src/tools/store-memory/cli-parser.ts`

**Changes**:
- Add `--template <name>` flag detection
- Parse template parameters as `--param-name value`
- Support both template and traditional content modes
- Add validation for template + content conflict

#### 2.2 Update store-memory Executor
**File**: `src/tools/store-memory/executor.ts`

**Changes**:
- Check for template in arguments
- Call `processTemplate()` if template provided
- Use generated content and tags
- Fallback to existing behavior if no template

#### 2.3 Add list-templates Command
**Files**: 
- `src/tools/list-templates/index.ts` (NEW)
- `src/tools/list-templates/cli-parser.ts` (NEW)
- `src/tools/list-templates/executor.ts` (NEW)

**Functionality**:
- Display all available templates
- Show required/optional parameters for each
- Include usage examples
- Format output as JSON or human-readable

### Phase 3: MCP Integration (1 hour)

#### 3.1 Update MCP Tool Schema
**File**: `src/tools/store-memory/index.ts`

**Changes**:
- Add `template` property (enum of template names)
- Add `params` property (object with string values)
- Update schema to support either `content` OR `template+params`
- Use JSON Schema `oneOf` for validation

#### 3.2 Register list-templates Tool
**File**: `src/tools/index.ts`

**Changes**:
- Import and register `list-templates` tool
- Add to tool registry
- Include in MCP tool listing

### Phase 4: Documentation (30 minutes)

#### 4.1 Update README
**File**: `README.md`

**Sections to Add**:
- "Using Templates" section with examples
- Template reference table
- CLI usage examples
- MCP usage examples

#### 4.2 Add Template Documentation
**File**: `docs/templates.md` (NEW)

**Content**:
- Detailed template reference
- Parameter descriptions
- Best practices
- Common patterns
- LLM integration examples

#### 4.3 Update CHANGELOG
**File**: `CHANGELOG.md`

**Entry**:
```markdown
## [2.1.0] - 2025-10-06

### Added
- Memory templates feature with 5 core templates (meeting, bug, idea, todo, learn)
- `list-templates` command to display available templates
- Template support in both CLI and MCP modes
```

### Phase 5: Testing & Validation (30 minutes)

#### 5.1 Manual Testing Checklist
```bash
# 1. CLI template usage
node dist/index.js store-memory --template meeting --with "John" --topic "API design"
node dist/index.js store-memory --template bug --title "Login broken" --steps "Click login button"
node dist/index.js store-memory --template todo --task "Review PR"

# 2. List templates
node dist/index.js list-templates

# 3. Traditional content (ensure backward compatibility)
node dist/index.js store-memory --content "Regular memory" --tags "test"

# 4. Search for templated memories
node dist/index.js search-memory --tags "meeting"
node dist/index.js search-memory --query "John"

# 5. Error cases
node dist/index.js store-memory --template invalid
node dist/index.js store-memory --template meeting --with "John"  # Missing required 'topic'
node dist/index.js store-memory --template meeting --content "conflict"  # Both template and content
```

#### 5.2 Automated Tests
```bash
npm run test  # Should pass all existing tests
npm run test:templates  # New template-specific tests
```

#### 5.3 Performance Validation
- Template processing should add <1ms overhead
- No impact on existing memory operations
- Build time remains <5 seconds

## File Structure

```
src/
├── utils/
│   └── templates.ts          # NEW - Template definitions and processor
├── tools/
│   ├── store-memory/
│   │   ├── cli-parser.ts     # MODIFIED - Add template support
│   │   ├── executor.ts       # MODIFIED - Process templates
│   │   └── index.ts          # MODIFIED - Update MCP schema
│   └── list-templates/       # NEW - Template listing tool
│       ├── index.ts
│       ├── cli-parser.ts
│       └── executor.ts
├── tests/
│   └── template-tests.ts     # NEW - Template tests
docs/
└── templates.md              # NEW - Template documentation
plans/
└── memory-templates-feature.md  # THIS FILE
```

## API Examples

### CLI Usage

```bash
# Meeting template
node dist/index.js store-memory --template meeting \
  --with "Sarah, Mike" \
  --topic "Sprint planning" \
  --decisions "2-week sprint, 5 stories" \
  --actions "Everyone: estimate by EOD"

# Bug template
node dist/index.js store-memory --template bug \
  --title "Login button broken" \
  --steps "1. Go to login page 2. Click button" \
  --severity "high"

# List available templates
node dist/index.js list-templates

# Traditional usage (unchanged)
node dist/index.js store-memory --content "My note" --tags "personal"
```

### MCP Usage (JSON-RPC)

```json
{
  "method": "tools/call",
  "params": {
    "name": "store-memory",
    "arguments": {
      "template": "meeting",
      "params": {
        "with": "John",
        "topic": "API design",
        "decisions": "Use REST",
        "actions": "John to draft spec"
      }
    }
  }
}
```

### Programmatic Usage

```typescript
import { processTemplate } from './utils/templates.js';

const { content, tags } = processTemplate('meeting', {
  with: 'Team',
  topic: 'Standup',
  notes: 'Discussed blockers'
});

memoryService.store(content, tags);
```

## Template Format Examples

### Meeting Template Output
```
Meeting with Sarah, Mike about Sprint planning on 2025-10-06.
Decisions: 2-week sprint, 5 stories
Action items: Everyone: estimate by EOD
```

### Bug Template Output
```
Bug Report: Login button broken
Steps to reproduce: 1. Go to login page 2. Click button
Severity: high
```

### Learn Template Output
```
Learned: SQLite FTS5 performance
Key points: FTS5 is significantly faster than LIKE for text search
```

## Design Decisions

### Why These 5 Templates?
- **meeting**: Most common structured note type in professional contexts
- **bug**: Universal need for software development
- **idea**: Captures proposals with evaluation criteria
- **todo**: Simple task tracking without external dependencies
- **learn**: Knowledge management and TIL (Today I Learned) notes

### Why Not Custom Templates?
- **Phase 1**: Keep it simple, validate the concept
- **Future**: Could add user-defined templates in Phase 2 if needed
- **Rationale**: 80/20 rule - these 5 cover most common use cases

### Template Parameter Naming
- Use natural language: `with`, `topic`, `steps` (not `participants`, `subject`, `reproduction_steps`)
- Keep it short: easier to type, easier to remember
- Consistent across templates where possible

### Placeholder Syntax
- Use `{paramName}` instead of `${paramName}` or `{{paramName}}`
- **Reason**: Simple, unambiguous, no escaping needed
- **Consideration**: Not executable code (security benefit)

## Non-Goals (Out of Scope)

- ❌ Custom user-defined templates (Phase 1)
- ❌ Template versioning or migration
- ❌ Complex template inheritance or composition
- ❌ Template marketplace or sharing
- ❌ Rich formatting (markdown, HTML)
- ❌ Template-specific search queries
- ❌ Visual template builder/editor

## Success Metrics

1. **Zero Breaking Changes**: All existing tests pass
2. **Performance**: <1ms template processing overhead
3. **Adoption**: Templates used in at least 20% of stores (monitor via tags)
4. **Code Quality**: TypeScript compiles with no errors
5. **Test Coverage**: >80% coverage for template code

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Template format too rigid | Medium | Allow optional params, traditional content still works |
| LLMs don't use templates | Low | Works equally well for CLI, no downside |
| Parameter naming conflicts | Low | Use clear, unambiguous names |
| Performance overhead | Low | Simple string replacement, benchmark before merge |

## Future Enhancements (Phase 2+)

1. **Custom Templates**: User-defined templates via config file
2. **Template Validation**: JSON Schema for parameter validation
3. **Template Composition**: Combine multiple templates
4. **Template Search**: Find memories by template type
5. **Template Versioning**: Evolve templates without breaking old memories
6. **Smart Defaults**: Pre-fill common values (e.g., current user for `with`)

## Migration Path

**No migration needed** - this is purely additive:
- No database schema changes
- No existing memory format changes
- Templates generate standard memory content
- Memories stored via templates are indistinguishable from manual content

## Rollback Plan

If issues arise:
1. Remove template-related files
2. Revert tool changes
3. Keep existing memories (they're just text+tags)
4. No data loss possible

## Timeline Estimate

- **Phase 1**: 1-2 hours (Core infrastructure)
- **Phase 2**: 1 hour (CLI integration)
- **Phase 3**: 1 hour (MCP integration)
- **Phase 4**: 30 minutes (Documentation)
- **Phase 5**: 30 minutes (Testing)

**Total**: ~4-5 hours for complete implementation

## Questions to Resolve

- [ ] Should templates support nested parameters? (e.g., `actions.1`, `actions.2`)
- [ ] Should there be a `--template-help <name>` command for detailed info?
- [ ] Should list-templates be alphabetical or by usage frequency?
- [ ] Should templates auto-generate related memories? (e.g., todo → reminder)

## Approval Checklist

- [ ] Design reviewed
- [ ] Implementation plan agreed
- [ ] Test strategy confirmed
- [ ] Documentation scope defined
- [ ] Timeline accepted
- [ ] Ready to implement

---

**Next Steps**: Review this plan, address questions, and begin Phase 1 implementation.
