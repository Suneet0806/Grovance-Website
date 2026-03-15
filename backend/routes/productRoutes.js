const express = require("express");
const https   = require("https");
const router  = express.Router();
const multer  = require("multer");
const path    = require("path");
const pool    = require("../db");

// ── MULTER ──────────────────────────────────────────────
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, path.join(__dirname, "../uploads")),
    filename:    (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ── HELPERS ─────────────────────────────────────────────

// Assign label to a product based on real data
function assignLabel(product, categoryAvgPrice) {
    const now      = new Date();
    const created  = new Date(product.created_at);
    const hoursOld = (now - created) / (1000 * 60 * 60);

    // JUST LISTED — posted within last 24 hours
    if (hoursOld <= 24) return "NEW";

    // HOT — viewed 10 or more times
    if (product.views >= 10) return "HOT";

    // DEAL — priced 40% or more below category average
    const avg = categoryAvgPrice[product.category];
    if (avg && product.price <= avg * 0.6) return "DEAL";

    return "";
}

// ── GET ALL PRODUCTS (filtered by college if provided) ──
router.get("/", async (req, res) => {
    const { college } = req.query;
    try {
        // Base query — filter by college if logged-in user's college is sent
        let query  = "SELECT * FROM products";
        let params = [];

        if (college) {
            query  += " WHERE LOWER(college) = LOWER($1)";
            params  = [college];
        }

        query += " ORDER BY created_at DESC";

        const result = await pool.query(query, params);
        const products = result.rows;

        // Calculate average price per category for DEAL logic
        const categoryAvgPrice = {};
        products.forEach(p => {
            if (!categoryAvgPrice[p.category]) categoryAvgPrice[p.category] = [];
            categoryAvgPrice[p.category].push(Number(p.price));
        });
        Object.keys(categoryAvgPrice).forEach(cat => {
            const prices = categoryAvgPrice[cat];
            categoryAvgPrice[cat] = prices.reduce((a, b) => a + b, 0) / prices.length;
        });

        // Attach computed label to each product
        const labeled = products.map(p => ({
            ...p,
            label: assignLabel(p, categoryAvgPrice)
        }));

        res.json(labeled);
    } catch (err) {
        console.error("Get products error:", err.message);
        res.status(500).send(err.message);
    }
});

// ── GET SINGLE PRODUCT + INCREMENT VIEW COUNT ───────────
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        // Increment view count every time detail page is opened
        await pool.query(
            "UPDATE products SET views = views + 1 WHERE id = $1",
            [id]
        );
        const result = await pool.query(
            "SELECT * FROM products WHERE id = $1", [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).send("Product not found.");
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Get product error:", err.message);
        res.status(500).send(err.message);
    }
});

// ── POST A PRODUCT ──────────────────────────────────────
router.post("/", upload.single("image"), async (req, res) => {
    const { title, price, category, description, college, sellername, sellerphone } = req.body;
    if (!title || !price || !sellername || !sellerphone) {
        return res.status(400).send("Title, price, seller name and phone are required.");
    }
    const { min_price } = req.body;
    const imageName = req.file ? req.file.filename : null;
    try {
        const result = await pool.query(
            `INSERT INTO products(title, price, category, description, college, sellername, sellerphone, image, views, created_at, min_price)
             VALUES($1,$2,$3,$4,$5,$6,$7,$8, 0, NOW(), $9) RETURNING *`,
            [title, price, category, description, college, sellername, sellerphone, imageName, min_price || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error("Post product error:", err.message);
        res.status(500).send(err.message);
    }
});

// ── DELETE A PRODUCT ────────────────────────────────────
router.delete("/:id", async (req, res) => {
    const { id } = req.params;
    const { sellerphone } = req.body;
    if (!sellerphone) return res.status(400).send("Seller phone required.");
    try {
        const check = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
        if (check.rows.length === 0) return res.status(404).send("Listing not found.");
        if (check.rows[0].sellerphone !== sellerphone) return res.status(403).send("Not authorized.");
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
        res.json({ message: "Deleted successfully." });
    } catch (err) {
        console.error("Delete error:", err.message);
        res.status(500).send(err.message);
    }
});

// ── WANTED ROUTES ───────────────────────────────────────

// GET all wanted posts for a college
router.get("/wanted/all", async (req, res) => {
    const { college } = req.query;
    try {
        let query  = "SELECT * FROM wanted";
        let params = [];
        if (college) {
            query  += " WHERE LOWER(college) = LOWER($1)";
            params  = [college];
        }
        query += " ORDER BY created_at DESC";
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// POST a wanted request
router.post("/wanted", async (req, res) => {
    const { title, description, budget, category, college, buyername, buyerphone } = req.body;
    if (!title || !college || !buyername || !buyerphone) {
        return res.status(400).send("Title, college, buyer name and phone are required.");
    }
    try {
        const result = await pool.query(
            `INSERT INTO wanted(title, description, budget, category, college, buyername, buyerphone, created_at)
             VALUES($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING *`,
            [title, description, budget, category, college, buyername, buyerphone]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// DELETE a wanted post
router.delete("/wanted/:id", async (req, res) => {
    const { id } = req.params;
    const { buyerphone } = req.body;
    try {
        const check = await pool.query("SELECT * FROM wanted WHERE id = $1", [id]);
        if (check.rows.length === 0) return res.status(404).send("Not found.");
        if (check.rows[0].buyerphone !== buyerphone) return res.status(403).send("Not authorized.");
        await pool.query("DELETE FROM wanted WHERE id = $1", [id]);
        res.json({ message: "Deleted." });
    } catch (err) {
        res.status(500).send(err.message);
    }
});


// ── AI NEGOTIATION ROUTE ────────────────────────────────
// Proxies to Anthropic API so the API key stays on the server
router.post("/negotiate", async (req, res) => {
    const { messages, itemTitle, listedPrice, minPrice, sellerName } = req.body;

    if (!messages || !itemTitle || !listedPrice) {
        return res.status(400).send("Missing required fields.");
    }

    const systemPrompt = `You are a friendly but firm price negotiation assistant acting on behalf of the seller "${sellerName}" for their item "${itemTitle}" listed at ₹${listedPrice} on Grovance, a campus student marketplace.

Your rules:
1. You represent the seller. Be polite, friendly, and conversational — like a fellow student.
2. The listed price is ₹${listedPrice}. The absolute minimum you can accept is ₹${minPrice || Math.round(listedPrice * 0.8)} — never go below this under any circumstance.
3. Start firm. Only lower the price gradually if the buyer makes reasonable arguments (e.g. item age, condition, quick pickup).
4. If the buyer offers below minimum, politely decline and counter with a price slightly above minimum.
5. When both sides agree on a price, respond with this exact format on the last line: DEAL_AGREED:₹[price] — for example: DEAL_AGREED:₹950
6. Keep responses short — 1 to 3 sentences max. This is a quick campus negotiation, not a formal business deal.
7. You can mention facts about the item to justify the price.
8. Never reveal the minimum price to the buyer.
9. If the buyer is rude or unreasonable, stay polite but firm.`;

    try {
        // ✅ Use Node https module — works on all Node versions without extra packages
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            console.error("ANTHROPIC_API_KEY is not set in .env");
            return res.status(500).send("API key not configured.");
        }

        const payload = JSON.stringify({
            model:      "claude-haiku-4-5-20251001",
            max_tokens: 300,
            system:     systemPrompt,
            messages:   messages
        });

        const data = await new Promise((resolve, reject) => {
            const options = {
                hostname: "api.anthropic.com",
                path:     "/v1/messages",
                method:   "POST",
                headers: {
                    "Content-Type":      "application/json",
                    "Content-Length":    Buffer.byteLength(payload),
                    "x-api-key":         apiKey,
                    "anthropic-version": "2023-06-01"
                }
            };

            const req = https.request(options, (apiRes) => {
                let body = "";
                apiRes.on("data", chunk => body += chunk);
                apiRes.on("end", () => {
                    try {
                        const parsed = JSON.parse(body);
                        if (apiRes.statusCode !== 200) {
                            console.error("Anthropic error:", body);
                            reject(new Error(parsed.error?.message || "Anthropic API error"));
                        } else {
                            resolve(parsed);
                        }
                    } catch (e) {
                        reject(new Error("Failed to parse Anthropic response"));
                    }
                });
            });

            req.on("error", reject);
            req.write(payload);
            req.end();
        });

        const reply = data.content[0].text;

        // Check if a deal was agreed
        const dealMatch = reply.match(/DEAL_AGREED:₹(\d+)/);
        if (dealMatch) {
            return res.json({
                reply:       reply.replace(/DEAL_AGREED:₹\d+/, '').trim(),
                dealAgreed:  true,
                agreedPrice: Number(dealMatch[1])
            });
        }

        res.json({ reply, dealAgreed: false, agreedPrice: null });

    } catch (err) {
        console.error("Negotiate error:", err.message);
        res.status(500).send(err.message);
    }
});

module.exports = router;