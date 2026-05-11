import { useState } from "react";
import { setSocketAuthToken, socket } from "../../lib/socket";
import { useAuthStore } from "../../store/auth.store";

type Props = {
  conversationId: string;
};

export default function ChatInput({ conversationId }: Props) {
  const [content, setContent] = useState("");
  const token = useAuthStore((state) => state.token);

  const handleSend = () => {
    if (!content.trim()) return;

    setSocketAuthToken(token);
    if (!socket.connected) socket.connect();

    socket.emit("send_message", {
      conversationId,
      content
    });

    setContent("");
  };

  return (
    <div className="flex gap-2 p-3 border-t">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Nhập tin nhắn..."
        className="flex-1 border rounded px-3 py-2"
      />
      <button onClick={handleSend} className="px-4 py-2 border rounded">
        Gửi
      </button>
    </div>
  );
}