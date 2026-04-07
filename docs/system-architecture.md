# NutriCore AI System Architecture

## 1. Product Architecture Goals

NutriCore AI is designed around one principle:

> Complex logic, simple experience.

The system must:

- support mobile-first usage
- handle multi-condition nutrition safety rules
- combine deterministic clinical rules with AI assistance
- remain modular for healthcare-grade expansion
- support Indonesian and global food datasets

## 2. High-Level Architecture

```text
Mobile App (React Native)
  |
  v
API Gateway / FastAPI Application
  |
  +-- Auth & User Profile Service
  +-- Metabolic Engine
  +-- Clinical Rule Engine
  +-- Nutrition Planning Service
  +-- Food Tracking / NLP Service
  +-- Recipe Recommendation Service
  +-- Exercise Guidance Service
  +-- Reminder / Schedule Service
  +-- Insights & Personalization Service
  +-- Food Image Analysis Service
  |
  +-- PostgreSQL
  +-- Redis (cache, job state, sessions)
  +-- Object Storage (food images, avatars, generated assets)
  +-- Background Workers
  |
  +-- External / Internal AI Models
```

## 3. Core Layers

### Client Layer

React Native mobile app:

- Home
- Track
- Recipe
- Profile

Primary responsibilities:

- onboarding and health profile capture
- meal and activity logging
- personalized dashboard rendering
- reminders and insight presentation
- food image upload

### API Layer

FastAPI provides:

- REST endpoints for app features
- request validation with Pydantic
- auth and role control
- orchestration across clinical and AI services
- versioned APIs for future expansion

### Domain Logic Layer

This is the core of the product.

Modules:

- metabolic engine
- clinical rule engine
- nutrition target calculator
- schedule planner
- exercise recommender
- personalization engine

### AI Layer

Hybrid AI services:

- NLP parser for free-text food input
- CV model for food image analysis
- LLM-powered recipe generation with safety constraints
- weekly insight summarization

AI must never bypass clinical safety rules. All generated outputs are post-processed through deterministic validators.

### Data Layer

PostgreSQL stores:

- users
- health conditions
- lab values
- food database
- meal logs
- nutrition plans
- recipes
- reminders
- insights

Supporting infrastructure:

- Redis for caching food lookup, active plans, and job coordination
- object storage for uploaded food images

### Async Processing Layer

Background jobs handle:

- image analysis
- recipe generation
- weekly insight generation
- schedule reminder generation
- personalization retraining tasks

Recommended tooling:

- Celery or RQ for workers
- Redis as queue backend

## 4. Service Breakdown

### 4.1 Auth and User Service

Responsibilities:

- registration and login
- profile management
- health onboarding
- clinician mode support later

### 4.2 Metabolic Engine

Responsibilities:

- BMR using Mifflin-St Jeor
- TDEE using activity multiplier
- calorie deficit or surplus adjustment

Output:

- baseline metabolic profile
- calorie target

### 4.3 Clinical Rule Engine

Responsibilities:

- evaluate all selected conditions
- assign priority by medical severity
- merge nutrition constraints safely
- resolve conflicts conservatively

Priority order:

1. CKD
2. Cardiovascular disease
3. Diabetes
4. Hypertension
5. Obesity

Output:

- nutrition safety constraints
- macro adjustments
- sodium, fluid, and protein rules
- warnings and contraindications

### 4.4 Nutrition Planning Service

Responsibilities:

- combine metabolic output with clinical constraints
- produce calorie, protein, carb, fat, sodium, and fluid targets
- generate daily plan summaries

### 4.5 Food Tracking and NLP Service

Responsibilities:

- manual food logging
- parse text like "nasi + tempe goreng"
- map foods to database items
- estimate nutrition totals

### 4.6 Recipe Recommendation Service

Responsibilities:

- generate 3 to 5 tailored recipes
- respect calorie and condition constraints
- return ingredients, steps, and nutrition

### 4.7 Food Image Analysis Service

Responsibilities:

- identify food items in image
- estimate portion sizes
- compute calories and nutrients
- evaluate suitability against current plan

### 4.8 Exercise Guidance Service

Responsibilities:

- generate safe exercise type, duration, and frequency
- adapt by goal, condition, and fitness level

### 4.9 Smart Health System

Responsibilities:

- meal timing
- hydration reminders
- activity reminders
- daily schedule generation

### 4.10 Insights and Personalization Engine

Responsibilities:

- detect behavior trends
- adapt recommendations over time
- create weekly summaries

## 5. Data Flow

### Onboarding Flow

1. User submits profile, goals, conditions, and optional labs
2. Metabolic engine calculates BMR and TDEE
3. Clinical rule engine merges condition-specific restrictions
4. Nutrition planning service creates safe daily targets
5. Mobile app renders dashboard and schedule

### Food Tracking Flow

1. User enters food manually or with natural language
2. NLP parser identifies likely food matches
3. Nutrition totals are calculated from food database
4. Daily intake is compared with active targets
5. User receives feedback and adjustment suggestions

### Recipe Flow

1. User selects ingredients or requests recipes
2. Recipe generator receives nutrition and medical constraints
3. AI drafts candidates
4. safety validator checks clinical compliance
5. Safe recipes are returned

### Food Image Flow

1. User uploads meal image
2. Image stored in object storage
3. CV worker detects foods and estimates portions
4. Nutrition service calculates totals
5. Clinical evaluator labels meal as suitable, caution, or avoid

## 6. Security and Compliance Readiness

Recommended production controls:

- JWT access and refresh tokens
- password hashing with Argon2 or bcrypt
- audit logging for health-profile changes
- encrypted storage for sensitive health values
- role-based access for clinician mode
- API rate limiting
- signed URL uploads for images

## 7. Deployment Topology

Recommended deployment:

- React Native app for iOS and Android
- FastAPI app in containers
- PostgreSQL managed database
- Redis managed cache
- worker containers for async jobs
- object storage for images
- observability stack for metrics and logs

## 8. Suggested Monorepo Structure

```text
nutricore-ai/
  mobile/
  backend/
    app/
      api/
      core/
      models/
      schemas/
      services/
      engines/
      repositories/
      workers/
      tests/
  docs/
  infra/
```
