// Cloudflare Pages Function — handles "Get a Quote" form submissions.
//
// Storage: every submission is written to the D1 database bound as `DB`
// (see wrangler.toml / Pages Functions bindings). Photo attachments are
// uploaded to the R2 bucket bound as `PHOTOS` when that binding exists —
// R2 needs a one-time enable in the Cloudflare dashboard before it can be
// bound, so until that's done this still works, it just records each
// photo's filename/size/type instead of storing the bytes.
//
// Notifications: nothing is emailed today — leads land in D1 and are
// checked via the Cloudflare dashboard / `wrangler d1 execute`. To add
// email later (e.g. Cloudflare Email Routing's send_email binding once a
// domain + verified destination are set up), hook into notifyNewLead()
// below without touching the rest of this file.

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/png"]);
const MAX_TEXT_LEN = 4000;

export async function onRequestPost(context) {
  const { request, env } = context;

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("multipart/form-data")) {
    return json({ success: false, error: "Invalid submission." }, 400);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return json({ success: false, error: "Could not read submission." }, 400);
  }

  // Honeypot: a hidden field real users never fill in. Bots that
  // auto-fill every field will trip it.
  if (str(formData.get("company"))) {
    return json({ success: true }); // pretend success, drop silently
  }

  const services = formData.getAll("service").map(str).filter(Boolean).slice(0, 20);
  const fullName = trim(str(formData.get("fullName")));
  const phone = trim(str(formData.get("phone")));
  const email = trim(str(formData.get("email")));
  const consent = str(formData.get("consent"));

  const errors = [];
  if (services.length === 0) errors.push("Select at least one service.");
  if (!fullName) errors.push("Full name is required.");
  if (!phone) errors.push("Phone is required.");
  if (!isValidEmail(email)) errors.push("A valid email is required.");
  if (!consent) errors.push("Consent is required.");
  if (errors.length) {
    return json({ success: false, error: errors.join(" ") }, 400);
  }

  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const photoFiles = formData
    .getAll("photos")
    .filter((v) => v instanceof File && v.size > 0)
    .slice(0, MAX_PHOTOS);

  const photoMeta = [];
  const photoKeys = [];

  for (let i = 0; i < photoFiles.length; i++) {
    const file = photoFiles[i];
    const valid = ALLOWED_PHOTO_TYPES.has(file.type) && file.size <= MAX_PHOTO_BYTES;
    const meta = { name: file.name.slice(0, 200), size: file.size, type: file.type, stored: false };

    if (valid && env.PHOTOS) {
      try {
        const key = `leads/${id}/${i}-${safeFileName(file.name)}`;
        await env.PHOTOS.put(key, file.stream(), {
          httpMetadata: { contentType: file.type },
        });
        photoKeys.push(key);
        meta.stored = true;
        meta.key = key;
      } catch (err) {
        console.error("R2 upload failed", err);
      }
    }
    photoMeta.push(meta);
  }

  try {
    await env.DB.prepare(
      `INSERT INTO leads (
        id, created_at, status, services, project_notes,
        vehicle_make, vehicle_model, vehicle_year, vehicle_colour,
        package_pref, timeframe,
        full_name, phone, email, suburb, contact_method, extra_notes,
        photo_count, photo_meta, photo_keys
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    )
      .bind(
        id,
        createdAt,
        "new",
        services.join(", "),
        clip(str(formData.get("projectNotes"))),
        clip(str(formData.get("vehicleMake")), 200),
        clip(str(formData.get("vehicleModel")), 200),
        clip(str(formData.get("vehicleYear")), 20),
        clip(str(formData.get("vehicleColour")), 200),
        clip(str(formData.get("package")), 200),
        clip(str(formData.get("timeframe")), 200),
        clip(fullName, 200),
        clip(phone, 60),
        clip(email, 200),
        clip(str(formData.get("suburb")), 200),
        clip(str(formData.get("contactMethod")), 60),
        clip(str(formData.get("extraNotes"))),
        photoFiles.length,
        JSON.stringify(photoMeta),
        JSON.stringify(photoKeys)
      )
      .run();
  } catch (err) {
    console.error("D1 insert failed", err);
    return json({ success: false, error: "Could not save your request. Please call us instead." }, 500);
  }

  await notifyNewLead(env, { id, fullName, phone, email, services });

  return json({ success: true, id });
}

export async function onRequestGet() {
  return json({ success: false, error: "Method not allowed." }, 405);
}

// eslint-disable-next-line no-unused-vars
async function notifyNewLead(env, lead) {
  // Intentionally empty for now — leads are reviewed in D1 via the
  // Cloudflare dashboard or `wrangler d1 execute jltint-leads --remote
  // --command "select * from leads order by created_at desc"`.
  //
  // To notify by email later via Cloudflare Email Routing, bind
  // `send_email` in wrangler.toml and construct/send a MIME message here.
}

function str(v) {
  return typeof v === "string" ? v : "";
}
function trim(v) {
  return v.trim();
}
function clip(v, max = MAX_TEXT_LEN) {
  return trim(v).slice(0, max);
}
function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}
function safeFileName(name) {
  return (name || "photo")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .slice(-120);
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
