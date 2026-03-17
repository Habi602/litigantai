#!/usr/bin/env python3
"""
End-to-end smoke test for the NoahLaw backend.
Exercises the full user journey: register → login → case → evidence →
analyse → facts → timeline → bundle → statement of claim → cleanup.

Usage:
    cd backend
    source venv/bin/activate
    python smoke_test.py
    # or:
    BASE_URL=http://localhost:8000 python smoke_test.py
"""

import os
import sys
import time
import requests
from io import BytesIO

try:
    from reportlab.pdfgen import canvas as rl_canvas
except ImportError:
    print("reportlab not installed — run: pip install reportlab")
    sys.exit(1)

BASE = os.environ.get("BASE_URL", "http://localhost:8000").rstrip("/")
API = f"{BASE}/api/v1"

passes = 0
failures = 0


def ok(label: str) -> None:
    global passes
    passes += 1
    print(f"[PASS] {label}")


def fail(label: str, reason: str) -> None:
    global failures
    failures += 1
    print(f"[FAIL] {label} — {reason}")


def make_test_pdf(title: str) -> bytes:
    buf = BytesIO()
    c = rl_canvas.Canvas(buf)
    c.drawString(100, 750, title)
    c.save()
    buf.seek(0)
    return buf.read()


def main() -> None:
    session = requests.Session()
    ts = int(time.time())
    username = f"smoke_{ts}"
    password = "SmokeTest123!"
    token = None
    case_id = None

    try:
        # ── Register ──────────────────────────────────────────────────────────
        r = session.post(
            f"{API}/auth/register",
            json={"username": username, "password": password, "full_name": "Smoke Test"},
            timeout=60,
        )
        if r.status_code in (200, 201):
            ok("Register user")
        else:
            fail("Register user", f"HTTP {r.status_code}: {r.text[:200]}")
            return

        # ── Login ─────────────────────────────────────────────────────────────
        r = session.post(
            f"{API}/auth/login",
            json={"username": username, "password": password},
            timeout=60,
        )
        if r.status_code == 200 and "access_token" in r.json():
            token = r.json()["access_token"]
            ok("Login")
        else:
            fail("Login", f"HTTP {r.status_code}: {r.text[:200]}")
            return

        headers = {"Authorization": f"Bearer {token}"}

        # ── Create case ───────────────────────────────────────────────────────
        r = session.post(
            f"{API}/cases/",
            json={"title": "Smoke Test Case", "description": "Automated smoke test"},
            headers=headers,
            timeout=60,
        )
        if r.status_code in (200, 201):
            case_id = r.json()["id"]
            ok("Create case")
        else:
            fail("Create case", f"HTTP {r.status_code}: {r.text[:200]}")
            return

        # ── Upload evidence (2 PDFs in one request) ───────────────────────────
        pdf1 = make_test_pdf("Smoke Test Document 1 — Contract dated 1 January 2024")
        pdf2 = make_test_pdf("Smoke Test Document 2 — Email dated 15 March 2024")
        files = [
            ("files", ("doc1.pdf", pdf1, "application/pdf")),
            ("files", ("doc2.pdf", pdf2, "application/pdf")),
        ]
        r = session.post(
            f"{API}/cases/{case_id}/evidence/",
            files=files,
            headers=headers,
            timeout=60,
        )
        if r.status_code in (200, 201):
            evidence_list = r.json() if isinstance(r.json(), list) else [r.json()]
            evidence_ids = [e["id"] for e in evidence_list]
            ok("Upload evidence")
        else:
            fail("Upload evidence", f"HTTP {r.status_code}: {r.text[:200]}")
            return

        # ── Analyse evidence ──────────────────────────────────────────────────
        for eid, name in zip(evidence_ids, ["doc1.pdf", "doc2.pdf"]):
            r = session.post(
                f"{API}/cases/{case_id}/evidence/{eid}/analyze",
                headers=headers,
                timeout=60,
            )
            if r.status_code in (200, 201):
                ok(f"Analyse evidence ({name})")
            else:
                fail(f"Analyse evidence ({name})", f"HTTP {r.status_code}: {r.text[:200]}")

        # ── Facts extracted ───────────────────────────────────────────────────
        r = session.get(
            f"{API}/cases/{case_id}/facts",
            headers=headers,
            timeout=60,
        )
        if r.status_code == 200 and len(r.json()) >= 1:
            ok("Facts extracted")
        elif r.status_code == 200:
            fail("Facts extracted", f"0 facts returned (expected ≥ 1)")
        else:
            fail("Facts extracted", f"HTTP {r.status_code}: {r.text[:200]}")

        # ── Generate timeline ─────────────────────────────────────────────────
        r = session.post(
            f"{API}/cases/{case_id}/timeline/generate",
            headers=headers,
            timeout=60,
        )
        if r.status_code in (200, 201):
            ok("Generate timeline")
        else:
            fail("Generate timeline", f"HTTP {r.status_code}: {r.text[:200]}")

        # ── Propose bundle order ──────────────────────────────────────────────
        r = session.post(
            f"{API}/cases/{case_id}/bundles/propose-order",
            json={"evidence_ids": evidence_ids},
            headers=headers,
            timeout=60,
        )
        if r.status_code in (200, 201):
            ok("Propose bundle order")
        else:
            fail("Propose bundle order", f"HTTP {r.status_code}: {r.text[:200]}")

        # ── Create bundle ─────────────────────────────────────────────────────
        r = session.post(
            f"{API}/cases/{case_id}/bundles/",
            json={"title": "Smoke Test Bundle", "evidence_ids": evidence_ids},
            headers=headers,
            timeout=60,
        )
        if r.status_code in (200, 201):
            bundle_id = r.json()["id"]
            ok("Create bundle")
        else:
            fail("Create bundle", f"HTTP {r.status_code}: {r.text[:200]}")
            bundle_id = None

        # ── Download bundle PDF ───────────────────────────────────────────────
        if bundle_id is not None:
            r = session.get(
                f"{API}/cases/{case_id}/bundles/{bundle_id}/file",
                params={"token": token},
                timeout=60,
            )
            if r.status_code == 200 and r.content[:4] == b"%PDF" and len(r.content) > 0:
                ok("Download bundle PDF")
            elif r.status_code == 200:
                fail("Download bundle PDF", f"Response is not a valid PDF (got {r.content[:20]!r})")
            else:
                fail("Download bundle PDF", f"HTTP {r.status_code}: {r.text[:200]}")
        else:
            fail("Download bundle PDF", "Skipped — bundle creation failed")

        # ── Generate statement of claim ───────────────────────────────────────
        r = session.post(
            f"{API}/cases/{case_id}/statement-of-claim/generate",
            headers=headers,
            timeout=60,
        )
        if r.status_code in (200, 201):
            ok("Generate statement of claim")
        else:
            fail("Generate statement of claim", f"HTTP {r.status_code}: {r.text[:200]}")

    finally:
        # ── Cleanup ───────────────────────────────────────────────────────────
        if case_id is not None and token is not None:
            headers = {"Authorization": f"Bearer {token}"}
            r = session.delete(
                f"{API}/cases/{case_id}",
                headers=headers,
                timeout=60,
            )
            if r.status_code in (200, 204):
                ok("Cleanup")
            else:
                fail("Cleanup", f"HTTP {r.status_code}: {r.text[:200]}")

        total = passes + failures
        print()
        if failures == 0:
            print(f"✓ All {total} tests passed")
        else:
            print(f"✗ {failures}/{total} tests failed")
            sys.exit(1)


if __name__ == "__main__":
    main()
