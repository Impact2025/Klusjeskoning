-- Add childId column to sessions table to track child logins
ALTER TABLE sessions ADD COLUMN child_id uuid REFERENCES children(id) ON DELETE CASCADE;