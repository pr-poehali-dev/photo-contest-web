import json
import os
import random
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get random photo pairs for voting and submit votes
    Args: event with httpMethod, body (user_id, winner_photo_id for POST), query params (user_id for GET)
    Returns: HTTP response with photo pair or vote result
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
        
        if not user_id:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'user_id required'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            SELECT c.id, c.name FROM categories c ORDER BY c.display_order
        """)
        categories = cur.fetchall()
        
        photo_pair: Optional[tuple] = None
        selected_category = None
        
        for category in categories:
            cur.execute("""
                SELECT p.id, p.rating, p.views_count
                FROM photos p
                WHERE p.category_id = %s
                AND p.user_id != %s
                AND p.id NOT IN (SELECT photo_id FROM shown_photos WHERE user_id = %s)
                ORDER BY p.views_count ASC, RANDOM()
                LIMIT 2
            """, (category['id'], user_id, user_id))
            
            photos = cur.fetchall()
            if len(photos) >= 2:
                photo_pair = photos
                selected_category = category
                break
        
        if not photo_pair:
            cur.close()
            conn.close()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'completed': True, 'message': 'All photos voted'}),
                'isBase64Encoded': False
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'photo1': dict(photo_pair[0]),
                'photo2': dict(photo_pair[1]),
                'category': selected_category['name']
            }),
            'isBase64Encoded': False
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('user_id')
        photo1_id = body_data.get('photo1_id')
        photo2_id = body_data.get('photo2_id')
        winner_photo_id = body_data.get('winner_photo_id')
        
        if not all([user_id, photo1_id, photo2_id, winner_photo_id]):
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing required fields'}),
                'isBase64Encoded': False
            }
        
        cur.execute(
            "INSERT INTO votes (user_id, photo1_id, photo2_id, winner_photo_id) VALUES (%s, %s, %s, %s)",
            (user_id, photo1_id, photo2_id, winner_photo_id)
        )
        
        cur.execute("UPDATE photos SET rating = rating + 1 WHERE id = %s", (winner_photo_id,))
        
        cur.execute(
            "INSERT INTO shown_photos (user_id, photo_id) VALUES (%s, %s), (%s, %s) ON CONFLICT DO NOTHING",
            (user_id, photo1_id, user_id, photo2_id)
        )
        
        cur.execute("UPDATE photos SET views_count = views_count + 1 WHERE id IN (%s, %s)", (photo1_id, photo2_id))
        
        cur.execute(
            "UPDATE user_activity SET activity_count = activity_count + 1 WHERE user_id = %s",
            (user_id,)
        )
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'message': 'Vote recorded successfully'}),
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