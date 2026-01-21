'use client'

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"
import { usePathname } from "next/navigation"

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
  homeHref?: string
}

export function Breadcrumbs({ items = [], homeHref = "/" }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbItems = items.length > 0 ? items : generateBreadcrumbs(pathname)

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      <Link
        href={homeHref}
        className="flex items-center hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1

        return (
          <div key={index} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : ""}>
                {item.label}
              </span>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)
  const breadcrumbs: BreadcrumbItem[] = []

  // Map of path segments to readable labels
  const labelMap: Record<string, string> = {
    workspace: 'Workspace',
    admin: 'Admin',
    author: 'Author Studio',
    learn: 'My Learning',
    catalogue: 'Course Catalogue',
    compliance: 'Compliance',
    team: 'Team',
    assignments: 'Assignments',
    settings: 'Settings',
    policies: 'Policies',
    edit: 'Edit',
    new: 'New',
    preview: 'Preview',
    lesson: 'Lesson',
    quiz: 'Quiz',
    invite: 'Invite',
    export: 'Export',
  }

  let currentPath = ''
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`

    // Skip UUID-like segments (org IDs, course IDs, etc.)
    if (segment.length === 36 && segment.includes('-')) {
      return
    }

    // Skip numeric segments (version IDs, lesson IDs)
    if (/^\d+$/.test(segment)) {
      return
    }

    const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    breadcrumbs.push({
      label,
      href: index < segments.length - 1 ? currentPath : undefined,
    })
  })

  return breadcrumbs
}
