'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle, Info } from 'lucide-react'

/**
 * Staff-facing notifications.
 *
 * Replaces window.alert, which blocks the whole page and cannot show a title,
 * a hint, or a "try again" action. A waiter taking an order needs to read a
 * short message and keep serving; a modal alert stops the till.
 */

export interface Notice {
  id: number
  tone: 'error' | 'info' | 'success'
  title: string
  message: string
  hint?: string
}

let nextId = 1
const listeners = new Set<(notices: Notice[]) => void>()
let current: Notice[] = []

function emit() {
  for (const listener of listeners) listener([...current])
}

/** Show a notice. Auto-dismisses unless it is an error the staff must see. */
export function notify(notice: Omit<Notice, 'id'>) {
  const id = nextId++
  current = [...current, { ...notice, id }]
  emit()

  // Errors stay until dismissed: a payment failure is not something to miss
  // while the customer waits.
  if (notice.tone !== 'error') {
    setTimeout(() => dismissNotice(id), 4000)
  }
}

export function dismissNotice(id: number) {
  current = current.filter((notice) => notice.id !== id)
  emit()
}

export function notifyError(title: string, message: string, hint?: string) {
  notify({ tone: 'error', title, message, hint })
}

export function notifySuccess(message: string) {
  notify({ tone: 'success', title: 'Done', message })
}

/** Convenience for a failed fetch: one line, already phrased for staff. */
export function notifyErrorText(message: string) {
  notify({ tone: 'error', title: 'That did not work', message })
}

export function NoticeList() {
  const [notices, setNotices] = useState<Notice[]>(current)

  useEffect(() => {
    listeners.add(setNotices)
    return () => {
      listeners.delete(setNotices)
    }
  }, [])

  if (notices.length === 0) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6">
      {notices.map((notice) => (
        <div
          key={notice.id}
          role="status"
          className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 border px-4 py-3 shadow-lg ${
            notice.tone === 'error'
              ? 'border-red-400/30 bg-[#241a18] text-[#f0d5cd]'
              : notice.tone === 'success'
                ? 'border-[#7cc58f]/30 bg-[#16211a] text-[#cfe8d6]'
                : 'border-white/[0.1] bg-[#1c1e1a] text-[#d6d3ca]'
          }`}
        >
          <span className="mt-0.5 shrink-0">
            {notice.tone === 'error' ? (
              <AlertTriangle size={16} />
            ) : (
              <Info size={16} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold">{notice.title}</p>
            <p className="mt-0.5 text-xs leading-5 opacity-90">{notice.message}</p>
            {notice.hint && (
              <p className="mt-1 text-[11px] leading-4 opacity-70">{notice.hint}</p>
            )}
          </div>
          <button
            onClick={() => dismissNotice(notice.id)}
            className="shrink-0 opacity-50 transition hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
