import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload and retrieve user photos
    Args: event with httpMethod, body (user_id, category_id, image_url for POST)
    Returns: HTTP response with photos data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        user_id = params.get('user_id')
        
        cur.execute("""
            SELECT p.id, p.rating, c.name as category_name, c.id as category_id
            FROM photos p
            JOIN categories c ON p.category_id = c.id
            WHERE p.user_id = %s
            ORDER BY c.display_order, p.created_at
        """, (user_id,)) if user_id else cur.execute("""
            SELECT p.id, p.rating, c.name as category_name, c.id as category_id, u.username
            FROM photos p
            JOIN categories c ON p.category_id = c.id
            JOIN users u ON p.user_id = u.id
            ORDER BY p.rating DESC
            LIMIT 50
        """)
        
        photos = cur.fetchall()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps([dict(photo) for photo in photos]),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body = event.get('body', '{}')
        if not body or body == '':
            body = '{}'
        body_data = json.loads(body)
        user_id = body_data.get('user_id')
        category_id = body_data.get('category_id')
        image_url = body_data.get('image_url')
        
        if not all([user_id, category_id, image_url]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        if len(image_url) > 250000:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Image too large (max 250KB in base64)'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "SELECT COUNT(*) as count FROM photos WHERE user_id = %s AND category_id = %s",
            (user_id, category_id)
        )
        count = cur.fetchone()['count']
        
        if count >= 6:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Maximum 6 photos per category'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO photos (user_id, category_id, image_url) VALUES (%s, %s, %s) RETURNING id",
            (user_id, category_id, image_url)
        )
        photo_id = cur.fetchone()['id']
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'photo_id': photo_id, 'message': 'Photo uploaded successfully'}),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    return {
        'statusCode': 405,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }