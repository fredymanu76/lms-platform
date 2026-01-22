"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { type ReactNode } from "react"

interface NavLinkProps {
  href: string
  icon: ReactNode
  label: string
}

export function NavLink({ href, icon, label }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start gap-2 ${
          isActive ? "nav-tab-active" : "nav-tab-inactive"
        }`}
      >
        {icon}
        {label}
      </Button>
    </Link>
  )
}
