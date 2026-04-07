# NutriCore AI Backend API Structure

## 1. Backend Design Principles

The backend should be:

- domain-driven
- clinically safe
- AI-augmented but rules-first
- mobile optimized
- horizontally scalable

## 2. FastAPI Module Structure

```text
backend/
  app/
    api/
      v1/
        endpoints/
          auth.py
          users.py
          health.py
          plans.py
          foods.py
          tracking.py
          recipes.py
          exercise.py
          reminders.py
          insights.py
          image_analysis.py
        router.py
    core/
      config.py
      security.py
      database.py
      exceptions.py
    models/
      user.py
      profile.py
      medical_condition.py
      lab_result.py
      food.py
      meal.py
      recipe.py
      nutrition_plan.py
      exercise_plan.py
      reminder.py
      insight.py
    schemas/
      auth.py
      user.py
      health.py
      food.py
      meal.py
      plan.py
      recipe.py
      exercise.py
      reminder.py
      insight.py
      common.py
    repositories/
      user_repository.py
      food_repository.py
      meal_repository.py
      plan_repository.py
    services/
      auth_service.py
      profile_service.py
      food_service.py
      tracking_service.py
      recipe_service.py
      image_analysis_service.py
      exercise_service.py
      reminder_service.py
      insight_service.py
    engines/
      metabolic_engine.py
      clinical_rule_engine.py
      nutrition_engine.py
      conflict_resolver.py
    workers/
      recipe_jobs.py
      image_jobs.py
      insight_jobs.py
```

## 3. Domain API Surface

### Auth

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `GET /api/v1/auth/me`

### User and Profile

- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `POST /api/v1/users/onboarding`
- `GET /api/v1/users/preferences`
- `PUT /api/v1/users/preferences`

### Health and Clinical Data

- `GET /api/v1/health/conditions`
- `POST /api/v1/health/conditions`
- `PUT /api/v1/health/conditions/{condition_id}`
- `DELETE /api/v1/health/conditions/{condition_id}`
- `GET /api/v1/health/labs`
- `POST /api/v1/health/labs`

### Nutrition Plans

- `POST /api/v1/plans/generate`
- `GET /api/v1/plans/current`
- `GET /api/v1/plans/history`
- `GET /api/v1/plans/{plan_id}`

### Food Database

- `GET /api/v1/foods/search`
- `GET /api/v1/foods/{food_id}`
- `POST /api/v1/foods/parse-text`

### Tracking

- `POST /api/v1/tracking/meals`
- `GET /api/v1/tracking/meals`
- `GET /api/v1/tracking/meals/{meal_id}`
- `POST /api/v1/tracking/image-analysis`
- `GET /api/v1/tracking/daily-summary`

### Recipes

- `POST /api/v1/recipes/generate`
- `GET /api/v1/recipes/history`
- `GET /api/v1/recipes/{recipe_id}`

### Resources

- `GET /api/v1/resources/guide`
- `GET /api/v1/resources/guide/file`

### Exercise

- `POST /api/v1/exercise/recommend`
- `GET /api/v1/exercise/current`

### Reminders

- `GET /api/v1/reminders`
- `POST /api/v1/reminders`
- `PUT /api/v1/reminders/{reminder_id}`

### Insights

- `GET /api/v1/insights/weekly`
- `POST /api/v1/insights/generate`

## 4. Request and Response Strategy

Use:

- Pydantic request validation
- standard response envelope for mobile predictability
- typed error objects for field-level validation

Recommended API response pattern:

```json
{
  "success": true,
  "message": "Plan generated successfully",
  "data": {}
}
```

Error pattern:

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "field": "weight_kg",
      "detail": "Weight must be greater than zero"
    }
  ]
}
```

## 5. Core Service Responsibilities

### metabolic_engine.py

- compute BMR
- compute TDEE
- apply goal-based calorie adjustment

### clinical_rule_engine.py

- load all active conditions
- apply priority ranking
- merge nutrition constraints
- return safe boundaries

### conflict_resolver.py

- handle rule collisions
- choose safer clinical value
- create reasoning summary for transparency

### nutrition_engine.py

- translate calorie target and restrictions into daily macro targets
- add sodium and fluid constraints

## 6. Non-Functional API Requirements

- versioned API paths
- structured logging
- audit trails for clinical-impacting updates
- rate limiting for AI-heavy endpoints
- async job model for image analysis and recipe generation
- idempotent plan generation where possible
