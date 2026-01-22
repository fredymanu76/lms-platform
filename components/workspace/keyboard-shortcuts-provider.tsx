'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { KeyboardShortcutsDialog } from './keyboard-shortcuts-dialog'
import { toast } from 'sonner'

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode
  orgId: string
}

export function KeyboardShortcutsProvider({ children, orgId }: KeyboardShortcutsProviderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [showShortcuts, setShowShortcuts] = useState(false)

  // Check if we're in the course editor
  const isInEditor = pathname?.includes('/author/edit/')

  useKeyboardShortcuts([
    // Help dialog
    {
      key: '?',
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: () => setShowShortcuts(true),
    },
    // Navigation shortcuts
    {
      key: 'd',
      description: 'Go to Dashboard',
      action: () => {
        if (pathname?.includes('/author/edit/')) {
          toast.info('Save your changes before navigating away')
          return
        }
        router.push(`/workspace/${orgId}`)
      },
    },
    {
      key: 'l',
      description: 'Go to Learning',
      action: () => {
        if (pathname?.includes('/author/edit/')) {
          toast.info('Save your changes before navigating away')
          return
        }
        router.push(`/workspace/${orgId}/learn`)
      },
    },
    {
      key: 'c',
      description: 'Go to Catalogue',
      action: () => {
        if (pathname?.includes('/author/edit/')) {
          toast.info('Save your changes before navigating away')
          return
        }
        router.push(`/workspace/${orgId}/catalogue`)
      },
    },
    {
      key: 'a',
      description: 'Go to Author Studio',
      action: () => {
        if (pathname?.includes('/author/edit/')) {
          toast.info('Save your changes before navigating away')
          return
        }
        router.push(`/workspace/${orgId}/author`)
      },
    },
  ])

  return (
    <>
      {children}
      <KeyboardShortcutsDialog open={showShortcuts} onOpenChange={setShowShortcuts} />
    </>
  )
}
