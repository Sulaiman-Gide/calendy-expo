-- Add onboarded column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarded BOOLEAN DEFAULT FALSE;

-- Update existing users to be marked as onboarded
UPDATE profiles SET onboarded = TRUE;
