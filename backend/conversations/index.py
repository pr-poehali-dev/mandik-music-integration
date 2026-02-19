import json
import os
import psycopg2

def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def handler(event, context):
    """Управление диалогами в БумагаGram"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id", "Access-Control-Max-Age": "86400"}, "body": ""}

    headers = {"Access-Control-Allow-Origin": "*", "Content-Type": "application/json"}
    method = event.get("httpMethod", "GET")
    params = event.get("queryStringParameters") or {}
    action = params.get("action", "list")
    req_headers = event.get("headers", {})
    user_id = req_headers.get("X-User-Id") or req_headers.get("x-user-id")

    if not user_id:
        return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Не авторизован"})}

    user_id = int(user_id)

    if method == "GET":
        conn = get_db()
        cur = conn.cursor()
        cur.execute("""
            SELECT c.id, c.is_group, c.group_name, c.created_at
            FROM conversations c
            JOIN conversation_members cm ON cm.conversation_id = c.id
            WHERE cm.user_id = %s
            ORDER BY c.created_at DESC
        """, (user_id,))
        convs = cur.fetchall()

        result = []
        for conv in convs:
            conv_id = conv[0]

            cur.execute("""
                SELECT u.id, u.username, u.display_name, u.avatar_color, u.is_online
                FROM users u
                JOIN conversation_members cm ON cm.user_id = u.id
                WHERE cm.conversation_id = %s AND u.id != %s
            """, (conv_id, user_id))
            members = cur.fetchall()

            cur.execute("""
                SELECT text, sender_id, created_at FROM messages
                WHERE conversation_id = %s
                ORDER BY created_at DESC LIMIT 1
            """, (conv_id,))
            last_msg = cur.fetchone()

            cur.execute("""
                SELECT COUNT(*) FROM messages
                WHERE conversation_id = %s AND sender_id != %s AND is_read = FALSE
            """, (conv_id, user_id))
            unread = cur.fetchone()[0]

            other = members[0] if members else None
            result.append({
                "id": conv_id,
                "is_group": conv[1],
                "group_name": conv[2],
                "other_user": {"id": other[0], "username": other[1], "display_name": other[2], "avatar_color": other[3], "is_online": other[4]} if other else None,
                "last_message": {"text": last_msg[0], "sender_id": last_msg[1], "created_at": str(last_msg[2])} if last_msg else None,
                "unread_count": unread
            })

        conn.close()
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"conversations": result})}

    if method == "POST" and action == "start":
        body = json.loads(event.get("body", "{}"))
        other_user_id = body.get("other_user_id")

        if not other_user_id:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите пользователя"})}

        conn = get_db()
        cur = conn.cursor()

        cur.execute("""
            SELECT cm1.conversation_id FROM conversation_members cm1
            JOIN conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
            JOIN conversations c ON c.id = cm1.conversation_id
            WHERE cm1.user_id = %s AND cm2.user_id = %s AND c.is_group = FALSE
        """, (user_id, other_user_id))
        existing = cur.fetchone()

        if existing:
            conn.close()
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"conversation_id": existing[0], "existing": True})}

        cur.execute("INSERT INTO conversations (is_group) VALUES (FALSE) RETURNING id")
        conv_id = cur.fetchone()[0]
        cur.execute("INSERT INTO conversation_members (conversation_id, user_id) VALUES (%s, %s)", (conv_id, user_id))
        cur.execute("INSERT INTO conversation_members (conversation_id, user_id) VALUES (%s, %s)", (conv_id, other_user_id))
        conn.commit()
        conn.close()

        return {"statusCode": 200, "headers": headers, "body": json.dumps({"conversation_id": conv_id, "existing": False})}

    return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
