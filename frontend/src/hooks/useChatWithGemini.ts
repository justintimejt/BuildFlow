import { useState, useEffect, useRef } from "react";
import { useProjectContext } from "../contexts/ProjectContext";
import { supabaseClient, isSupabaseAvailable } from "../lib/supabaseClient";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function useChatWithGemini(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const { applyOperations } = useProjectContext();
  const previousProjectIdRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  
  // Keep messagesRef in sync with messages state
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Load chat history from Supabase when projectId is available
  useEffect(() => {
    // Only clear messages if projectId actually changed to a different project
    // Don't clear if going from null/dummy to a UUID (project was just created)
    const projectIdChanged = previousProjectIdRef.current !== null && 
                             previousProjectIdRef.current !== projectId &&
                             previousProjectIdRef.current !== 'dummy' &&
                             projectId !== 'dummy';
    
    if (projectIdChanged) {
      // Only clear if switching to a completely different project
      console.log(`🔄 Project ID changed from ${previousProjectIdRef.current} to ${projectId}, clearing messages`);
      setMessages([]);
      hasLoadedRef.current = false;
    } else if (previousProjectIdRef.current !== projectId) {
      // Project ID changed but it's not a "real" change (e.g., null -> UUID or dummy -> UUID)
      // Don't clear messages, just update the ref
      console.log(`ℹ️  Project ID updated from ${previousProjectIdRef.current} to ${projectId}, preserving ${messagesRef.current.length} messages`);
    }
    
    previousProjectIdRef.current = projectId;
    setIsLoadingHistory(true);

    if (!projectId || projectId === 'dummy' || !isSupabaseAvailable() || !supabaseClient) {
      setIsLoadingHistory(false);
      return;
    }

    // Validate that projectId is a UUID (Supabase projects use UUIDs)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      // Not a valid UUID, so this project doesn't have chat history yet
      // But don't clear existing messages - they might be local messages that haven't been saved yet
      setIsLoadingHistory(false);
      return;
    }

    // If we've already loaded for this projectId and it hasn't changed, don't reload
    // BUT: if projectId changed (even if we think we loaded), we need to reload
    // because messages might have been migrated to this new projectId
    if (hasLoadedRef.current && !projectIdChanged && previousProjectIdRef.current === projectId) {
      setIsLoadingHistory(false);
      return;
    }
    
    // If projectId changed, reset hasLoaded so we reload
    if (projectIdChanged) {
      hasLoadedRef.current = false;
    }

    let cancelled = false;

    async function loadChatHistory() {
      try {
        if (!supabaseClient) {
          throw new Error("Supabase client not initialized");
        }
        
        console.log(`📥 Loading chat history for project: ${projectId}`);
        const { data, error } = await supabaseClient
          .from("chat_messages")
          .select("id, role, content, created_at")
          .eq("project_id", projectId)
          .order("created_at", { ascending: true })
          .limit(100); // Load up to 100 messages

        if (error) {
          console.error("❌ Failed to load chat history:", error);
          if (!cancelled) {
            setIsLoadingHistory(false);
          }
          return;
        }

        if (!cancelled && data) {
          // Map database messages to ChatMessage format
          const loadedMessages: ChatMessage[] = data.map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }));
          console.log(`✅ Loaded ${loadedMessages.length} chat messages for project ${projectId}`);
          
          // Merge with existing messages to preserve any local messages that haven't been saved yet
          setMessages((prevMessages) => {
            // CRITICAL: Always preserve existing messages if we have them
            // This ensures local messages (sent before project existed in Supabase) are never lost
            if (prevMessages.length > 0) {
              if (loadedMessages.length > 0) {
                // We have both local and loaded messages - merge them intelligently
                // Create a map of loaded messages by content to avoid duplicates
                const loadedMap = new Map<string, ChatMessage>();
                loadedMessages.forEach(msg => {
                  // Use content as key to identify duplicates
                  loadedMap.set(`${msg.role}:${msg.content}`, msg);
                });
                
                // Keep local messages that aren't in the loaded set
                const localOnly = prevMessages.filter(localMsg => {
                  const key = `${localMsg.role}:${localMsg.content}`;
                  return !loadedMap.has(key);
                });
                
                // Combine: loaded messages first (they have proper IDs), then local-only messages
                const merged = [...loadedMessages, ...localOnly];
                console.log(`🔀 Merged ${loadedMessages.length} Supabase messages with ${localOnly.length} local messages`);
                return merged;
              } else {
                // No messages in Supabase, but we have local messages - KEEP THEM
                console.log(`✅ No Supabase messages, preserving ${prevMessages.length} local messages`);
                return prevMessages;
              }
            }
            
            // No existing messages, use loaded messages (or empty array)
            return loadedMessages;
          });
          
          hasLoadedRef.current = true;
          setIsLoadingHistory(false);
        } else if (!cancelled) {
          console.log(`ℹ️  No chat history found for project ${projectId}`);
          // Don't clear existing messages - they might be local messages that haven't been saved yet
          // Only set hasLoaded if we actually tried to load (not if we skipped due to invalid projectId)
          hasLoadedRef.current = true;
          setIsLoadingHistory(false);
        }
      } catch (error) {
        console.error("❌ Error loading chat history:", error);
        if (!cancelled) {
          setIsLoadingHistory(false);
        }
      }
    }

    loadChatHistory();

    return () => {
      cancelled = true;
    };
  }, [projectId]);

  async function sendMessage(text: string) {
    // Validate that projectId is a valid UUID before sending (but allow 'dummy' for graceful degradation)
    if (!projectId || projectId === 'dummy') {
      console.error("❌ Cannot send message: Invalid or missing projectId", projectId);
      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Error: Project ID is invalid. Please ensure Supabase is configured and the project is saved.",
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    // Validate UUID format, but log a warning instead of blocking (backend will validate)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(projectId)) {
      console.warn("⚠️  Warning: projectId is not a valid UUID format:", projectId);
      console.warn("⚠️  Chat may not work correctly. Backend will validate and return an error if invalid.");
      // Still try to send - let the backend handle validation
    }

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
      
      console.log(`📤 Sending message to backend with projectId: ${projectId}`);
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
      
      // Handle new format with message and operations, or fallback to old format
      let assistantMessage: ChatMessage;
      let operations: any[] = [];
      
      if (data.message && data.operations !== undefined) {
        // New format: { message: string, operations: array }
        assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message,
        };
        operations = Array.isArray(data.operations) ? data.operations : [];
      } else if (data.operationsJson) {
        // Old format: { operationsJson: string }
        const operationsJson = data.operationsJson as string;
        assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: operationsJson,
        };
        
        // Parse operations from JSON string
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
        
        let parsedOperations;
        try {
          parsedOperations = JSON.parse(cleanedJson);
        } catch (e) {
          // Try to fix malformed JSON where metadata appears as separate objects
          try {
            // Use a state machine to properly handle nested braces and merge metadata
            let fixedJson = '';
            let i = 0;
            let objectDepth = 0;
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
                  
                  if (objectDepth === 0) {
                    const remaining = cleanedJson.substring(i + 1).trim();
                    if (remaining.startsWith(', "metadata":')) {
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
                          
                          fixedJson = fixedJson.slice(0, -1);
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
            
            parsedOperations = JSON.parse(fixedJson);
            console.log("Successfully fixed malformed JSON structure");
          } catch (fixError) {
            console.error("Failed to parse operations JSON", e);
            console.error("Failed to fix malformed JSON", fixError);
            parsedOperations = [];
          }
        }
        
        operations = Array.isArray(parsedOperations) ? parsedOperations : [];
      } else {
        // No operations in response
        assistantMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.message || "I received your message.",
        };
      }
      
      // Add message to chat
      setMessages((prev) => [...prev, assistantMessage]);
      
      // Post-process operations to fix any remaining structure issues
      if (Array.isArray(operations) && operations.length > 0) {
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
        
        // Apply operations to diagram
        applyOperations(operations);
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
    isLoadingHistory,
    sendMessage,
  };
}



