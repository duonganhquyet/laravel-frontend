import { useState } from "react";
import { socket } from "../../lib/socket";

type Props = {
  conversationId: string;
};

export default function ChatInput({ conversationId }: Props) {
  const [content, setContent] = useState("");

  const handleSend = () => {
    if (!content.trim()) return;

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