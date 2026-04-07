from fastapi import APIRouter

from app.api.v1.endpoints import assessment, auth, exports, foods, health, plans, product_labels, recipes, resources, tracking, users

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(assessment.router, prefix="/assessment", tags=["assessment"])
api_router.include_router(plans.router, prefix="/plans", tags=["plans"])
api_router.include_router(foods.router, prefix="/foods", tags=["foods"])
api_router.include_router(tracking.router, prefix="/tracking", tags=["tracking"])
api_router.include_router(recipes.router, prefix="/recipes", tags=["recipes"])
api_router.include_router(product_labels.router, prefix="/product-labels", tags=["product-labels"])
api_router.include_router(resources.router, prefix="/resources", tags=["resources"])
api_router.include_router(exports.router, prefix="/exports", tags=["exports"])
