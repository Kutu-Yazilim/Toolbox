import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Trash2Icon } from "lucide-react"

const RESPONSE_TYPE = {
  POSITIVE: "positive",
  NEUTRAL: "neutral",
  NEGATIVE: "negative",
} as const

type ResponseType = (typeof RESPONSE_TYPE)[keyof typeof RESPONSE_TYPE]

type Response = {
  text: string
  type: ResponseType
}

const RESPONSES: Response[] = [
  // Positive (10)
  { text: "It is certain", type: RESPONSE_TYPE.POSITIVE },
  { text: "It is decidedly so", type: RESPONSE_TYPE.POSITIVE },
  { text: "Without a doubt", type: RESPONSE_TYPE.POSITIVE },
  { text: "Yes definitely", type: RESPONSE_TYPE.POSITIVE },
  { text: "You may rely on it", type: RESPONSE_TYPE.POSITIVE },
  { text: "As I see it, yes", type: RESPONSE_TYPE.POSITIVE },
  { text: "Most likely", type: RESPONSE_TYPE.POSITIVE },
  { text: "Outlook good", type: RESPONSE_TYPE.POSITIVE },
  { text: "Yes", type: RESPONSE_TYPE.POSITIVE },
  { text: "Signs point to yes", type: RESPONSE_TYPE.POSITIVE },
  // Neutral (5)
  { text: "Reply hazy, try again", type: RESPONSE_TYPE.NEUTRAL },
  { text: "Ask again later", type: RESPONSE_TYPE.NEUTRAL },
  { text: "Better not tell you now", type: RESPONSE_TYPE.NEUTRAL },
  { text: "Cannot predict now", type: RESPONSE_TYPE.NEUTRAL },
  { text: "Concentrate and ask again", type: RESPONSE_TYPE.NEUTRAL },
  // Negative (5)
  { text: "Don't count on it", type: RESPONSE_TYPE.NEGATIVE },
  { text: "My reply is no", type: RESPONSE_TYPE.NEGATIVE },
  { text: "My sources say no", type: RESPONSE_TYPE.NEGATIVE },
  { text: "Outlook not so good", type: RESPONSE_TYPE.NEGATIVE },
  { text: "Very doubtful", type: RESPONSE_TYPE.NEGATIVE },
]

const RESPONSE_COLOR: Record<ResponseType, string> = {
  [RESPONSE_TYPE.POSITIVE]: "text-green-400",
  [RESPONSE_TYPE.NEUTRAL]: "text-yellow-400",
  [RESPONSE_TYPE.NEGATIVE]: "text-red-400",
}

type HistoryEntry = {
  question: string
  answer: Response
  timestamp: number
}

export function Magic8Ball() {
  const [question, setQuestion] = useState("")
  const [isShaking, setIsShaking] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState<Response | null>(null)
  const [showAnswer, setShowAnswer] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const shake = useCallback(() => {
    const trimmed = question.trim()
    if (isShaking || !trimmed) return

    setIsShaking(true)
    setShowAnswer(false)

    const answer = RESPONSES[Math.floor(Math.random() * RESPONSES.length)]

    setTimeout(() => {
      setCurrentAnswer(answer)
      setShowAnswer(true)
      setIsShaking(false)
      setHistory((prev) => [
        { question: trimmed, answer, timestamp: Date.now() },
        ...prev,
      ])
      setQuestion("")
    }, 800)
  }, [isShaking, question])

  return (
    <div className="h-full flex flex-col md:flex-row min-h-0">
      {/* Main area */}
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 p-6 gap-6">
        {/* 8-Ball */}
        <button
          type="button"
          onClick={shake}
          disabled={isShaking || !question.trim()}
          className={`relative w-64 h-64 rounded-full bg-black flex items-center justify-center
            shadow-[inset_-8px_-8px_24px_rgba(80,80,80,0.4),0_8px_32px_rgba(0,0,0,0.5)]
            cursor-pointer transition-opacity select-none
            ${!question.trim() ? "opacity-60 cursor-not-allowed" : "hover:shadow-[inset_-8px_-8px_24px_rgba(80,80,80,0.4),0_8px_40px_rgba(0,0,0,0.6)]"}
            ${isShaking ? "animate-8ball-shake" : ""}`}
          aria-label="Shake the Magic 8-Ball"
        >
          {/* Inner white circle */}
          <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center">
            {/* Blue triangle window */}
            <div
              className="w-24 h-24 flex items-center justify-center"
              style={{
                clipPath: "polygon(50% 15%, 15% 85%, 85% 85%)",
                backgroundColor: "#1e3a5f",
              }}
            >
              {/* Answer text */}
              <span
                className={`text-[10px] font-bold leading-tight text-center px-1 pt-4 transition-opacity duration-300 ${
                  showAnswer && currentAnswer ? `opacity-100 ${RESPONSE_COLOR[currentAnswer.type]}` : "opacity-0"
                }`}
              >
                {showAnswer && currentAnswer
                  ? currentAnswer.text
                  : "8"}
              </span>
            </div>
          </div>
        </button>

        {/* Question input + Shake button */}
        <div className="flex gap-2 w-full max-w-md">
          <input
            type="text"
            value={question}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuestion(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === "Enter") shake()
            }}
            placeholder="Ask a yes/no question..."
            disabled={isShaking}
            className="flex-1 h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          />
          <Button
            onClick={shake}
            disabled={isShaking || !question.trim()}
          >
            {isShaking ? "Shaking..." : "Shake"}
          </Button>
        </div>
      </div>

      {/* History sidebar */}
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-border flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-muted-foreground">
            History ({history.length})
          </span>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHistory([])}
              className="h-7 px-2"
            >
              <Trash2Icon className="w-3.5 h-3.5 mr-1" />
              Clear
            </Button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto min-h-0 p-3 space-y-2">
          {history.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-6">
              No questions asked yet
            </p>
          )}
          {history.map((entry) => (
            <div
              key={entry.timestamp}
              className="rounded-lg border border-border p-3 space-y-1"
            >
              <p className="text-sm text-foreground">{entry.question}</p>
              <p
                className={`text-xs font-semibold ${RESPONSE_COLOR[entry.answer.type]}`}
              >
                {entry.answer.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Shake animation keyframes */}
      <style>{`
        @keyframes ball-shake {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          10% { transform: translate(-6px, -3px) rotate(-4deg); }
          20% { transform: translate(5px, 4px) rotate(3deg); }
          30% { transform: translate(-7px, 2px) rotate(-3deg); }
          40% { transform: translate(4px, -5px) rotate(4deg); }
          50% { transform: translate(-3px, 5px) rotate(-2deg); }
          60% { transform: translate(6px, -2px) rotate(3deg); }
          70% { transform: translate(-4px, 3px) rotate(-4deg); }
          80% { transform: translate(3px, -4px) rotate(2deg); }
          90% { transform: translate(-5px, 2px) rotate(-3deg); }
        }
        .animate-8ball-shake {
          animation: ball-shake 0.8s ease-in-out;
        }
      `}</style>
    </div>
  )
}
