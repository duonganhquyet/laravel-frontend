import { useEffect, useCallback, useState } from "react";
import { socket } from "../lib/socket";
import { messageApi } from "../api/message.api";
import { useChatStore } from "../store/chat.store";
import { useAuthStore } from "../store/auth.store";

export const useChat = (conversationId: string) => {
  const { messages, setMessages, addMessage } = useChatStore();
  const { user } = useAuthStore();
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const res = await messageApi.getMessages(+conversationId);
      setMessages(res.data);
      setHasMore(false);
    } catch (err) {
      console.error("Fetch messages error:", err);
    }
  }, [conversationId, setMessages]);

  useEffect(() => {
    if (!conversationId) return;

    setPage(1);
    setLoadingMore(false);
    setHasMore(false);
    fetchMessages();

    socket.connect();
    socket.emit("join_room", conversationId);

    const handleReceiveMessage = (newMessage: any) => {
      if (newMessage.ConversationId === +conversationId) {
        addMessage(newMessage);
      }
    };

    socket.on("receive_message", handleReceiveMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, [conversationId, fetchMessages, addMessage]);

  const loadMore = async () => {
    // Backend currently returns the full conversation history in one request.
    // Paging is not supported in the current API contract.
    return;
  };

  return { messages, loadMore, hasMore, loadingMore, user, page };
};