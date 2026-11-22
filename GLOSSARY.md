# Glossary

Domain terms as the code uses them. Use these names in issues, tests and commits.

**Dog** (`Dog` in `website/src/lib/types.ts`): A listing on the noticeboard: name, breed, colour, description, status, photo, location and report date. Contact details are deliberately absent from it. _Avoid_: pet, animal, post.

**Status** (`DogStatus`): Where a Dog's story stands: `lost` (owner is looking), `found` (a finder has it), or `reunited` (resolved).

**Reporter**: The person who submitted a Dog. Their contact email and phone live only on `DogWithContact`, server side, and are never returned by the public API.

**DogWithContact**: A Dog plus the Reporter's `contactEmail` and `contactPhone`. Server-side only.

**Listing**: The public page and API record for one Dog (`/dogs/[id]`, `/api/dogs/[id]`).

**Enquiry**: A Message sent from a finder or owner about one specific Dog (carries a `dogId`); forwarded by email to that Dog's Reporter. The Reporter's address is never shown to the sender.

**Message** (`StoredMessage`): A row in `messages`: a contact-form message or an Enquiry, stored whether or not it could be emailed on.

**Delivered**: The flag on a Message or Feedback row recording that it was also emailed. Rows left undelivered can be re-sent later.

**Feedback**: A beta tester's note (`Feedback`, table `feedback`) from the in-page dialog, with the page path it was sent from. Has a review status: `new`, `seen` or `done`.

**Support inbox**: The address that receives contact-form messages (including takedown requests) and Feedback, via `sendSupportEmail`.

**Support email kind** (`SupportMailKind`): `contact` or `feedback`. Each kind has its own cap of `SUPPORT_EMAILS_PER_HOUR` attempts in a rolling hour, counted in the `email_sends` table.

**Rate limit** (`checkRateLimit`): A per-client, in-memory fixed-window counter on the write endpoints. Distinct from the Support email cap, which is global and database-backed.

**Features** (`features()`): Capability flags derived from the environment (`hostedDatabase`, `durableImageStorage`, `emailDelivery`, `geocoding`, `feedbackReview`). Copy that promises a capability is gated on them.

**Geocoding**: Turning a Dog's address into `lat`/`lng` so it gets a pin. A Dog whose address cannot be placed appears under "Not on the map" on the map page.

**Cluster** (`clusterPoints`): A group of map pins within a pixel radius of each other, shown as one marker so pins do not overlap.

**Upload**: A Dog's photo. Stored in Vercel Blob when durable storage is configured, otherwise on local disk and served from `/uploads/[filename]`.
