-- =====================================================
-- RESET DATABASE
-- DEVELOPMENT ONLY
--
-- WARNING:
-- This script permanently deletes all tables and their data.
-- Use only in a local development environment.
-- Do NOT run in production.
-- =====================================================
DROP TABLE IF EXISTS notification CASCADE;
DROP TABLE IF EXISTS report CASCADE;
DROP TABLE IF EXISTS invoice CASCADE;
DROP TABLE IF EXISTS cost_estimate CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS inspection_request CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS stock CASCADE;
DROP TABLE IF EXISTS super_admin CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS inspector CASCADE;
DROP TABLE IF EXISTS client CASCADE;