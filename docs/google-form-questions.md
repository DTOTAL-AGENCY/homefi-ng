# Legacy Google Form: HomeFi Mortgage Pre-Qualification Form

Source: the live Google Form (8 pages, "about 2-3 minutes"). Captured 23 Nov 2026 for reference while building `/prequalify`.
The website uses the brief's 4-step flow, with the questions marked **➕ kept** folded in (see `docs/DECISIONS.md`).

## Page 1: Personal details
| Question | Type | Required | Options | On the website |
|---|---|---|---|---|
| Full name (Surname First-Name Others) | short text | yes | | Split into first / surname / other names (step 1) |
| Email address (accessible; used in your mortgage application) | short text | yes | | Collected at sign-up, not in the form |
| Phone number (+234 80 1234 5678) | short text | yes | | Step 1, E.164 |
| Gender | single choice | no | Male · Female · Prefer Not To Say | ➕ kept, optional (step 1) |
| Nationality | single choice | yes | Nigerian · Nigerian in Diaspora · Other (specify) | Step 1 nationality + residence |
| Current Country of residence | dropdown | yes | Nigeria · Outside of Nigeria (→ page 2) | Step 1 residence |
| State of residence in Nigeria | short text | yes | | Step 1 dropdown (36 states + FCT) |
| Marital Status | single choice | yes | Single · Married · Divorced · Widowed · Other | Step 1 (+ Separated) |

## Page 2: Country selection for those in diaspora
| Current Country of Residence | single choice | yes | UK · USA · CANADA · UAE · GERMANY · SOUTH AFRICA · Others (specify) | Step 1 country dropdown + city |

## Page 3: Employment & financial assessment
| Question | Type | Required | Options | On the website |
|---|---|---|---|---|
| Primary source of income | single choice | yes | Salary (full-time) · Salary (part-time) · Business income · Pension · Investment income · Mixed · Others | Step 2 income_source (➕ investment added) |
| Average monthly income after tax, with currency | short text | yes | | Step 2 currency + amount |
| Do you have an RSA with any PFA? (up to 25% usable as equity) | single choice | yes | Yes · No · Not sure | Step 2 has_rsa |

## Page 4: Solo or joint ownership
| Buying alone or jointly with spouse? (joint = both names on title and mortgage) | single choice | yes | Alone · Joint (→ page 5) | Step 1 is_joint |

## Page 5: Spouse details (joint only)
| Spouse full name | short text | yes | | Step 2 co-applicant name |
| Spouse primary source of income | single choice | yes | same as page 3 | Step 2 |
| Spouse average monthly income after tax, with currency | short text | yes | | Step 2 |

## Page 6: Preferred property
| Question | Type | Required | Options | On the website |
|---|---|---|---|---|
| Type of property | single choice | yes | Fully detached bungalow · Semi-detached bungalow · Fully detached duplex · Semi-detached duplex · Terraced apartment · I have land (to build) · Not sure yet | Step 3 property_type |
| Features that matter most (select all) | checkboxes | yes | Fence · Gated estate with security · Number of bedrooms (1–5+) · Near schools · Near workplace · Good road access · Parking for 2–3 cars · Solar only · Solar + grid · Water supply · Open compound/garden · Modern/smart-home fittings · Other | ➕ kept (step 3, optional) |
| Preferred location (State / City) | short text | yes | | Step 3 states (≤3) + city |
| For rent or primary residence? | single choice | yes | Primary residence · Rental · Others | Step 3 intended_use |
| Found the property? | single choice | yes | Yes · No · I need help searching | Step 3 property_status |
| How soon to complete? | single choice | yes | 1–3 months · 3–6 · 6–12 · Just exploring | Step 3 timeline |
| Budget range | single choice | yes | ₦10–20m · ₦20–30m · ₦30–50m · ₦50–75m · ₦75–100m · Above ₦100m | Step 3 target_value (+ below ₦10m, exact price) |

## Page 7: Pension & equity contribution
Disclosure text: equity 10–30% of property value; processing fee 8–10% of property value (legal search, valuation, title perfection, insurance, bank fee). Example: ₦30m MREIF property → ₦3m deposit + ₦2.1m–₦2.7m fees = ₦5m–₦5.7m in hand. Commercial bank deposits vary.

| Question | Type | Required | Options | On the website |
|---|---|---|---|---|
| Use up to 25% of RSA balance as equity? | single choice | yes | Yes, explore · No, other sources · I'd like advice | ➕ kept (step 4, if has_rsa ≠ No) |
| Budget range (repeat) | single choice | yes | | Dropped (duplicate of page 6) |
| Reviewed equity and processing fee requirements? | single choice | yes | Yes, read and understood · No, I have questions | ➕ kept (step 4) |
| Ready to proceed with 10% equity and processing fee? | single choice | yes | Ready · Within 1–3 months · In 6 months · Not yet | ➕ kept (step 4) |
| Proceed with formal mortgage application? | single choice | yes | Prepare my assessment and contact me · Speak with an advisor first · Not yet, keep me on the email list | ➕ kept (step 4) |

## Page 8: Final steps
| How did you hear about us? | single choice | yes | Instagram/Facebook/TikTok · LinkedIn · Google · Friend/Family/Referral · News/blog · Event/webinar · Other | Step 4 source_channel (merged with brief options) |
| Consent & declaration (accuracy + privacy + contact) | checkbox | yes | | Step 4 consent_processing (merged wording) |
| Anything else? | paragraph | no | | Step 4 notes |
