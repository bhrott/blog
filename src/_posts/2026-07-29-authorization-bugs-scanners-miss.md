---
layout: post
title:  "The Authorization Bugs No Scanner Will Ever Find for You"
date:   2026-07-29 09:20:00 -0300
categories: appsec web
tags: [access-control, idor, testing]
description: >-
  Scanners cannot find broken access control because they do not know who owns
  what. Push the check into a chokepoint and prove it with two-identity tests.
---
Every scanner on the market will find your reflected XSS. None of them will tell
you that `GET /api/invoices/8412` returns someone else's invoice. The tool sees
a 200 and a well-formed JSON body and moves on, because it has no idea that the
record belongs to a different tenant.

Broken access control stays at the top of the OWASP list for exactly this
reason: it is the one bug class where the vulnerability is *semantic*, not
syntactic.

<!--more-->

## Why automation is blind here

A scanner needs an oracle — some signal that says "this response is wrong." For
injection it has one: an error, a delay, a callback. For authorization there is
nothing observable in the response itself. `{"id":8412,"total":"R$ 1.240,00"}`
is a perfectly valid invoice. It is only a vulnerability once you know it was
requested by a session that should not see it.

The oracle has to come from outside the request. That means you have to supply
it, and the cheapest way to supply it is a second identity.

## The two-identity test

Take every authenticated test you already have and run it twice: once as the
owner, once as a stranger. The stranger must get a 403 or a 404 — never a 200.

```python
# conftest.py — two tenants that must never see each other's data.
@pytest.fixture
def alice(client):
    return client.login("alice@acme.test")     # owns invoice 8412

@pytest.fixture
def mallory(client):
    return client.login("mallory@evil.test")   # owns nothing


@pytest.mark.parametrize("method,path", [
    ("GET",    "/api/invoices/8412"),
    ("PATCH",  "/api/invoices/8412"),
    ("DELETE", "/api/invoices/8412"),
    ("GET",    "/api/invoices/8412/attachments"),
])
def test_cross_tenant_access_is_denied(mallory, method, path):
    response = mallory.request(method, path)
    assert response.status_code in (403, 404), (
        f"{method} {path} leaked across tenants: {response.status_code}"
    )
```

That parametrized list is the whole trick. It costs four lines per resource and
it catches the bug class that costs the most to find in production.

## Object-level is only half of it

Two other variants hide behind the same blind spot:

| Variant | The question it answers | Typical miss |
|---|---|---|
| Object-level (IDOR) | Can I read *your* record? | Sequential IDs, no owner check |
| Function-level | Can I call an admin route? | UI hides the button, API does not |
| Field-level | Can I write a field I shouldn't? | Mass assignment sets `role: admin` |

Field-level is the sneakiest. The endpoint is legitimately yours, the object is
legitimately yours, and you simply include one extra key in the JSON body:

```http
PATCH /api/users/me HTTP/1.1
Content-Type: application/json

{"display_name": "Mallory", "role": "admin", "tenant_id": 1}
```

If the handler passes the parsed body straight into an ORM update, you just
promoted yourself. An allow-list of writable fields — never a deny-list — is the
fix, and it belongs in the serializer, not in a code review comment.

## Make the check impossible to forget

Per-handler `if` statements do not survive contact with a growing team. Somebody
adds route 61 and forgets. Push the decision into a chokepoint every request must
cross:

- **Scope the query, not the response.** `Invoice.where(tenant: current_tenant)`
  as the base scope makes the cross-tenant read return 404 by construction. You
  cannot forget a filter that lives in the only place rows come from.
- **Deny by default at the router.** Routes opt *in* to being public. A new
  handler with no policy declared should fail closed — and it should fail loudly
  in CI, not silently at runtime.
- **Never trust an identifier from the client** for anything but lookup. The
  tenant comes from the session; the ID in the URL only narrows the search
  inside it.

The failure mode of good access control is boring: a stranger asks for invoice
8412 and the database honestly reports that no such invoice exists. That 404 is
not a lie. Within that session's world, it is the truth.
