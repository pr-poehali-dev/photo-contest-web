import json
import base64
import os
import uuid
from typing import Dict, Any
import boto3

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload base64 image to S3 and return public URL
    Args: event with body containing base64 image data
    Returns: HTTP response with S3 URL
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
    
    body_data = json.loads(event.get('body', '{}'))
    image_data = body_data.get('image')
    
    if not image_data:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Missing image data'}),
            'isBase64Encoded': False
        }
    
    if image_data.startswith('data:image'):
        image_data = image_data.split(',', 1)[1]
    
    try:
        image_bytes = base64.b64decode(image_data)
    except Exception as e:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid base64 image'}),
            'isBase64Encoded': False
        }
    
    aws_key_id = os.environ.get('AWS_ACCESS_KEY_ID')
    aws_secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
    bucket_name = os.environ.get('S3_BUCKET_NAME', 'poehali-user-uploads')
    
    s3_client = boto3.client(
        's3',
        aws_access_key_id=aws_key_id,
        aws_secret_access_key=aws_secret,
        endpoint_url='https://storage.yandexcloud.net',
        region_name='ru-central1'
    )
    
    file_name = f"photos/{uuid.uuid4()}.jpg"
    
    s3_client.put_object(
        Bucket=bucket_name,
        Key=file_name,
        Body=image_bytes,
        ContentType='image/jpeg',
        ACL='public-read'
    )
    
    image_url = f"https://storage.yandexcloud.net/{bucket_name}/{file_name}"
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'url': image_url}),
        'isBase64Encoded': False
    }
