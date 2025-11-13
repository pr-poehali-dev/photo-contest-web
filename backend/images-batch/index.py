import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Batch load multiple images by IDs (up to 10 at once)
    Args: event with httpMethod GET, query param photo_ids (comma-separated)
    Returns: HTTP response with dict of {photo_id: image_url}
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
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
    photo_ids_str = params.get('photo_ids', '')
    
    if not photo_ids_str:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'photo_ids parameter required (comma-separated)'}),
            'isBase64Encoded': False
        }
    
    try:
        photo_ids = [int(pid.strip()) for pid in photo_ids_str.split(',') if pid.strip()]
    except ValueError:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid photo_ids format'}),
            'isBase64Encoded': False
        }
    
    if len(photo_ids) > 10:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Maximum 10 photo IDs per request'}),
            'isBase64Encoded': False
        }
    
    if not photo_ids:
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    placeholders = ','.join(['%s'] * len(photo_ids))
    query = f"SELECT id, image_url FROM photos WHERE id IN ({placeholders})"
    
    cur.execute(query, tuple(photo_ids))
    results = cur.fetchall()
    
    cur.close()
    conn.close()
    
    images_dict = {str(row['id']): row['image_url'] for row in results}
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(images_dict),
        'isBase64Encoded': False
    }