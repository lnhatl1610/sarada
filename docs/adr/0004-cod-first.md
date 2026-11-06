# ADR 0004: COD-first payment

- Status: Accepted
- Context: Online gateways add callback, reconciliation, and compliance requirements not needed for the initial product.
- Decision: First release supports cash on delivery, with a payment record and gateway boundary for future providers.
- Consequences: Payment is pending at order placement and becomes paid only when staff records successful collection. Refund workflow remains later scope.
