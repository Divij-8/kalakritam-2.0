-- ================================================================
-- KALAKRITAM DATABASE MIGRATION
-- Add missing columns to events table
-- Run this in your Neon PostgreSQL database
-- ================================================================

-- Add district_url column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS district_url TEXT;

-- Add book_my_show_url column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS book_my_show_url TEXT;

-- Add category column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS category VARCHAR(100);

-- Add video_url column if it doesn't exist
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS video_url TEXT;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_district_url ON events(district_url) WHERE district_url IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_events_book_my_show_url ON events(book_my_show_url) WHERE book_my_show_url IS NOT NULL;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name IN ('district_url', 'book_my_show_url', 'category', 'video_url')
ORDER BY column_name;

-- Show sample data to confirm columns exist
SELECT 
    id, 
    title, 
    category,
    video_url,
    district_url, 
    book_my_show_url 
FROM events 
LIMIT 5;
