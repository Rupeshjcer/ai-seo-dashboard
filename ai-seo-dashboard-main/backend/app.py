from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import requests as http_requests
from pathlib import Path
import hashlib
import re
# pyrefly: ignore [missing-import]
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin

app = Flask(__name__)
CORS(app)
DATABASE_PATH = Path(__file__).resolve().parent / "seo.db"


def get_connection():
    return sqlite3.connect(DATABASE_PATH)


def keyword_number(keyword, minimum, maximum):
    digest = hashlib.sha256(keyword.encode("utf-8")).hexdigest()
    return minimum + (int(digest[:8], 16) % (maximum - minimum + 1))

# ----------------------------
# Home Route
# ----------------------------
@app.route("/")
def home():
    return "AI SEO Growth Dashboard Backend is Running Successfully!"

# ----------------------------
# Register API
# ----------------------------
@app.route("/register", methods=["POST"])
def register():

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "success": False,
            "message": "Invalid request. No JSON data received."
        })

    fullname = data.get("fullname", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not fullname or not email or not password:
        return jsonify({
            "success": False,
            "message": "All fields are required."
        })

    conn = get_connection()
    cursor = conn.cursor()

    # Check if email already exists
    cursor.execute("SELECT * FROM users WHERE email=?", (email,))
    user = cursor.fetchone()

    if user:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Email already registered."
        })

    cursor.execute(
        """
        INSERT INTO users(fullname,email,password)
        VALUES(?,?,?)
        """,
        (fullname, email, password)
    )

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Registration Successful!"
    })

# ----------------------------
# Login API
# ----------------------------
@app.route("/login", methods=["POST"])
def login():

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "success": False,
            "message": "Invalid request. No JSON data received."
        })

    email = data.get("email", "").strip()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        })

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE email=? AND password=?", (email, password))
    user = cursor.fetchone()

    conn.close()

    if user:
        return jsonify({
            "success": True,
            "message": "Login Successful!",
            "user_id": user[0],
            "fullname": user[1]
        })
    else:
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        })

# ----------------------------
# Analyze Website API
# ----------------------------
@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json(silent=True)

    if data is None:
        return jsonify({
            "success": False,
            "message": "Invalid request."
        })

    url = data.get("url", "").strip()

    if not url:
        return jsonify({
            "success": False,
            "message": "Please provide a website URL."
        })

    # Add https:// if missing
    if not url.startswith("http://") and not url.startswith("https://"):
        url = "https://" + url

    try:
        # Fetch the webpage
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = http_requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Could not fetch the website. Error: {str(e)}"
        })

    # Parse HTML with BeautifulSoup
    soup = BeautifulSoup(response.text, "html.parser")
    parsed_url = urlparse(url)
    domain = parsed_url.netloc

    # --- Extract SEO Data ---

    # Title
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    # Meta Description
    meta_desc_tag = soup.find("meta", attrs={"name": "description"})
    meta_description = meta_desc_tag["content"].strip() if meta_desc_tag and meta_desc_tag.get("content") else ""

    # H1 Tags
    h1_tags = soup.find_all("h1")
    h1_count = len(h1_tags)

    # Images
    images = soup.find_all("img")
    image_count = len(images)

    # Images with alt text
    images_with_alt = sum(1 for img in images if img.get("alt", "").strip())

    # Links
    all_links = soup.find_all("a", href=True)
    internal_links = 0
    external_links = 0

    for link in all_links:
        href = link["href"]
        if href.startswith("#") or href.startswith("javascript:"):
            continue
        link_parsed = urlparse(urljoin(url, href))
        if link_parsed.netloc == domain or link_parsed.netloc == "":
            internal_links += 1
        else:
            external_links += 1

    # Word Count
    page_text = soup.get_text(separator=" ", strip=True)
    word_count = len(page_text.split())

    # --- Calculate SEO Score (out of 100) ---
    seo_score = 0

    # Title Present (+20)
    title_present = bool(title)
    if title_present:
        seo_score += 20

    # Meta Description Present (+20)
    meta_present = bool(meta_description)
    if meta_present:
        seo_score += 20

    # H1 Present (+20)
    h1_present = h1_count > 0
    if h1_present:
        seo_score += 20

    # Images (+10) — at least 1 image present
    if image_count > 0:
        seo_score += 10

    # Internal Links (+15) — at least 3 internal links
    if internal_links >= 3:
        seo_score += 15
    elif internal_links >= 1:
        seo_score += 8

    # Word Count (+15) — at least 300 words
    if word_count >= 300:
        seo_score += 15
    elif word_count >= 100:
        seo_score += 8

    # --- Calculate Content Score (out of 100) ---
    content_score = 0

    if title_present:
        content_score += 15
    if meta_present:
        content_score += 15
    if h1_present:
        content_score += 15

    # Heading structure (h2, h3)
    h2_count = len(soup.find_all("h2"))
    h3_count = len(soup.find_all("h3"))
    if h2_count >= 2:
        content_score += 15
    elif h2_count >= 1:
        content_score += 8

    if word_count >= 500:
        content_score += 20
    elif word_count >= 200:
        content_score += 10

    if image_count >= 3:
        content_score += 10
    elif image_count >= 1:
        content_score += 5

    if images_with_alt == image_count and image_count > 0:
        content_score += 10
    elif images_with_alt > 0:
        content_score += 5

    content_score = min(content_score, 100)

    # --- Calculate Health Score (out of 100) ---
    health_score = 50  # Base score for a reachable site

    if response.status_code == 200:
        health_score += 15

    if url.startswith("https://"):
        health_score += 15

    # Check for viewport meta (mobile-friendly)
    viewport = soup.find("meta", attrs={"name": "viewport"})
    if viewport:
        health_score += 10

    # Check for charset
    charset = soup.find("meta", attrs={"charset": True})
    if charset:
        health_score += 10

    health_score = min(health_score, 100)

    # --- Generate AI Recommendations ---
    recommendations = []

    if not title_present:
        recommendations.append("Add a Title Tag to improve search engine visibility.")
    elif len(title) < 30:
        recommendations.append("Improve Title Tag — make it 50-60 characters for better CTR.")

    if not meta_present:
        recommendations.append("Add a Meta Description to improve click-through rates.")
    elif len(meta_description) < 120:
        recommendations.append("Extend Meta Description to 150-160 characters for better ranking.")

    if h1_count == 0:
        recommendations.append("Add an H1 Heading — it's essential for SEO.")
    elif h1_count > 1:
        recommendations.append(f"Use only 1 H1 tag per page. Found {h1_count} H1 tags.")

    if image_count == 0:
        recommendations.append("Add Images to make content more engaging.")
    elif images_with_alt < image_count:
        missing_alt = image_count - images_with_alt
        recommendations.append(f"Add Alt Text to {missing_alt} image(s) for better accessibility and SEO.")

    if image_count > 5:
        recommendations.append("Compress Images to improve page load speed.")

    if internal_links < 3:
        recommendations.append("Add more Internal Links to improve site navigation and SEO.")

    if external_links == 0:
        recommendations.append("Add External Links to authoritative sources for credibility.")

    if word_count < 300:
        recommendations.append(f"Increase Word Count (currently {word_count}). Aim for 500+ words.")

    if h2_count == 0:
        recommendations.append("Add H2 Subheadings to organize content and boost SEO.")

    if not url.startswith("https://"):
        recommendations.append("Switch to HTTPS for better security and SEO ranking.")

    if not viewport:
        recommendations.append("Add a Viewport Meta Tag to make the site mobile-friendly.")

    # Add FAQ suggestion if no FAQ-like section detected
    page_text_lower = page_text.lower()
    if "faq" not in page_text_lower and "frequently asked" not in page_text_lower:
        recommendations.append("Add a FAQ Section to target featured snippets in search results.")

    # Ensure at least one recommendation
    if not recommendations:
        recommendations.append("Great job! Your website follows SEO best practices.")

    # --- Save to Database ---
    try:
        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute(
            """
            INSERT INTO websites(user_id, website_url, seo_score, content_score, health_score)
            VALUES(?, ?, ?, ?, ?)
            """,
            (1, url, seo_score, content_score, health_score)
        )

        conn.commit()
        conn.close()
    except Exception:
        pass  # Don't fail the response if DB save fails

    # --- Build Response ---
    return jsonify({
        "success": True,
        "message": "Website analyzed successfully!",
        "data": {
            "url": url,
            "title": title,
            "meta_description": meta_description,
            "h1_count": h1_count,
            "h2_count": h2_count,
            "h3_count": h3_count,
            "image_count": image_count,
            "images_with_alt": images_with_alt,
            "internal_links": internal_links,
            "external_links": external_links,
            "word_count": word_count,
            "seo_score": seo_score,
            "content_score": content_score,
            "health_score": health_score,
            "recommendations": recommendations,
            "checks": {
                "title_present": title_present,
                "meta_present": meta_present,
                "h1_present": h1_present,
                "has_images": image_count > 0,
                "has_internal_links": internal_links > 0,
                "has_external_links": external_links > 0,
                "is_https": url.startswith("https://"),
                "has_viewport": viewport is not None
            }
        }
    })

# ----------------------------
# Dashboard Stats API
# ----------------------------
@app.route("/stats", methods=["GET"])
def stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*),
               COALESCE(AVG(seo_score), 0),
               COALESCE(AVG(content_score), 0),
               COALESCE(AVG(health_score), 0)
        FROM websites
    """)
    audit_count, average_seo, average_content, average_health = cursor.fetchone()
    conn.close()

    return jsonify({
        "success": True,
        "data": {
            "audit_count": audit_count,
            "average_seo": round(average_seo),
            "average_content": round(average_content),
            "average_health": round(average_health)
        }
    })

# ----------------------------
# Analytics API
# ----------------------------
@app.route("/analytics", methods=["GET"])
def analytics():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT date(created_at), COUNT(*), AVG(seo_score), AVG(content_score), AVG(health_score)
        FROM websites
        GROUP BY date(created_at)
        ORDER BY date(created_at) ASC
        LIMIT 90
    """)
    rows = cursor.fetchall()
    conn.close()
    return jsonify({
        "success": True,
        "data": [{
            "date": row[0],
            "audits": row[1],
            "seo_score": round(row[2]),
            "content_score": round(row[3]),
            "health_score": round(row[4])
        } for row in rows]
    })

# ----------------------------
# Keyword Research API
# ----------------------------
@app.route("/keyword-research", methods=["POST"])
def keyword_research():
    data = request.get_json(silent=True)
    seed = (data or {}).get("keyword", "").strip().lower()
    if not seed:
        return jsonify({"success": False, "message": "Please provide a seed keyword."}), 400

    variations = [
        seed,
        f"best {seed}",
        f"{seed} tools",
        f"{seed} for small business",
        f"{seed} pricing",
        f"how to use {seed}",
        f"{seed} guide",
    ]
    intents = ["I", "C", "C", "T", "C", "I", "I"]
    rows = []
    for keyword, intent in zip(variations, intents):
        volume = keyword_number(keyword, 800, 48000)
        difficulty = keyword_number(keyword + " difficulty", 18, 82)
        cpc = keyword_number(keyword + " cpc", 80, 850) / 100
        rows.append({
            "keyword": keyword,
            "intent": intent,
            "volume": volume,
            "difficulty": difficulty,
            "cpc": cpc,
            "trend": [keyword_number(keyword + str(index), 4, 28) for index in range(8)]
        })

    return jsonify({
        "success": True,
        "data": {
            "summary": {
                "volume": sum(row["volume"] for row in rows),
                "difficulty": round(sum(row["difficulty"] for row in rows) / len(rows)),
                "cpc": round(sum(row["cpc"] for row in rows) / len(rows), 2)
            },
            "keywords": rows
        }
    })

# ----------------------------
# Content Optimization API
# ----------------------------
@app.route("/content-optimize", methods=["POST"])
def content_optimize():
    data = request.get_json(silent=True)
    text = (data or {}).get("content", "").strip()
    keyword = (data or {}).get("keyword", "").strip()
    if not text:
        return jsonify({"success": False, "message": "Please provide content to analyze."}), 400

    words = re.findall(r"\b[\w'-]+\b", text)
    word_count = len(words)
    keyword_count = len(re.findall(re.escape(keyword), text, re.IGNORECASE)) if keyword else 0
    density = round((keyword_count / word_count) * 100, 1) if word_count else 0
    headings = len(re.findall(r"^#{1,6}\s|<h[1-6][^>]*>", text, re.IGNORECASE | re.MULTILINE))
    sentences = max(1, len(re.findall(r"[.!?]+", text)))
    average_sentence = word_count / sentences
    readability = "Good" if average_sentence < 22 else "Needs improvement"
    score = 35
    if word_count >= 500:
        score += 25
    elif word_count >= 200:
        score += 15
    if keyword and 0.5 <= density <= 3:
        score += 25
    elif keyword_count:
        score += 10
    if headings:
        score += 10
    if readability == "Good":
        score += 5

    checks = [
        {"status": "pass" if keyword_count else "fail", "text": f"Target keyword usage: {keyword_count} occurrence(s)"},
        {"status": "pass" if word_count >= 500 else ("warning" if word_count >= 200 else "fail"), "text": f"Word count: {word_count} (target 500+)"},
        {"status": "pass" if readability == "Good" else "warning", "text": f"Readability: {readability}"},
        {"status": "pass" if headings else "warning", "text": "Heading structure detected" if headings else "Add H2/H3 subheadings"}
    ]
    return jsonify({"success": True, "data": {"score": min(score, 100), "density": density, "word_count": word_count, "checks": checks}})

# ----------------------------
# Recommendations API
# ----------------------------
@app.route("/recommendations", methods=["GET"])
def recommendations():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT website_url, seo_score, content_score, health_score
        FROM websites ORDER BY created_at DESC LIMIT 1
    """)
    row = cursor.fetchone()
    conn.close()
    if not row:
        return jsonify({"success": True, "data": []})

    website_url, seo_score, content_score, health_score = row
    items = []
    if seo_score < 70:
        items.append({"title": "Improve the latest audit score", "desc": f"{website_url} scored {seo_score}/100.", "category": "content", "priority": "high", "urls": [website_url], "action": "Run the website audit and address the failed checks first."})
    if content_score < 70:
        items.append({"title": "Strengthen page content", "desc": f"The content score is {content_score}/100.", "category": "content", "priority": "med", "urls": [website_url], "action": "Add useful copy, headings, descriptive metadata, and supporting links."})
    if health_score < 90:
        items.append({"title": "Review site health issues", "desc": f"The health score is {health_score}/100.", "category": "technical", "priority": "med", "urls": [website_url], "action": "Check HTTPS, viewport metadata, response status, and crawlability."})
    if not items:
        items.append({"title": "Keep monitoring your site", "desc": "Your latest audit is in good shape.", "category": "content", "priority": "low", "urls": [website_url], "action": "Schedule another audit after your next significant content update."})
    return jsonify({"success": True, "data": items})

# ----------------------------
# History API
# ----------------------------
@app.route("/history", methods=["GET"])
def history():

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        SELECT website_url, seo_score, content_score, health_score, created_at
        FROM websites
        ORDER BY created_at DESC
        LIMIT 10
        """
    )

    rows = cursor.fetchall()
    conn.close()

    history_list = []
    for row in rows:
        history_list.append({
            "url": row[0],
            "seo_score": row[1],
            "content_score": row[2],
            "health_score": row[3],
            "date": row[4]
        })

    return jsonify({
        "success": True,
        "data": history_list
    })

# ----------------------------
# Update Profile API
# ----------------------------
@app.route("/update_profile", methods=["POST"])
def update_profile():
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"success": False, "message": "Invalid request."})

    user_id = data.get("user_id")
    fullname = data.get("fullname", "").strip()
    password = data.get("password", "")

    if not user_id or not fullname:
        return jsonify({"success": False, "message": "User ID and Full Name are required."})

    conn = get_connection()
    cursor = conn.cursor()

    if password:
        cursor.execute("UPDATE users SET fullname=?, password=? WHERE id=?", (fullname, password, user_id))
    else:
        cursor.execute("UPDATE users SET fullname=? WHERE id=?", (fullname, user_id))

    conn.commit()
    conn.close()

    return jsonify({
        "success": True,
        "message": "Profile updated successfully!",
        "fullname": fullname
    })

if __name__ == "__main__":
    app.run(debug=True)