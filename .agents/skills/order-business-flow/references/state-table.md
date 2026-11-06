# Order State Table

| From | Event | To | Actor/condition |
|---|---|---|---|
| pending | confirm | confirmed | authorized staff |
| pending | cancel | cancelled | customer or staff |
| confirmed | pack | processing | authorized staff |
| confirmed | cancel | cancelled | authorized staff |
| processing | ship | shipping | authorized staff |
| processing | cancel | cancelled | authorized staff |
| shipping | deliver | delivered | authorized staff; record COD collection separately |
| shipping | fail | delivery_failed | authorized staff |
| delivery_failed | retry | shipping | authorized staff |
| delivery_failed | return | returned | authorized staff |
| delivered | close | completed | scheduler/staff after configured period |
