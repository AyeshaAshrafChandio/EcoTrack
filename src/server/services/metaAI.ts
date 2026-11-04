/**
 * Re-export the clean Meta Llama 3.2 3B AI Copilot service.
 * Eliminates all fake SAM 3.1, Groq, and paid API references.
 */

import { aiCopilotService, type CopilotChatRequest, type CopilotChatResponse } from './aiCopilot';

export {
  aiCopilotService,
  aiCopilotService as metaAIService,
  type CopilotChatRequest,
  type CopilotChatResponse,
};
