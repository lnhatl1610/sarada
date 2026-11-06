# Storefront Referral and Affiliate Previews

Routes: `/refer-a-friend` and `/affiliate`.

## Referral page

- Editorial hero with a link to sign in/register.
- Disabled referral-code and copy control while no live code exists.
- Separate benefit cards for inviter and invitee without invented amounts or terms.
- Empty referral-history state until the API is connected.

## Affiliate page

- Editorial introduction, three onboarding steps, and an application form for name, email, main channel, channel URL, and an optional short introduction.
- Client validation checks required fields and URL/email formats. Submitting only confirms that the preview form is valid; it does not create or send an application.
- No commission, approval criteria, settlement schedule, or reward promises are shown before policy approval.

Both routes are excluded from indexing until the actual program rules and API are ready. The complete referral/affiliate workflow remains incomplete until approved eligibility/fraud/reward policies and persistent server-side flows exist.
