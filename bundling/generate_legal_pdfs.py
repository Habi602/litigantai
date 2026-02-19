from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.enums import TA_JUSTIFY, TA_CENTER

docs = [
    {
        "filename": "non_disclosure_agreement.pdf",
        "title": "NON-DISCLOSURE AGREEMENT",
        "sections": [
            ("PARTIES", (
                "This Non-Disclosure Agreement (\"Agreement\") is entered into as of February 18, 2026, "
                "by and between Hartwell Capital Group, LLC, a Delaware limited liability company with "
                "its principal place of business at 450 Park Avenue, New York, NY 10022 (\"Disclosing "
                "Party\"), and Meridian Advisory Partners, Inc., a California corporation with its "
                "principal place of business at 1 Market Street, San Francisco, CA 94105 "
                "(\"Receiving Party\")."
            )),
            ("RECITALS", (
                "WHEREAS, the Disclosing Party possesses certain confidential and proprietary information "
                "relating to its business operations, financial data, trade secrets, and strategic plans; "
                "and WHEREAS, the Receiving Party desires to receive certain confidential information from "
                "the Disclosing Party for the purpose of evaluating a potential business relationship or "
                "transaction between the parties (the \"Purpose\"); and WHEREAS, the Disclosing Party is "
                "willing to disclose such confidential information to the Receiving Party, subject to the "
                "terms and conditions of this Agreement."
            )),
            ("1. DEFINITION OF CONFIDENTIAL INFORMATION", (
                "\"Confidential Information\" means any and all information or data that has or could have "
                "commercial value or other utility in the business in which Disclosing Party is engaged. "
                "If Confidential Information is in written form, the Disclosing Party shall label or stamp "
                "the materials with the word \"Confidential\" or some similar warning. If Confidential "
                "Information is transmitted orally, the Disclosing Party shall promptly provide writing "
                "indicating that such oral communication constituted Confidential Information. "
                "Confidential Information includes, without limitation: (a) technical data, trade secrets, "
                "know-how, research, product plans, products, services, customers, customer lists, "
                "markets, software, developments, inventions, processes, formulas, technology, designs, "
                "drawings, engineering, hardware configuration information, marketing plans, finances, "
                "or other business information disclosed by the Disclosing Party either directly or "
                "indirectly in writing, orally, or by drawings or inspection of parts or equipment."
            )),
            ("2. OBLIGATIONS OF RECEIVING PARTY", (
                "The Receiving Party agrees to: (a) hold the Confidential Information in strict confidence "
                "and take all reasonable precautions to protect such Confidential Information, including, "
                "without limitation, all precautions the Receiving Party employs with respect to its own "
                "confidential materials; (b) not disclose any Confidential Information or any information "
                "derived therefrom to any third person without the express written consent of the "
                "Disclosing Party; (c) not make any use whatsoever at any time of the Confidential "
                "Information except to evaluate internally whether to proceed with a business relationship "
                "with the Disclosing Party; (d) not copy or reverse engineer any materials; and (e) not "
                "export any Confidential Information in violation of applicable export control laws."
            )),
            ("3. TERM AND TERMINATION", (
                "This Agreement shall remain in effect for a period of three (3) years from the date first "
                "written above, unless earlier terminated by either party upon thirty (30) days written "
                "notice to the other party. Notwithstanding the foregoing, the obligations of the "
                "Receiving Party with respect to Confidential Information that constitutes a trade secret "
                "under applicable law shall survive the termination or expiration of this Agreement for "
                "as long as such information remains a trade secret. Upon termination or expiration of "
                "this Agreement, or upon request by the Disclosing Party, the Receiving Party shall "
                "promptly return or destroy all tangible materials embodying the Confidential Information."
            )),
            ("4. GOVERNING LAW AND DISPUTE RESOLUTION", (
                "This Agreement shall be governed by and construed in accordance with the laws of the "
                "State of New York, without regard to its conflict of law provisions. Any dispute arising "
                "out of or relating to this Agreement shall be submitted to binding arbitration in "
                "New York, New York, under the Commercial Arbitration Rules of the American Arbitration "
                "Association. The prevailing party in any arbitration or litigation shall be entitled to "
                "recover its reasonable attorneys' fees and costs from the non-prevailing party."
            )),
            ("IN WITNESS WHEREOF", (
                "The parties have executed this Non-Disclosure Agreement as of the date first written above.\n\n"
                "HARTWELL CAPITAL GROUP, LLC\n\nBy: ___________________________\nName: Jonathan R. Hartwell\n"
                "Title: Chief Executive Officer\nDate: _________________________\n\n"
                "MERIDIAN ADVISORY PARTNERS, INC.\n\nBy: ___________________________\nName: Sandra L. Chen\n"
                "Title: Managing Director\nDate: _________________________"
            )),
        ]
    },
    {
        "filename": "software_license_agreement.pdf",
        "title": "SOFTWARE LICENSE AGREEMENT",
        "sections": [
            ("AGREEMENT", (
                "This Software License Agreement (\"Agreement\") is entered into as of February 18, 2026, "
                "between Nexon Technologies, Inc., a Texas corporation (\"Licensor\"), and Caldwell "
                "Manufacturing Solutions, a Pennsylvania corporation (\"Licensee\"). This Agreement sets "
                "forth the terms and conditions under which Licensor grants Licensee a license to use "
                "the proprietary software product known as DataSync Enterprise Suite, version 4.2 "
                "(collectively, the \"Software\")."
            )),
            ("1. GRANT OF LICENSE", (
                "Subject to the terms and conditions of this Agreement, Licensor hereby grants to "
                "Licensee a non-exclusive, non-transferable, limited license to install and use the "
                "Software solely for Licensee's internal business operations. This license authorizes "
                "use of the Software on up to fifty (50) workstations or computing devices owned or "
                "leased by Licensee. Licensee may make one (1) copy of the Software solely for backup "
                "or archival purposes. Licensee shall not sublicense, sell, resell, transfer, assign, "
                "or otherwise dispose of the Software or any rights therein to any third party."
            )),
            ("2. RESTRICTIONS", (
                "Licensee shall not: (a) modify, translate, adapt, or create derivative works based "
                "upon the Software; (b) reverse engineer, disassemble, decompile, or otherwise attempt "
                "to derive the source code of the Software; (c) remove, alter, or obscure any "
                "proprietary notices, labels, or marks on the Software; (d) use the Software to develop "
                "a competing product or service; (e) use the Software in any manner that could damage, "
                "disable, overburden, or impair Licensor's servers or networks; or (f) use the Software "
                "for any unlawful purpose or in violation of any applicable law or regulation."
            )),
            ("3. FEES AND PAYMENT", (
                "In consideration for the license granted herein, Licensee shall pay Licensor an annual "
                "license fee of forty-eight thousand dollars ($48,000), payable in advance on the first "
                "day of each calendar year during the term of this Agreement. All fees are non-refundable "
                "except as expressly provided herein. Licensee shall be responsible for all taxes, "
                "levies, or duties imposed by taxing authorities associated with this Agreement, excluding "
                "taxes based on Licensor's net income. Unpaid amounts are subject to a finance charge "
                "of one and one-half percent (1.5%) per month on any outstanding balance."
            )),
            ("4. INTELLECTUAL PROPERTY", (
                "The Software and all copies thereof are proprietary to Licensor and title thereto "
                "remains in Licensor. All applicable rights to patents, copyrights, trademarks, and "
                "trade secrets in the Software are and shall remain in Licensor. Licensee shall not "
                "take any action to jeopardize, limit, or interfere in any manner with Licensor's "
                "ownership of and rights with respect to the Software. Licensee acknowledges that no "
                "title to the intellectual property in the Software is transferred to Licensee. Licensee "
                "further acknowledges that title and full ownership rights to the Software will remain "
                "the exclusive property of Licensor."
            )),
            ("5. WARRANTY DISCLAIMER AND LIMITATION OF LIABILITY", (
                "THE SOFTWARE IS PROVIDED \"AS IS\" WITHOUT WARRANTY OF ANY KIND. LICENSOR EXPRESSLY "
                "DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, INCLUDING "
                "WITHOUT LIMITATION ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR "
                "PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, "
                "INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES ARISING OUT OF OR RELATED TO "
                "THIS AGREEMENT, EVEN IF LICENSOR HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES. "
                "LICENSOR'S TOTAL CUMULATIVE LIABILITY ARISING OUT OF OR RELATED TO THIS AGREEMENT SHALL "
                "NOT EXCEED THE FEES PAID BY LICENSEE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM."
            )),
        ]
    },
    {
        "filename": "commercial_lease_agreement.pdf",
        "title": "COMMERCIAL LEASE AGREEMENT",
        "sections": [
            ("LEASE AGREEMENT", (
                "This Commercial Lease Agreement (\"Lease\") is made and entered into as of February 18, "
                "2026, by and between Stonegate Properties, LP, a Florida limited partnership "
                "(\"Landlord\"), and Brightwell Dental Associates, PLLC, a Florida professional limited "
                "liability company (\"Tenant\"). Landlord hereby leases to Tenant, and Tenant hereby "
                "leases from Landlord, the premises described herein, subject to the terms and "
                "conditions set forth in this Lease."
            )),
            ("1. PREMISES AND TERM", (
                "Landlord hereby leases to Tenant approximately 3,400 rentable square feet of office "
                "space located at Suite 210, 1800 Brickell Avenue, Miami, Florida 33129 (the "
                "\"Premises\"). The lease term shall commence on April 1, 2026, and shall expire on "
                "March 31, 2031, unless sooner terminated in accordance with the terms of this Lease "
                "(the \"Term\"). Tenant shall have the option to extend the Term for one (1) additional "
                "period of five (5) years upon written notice to Landlord not less than one hundred "
                "eighty (180) days prior to the expiration of the initial Term, provided Tenant is not "
                "in default under this Lease at the time of such exercise."
            )),
            ("2. BASE RENT AND ADDITIONAL RENT", (
                "Tenant shall pay to Landlord as base rent for the Premises the sum of eleven thousand "
                "nine hundred dollars ($11,900) per month for the first Lease Year, increasing by three "
                "percent (3%) annually on each anniversary of the commencement date. Rent shall be "
                "payable in advance on the first day of each calendar month during the Term. In addition "
                "to base rent, Tenant shall pay Tenant's proportionate share (estimated at 8.7%) of all "
                "operating expenses, real property taxes, and insurance costs for the building and "
                "common areas (\"Additional Rent\"). Landlord shall provide Tenant with an annual "
                "reconciliation statement within ninety (90) days following the end of each calendar year."
            )),
            ("3. SECURITY DEPOSIT", (
                "Upon execution of this Lease, Tenant shall deposit with Landlord the sum of twenty-three "
                "thousand eight hundred dollars ($23,800), representing two (2) months of base rent, as "
                "a security deposit (the \"Security Deposit\"). The Security Deposit shall be held by "
                "Landlord as security for the faithful performance by Tenant of all the terms, covenants, "
                "and conditions of this Lease. Landlord may apply the Security Deposit to cure any "
                "default by Tenant. Landlord shall return the Security Deposit, less any amounts "
                "properly applied, within thirty (30) days following the expiration or earlier "
                "termination of this Lease and Tenant's surrender of the Premises."
            )),
            ("4. USE OF PREMISES", (
                "Tenant shall use and occupy the Premises solely for the operation of a dental practice "
                "and related medical office uses, and for no other purpose without the prior written "
                "consent of Landlord. Tenant shall comply with all applicable laws, ordinances, "
                "regulations, and orders of governmental authorities with respect to the use and "
                "occupancy of the Premises, including without limitation all requirements of the "
                "Americans with Disabilities Act, HIPAA, Florida health regulations, and all applicable "
                "building codes. Tenant shall not use or permit the Premises to be used for any "
                "unlawful purpose or in any manner that constitutes a nuisance or unreasonably "
                "interferes with other tenants of the building."
            )),
            ("5. MAINTENANCE AND REPAIRS", (
                "Tenant shall, throughout the Term, maintain the Premises in good order, condition, and "
                "repair, reasonable wear and tear excepted. Tenant shall be responsible for all interior "
                "non-structural repairs and maintenance, including plumbing fixtures within the Premises, "
                "electrical systems within the Premises, HVAC system maintenance and filter replacement, "
                "interior walls, floors, and ceilings. Landlord shall be responsible for structural "
                "repairs, roof maintenance, exterior walls, and common area maintenance. Tenant shall "
                "promptly notify Landlord in writing of any damage to the Premises or building systems "
                "requiring Landlord's attention."
            )),
        ]
    },
    {
        "filename": "employment_agreement.pdf",
        "title": "EXECUTIVE EMPLOYMENT AGREEMENT",
        "sections": [
            ("AGREEMENT", (
                "This Executive Employment Agreement (\"Agreement\") is entered into as of February 18, "
                "2026, between Pinnacle Healthcare Systems, Inc., a Delaware corporation (\"Company\"), "
                "and Dr. Marcus A. Thornton (\"Executive\"). The Company desires to employ Executive as "
                "its Chief Medical Officer, and Executive desires to accept such employment with the "
                "Company, on the terms and conditions set forth herein. This Agreement supersedes and "
                "replaces any prior employment agreements or understandings between the parties."
            )),
            ("1. POSITION AND DUTIES", (
                "The Company hereby employs Executive as Chief Medical Officer (\"CMO\"), reporting "
                "directly to the Chief Executive Officer of the Company. In this capacity, Executive "
                "shall have overall responsibility for the Company's medical strategy, clinical "
                "operations, quality assurance programs, physician relations, and regulatory compliance. "
                "Executive shall devote Executive's full business time, attention, and best efforts to "
                "the performance of Executive's duties under this Agreement. Executive shall not engage "
                "in any other business activities, whether or not for compensation, without the prior "
                "written consent of the Board of Directors, except that Executive may (a) serve on "
                "boards of charitable organizations, (b) deliver lectures, and (c) manage Executive's "
                "personal investments."
            )),
            ("2. COMPENSATION AND BENEFITS", (
                "As compensation for services rendered hereunder, the Company shall pay Executive a "
                "base salary at the annual rate of four hundred twenty-five thousand dollars ($425,000), "
                "payable in accordance with the Company's standard payroll practices. Executive shall "
                "be eligible to receive an annual performance bonus with a target amount equal to forty "
                "percent (40%) of Executive's base salary, based upon achievement of performance "
                "objectives established by the Board of Directors. Executive shall be entitled to "
                "participate in all employee benefit plans and programs made available by the Company "
                "to its senior executives, including health insurance, dental and vision coverage, "
                "401(k) plan with Company matching contributions, and four (4) weeks of paid vacation "
                "per year. The Company shall reimburse Executive for all reasonable business expenses "
                "in accordance with Company policy."
            )),
            ("3. TERM AND TERMINATION", (
                "This Agreement shall have an initial term of three (3) years commencing on March 1, "
                "2026, and shall automatically renew for successive one (1) year periods unless either "
                "party provides written notice of non-renewal at least ninety (90) days prior to the "
                "end of the then-current term. The Company may terminate Executive's employment at any "
                "time with or without Cause (as defined herein). If the Company terminates Executive "
                "without Cause, Executive shall be entitled to receive severance pay equal to twelve "
                "(12) months of Executive's then-current base salary, payable in accordance with the "
                "Company's regular payroll schedule, subject to Executive's execution and "
                "non-revocation of a general release of claims."
            )),
            ("4. NON-COMPETITION AND NON-SOLICITATION", (
                "During the term of Executive's employment and for a period of twelve (12) months "
                "following the termination of Executive's employment for any reason (the \"Restricted "
                "Period\"), Executive shall not, directly or indirectly, engage in any business that "
                "competes with the Company in the healthcare services industry within a one hundred "
                "mile (100-mile) radius of any facility operated by the Company. During the Restricted "
                "Period, Executive shall not solicit, hire, or engage any person who is then an employee "
                "of the Company. Executive acknowledges that these restrictions are reasonable and "
                "necessary to protect the legitimate business interests of the Company."
            )),
            ("5. CONFIDENTIALITY AND INTELLECTUAL PROPERTY", (
                "Executive agrees to hold in strictest confidence, and not to use or disclose to any "
                "person, firm, or corporation, any Confidential Information of the Company, except as "
                "required to perform Executive's duties hereunder or as required by law. \"Confidential "
                "Information\" includes all technical and non-technical information related to the "
                "Company's business, including patient data, financial information, business plans, "
                "marketing strategies, and trade secrets. Executive agrees that all inventions, "
                "discoveries, improvements, and other intellectual property developed by Executive "
                "during employment, whether or not during working hours, that relate to the Company's "
                "business, shall be the exclusive property of the Company."
            )),
        ]
    },
    {
        "filename": "settlement_agreement.pdf",
        "title": "SETTLEMENT AGREEMENT AND MUTUAL RELEASE",
        "sections": [
            ("RECITALS", (
                "This Settlement Agreement and Mutual Release (\"Agreement\") is entered into as of "
                "February 18, 2026, by and between Greenfield Construction Corp., an Ohio corporation "
                "(\"Claimant\"), and Vantage Commercial Builders, LLC, an Ohio limited liability company "
                "(\"Respondent\"), and together with Claimant, the \"Parties\". WHEREAS, a dispute "
                "arose between the Parties arising out of a construction subcontract dated March 15, "
                "2023 (the \"Subcontract\"), relating to the construction of a commercial office "
                "complex located at 4520 Polaris Parkway, Columbus, Ohio 43240 (the \"Project\"); and "
                "WHEREAS, Claimant commenced an arbitration proceeding against Respondent, Case No. "
                "01-24-0003-8877, before the American Arbitration Association, asserting claims for "
                "breach of contract, quantum meruit, and unjust enrichment."
            )),
            ("1. SETTLEMENT PAYMENT", (
                "In consideration of the mutual covenants and releases contained herein, and for other "
                "good and valuable consideration, the receipt and sufficiency of which are hereby "
                "acknowledged, Respondent agrees to pay to Claimant the sum of two hundred seventy-five "
                "thousand dollars ($275,000) (the \"Settlement Amount\"). The Settlement Amount shall "
                "be paid as follows: (a) the sum of one hundred fifty thousand dollars ($150,000) shall "
                "be paid within fifteen (15) business days of execution of this Agreement; and (b) the "
                "remaining one hundred twenty-five thousand dollars ($125,000) shall be paid in five "
                "(5) equal monthly installments of twenty-five thousand dollars ($25,000) commencing "
                "sixty (60) days following execution of this Agreement."
            )),
            ("2. MUTUAL RELEASE OF CLAIMS", (
                "In consideration of the Settlement Amount and the other mutual covenants set forth "
                "herein, Claimant, on behalf of itself and its past and present officers, directors, "
                "employees, agents, attorneys, successors, and assigns, hereby releases and forever "
                "discharges Respondent, and its past and present officers, members, managers, employees, "
                "agents, attorneys, successors, and assigns, from any and all claims, demands, causes "
                "of action, suits, debts, damages, and liabilities of any kind or nature whatsoever, "
                "known or unknown, which relate to or arise out of the Subcontract or the Project. "
                "Similarly, Respondent hereby releases Claimant from all claims arising out of or "
                "relating to the Subcontract and Project."
            )),
            ("3. DISMISSAL OF ARBITRATION", (
                "Within five (5) business days following Respondent's payment of the first installment "
                "of the Settlement Amount, the Parties shall jointly file a stipulation of dismissal "
                "with prejudice in the arbitration proceeding, Case No. 01-24-0003-8877, with each "
                "party to bear its own attorneys' fees and costs. The Parties acknowledge and agree "
                "that the American Arbitration Association shall have jurisdiction to enforce the terms "
                "of this Agreement. Upon the filing of the stipulation of dismissal, the arbitration "
                "shall be deemed fully resolved and terminated, and neither party shall have any further "
                "obligations thereunder, except as provided in this Agreement."
            )),
            ("4. NON-DISPARAGEMENT AND CONFIDENTIALITY", (
                "The Parties agree not to make any disparaging, defamatory, or negative statements, "
                "whether written or oral, about the other party, its officers, employees, or business "
                "practices. The Parties further agree to keep the terms of this Agreement strictly "
                "confidential and shall not disclose such terms to any third party, except (a) to their "
                "respective legal counsel and financial advisors, (b) as required by applicable law or "
                "court order, or (c) as necessary to enforce the terms of this Agreement. Any permitted "
                "disclosure to legal counsel or financial advisors shall be made subject to an "
                "obligation of confidentiality."
            )),
            ("5. NO ADMISSION OF LIABILITY", (
                "The Parties agree and acknowledge that this Agreement is a compromise settlement of "
                "disputed claims and shall not be construed as an admission of liability, fault, or "
                "wrongdoing by either party. Neither party has made any representation regarding the "
                "merits or lack thereof of the claims or defenses asserted by either party. This "
                "Agreement is entered into solely to avoid the expense, uncertainty, and inconvenience "
                "of further litigation or arbitration. Each party represents that it has had the "
                "opportunity to consult with counsel of its choice in connection with the negotiation "
                "and execution of this Agreement and enters into this Agreement freely and voluntarily."
            )),
        ]
    },
]

styles = getSampleStyleSheet()
title_style = ParagraphStyle(
    "TitleStyle",
    parent=styles["Title"],
    fontSize=16,
    spaceAfter=20,
    alignment=TA_CENTER,
    fontName="Helvetica-Bold",
)
heading_style = ParagraphStyle(
    "HeadingStyle",
    parent=styles["Heading2"],
    fontSize=11,
    spaceBefore=14,
    spaceAfter=6,
    fontName="Helvetica-Bold",
)
body_style = ParagraphStyle(
    "BodyStyle",
    parent=styles["Normal"],
    fontSize=10,
    leading=14,
    alignment=TA_JUSTIFY,
    fontName="Helvetica",
)

for doc_data in docs:
    path = f"/Users/israelrussell/Desktop/bundling/{doc_data['filename']}"
    doc = SimpleDocTemplate(
        path,
        pagesize=LETTER,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=inch,
        bottomMargin=inch,
    )
    story = [Paragraph(doc_data["title"], title_style), Spacer(1, 0.2 * inch)]
    for heading, body in doc_data["sections"]:
        story.append(Paragraph(heading, heading_style))
        story.append(Paragraph(body, body_style))
        story.append(Spacer(1, 0.1 * inch))
    doc.build(story)
    print(f"Created: {doc_data['filename']}")

print("Done.")
