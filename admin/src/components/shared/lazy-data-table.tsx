import { lazy, type ComponentType } from 'react'
import type { DataTableProps } from './data-table'

const DataTableChunk = lazy(async () => {
  const { DataTable } = await import('./data-table')
  return { default: DataTable as unknown as ComponentType<DataTableProps<unknown>> }
})

export function LazyDataTable<Row>(props: DataTableProps<Row>) {
  const TypedDataTable = DataTableChunk as unknown as ComponentType<DataTableProps<Row>>
  return <TypedDataTable {...props} />
}
