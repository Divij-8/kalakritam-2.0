# Quick Database Verification for Booking URLs
# Copy and paste these queries one at a time into your Neon PostgreSQL console

# ================================================================
# 1. CHECK IF COLUMNS EXIST
# ================================================================
SELECT 
    column_name, 
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name IN ('district_url', 'book_my_show_url', 'category', 'video_url')
ORDER BY column_name;

-- Expected: Should return 4 rows (one for each column)
-- If it returns 0 rows, the columns don't exist!


# ================================================================
# 2. CHECK DATA IN THESE COLUMNS
# ================================================================
SELECT 
    id, 
    title,
    district_url,
    book_my_show_url,
    category,
    video_url,
    LENGTH(district_url) as district_url_length,
    LENGTH(book_my_show_url) as bookmyshow_url_length,
    created_at,
    updated_at
FROM events 
ORDER BY updated_at DESC 
LIMIT 5;

-- This shows the last 5 updated events
-- Check if district_url and book_my_show_url have actual values or are NULL


# ================================================================
# 3. COUNT HOW MANY EVENTS HAVE BOOKING URLS
# ================================================================
SELECT 
    COUNT(*) as total_events,
    COUNT(district_url) as events_with_district,
    COUNT(book_my_show_url) as events_with_bookmyshow,
    COUNT(CASE WHEN district_url IS NOT NULL AND book_my_show_url IS NOT NULL THEN 1 END) as events_with_both
FROM events;

-- This shows how many events actually have booking URLs


# ================================================================
# 4. SEE SPECIFIC EVENT BY ID (Replace 1 with your event ID)
# ================================================================
SELECT * FROM events WHERE id = 1;

-- This shows ALL columns for a specific event


# ================================================================
# 5. TEST UPDATE (Replace values as needed)
# ================================================================
-- First, let's see what we're updating
SELECT id, title, district_url, book_my_show_url 
FROM events 
WHERE id = 1;

-- Update a test event (CHANGE ID AND URLs)
UPDATE events 
SET 
    district_url = 'https://district.app/event/test-event',
    book_my_show_url = 'https://in.bookmyshow.com/events/test-event'
WHERE id = 1
RETURNING id, title, district_url, book_my_show_url;

-- This should return the updated row with new values


# ================================================================
# 6. VERIFY THE UPDATE WORKED
# ================================================================
SELECT id, title, district_url, book_my_show_url 
FROM events 
WHERE id = 1;

-- Should show the URLs you just set
