# /quick-fix

Apply a small change using the Small Change Exemption from CLAUDE.md.

## Instructions

1. **Verify ALL exemption criteria** before proceeding:
   - [ ] Touches 3 or fewer files
   - [ ] Total diff is under 50 lines
   - [ ] Is one of: typo fix, copy change, CSS-only styling tweak, dependency version bump, comment update, log message change
   - [ ] Does NOT touch: authentication, payment/billing, database schema, API route signatures, environment variables, or security-related code

   If ANY criterion fails, stop and use `/plan-feature` instead.

2. **Determine ownership**: Check the Directory Ownership Map in CLAUDE.md. Use the correct agent scope — Backend_Dev does not touch `src/`, Frontend_Dev does not touch `server/`.

3. **Implement the change** respecting ownership boundaries.

4. **Log the exemption** in CLAUDE.md between `<!-- DECISIONS START -->` and `<!-- DECISIONS END -->`:

```
### [YYYY-MM-DD] [Short description]
- **Type**: exemption
- **Agents**: [Backend_Dev or Frontend_Dev]
- **Verdict**: EXEMPT
- **Summary**: [One-line description of what changed]
- **Files affected**: [list]
```

## Fix to apply

$ARGUMENTS
