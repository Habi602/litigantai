# Open Architecture Questions

All decisions recorded here as they are made. Unanswered questions remain for future phases.

---

## Marketplace & Bids

**Q1. When a bid is accepted, should a Conversation be automatically created?**
- Answer: **Yes** — auto-create conversation between litigant and specialist on acceptance ✅

---

**Q2. Can the litigant accept more than one specialist per case?**
- Answer: **No** — one accepted bid closes the listing; all others are rejected ✅

---

**Q3. When a specialist withdraws a bid, should the litigant be notified?**
- Answer: **Yes** — in-app notification: "A specialist withdrew their bid on your listing" ✅

---

**Q4. Can a specialist re-bid on a listing after withdrawing?**
- Answer: **No** — one bid per specialist per listing, final. Submit endpoint should block re-bids. ✅

---

## Notifications

**Q5. Should notifications also go out by email?**
- Answer: **In-app only for now** — email delivery to be added in a later phase ✅

---

**Q6. Should a notification be created when a collaborator is added manually (not via bid)?**
- Answer: **Yes** — notify the added user when manually added as a collaborator ✅

---

## Evidence & AI

**Q7. When evidence AI analysis completes, should an automatic CaseNote be created?**
- Answer: **Yes** — auto-note: "AI analysis complete: extracted X key facts and Y timeline events." ✅

---

**Q8. Should the audit log include the user's IP address?**
- Answer: **Yes** — pass `request.client.host` from the router to `log_action()` ✅

---

## Payments & Invoices

**Q9. When should an invoice be auto-generated?**
- Answer: **When payment is made** — invoice is created as a record/confirmation of payment ✅

---

**Q10. Do we integrate Stripe for payments, and when?**
- Answer: **Structure only for now** — payments table exists but no Stripe integration yet. Revisit in a future phase. ✅

---

## User Profiles

**Q11. Should a litigant_profile be auto-created on registration?**
- Answer: **Yes, role-dependent** — if registering as litigant → create litigant_profile; if specialist → create specialist_profile ✅

---

**Q12. Same question for specialist_profile?**
- Answer: **Yes** — covered by Q11 ✅

---

## Audit Log

**Q13. What is the data retention policy for audit_log?**
- Answer: **1 year** — entries older than 365 days should be purged ✅

---

**Q14. Should bundle PDF downloads be logged in audit_log?**
- Answer: **Yes** — log who downloaded which bundle and when ✅

---

## Collaboration

**Q15. When a specialist creates a CaseNote, should the litigant be notified?**
- Answer: **Yes** — in-app notification: "Your specialist left a note on your case" ✅

---

**Q16. Can a specialist be removed from a case after being added as a collaborator?**
- Answer: **Yes** — litigant can revoke access via a DELETE endpoint ✅
