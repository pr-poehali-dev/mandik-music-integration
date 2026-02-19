import json
import os
import hashlib
import secrets
import psycopg2

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_hex(16)
    hashed = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}:{hashed}"

def verify_password(password, stored):
    salt, hashed = stored.split(":")
    return hash_password(password, salt) == stored

def handler(event, context):
    """Регистрация и вход пользователей БумагаGram"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id", "Access-Control-Max-Age": "86400"}, "body": ""}

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "")

    if method == "POST" and action == "register":
        body = json.loads(event.get("body", "{}"))
        username = body.get("username", "").strip().lower()
        display_name = body.get("display_name", "").strip()
        password = body.get("password", "")

        if not username or not password or not display_name:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}

        if len(username) < 3:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Логин минимум 3 символа"})}

        if len(password) < 4:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Пароль минимум 4 символа"})}

        colors = ["#7c3aed", "#06b6d4", "#ec4899", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#3b82f6"]
        avatar_color = colors[hash(username) % len(colors)]
        password_hash = hash_password(password)

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cur.fetchone():
            conn.close()
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Такой логин уже занят"})}

        cur.execute(
            "INSERT INTO users (username, display_name, password_hash, avatar_color, is_online) VALUES (%s, %s, %s, %s, TRUE) RETURNING id",
            (username, display_name, password_hash, avatar_color)
        )
        user_id = cur.fetchone()[0]
        token = secrets.token_hex(32)
        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": headers, "body": json.dumps({"user": {"id": user_id, "username": username, "display_name": display_name, "avatar_color": avatar_color}, "token": token})}

    if method == "POST" and action == "login":
        body = json.loads(event.get("body", "{}"))
        username = body.get("username", "").strip().lower()
        password = body.get("password", "")

        if not username or not password:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}

        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, username, display_name, password_hash, avatar_color FROM users WHERE username = %s", (username,))
        row = cur.fetchone()

        if not row or not verify_password(password, row[3]):
            conn.close()
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный логин или пароль"})}

        cur.execute("UPDATE users SET is_online = TRUE, last_seen = NOW() WHERE id = %s", (row[0],))
        conn.commit()
        conn.close()

        token = secrets.token_hex(32)
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"user": {"id": row[0], "username": row[1], "display_name": row[2], "avatar_color": row[4]}, "token": token})}

    if method == "GET" and action == "users":
        conn = get_db()
        cur = conn.cursor()
        cur.execute("SELECT id, username, display_name, avatar_color, is_online, last_seen FROM users ORDER BY display_name")
        rows = cur.fetchall()
        conn.close()

        users = [{"id": r[0], "username": r[1], "display_name": r[2], "avatar_color": r[3], "is_online": r[4], "last_seen": str(r[5])} for r in rows]
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"users": users})}

    if method == "GET":
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"status": "ok", "service": "auth"})}

    return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
