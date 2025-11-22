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
        // Try to fix malformed JSON where metadata appears as separate objects
        // The issue is: {"op": "...", "payload": {...}}, "metadata": {...}
        // Should be: {"op": "...", "payload": {...}, "metadata": {...}}
        try {
          // Use a state machine to properly handle nested braces and merge metadata
          let fixedJson = '';
          let i = 0;
          let objectDepth = 0; // Track depth of object braces (not array brackets)
          let inString = false;
          let escapeNext = false;
          
          while (i < cleanedJson.length) {
            const char = cleanedJson[i];
            
            if (escapeNext) {
              fixedJson += char;
              escapeNext = false;
              i++;
              continue;
            }
            
            if (char === '\\') {
              escapeNext = true;
              fixedJson += char;
              i++;
              continue;
            }
            
            if (char === '"') {
              inString = !inString;
              fixedJson += char;
              i++;
              continue;
            }
            
            if (!inString) {
              if (char === '{') {
                objectDepth++;
                fixedJson += char;
              } else if (char === '}') {
                objectDepth--;
                fixedJson += char;
                
                // When we close a top-level object in the array (objectDepth back to 0)
                // Check if the next thing is ", "metadata":"
                if (objectDepth === 0) {
                  // Look ahead for ", "metadata": {...}"
                  const remaining = cleanedJson.substring(i + 1).trim();
                  if (remaining.startsWith(', "metadata":')) {
                    // Extract the metadata object (handle nested braces)
                    let metadataStart = remaining.indexOf('{');
                    if (metadataStart !== -1) {
                      let metadataDepth = 0;
                      let metadataEnd = -1;
                      let inMetadataString = false;
                      let escapeNext = false;
                      
                      for (let j = metadataStart; j < remaining.length; j++) {
                        const metaChar = remaining[j];
                        
                        if (escapeNext) {
                          escapeNext = false;
                          continue;
                        }
                        
                        if (metaChar === '\\') {
                          escapeNext = true;
                          continue;
                        }
                        
                        if (metaChar === '"') {
                          inMetadataString = !inMetadataString;
                          continue;
                        }
                        
                        if (!inMetadataString) {
                          if (metaChar === '{') {
                            metadataDepth++;
                          } else if (metaChar === '}') {
                            metadataDepth--;
                            if (metadataDepth === 0) {
                              metadataEnd = j + 1;
                              break;
                            }
                          }
                        }
                      }
                      
                      if (metadataEnd !== -1) {
                        const metadataObj = remaining.substring(metadataStart, metadataEnd);
                        const fullMatch = remaining.substring(0, metadataEnd);
                        
                        // Merge metadata into the operation object
                        fixedJson = fixedJson.slice(0, -1); // Remove the closing brace
                        fixedJson += `, "metadata": ${metadataObj}}`;
                        i += 1 + fullMatch.length;
                        continue;
                      }
                    }
                  }
                }
              } else {
                fixedJson += char;
              }
            } else {
              fixedJson += char;
            }
            
            i++;
          }
          
          operations = JSON.parse(fixedJson);
          console.log("Successfully fixed malformed JSON structure");
        } catch (fixError) {
          console.error("Failed to parse operations JSON", e);
          console.error("Failed to fix malformed JSON", fixError);
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
      }
      
      // Post-process operations to fix any remaining structure issues
      if (Array.isArray(operations)) {
        const fixedOperations: any[] = [];
        for (let i = 0; i < operations.length; i++) {
          const item = operations[i];
          // If this is a metadata object and the previous item is an operation, merge them
          if (item && typeof item === 'object' && 'x' in item && 'y' in item && !('op' in item) && !('payload' in item)) {
            // This looks like a metadata object
            if (fixedOperations.length > 0) {
              const prevOp = fixedOperations[fixedOperations.length - 1];
              if (prevOp && typeof prevOp === 'object' && 'op' in prevOp && !('metadata' in prevOp)) {
                // Merge metadata into previous operation
                prevOp.metadata = item;
                continue; // Skip adding this as a separate item
              }
            }
          }
          fixedOperations.push(item);
        }
        operations = fixedOperations;
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



