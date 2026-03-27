import { useState, useRef } from 'react'

export function useToast() {
  const [message, setMessage] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function showToast(msg: string) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setMessage(msg)
    timerRef.current = setTimeout(() => setMessage(null), 3000)
  }

  return { toastMessage: message, showToast }
}

export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-surface rounded-2xl shadow-lg px-4 py-3 border border-border max-w-xs">
      <div className="w-6 h-6 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
        <svg
          className="w-3.5 h-3.5 text-success"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-800">{message}</p>
    </div>
  )
}
