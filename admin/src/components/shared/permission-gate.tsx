/* eslint-disable react-refresh/only-export-components -- permission helper is intentionally colocated with the gate. */
import type { ReactNode } from 'react'

export function hasPermission(permissions: string[], permission: string) {
  return permissions.includes(permission)
}

export function PermissionGate({ permissions, permission, children, fallback = null }: { permissions: string[]; permission: string; children: ReactNode; fallback?: ReactNode }) {
  return hasPermission(permissions, permission) ? children : fallback
}
