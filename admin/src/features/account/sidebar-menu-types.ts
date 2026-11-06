export type SidebarMenuGroup = {
  label: string
  items: Array<{
    label: string
    permission: string
    page: string
    href?: string
    key?: string
  }>
}
