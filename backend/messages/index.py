import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event, context):
    """Отправка и получение сообщений в БумагаGram"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id", "Access-Control-Max-Age": "86400"}, "body": ""}

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    method = event.get("httpMethod", "GET")
    req_headers = event.get("headers", {})
    user_id = req_headers.get("X-User-Id") or req_headers.get("x-user-id")
    params = event.get("queryStringParameters") or {}

    if not user_id:
        return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

    user_id = int(user_id)

    if method == "GET":
        conversation_id = params.get("conversation_id")
        if not conversation_id:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите conversation_id"})}

        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT id FROM conversation_members WHERE conversation_id = %s AND user_id = %s", (conversation_id, user_id))
        if not cur.fetchone():
            conn.close()
            return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}

        cur.execute("UPDATE messages SET is_read = TRUE WHERE conversation_id = %s AND sender_id != %s AND is_read = FALSE", (conversation_id, user_id))

        cur.execute("""
            SELECT m.id, m.text, m.sender_id, m.is_read, m.created_at, u.display_name, u.avatar_color
            FROM messages m
            JOIN users u ON u.id = m.sender_id
            WHERE m.conversation_id = %s
            ORDER BY m.created_at ASC
            LIMIT 200
        """, (conversation_id,))
        rows = cur.fetchall()
        conn.commit()
        conn.close()

        messages = [{"id": r[0], "text": r[1], "sender_id": r[2], "is_read": r[3], "created_at": str(r[4]), "sender_name": r[5], "sender_color": r[6]} for r in rows]
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"messages": messages})}

    if method == "POST":
        body = json.loads(event.get("body", "{}"))
        conversation_id = body.get("conversation_id")
        text = body.get("text", "").strip()

        if not conversation_id or not text:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}

        conn = get_db()
        cur = conn.cursor()

        cur.execute("SELECT id FROM conversation_members WHERE conversation_id = %s AND user_id = %s", (conversation_id, user_id))
        if not cur.fetchone():
            conn.close()
            return {"statusCode": 403, "headers": headers, "body": json.dumps({"error": "Нет доступа"})}

        cur.execute(
            "INSERT INTO messages (conversation_id, sender_id, text) VALUES (%s, %s, %s) RETURNING id, created_at",
            (conversation_id, user_id, text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": headers, "body": json.dumps({"message": {"id": row[0], "text": text, "sender_id": user_id, "is_read": False, "created_at": str(row[1])}})}

    return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
