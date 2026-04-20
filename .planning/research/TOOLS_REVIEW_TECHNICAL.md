# Tools to Review — Technical (Developer)
**Goal:** Evaluate each library/framework for fit with NoahLaw's stack before building
**Research date:** March 2026

---

## PART 1 — BUNDLING

### Already in the NoahLaw stack — no action needed

| Library | Already used for |
|---------|----------------|
| **pypdf** | PDF merging, splitting, link annotation writing in `bundling/bundle_pdfs.py` |
| **ReportLab** | Index page generation, per-page footer overlays in `bundling/bundle_pdfs.py` |

These cover the current bundling requirements. Evaluate the libraries below only if a specific capability gap is identified.

---

### PyMuPDF (fitz)
- **Repo:** github.com/pymupdf/PyMuPDF
- **Language:** Python (C bindings to MuPDF)
- **License:** AGPL / commercial
- **What it does:** High-performance PDF manipulation. Reads, writes, and annotates PDFs. Crucially, supports **cross-document link targets** — a link in document A can point to a specific page in document B within the same bundle.
- **Why evaluate:** pypdf's `AnnotationBuilder` writes link annotations but targets within the same PDF only. PyMuPDF can write annotations that resolve across merged PDFs and is the right tool for the stitching feature.
- **Evaluate for:**
  - Cross-document link annotation support
  - Performance on 5000-page bundles vs pypdf
  - Handling of malformed/scanned court PDFs
- **Potential conflict:** AGPL license — if the bundling server is hosted, the service itself may need to be open-sourced unless a commercial license is purchased. Verify before adopting.

---

### pikepdf
- **Repo:** github.com/pikepdf/pikepdf
- **Language:** Python (bindings to qpdf)
- **License:** MIT
- **What it does:** Low-level PDF repair and manipulation via qpdf. Fixes malformed PDFs that pypdf and PyMuPDF reject.
- **Why evaluate:** Court documents are frequently scanned, converted from Word via print-to-PDF, or otherwise malformed. pikepdf can repair them before they enter the bundle pipeline.
- **Evaluate for:**
  - Can it fix PDFs that cause pypdf to throw on merge?
  - What's the overhead of running it as a pre-processing step?
  - Does it preserve existing link annotations during repair?

---

### pdf-lib
- **Repo:** github.com/Hopding/pdf-lib
- **Language:** JavaScript / TypeScript
- **License:** MIT
- **What it does:** Create and modify PDFs in the browser or Node.js. Supports link annotations.
- **Why evaluate:** If the bundling utility is ever moved client-side (like BunTool does), pdf-lib is the JS equivalent of pypdf + reportlab.
- **Evaluate for:**
  - Can it replicate the index page and footer overlay logic from `bundle_pdfs.py`?
  - Performance on large bundles in the browser
  - Link annotation support vs PyMuPDF

---

### PDF.js
- **Repo:** github.com/mozilla/pdf.js
- **Language:** JavaScript
- **License:** Apache 2.0
- **What it does:** Client-side PDF rendering in the browser. Renders link annotations as clickable elements.
- **Why evaluate:** If NoahLaw adds a in-app bundle viewer (rather than downloading the PDF), PDF.js handles the rendering. Also needed to verify that link annotations written by the backend render correctly.
- **Evaluate for:**
  - Does it correctly render link annotations created by pypdf / PyMuPDF?
  - Integration complexity with Next.js App Router
  - Memory usage on 5000-page bundles

---

## PART 2 — STITCHING / CROSS-REFERENCING

**Definition:** Given a merged bundle of 5000+ pages, identify which passages across different documents reference each other and write navigable PDF link annotations between them.

**Key insight:** Pure vector/semantic search fails on referential queries like "see paragraph 5 of exhibit C." The right architecture is:

```
GraphRAG (knowledge graph)  →  entity/reference extraction
+ LlamaIndex (RAG)          →  passage retrieval and ranking
+ PyMuPDF                   →  write PDF link annotations
```

---

### Microsoft GraphRAG
- **Repo:** github.com/microsoft/graphrag
- **Language:** Python
- **License:** MIT
- **What it does:** Ingests a corpus of documents, builds a hierarchical knowledge graph (entities, relationships, communities), and enables multi-hop reasoning across large document sets. Global queries like "which documents mention the same contract clause?" become answerable.
- **Why it's the right fit:** Legal bundles are highly referential. A statement of claim references a contract which references a schedule which is referenced in a witness statement. GraphRAG maps these relationships explicitly; vector search does not.
- **Evaluate for:**
  - Indexing time on a 50-document / 500-page test bundle
  - Quality of entity extraction on legal text (parties, dates, clause numbers, case references)
  - Cost: GraphRAG uses LLM calls during indexing — estimate token cost before production use
  - Does it preserve page-level provenance (needed to write precise PDF annotations)?

---

### LlamaIndex
- **Repo:** github.com/run-llama/llama_index
- **Language:** Python
- **License:** MIT
- **What it does:** RAG framework that preserves document structure and relationships. Supports hierarchical indexing — a document → sections → paragraphs — so retrieval can return precise locations, not just document-level matches.
- **Why it's the right fit:** Works alongside GraphRAG. GraphRAG finds which documents are related; LlamaIndex retrieves the exact passages within those documents.
- **Evaluate for:**
  - Hierarchical node parser for legal documents (headers, numbered paragraphs, exhibits)
  - Metadata attachment (document name, page number, paragraph number) for annotation targeting
  - Integration with Chroma or Qdrant as the vector store

---

### LangChain
- **Repo:** github.com/langchain-ai/langchain
- **Language:** Python
- **License:** MIT
- **What it does:** LLM orchestration framework. Entity extraction chains, relationship mapping, knowledge graph creation from unstructured text.
- **Why evaluate:** LangChain's graph constructors can supplement GraphRAG's indexing pipeline — useful for extracting structured legal references (case citations, clause numbers, exhibit labels) that GraphRAG's general entity extractor may miss.
- **Evaluate for:**
  - Legal citation extraction accuracy (UK case citation format: `[2024] EWCA Civ 123`)
  - Exhibit/schedule cross-reference detection (`as per Exhibit C`, `see Schedule 2`)
  - Whether it adds meaningful value on top of GraphRAG or duplicates effort

---

### Chroma
- **Repo:** github.com/chroma-core/chroma
- **Language:** Python
- **License:** Apache 2.0
- **What it does:** Open source vector database. Easiest to get started — runs in-process with no separate server.
- **Why evaluate:** The embedding store for LlamaIndex during stitching development. Start here for the proof of concept.
- **Evaluate for:**
  - In-process mode performance on a 500-page test bundle
  - Metadata filtering (filter by document ID, page range)
  - Persistence between requests (needed for bundles that are annotated incrementally)

---

### Qdrant
- **Repo:** github.com/qdrant/qdrant
- **Language:** Rust
- **License:** Apache 2.0
- **What it does:** High-performance vector DB. Faster than Chroma at scale. Runs as a separate service (Docker).
- **Why evaluate:** Production upgrade path from Chroma when bundle sizes exceed what in-process Chroma handles comfortably.
- **Evaluate for:**
  - When to switch from Chroma (benchmark at what document count Chroma slows down)
  - Docker deployment overhead on Render

---

## EVALUATION ORDER

1. **Now (bundling):** PyMuPDF + pikepdf — can they handle court PDFs pypdf can't? Does PyMuPDF's cross-document linking work for the current `bundling/` app?
2. **Proof of concept (stitching):** GraphRAG + LlamaIndex + Chroma on a 10-20 document test bundle. Measure indexing time and annotation accuracy before committing.
3. **Later (production stitching):** Swap Chroma → Qdrant if scale requires it. Add pdf-lib / PDF.js if a browser-side viewer is built.

---

## TEST PROTOCOL FOR STITCHING POC

1. Take 10-20 documents from a real bundle (redact if needed)
2. Identify 10-20 known cross-references manually (ground truth)
3. Run GraphRAG indexing — log time and token cost
4. Run LlamaIndex retrieval for each known reference
5. Score: precision (correct links found / total links written) + recall (correct links found / total known references)
6. Write the links as PyMuPDF annotations into the merged PDF
7. Open in a PDF viewer and verify annotations are navigable

Target: >80% recall, >70% precision before building the production pipeline.

---

*Document generated: March 2026 | NoahLaw MVP Research*
