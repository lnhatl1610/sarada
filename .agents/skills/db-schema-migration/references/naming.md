# Schema Naming

- Tables: plural snake_case; columns: snake_case.
- Foreign keys: `<singular_table>_id`; index composite columns in query order.
- Boolean flags start with `is_`, `has_`, or a clear state name.
- Use `quantity` for physical stock and `reserved` for held stock; available is derived.
- Use `_snapshot` or order-line copied columns for historical values.
- Store prices and fees as unsigned integer VND; do not use decimal/floating-point arithmetic.
