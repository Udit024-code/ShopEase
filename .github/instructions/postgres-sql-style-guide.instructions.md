---
description: Postgres SQL style guide for this project
alwaysApply: false
---

# Postgres SQL Style Guide

## General

- Use lowercase for SQL reserved words (`select`, `create table`, `where`) to keep queries readable and consistent.
- Use snake_case for table names, column names, and identifiers.
- Prefer plural table names (`posts`, `comments`) and singular column names (`user_id`, not `user_ids` unless it's actually an array).
- Add a comment above any non-obvious column or constraint explaining its purpose.

## Tables

- Every table should have a primary key. Prefer `uuid primary key default gen_random_uuid()` unless there's a specific reason for a different key type.
- Always add `created_at timestamptz not null default now()` for auditability; add `updated_at` (maintained by trigger) for tables that get modified after creation.
- Explicitly declare `not null` where a column should never be empty rather than relying on defaults.

## Foreign Keys & Indexes

- Always index foreign key columns — Postgres does not do this automatically, and it's needed for efficient joins and cascade operations.
- Use `on delete cascade` for child rows that shouldn't outlive their parent (e.g. comments when a post is deleted); use `on delete restrict` or `set null` when deletion should be prevented or handled explicitly.

## Migrations & RLS

- See `create-migration.mdc` for migration file conventions.
- See `create-rls-policies.mdc` for RLS policy conventions.
- See `create-db-functions.mdc` for function conventions.
