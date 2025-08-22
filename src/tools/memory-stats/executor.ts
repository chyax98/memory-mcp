import type { ToolContext } from '../../types/tools.js';
import type { MemoryStats } from '../../services/memory-service.js';

export async function execute(args: any, context: ToolContext): Promise<MemoryStats> {
  return await context.memoryService.stats();
}
