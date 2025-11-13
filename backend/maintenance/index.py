import json
import os
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Reset monthly activity and update daily statistics snapshots
    Args: event with httpMethod, query params (action: reset_activity|update_stats)
    Returns: HTTP response with operation result
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {})
    action = params.get('action', 'update_stats')
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    barnaul_tz = timezone(timedelta(hours=7))
    now_barnaul = datetime.now(barnaul_tz)
    today = now_barnaul.date()
    
    if action == 'reset_activity':
        cur.execute("""
            SELECT COUNT(*) as count FROM user_activity 
            WHERE last_reset_date < %s
        """, (today,))
        
        result = cur.fetchone()
        users_to_reset = result['count'] if result else 0
        
        if users_to_reset > 0:
            cur.execute("""
                UPDATE user_activity 
                SET activity_count = 0, last_reset_date = %s
                WHERE last_reset_date < %s
            """, (today, today))
            
            conn.commit()
            message = f'Activity reset for {users_to_reset} users'
        else:
            message = 'No users need activity reset today'
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'action': 'reset_activity',
                'date': str(today),
                'users_affected': users_to_reset,
                'message': message
            }),
            'isBase64Encoded': False
        }
    
    elif action == 'update_stats':
        cur.execute("""
            SELECT u.id as user_id, COALESCE(ua.activity_count, 0) as activity
            FROM users u
            LEFT JOIN user_activity ua ON u.id = ua.user_id
        """)
        users = cur.fetchall()
        
        cur.execute("""
            SELECT id as photo_id, user_id, rating
            FROM photos
        """)
        photos = cur.fetchall()
        
        for user in users:
            cur.execute("""
                INSERT INTO daily_stats (snapshot_date, user_id, activity_count)
                VALUES (%s, %s, %s)
                ON CONFLICT (snapshot_date, user_id, photo_id) 
                DO UPDATE SET activity_count = EXCLUDED.activity_count
            """, (today, user['user_id'], user['activity']))
        
        for photo in photos:
            cur.execute("""
                INSERT INTO daily_stats (snapshot_date, user_id, photo_id, photo_rating)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (snapshot_date, user_id, photo_id) 
                DO UPDATE SET photo_rating = EXCLUDED.photo_rating
            """, (today, photo['user_id'], photo['photo_id'], photo['rating']))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'action': 'update_stats',
                'date': str(today),
                'users_updated': len(users),
                'photos_updated': len(photos),
                'message': 'Daily statistics updated successfully'
            }),
            'isBase64Encoded': False
        }
    
    cur.close()
    conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'}),
        'isBase64Encoded': False
    }
