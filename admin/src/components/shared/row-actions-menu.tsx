import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu'

export type RowAction = {
  id: string
  label: string
  icon?: ReactNode
  href?: string
  target?: '_blank'
  onSelect?: () => void
  disabled?: boolean
  destructive?: boolean
}

type Props = { label: string; actions: RowAction[] }

function ActionContent({ action }: { action: RowAction }) {
  return <>{action.icon && <span className="row-actions-menu-icon" aria-hidden="true">{action.icon}</span>}{action.label}</>
}

export function RowActionsMenu({ label, actions }: Props) {
  const regularActions = actions.filter((action) => !action.destructive)
  const destructiveActions = actions.filter((action) => action.destructive)
  if (regularActions.length + destructiveActions.length === 0) return null

  return <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button className="icon-button row-actions-menu-trigger" type="button" aria-label={label} title={label}>
        <MoreHorizontal size={18} aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="row-actions-menu-content">
      {regularActions.map((action) => action.href
        ? <DropdownMenuItem key={action.id} asChild disabled={action.disabled}><a href={action.href} target={action.target} rel={action.target === '_blank' ? 'noreferrer' : undefined}><ActionContent action={action} /></a></DropdownMenuItem>
        : <DropdownMenuItem key={action.id} onSelect={action.onSelect} disabled={action.disabled}><ActionContent action={action} /></DropdownMenuItem>)}
      {destructiveActions.length > 0 && <>
        {regularActions.length > 0 && <DropdownMenuSeparator />}
        {destructiveActions.map((action) => action.href
          ? <DropdownMenuItem key={action.id} asChild variant="destructive" disabled={action.disabled}><a href={action.href} target={action.target} rel={action.target === '_blank' ? 'noreferrer' : undefined}><ActionContent action={action} /></a></DropdownMenuItem>
          : <DropdownMenuItem key={action.id} variant="destructive" onSelect={action.onSelect} disabled={action.disabled}><ActionContent action={action} /></DropdownMenuItem>)}
      </>}
    </DropdownMenuContent>
  </DropdownMenu>
}
