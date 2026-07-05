import redis.asyncio as redis
from app.core.config import settings

# Redis 비동기 클라이언트 싱글톤
redis_client = redis.Redis(
    host=settings.REDIS_HOST,
    port=settings.REDIS_PORT,
    decode_responses=True
)

async def get_redis():
    return redis_client
