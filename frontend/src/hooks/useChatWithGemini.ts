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
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, message: text }),
        }
      );

      if (!res.ok) {
        throw new Error(`Chat failed with status ${res.status}`);
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
      let operations;
      try {
        operations = JSON.parse(operationsJson);
      } catch (e) {
        console.error("Failed to parse operations JSON", e, operationsJson);
        return;
      }

      if (Array.isArray(operations)) {
        applyOperations(operations);
      } else {
        console.error("Operations must be an array", operations);
      }
    } catch (err) {
      console.error("Chat error", err);
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

