# Debugging Guide: Booking URLs Not Showing Issue

## 🔍 Problem
When editing an event, the booking URLs (District URL and BookMyShow URL) are not appearing in the form fields, and only one logo button is showing on the event detail page.

## 📋 Testing Steps

### Step 1: Check Console Logs When Loading Admin Portal

1. Open your browser's Developer Console (Press F12)
2. Go to the Admin Events page
3. Look for the log: `📋 Fetched events response:`
4. Check these values:
   - `sampleDistrictUrl` - Should show the URL or undefined
   - `sampleBookMyShowUrl` - Should show the URL or undefined
   - `firstEventKeys` - Should include 'district_url' and 'book_my_show_url'

**What to look for:**
- ✅ If you see the URLs: Database is returning the data correctly
- ❌ If they're undefined: Database might not have the data or columns

### Step 2: Check Console Logs When Clicking Edit

1. Click the "Edit" button on any event
2. Look for these logs in order:
   - `🔧 Editing event:` - Shows what data is in the event object
   - `📝 Form data being set:` - Shows what's being put into the form

**What to look for:**
```javascript
🔧 Editing event: {
  districtUrl: "https://district.app/...",  // Should show URL or undefined
  bookMyShowUrl: "https://in.bookmyshow.com/..." // Should show URL or undefined
}

📝 Form data being set: {
  districtUrl: "https://district.app/...",
  bookMyShowUrl: "https://in.bookmyshow.com/...",
  hasDistrictInEvent: true,  // Should be true if property exists
  hasBookMyShowInEvent: true, // Should be true if property exists
  eventKeys: [...]  // Should include 'districtUrl' and 'bookMyShowUrl'
}
```

### Step 3: Check What's Actually in the Database

Run this SQL query in your Neon database:

```sql
SELECT 
    id, 
    title, 
    district_url, 
    book_my_show_url,
    CASE 
        WHEN district_url IS NULL THEN 'NULL'
        WHEN district_url = '' THEN 'EMPTY STRING'
        ELSE 'HAS VALUE'
    END as district_status,
    CASE 
        WHEN book_my_show_url IS NULL THEN 'NULL'
        WHEN book_my_show_url = '' THEN 'EMPTY STRING'
        ELSE 'HAS VALUE'
    END as bookmyshow_status
FROM events 
ORDER BY updated_at DESC 
LIMIT 10;
```

### Step 4: Verify the Columns Exist

```sql
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'events' 
    AND column_name IN ('district_url', 'book_my_show_url', 'category', 'video_url')
ORDER BY column_name;
```

Expected result:
```
column_name       | data_type | is_nullable
------------------+-----------+------------
book_my_show_url  | text      | YES
category          | varchar   | YES
district_url      | text      | YES
video_url         | text      | YES
```

## 🎯 Diagnosis Based on Results

### Scenario A: Columns Don't Exist
**Symptom:** The SQL query in Step 4 returns no rows

**Solution:** Run the migration script:
```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS district_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS book_my_show_url TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE events ADD COLUMN IF NOT EXISTS video_url TEXT;
```

### Scenario B: Columns Exist But Have NULL Values
**Symptom:** 
- Step 4 shows columns exist
- Step 3 shows "NULL" or "EMPTY STRING" for existing events
- Console logs show `undefined` for booking URLs

**Solution:** The columns exist, but old events don't have values. You need to:
1. Edit each event
2. Add the booking URLs
3. Save

### Scenario C: Data Exists But Not Reaching Frontend
**Symptom:**
- Step 3 shows "HAS VALUE"
- Console logs show `undefined`

**Solution:** Worker needs to be redeployed. Run:
```powershell
npm run deploy
```

### Scenario D: Data Reaches Frontend But Doesn't Show in Form
**Symptom:**
- Console log `🔧 Editing event:` shows URLs
- Console log `📝 Form data being set:` shows URLs
- But form fields are still empty

**Solution:** There's a React state issue. Try:
1. Clear browser cache
2. Hard refresh (Ctrl + Shift + R)
3. Check if form inputs have `value={formData.districtUrl}` attribute

## 🐛 Common Issues

### Issue 1: Only One Logo Button Shows (Even When Both URLs Exist)

**Check:**
```javascript
// In EventDetail.jsx, the console should show:
Event found: { ... }
District URL: "https://district.app/..."
BookMyShow URL: "https://in.bookmyshow.com/..."
```

**If only one URL shows in console:**
- The database only has one URL saved
- Check if both were submitted during update

**If both URLs show in console but only one button appears:**
- Check CSS: One button might be hidden
- Inspect element to see if both `<a>` tags are in DOM
- Check if images are loading (network tab)

### Issue 2: Placeholder Text Shows Instead of Actual Values

**This means:** `formData.districtUrl` and `formData.bookMyShowUrl` are empty strings

**Check:** The console logs from Step 2 to see where the data is being lost

## ✅ Expected Working Flow

1. **Database** has columns and data
2. **Worker** SELECT query includes the columns
3. **API response** contains the URL values
4. **fetchEvents()** transforms snake_case to camelCase
5. **events state** contains `districtUrl` and `bookMyShowUrl`
6. **handleEdit()** reads from events state
7. **setFormData()** populates the form
8. **Form inputs** display the values

If any step fails, you'll see it in the console logs!

## 📞 Next Steps

After running these tests, report back with:
1. Screenshots of console logs from Step 1 & 2
2. Results from SQL query in Step 3
3. Which scenario (A, B, C, or D) matches your situation
