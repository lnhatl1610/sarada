# ADR 0005: Domain modules inside Laravel monolith

- Status: Accepted
- Context: One API needs clear ownership for catalog, cart, orders, inventory, promotion, identity, and content without operational overhead of microservices.
- Decision: Use a modular Laravel monolith. Module route files and domain actions own business logic; shared support contracts are explicit.
- Consequences: Simple deployment and transactions; boundaries require discipline and future static checks. Extract a service only when load/ownership needs are measured.
