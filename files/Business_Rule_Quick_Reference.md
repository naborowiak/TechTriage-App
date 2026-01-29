# Quick Reference: Business Rule Configuration

## Create Business Rule in ServiceNow

**Navigation**: System Definition > Business Rules > New

---

## Configuration Settings

```
┌─────────────────────────────────────────────────────────────┐
│ Business Rule Configuration                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Name:  Prevent u_application Overwrite - Create New        │
│        Timecard                                             │
│                                                             │
│ Table: time_card                                            │
│                                                             │
│ Active: ✅ CHECKED                                          │
│                                                             │
│ Advanced: ✅ CHECKED                                        │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ WHEN TO RUN                                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ When:   before                                              │
│                                                             │
│ Insert: ❌                                                  │
│ Update: ✅                                                  │
│ Delete: ❌                                                  │
│ Query:  ❌                                                  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ FILTER CONDITIONS (Optional)                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Leave blank to run on all time_card updates                │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│ ADVANCED TAB                                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ [Paste the script from TimeCard_Application_Business_Rule.js]
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Verification Checklist

After creating the Business Rule:

- [ ] Business Rule is **Active**
- [ ] Table is set to **time_card**
- [ ] **Advanced** checkbox is checked
- [ ] **When** is set to **before**
- [ ] Only **Update** checkbox is checked
- [ ] Script is pasted in **Advanced** tab
- [ ] No syntax errors shown
- [ ] Rule is **Submitted** (saved)

---

## Quick Test

1. Open a timecard in portal
2. Edit the Application/Server field
3. Save
4. Verify:
   - Original timecard unchanged ✅
   - New timecard created ✅
   - Info message displayed ✅

---

## Order of Execution

```
User clicks Save
    ↓
[BEFORE Business Rules] ← This is where our rule runs
    ↓
Database Update (aborted by our rule)
    ↓
[AFTER Business Rules]
```

Our rule runs **before** the database update, which allows us to:
- Detect the change
- Create new record
- Abort the update

---

## Script Summary

```javascript
(function executeRule(current, previous) {
    
    // Detect u_application change
    if (previous.u_application != current.u_application) {
        
        // Create new timecard
        var newTC = new GlideRecord('time_card');
        // ... copy fields ...
        newTC.u_application = current.u_application; // NEW value
        newTC.insert();
        
        // Abort update (preserves original)
        current.setAbortAction(true);
    }
    
})(current, previous);
```

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Not firing | Check "Update" is checked |
| Still overwrites | Verify `setAbortAction(true)` is called |
| Permission error | Check create rights on time_card |
| Hours missing | Verify all day fields copied |

---

## Pro Tips

💡 **Enable Debugging**: Add `gs.info()` statements to track execution

💡 **Check Logs**: System Logs > All will show BR execution

💡 **Test in Sub-Prod First**: Always test in dev/test before prod

💡 **Order Matters**: If you have other BRs on time_card, check order
