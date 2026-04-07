# NutriCore AI Database Schema

## 1. Design Principles

The schema is designed for:

- user-centric health profiles
- multi-condition clinical logic
- daily nutrition tracking
- recipe personalization
- AI-assisted analysis history
- future clinician-mode expansion

## 2. Core Entities

### users

Stores account and identity data.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| email | varchar unique | login email |
| password_hash | varchar | hashed password |
| full_name | varchar | display name |
| birth_date | date | used to derive age |
| gender | varchar(20) | male, female, other |
| locale | varchar(20) | app language/region |
| timezone | varchar(50) | reminder scheduling |
| created_at | timestamptz | record created |
| updated_at | timestamptz | record updated |

### user_profiles

Stores mutable physical and lifestyle data.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | one-to-one owner |
| weight_kg | numeric(6,2) | current weight |
| height_cm | numeric(6,2) | current height |
| activity_level | varchar(30) | sedentary to very_active |
| health_goal | varchar(30) | lose, gain, maintain, improve_metabolic |
| fitness_level | varchar(30) | beginner, moderate, advanced |
| target_weight_kg | numeric(6,2) nullable | optional |
| created_at | timestamptz | record created |
| updated_at | timestamptz | record updated |

### medical_conditions

Master list of supported conditions.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| code | varchar unique | diabetes, hypertension, ckd |
| name | varchar | display name |
| priority_rank | int | lower means higher priority |
| created_at | timestamptz | record created |

### user_medical_conditions

Stores user-selected conditions, including stage or severity.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| condition_id | uuid fk medical_conditions.id | selected condition |
| stage | varchar(50) nullable | e.g. CKD stage 2 |
| severity | varchar(50) nullable | optional severity |
| notes | text nullable | clinician or user notes |
| is_active | boolean | active condition flag |
| diagnosed_at | date nullable | optional |
| created_at | timestamptz | record created |
| updated_at | timestamptz | record updated |

### lab_results

Stores optional lab inputs and longitudinal records.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| test_type | varchar(50) | hba1c, ldl, egfr, creatinine |
| value | numeric(10,2) | numeric result |
| unit | varchar(20) | %, mg/dL, mL/min |
| measured_at | date | lab date |
| source | varchar(50) nullable | manual, clinic, import |
| created_at | timestamptz | record created |

### nutrition_plans

Stores computed daily targets.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| plan_date | date | effective date |
| bmr_kcal | numeric(8,2) | metabolic baseline |
| tdee_kcal | numeric(8,2) | total expenditure |
| target_calories_kcal | numeric(8,2) | final daily target |
| protein_g | numeric(8,2) | daily protein |
| carbs_g | numeric(8,2) | daily carbs |
| fat_g | numeric(8,2) | daily fat |
| sodium_mg | numeric(8,2) nullable | daily sodium cap |
| fluid_ml | numeric(8,2) nullable | fluid guidance |
| clinical_summary | jsonb | merged constraints |
| generated_by | varchar(30) | rule_engine or clinician |
| created_at | timestamptz | record created |

### foods

Master food database for Indonesian and global foods.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| name | varchar | canonical food name |
| local_name | varchar nullable | e.g. nasi putih |
| category | varchar(50) | grain, protein, vegetable |
| calories_per_100g | numeric(8,2) | kcal |
| protein_g_per_100g | numeric(8,2) | grams |
| carbs_g_per_100g | numeric(8,2) | grams |
| fat_g_per_100g | numeric(8,2) | grams |
| fiber_g_per_100g | numeric(8,2) nullable | grams |
| sodium_mg_per_100g | numeric(8,2) nullable | mg |
| potassium_mg_per_100g | numeric(8,2) nullable | mg |
| phosphorus_mg_per_100g | numeric(8,2) nullable | mg |
| glycemic_index | int nullable | GI score |
| default_serving_g | numeric(8,2) nullable | default portion |
| aliases | jsonb nullable | synonyms |
| is_indonesian | boolean | localization flag |
| created_at | timestamptz | record created |
| updated_at | timestamptz | record updated |

### meals

Represents a meal event.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| meal_type | varchar(30) | breakfast, lunch, dinner, snack |
| consumed_at | timestamptz | meal time |
| source | varchar(30) | manual, nlp, image |
| note | text nullable | optional text |
| image_url | text nullable | uploaded image path |
| suitability_score | numeric(5,2) nullable | plan fit score |
| created_at | timestamptz | record created |

### meal_items

Resolved items in a meal.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| meal_id | uuid fk meals.id | parent meal |
| food_id | uuid fk foods.id nullable | matched food item |
| item_name | varchar | final display item |
| quantity_g | numeric(8,2) | grams consumed |
| calories_kcal | numeric(8,2) | resolved calories |
| protein_g | numeric(8,2) | resolved protein |
| carbs_g | numeric(8,2) | resolved carbs |
| fat_g | numeric(8,2) | resolved fat |
| sodium_mg | numeric(8,2) nullable | resolved sodium |
| glycemic_load | numeric(8,2) nullable | optional |
| confidence_score | numeric(5,2) nullable | NLP or CV confidence |
| created_at | timestamptz | record created |

### generated_recipes

Stores recipe generation history.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| title | varchar | recipe title |
| input_ingredients | jsonb | requested ingredients |
| medical_context | jsonb | conditions and safety limits |
| servings | int | default servings |
| instructions | jsonb | ordered steps |
| nutrition_info | jsonb | calories and macros |
| safety_notes | jsonb nullable | cautions and substitutions |
| created_at | timestamptz | record created |

### exercise_plans

Stores personalized exercise recommendations.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| plan_date | date | effective day |
| exercise_type | varchar(100) | walking, cycling, resistance |
| duration_minutes | int | planned duration |
| frequency_per_week | int | weekly frequency |
| intensity | varchar(30) | light, moderate |
| safety_notes | text nullable | cautions |
| created_at | timestamptz | record created |

### reminders

Stores user reminder schedules.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| reminder_type | varchar(30) | hydration, meal, exercise |
| scheduled_time | time | local clock time |
| days_of_week | jsonb | active weekdays |
| is_enabled | boolean | active flag |
| created_at | timestamptz | record created |
| updated_at | timestamptz | record updated |

### weekly_insights

Stores generated behavior summaries.

| column | type | notes |
|---|---|---|
| id | uuid pk | primary key |
| user_id | uuid fk users.id | owner |
| week_start | date | weekly window start |
| adherence_score | numeric(5,2) nullable | target adherence |
| insight_summary | text | narrative summary |
| recommendations | jsonb | action suggestions |
| generated_at | timestamptz | generation time |

## 3. Key Relationships

```text
users 1---1 user_profiles
users 1---n user_medical_conditions
medical_conditions 1---n user_medical_conditions
users 1---n lab_results
users 1---n nutrition_plans
users 1---n meals
meals 1---n meal_items
foods 1---n meal_items
users 1---n generated_recipes
users 1---n exercise_plans
users 1---n reminders
users 1---n weekly_insights
```

## 4. Recommended Indexes

- users(email)
- user_profiles(user_id)
- user_medical_conditions(user_id, is_active)
- lab_results(user_id, test_type, measured_at desc)
- nutrition_plans(user_id, plan_date desc)
- foods(name)
- foods(local_name)
- foods(category)
- meals(user_id, consumed_at desc)
- meal_items(meal_id)
- generated_recipes(user_id, created_at desc)
- weekly_insights(user_id, week_start desc)

## 5. Notes for Clinical Logic

The schema intentionally keeps `clinical_summary`, `medical_context`, and several AI outputs in `jsonb` so the system can evolve without constant migrations while still preserving normalized core health records.
