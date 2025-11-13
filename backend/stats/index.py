import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get statistics for homepage (top users, top photos)
    Args: event with httpMethod GET, query params (user_id optional)
    Returns: HTTP response with statistics data
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    user_id = params.get('user_id')
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("""
        SELECT u.id, u.username, COALESCE(ua.activity_count, 0) as activity_count
        FROM users u
        LEFT JOIN user_activity ua ON u.id = ua.user_id
        ORDER BY ua.activity_count DESC NULLS LAST
        LIMIT 10
    """)
    top_users = cur.fetchall()
    
    cur.execute("""
        SELECT p.id, p.rating, c.name as category_name, u.username
        FROM photos p
        JOIN categories c ON p.category_id = c.id
        JOIN users u ON p.user_id = u.id
        ORDER BY p.rating DESC
        LIMIT 1
    """)
    top_photo = cur.fetchone()
    
    cur.execute("""
        SELECT c.id, c.name, c.display_order
        FROM categories c
        ORDER BY c.display_order
    """)
    categories = cur.fetchall()
    
    top_photos_by_category = []
    for category in categories:
        cur.execute("""
            SELECT p.id, p.rating, c.name as category_name, u.username
            FROM photos p
            JOIN categories c ON p.category_id = c.id
            JOIN users u ON p.user_id = u.id
            WHERE p.category_id = %s
            ORDER BY p.rating DESC
            LIMIT 1
        """, (category['id'],))
        
        top_cat_photo = cur.fetchone()
        if top_cat_photo:
            top_photos_by_category.append(dict(top_cat_photo))
    
    user_activity = 0
    user_best_photo_rating = 0
    user_rank = None
    user_photos_by_category = {}
    
    if user_id:
        cur.execute("""
            SELECT activity_count FROM user_activity WHERE user_id = %s
        """, (user_id,))
        user_act = cur.fetchone()
        if user_act:
            user_activity = user_act['activity_count']
        
        cur.execute("""
            SELECT COALESCE(MAX(rating), 0) as max_rating FROM photos WHERE user_id = %s
        """, (user_id,))
        user_best = cur.fetchone()
        if user_best:
            user_best_photo_rating = user_best['max_rating']
        
        cur.execute("""
            SELECT COUNT(*) + 1 as rank
            FROM user_activity
            WHERE activity_count > (SELECT activity_count FROM user_activity WHERE user_id = %s)
        """, (user_id,))
        rank_result = cur.fetchone()
        if rank_result:
            user_rank = rank_result['rank']
        
        for category in categories:
            cur.execute("""
                SELECT COALESCE(MAX(rating), 0) as max_rating
                FROM photos
                WHERE user_id = %s AND category_id = %s
            """, (user_id, category['id']))
            
            cat_best = cur.fetchone()
            user_photos_by_category[category['name']] = cat_best['max_rating'] if cat_best else 0
    
    cur.close()
    conn.close()
    
    result = {
        'top_users': [dict(u) for u in top_users],
        'top_photo': dict(top_photo) if top_photo else None,
        'top_photos_by_category': top_photos_by_category,
        'user_stats': {
            'activity': user_activity,
            'best_photo_rating': user_best_photo_rating,
            'rank': user_rank,
            'photos_by_category': user_photos_by_category
        }
    }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(result),
        'isBase64Encoded': False
    }