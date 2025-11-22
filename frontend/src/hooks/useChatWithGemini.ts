import { useState } from "react";
import { useProjectContext } from "../contexts/ProjectContext";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChatWithGemini(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { applyOperations } = useProjectContext();

  async function sendMessage(text: string) {
    setIsLoading(true);
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Get backend URL with fallback to default
      // Remove trailing slashes and /api if present to avoid double /api/api
      let backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
      backendUrl = backendUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
      const res = await fetch(
        `${backendUrl}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, message: text }),
        }
      );

      if (!res.ok) {
        let errorMessage = `Chat failed with status ${res.status}`;
        try {
          const errorData = await res.json();
          errorMessage = errorData.detail || errorMessage;
        } catch {
          // If response is not JSON, use default message
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      const operationsJson = data.operationsJson as string;

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: operationsJson,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Parse operations and apply to diagram
      // Gemini may return JSON wrapped in markdown code blocks, so we need to extract it
      let cleanedJson = operationsJson.trim();
      
      // Remove markdown code blocks if present (```json ... ``` or ``` ... ```)
      if (cleanedJson.startsWith('```')) {
        // Find the first newline after ```
        const firstNewline = cleanedJson.indexOf('\n');
        if (firstNewline !== -1) {
          cleanedJson = cleanedJson.substring(firstNewline + 1);
        } else {
          // No newline, just remove ```
          cleanedJson = cleanedJson.substring(3);
        }
        // Remove trailing ```
        const lastBackticks = cleanedJson.lastIndexOf('```');
        if (lastBackticks !== -1) {
          cleanedJson = cleanedJson.substring(0, lastBackticks);
        }
        cleanedJson = cleanedJson.trim();
      }
      
      let operations;
      try {
        operations = JSON.parse(cleanedJson);
      } catch (e) {
        console.error("Failed to parse operations JSON", e);
        console.error("Original response:", operationsJson);
        console.error("Cleaned JSON:", cleanedJson);
        // Add error message to chat
        const parseErrorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `Error: Failed to parse JSON response from AI. The response may not be in the correct format.`,
        };
        setMessages((prev) => [...prev, parseErrorMessage]);
        return;
      }

      if (Array.isArray(operations)) {
        applyOperations(operations);
      } else {
        console.error("Operations must be an array", operations);
      }
    } catch (err) {
      console.error("Chat error", err);
      // Add error message to chat for user visibility
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : 'Failed to send message. Please check your backend connection and configuration.'}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
  };
}



