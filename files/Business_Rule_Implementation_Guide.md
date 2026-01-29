# Business Rule Implementation Guide
## Prevent u_application Overwrite - Create New Timecard

## Why Business Rule is Better

The Business Rule approach is **superior** to the Script Include approach because:

1. **Universal Coverage**: Works for ALL update methods:
   - Service Portal widget edits
   - Form submissions
   - API updates
   - Bulk updates
   - Import operations
   
2. **Simpler**: No need to modify client-side code or Script Includes

3. **Reliable**: Runs on the server before the database update

4. **Automatic**: No client-side logic needed to detect changes

## Implementation Steps

### Step 1: Create the Business Rule

1. Navigate to **System Definition > Business Rules**
2. Click **New**
3. Fill in the following fields:

**Basic Information:**
- **Name**: `Prevent u_application Overwrite - Create New Timecard`
- **Table**: `time_card` (Time Card)
- **Active**: ✅ Checked
- **Advanced**: ✅ Checked

**When to run:**
- **When**: `before`
- **Insert**: ❌ Unchecked
- **Update**: ✅ Checked
- **Delete**: ❌ Unchecked
- **Query**: ❌ Unchecked

**Advanced tab:**
- Paste the script from `TimeCard_Application_Business_Rule.js`

4. Click **Submit**

### Step 2: Remove Previous Changes (Optional)

Since the Business Rule handles everything, you can **revert** the Script Include and Widget changes:

**TimeCardPortalService_BJC Script Include:**
- Restore to the original `updateTimecard()` function (without the u_application detection logic)

**Widget Client Script:**
- Restore the original `saveRecord()` function (without the u_application tracking)

**However**, you should **keep** the `highlightDuplicates()` changes in the widget since that's still needed for proper duplicate detection.

### Step 3: Test the Solution

#### Test Case 1: Change Application in Portal
1. Open a timecard with hours logged (e.g., 60 hours Mon-Fri)
2. Change the Application/Server field from "2022scratch" to "10.53.125.246"
3. Click Save
4. **Expected Result**: 
   - Original timecard with "2022scratch" remains with original hours
   - New timecard created with "10.53.125.246" and same hours
   - Info message: "Application changed. A new timecard has been created..."

#### Test Case 2: Change Application via Form
1. Open a timecard in the standard ServiceNow form
2. Change the u_application field
3. Click Update
4. **Expected Result**: Same as Test Case 1

#### Test Case 3: Edit Other Fields (No Application Change)
1. Edit a timecard's hours but keep the same application
2. Click Save
3. **Expected Result**: Normal update, no new timecard created

#### Test Case 4: Verify Duplicate Detection
1. Create two timecards with same task, category, state, hours
2. Give them the **same** u_application value
3. **Expected Result**: Marked as duplicates, can be merged
4. Give them **different** u_application values
5. **Expected Result**: NOT marked as duplicates

## How It Works

### The Business Rule Logic Flow

```
User edits timecard and changes u_application
        ↓
Business Rule detects change (before update)
        ↓
Creates new timecard with:
  - All original field values
  - NEW u_application value
  - Same hours, task, category, etc.
        ↓
Aborts the original update (setAbortAction)
        ↓
Original timecard remains unchanged
        ↓
User sees info message about new timecard
```

### Key Code Sections

**Detection:**
```javascript
var originalApplication = previous.getValue('u_application');
var newApplication = current.getValue('u_application');

if (originalApplication != newApplication && !gs.nil(newApplication)) {
    // u_application changed, create new record
}
```

**New Record Creation:**
```javascript
var newTimecard = new GlideRecord('time_card');
newTimecard.initialize();
// Copy all fields...
newTimecard.u_application = newApplication;
newTimecard.insert();
```

**Abort Original Update:**
```javascript
current.setAbortAction(true); // Prevents overwrite
```

## Advantages Over Script Include Approach

| Aspect | Business Rule | Script Include |
|--------|---------------|----------------|
| Works on form updates | ✅ Yes | ❌ No |
| Works on API updates | ✅ Yes | ❌ No |
| Works on imports | ✅ Yes | ❌ No |
| Requires client changes | ❌ No | ✅ Yes |
| Complexity | 🟢 Low | 🔴 High |
| Maintenance | 🟢 Easy | 🔴 Complex |
| Reliability | 🟢 High | 🟡 Medium |

## Troubleshooting

### Issue: Business Rule Not Firing

**Check:**
1. Business Rule is Active
2. "Update" checkbox is checked
3. "Advanced" checkbox is checked
4. Table is set to "time_card"

### Issue: Original Record Still Being Updated

**Check:**
1. Ensure `current.setAbortAction(true)` is being called
2. Check for script errors in System Logs
3. Verify Business Rule order (should run before other update rules)

### Issue: New Timecard Not Created

**Check:**
1. User has create permissions on time_card table
2. Check logs for error messages
3. Verify all required fields are being copied

### Issue: Hours Not Showing Up

**Check:**
1. All day fields are being copied (monday through sunday)
2. Total field is calculated correctly by ServiceNow
3. Timesheet totals are recalculating

## Additional Notes

### Fields Copied to New Timecard

**Core Fields:**
- user
- time_sheet  
- week_starts_on
- task
- category
- state

**Hour Fields:**
- monday, tuesday, wednesday, thursday, friday, saturday, sunday

**Optional Fields:**
- rate_type
- project_time_category
- resource_plan
- resource_assignment
- work_notes
- comments

**Automatically Calculated:**
- total (calculated by ServiceNow)
- sys_created_by, sys_created_on (set by system)

### Preserving Audit Trail

The Business Rule approach maintains a complete audit trail:
- Original timecard remains with original u_application
- New timecard created with new u_application
- Both timecards retain their history
- No data is lost or overwritten

### Performance Considerations

The Business Rule adds minimal overhead:
- Only runs on updates (not queries or inserts)
- Only executes when u_application changes
- Single GlideRecord operation to create new record
- No impact on read operations

## Migration from Script Include Approach

If you already implemented the Script Include approach:

1. **Deploy the Business Rule** (as described above)
2. **Test thoroughly** to ensure it works
3. **Optional**: Revert Script Include changes
4. **Keep**: Widget duplicate detection changes (highlightDuplicates function)

The Business Rule will handle all update scenarios, making the Script Include logic redundant.

## Conclusion

The Business Rule approach is:
- ✅ More reliable
- ✅ Simpler to implement
- ✅ Easier to maintain
- ✅ Works universally
- ✅ Better for long-term maintainability

This is the recommended solution for preventing u_application overwrites.
