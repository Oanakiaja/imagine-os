import { query } from '@anthropic-ai/claude-agent-sdk';
import type { AgentMessage } from '@imagine/shared';

const IMAGINE_SYSTEM_PROMPT = `You are a UI generation agent (codename: Heli).

When user requests an interface, follow this EXACT sequence:

1. WINDOW NEW → id: <unique-id>, title: "<title>", size: <sm|md|lg|xl>
2. INIT <TOOL_NAME> (if needed)
3. Prepare data silently
4. DOM REPLACE HTML → selector: #<window-id> .window-content
5. HTML CONTENT: <complete HTML here>

CRITICAL RULES:
- Create window IMMEDIATELY with no content
- Show loading state while preparing
- Only update when HTML is COMPLETE
- Never stream partial HTML
- Use plain HTML/CSS with Tailwind classes
- All interactive elements must use data-action attributes
- Make UI beautiful and modern

Example:
User: "Show me a todo list"

Response:
WINDOW NEW → id: todo-window, title: "My Tasks", size: md
INIT STORAGE
Loading tasks...
DOM REPLACE HTML → selector: #todo-window .window-content
HTML CONTENT:
<div class="space-y-2">
  <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
    <input type="checkbox" class="w-4 h-4" />
    <span class="flex-1">Buy groceries</span>
    <button data-action="delete" class="text-red-500 text-sm">Delete</button>
  </div>
  <div class="flex items-center gap-2 p-2 hover:bg-gray-50 rounded">
    <input type="checkbox" checked class="w-4 h-4" />
    <span class="flex-1 line-through text-gray-500">Walk the dog</span>
    <button data-action="delete" class="text-red-500 text-sm">Delete</button>
  </div>
  <button data-action="add" class="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Add Task
  </button>
</div>

Remember: User experience is paramount. Create beautiful, functional UIs.`;

export interface AgentOptions {
  model?: string;
  maxTokens?: number;
}

export async function* startImagineAgent(
  userPrompt: string,
  options: AgentOptions = {}
): AsyncGenerator<AgentMessage> {
  try {
    const stream = query(userPrompt, {
      model: options.model || 'claude-sonnet-4-20250514',
      systemPrompt: IMAGINE_SYSTEM_PROMPT,
      allowedTools: ['Write', 'Read', 'Edit', 'Bash'],
      includePartialMessages: true,
      maxThinkingTokens: options.maxTokens,
    });

    for await (const message of stream) {
      // 转换 Agent SDK 消息为我们的格式
      const agentMessage: AgentMessage = {
        type: mapMessageType(message.type),
        data: message,
        timestamp: Date.now(),
      };

      yield agentMessage;

      // 如果是结果消息，结束流
      if (message.type === 'result') {
        break;
      }
    }
  } catch (error) {
    yield {
      type: 'error',
      data: error instanceof Error ? error.message : 'Unknown error',
      timestamp: Date.now(),
    };
  }
}

function mapMessageType(sdkType: string): AgentMessage['type'] {
  switch (sdkType) {
    case 'assistant':
      return 'text';
    case 'result':
      return 'complete';
    case 'error':
      return 'error';
    default:
      return 'text';
  }
}
