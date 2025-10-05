import type { ToolContext } from '../../types/tools.js';
import { formatHash } from '../../utils/debug.js';

interface DeleteMemoryArgs {
  hash?: string;
  tag?: string;
}

interface DeleteMemoryResult {
  success: boolean;
  deleted: number;
  message: string;
}

export async function execute(args: DeleteMemoryArgs, context: ToolContext): Promise<DeleteMemoryResult> {
  try {
    let deleted = 0;
    
    if (args.hash) {
      const success = context.memoryService.delete(args.hash);
      deleted = success ? 1 : 0;
      
      return {
        success,
        deleted,
        message: success 
          ? `Memory with hash ${formatHash(args.hash)} deleted successfully`
          : `Memory with hash ${formatHash(args.hash)} not found`
      };
    } else if (args.tag) {
      deleted = context.memoryService.deleteByTag(args.tag);
      
      return {
        success: deleted > 0,
        deleted,
        message: `Deleted ${deleted} memories with tag "${args.tag}"`
      };
    } else {
      return {
        success: false,
        deleted: 0,
        message: 'Either hash or tag must be provided'
      };
    }
  } catch (error) {
    return {
      success: false,
      deleted: 0,
      message: `Failed to delete memory: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}
