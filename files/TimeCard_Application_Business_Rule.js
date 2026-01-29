/**
 * Business Rule: Prevent u_application Overwrite - Create New Timecard
 * 
 * Table: time_card
 * When: Before
 * Update: true
 * 
 * Description:
 * When u_application field is changed on an existing timecard, this business rule
 * prevents the update and instead creates a new timecard with the new u_application
 * value while preserving the original timecard.
 */

(function executeRule(current, previous /*null when async*/) {
    
    // Only run on update operations
    if (!current.isNewRecord()) {
        
        // Check if u_application field has changed
        var originalApplication = previous.getValue('u_application');
        var newApplication = current.getValue('u_application');
        
        // If u_application has changed and is not empty
        if (originalApplication != newApplication && !gs.nil(newApplication)) {
            
            gs.info('TimeCard BR: u_application changed from "' + originalApplication + '" to "' + newApplication + '" for timecard ' + current.sys_id);
            
            // Create a new timecard with the new u_application value
            var newTimecard = new GlideRecord('time_card');
            newTimecard.initialize();
            
            // Copy all fields from the current timecard
            newTimecard.user = current.user;
            newTimecard.time_sheet = current.time_sheet;
            newTimecard.week_starts_on = current.week_starts_on;
            newTimecard.task = current.task;
            newTimecard.category = current.category;
            newTimecard.state = current.state;
            
            // Copy hour fields
            newTimecard.monday = current.monday;
            newTimecard.tuesday = current.tuesday;
            newTimecard.wednesday = current.wednesday;
            newTimecard.thursday = current.thursday;
            newTimecard.friday = current.friday;
            newTimecard.saturday = current.saturday;
            newTimecard.sunday = current.sunday;
            
            // Copy optional fields
            if (!gs.nil(current.rate_type))
                newTimecard.rate_type = current.rate_type;
            
            if (!gs.nil(current.project_time_category))
                newTimecard.project_time_category = current.project_time_category;
            
            if (!gs.nil(current.resource_plan))
                newTimecard.resource_plan = current.resource_plan;
            
            if (!gs.nil(current.resource_assignment))
                newTimecard.resource_assignment = current.resource_assignment;
            
            // Set the NEW u_application value
            newTimecard.u_application = newApplication;
            
            // Copy notes/work notes if any
            if (!gs.nil(current.work_notes))
                newTimecard.work_notes = current.work_notes;
            
            if (!gs.nil(current.comments))
                newTimecard.comments = current.comments;
            
            // Insert the new timecard
            var newTimecardId = newTimecard.insert();
            
            if (newTimecardId) {
                gs.info('TimeCard BR: Successfully created new timecard ' + newTimecardId + ' with u_application "' + newApplication + '"');
                
                // Revert the current record to its original u_application value
                // This prevents the original timecard from being overwritten
                current.setAbortAction(true); // Abort the current update
                
                gs.addInfoMessage('Application changed. A new timecard has been created with the selected application.');
            } else {
                gs.addErrorMessage('Failed to create new timecard. Please try again.');
                gs.error('TimeCard BR: Failed to create new timecard for u_application change');
            }
        }
    }
    
})(current, previous);
