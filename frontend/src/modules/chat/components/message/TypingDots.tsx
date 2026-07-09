// stack_sandbox/frontend_web/src/modules/chat/components/message/TypingDots.tsx

// Three bouncing dots shown while waiting for the first streaming token.

export function TypingDots() {
  return (
    <span
      className="inline-flex items-center gap-1 py-0.5"
      role="status"
      aria-label="Waiting for response"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="chat-typing-dot h-1.5 w-1.5 rounded-full bg-stone-500"
          style={{ animationDelay: `${index * 0.16}s` }}
        />
      ))}
    </span>
  );
}
