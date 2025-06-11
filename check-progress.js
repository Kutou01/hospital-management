#!/usr/bin/env node

/**
 * Quick Progress Checker for Hospital Management System
 * Run with: node check-progress.js
 */

const fs = require('fs');
const path = require('path');

function checkProgress() {
    console.log('🏥 Hospital Management System - Progress Check\n');
    
    try {
        // Read progress dashboard
        const dashboardPath = path.join(__dirname, 'docs', 'PROGRESS_DASHBOARD.md');
        const dashboard = fs.readFileSync(dashboardPath, 'utf8');
        
        // Count completed tasks
        const completedTasks = (dashboard.match(/\[x\]/g) || []).length;
        const totalTasks = (dashboard.match(/\[[ x]\]/g) || []).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        
        // Extract current phase
        const phaseMatch = dashboard.match(/Current Phase.*?:\s*(.+)/);
        const currentPhase = phaseMatch ? phaseMatch[1] : 'Unknown';
        
        // Extract overall progress
        const progressMatch = dashboard.match(/Overall Progress:\s*(\d+)%/);
        const overallProgress = progressMatch ? progressMatch[1] : '0';
        
        console.log('📊 QUICK STATS:');
        console.log(`   Overall Progress: ${overallProgress}%`);
        console.log(`   Current Phase: ${currentPhase}`);
        console.log(`   Tasks Completed: ${completedTasks}/${totalTasks} (${completionRate}%)`);
        console.log('');
        
        // Show next priority tasks
        console.log('🎯 NEXT PRIORITY TASKS:');
        const lines = dashboard.split('\n');
        let inPrioritySection = false;
        let taskCount = 0;
        
        for (const line of lines) {
            if (line.includes('Next 3 Priority Tasks')) {
                inPrioritySection = true;
                continue;
            }
            
            if (inPrioritySection && line.includes('---')) {
                break;
            }
            
            if (inPrioritySection && line.includes('**') && taskCount < 3) {
                const taskMatch = line.match(/\*\*(.+?)\*\*/);
                if (taskMatch) {
                    taskCount++;
                    console.log(`   ${taskCount}. ${taskMatch[1]}`);
                }
            }
        }
        
        console.log('');
        console.log('📈 PROGRESS BREAKDOWN:');
        
        // Count progress by phase
        const phases = [
            'Phase 0: Project Setup',
            'Phase 1: Infrastructure',
            'Phase 2: Authentication',
            'Phase 3: Core User Management'
        ];
        
        phases.forEach(phase => {
            const phaseSection = dashboard.match(new RegExp(`${phase}.*?(?=###|$)`, 's'));
            if (phaseSection) {
                const phaseText = phaseSection[0];
                const phaseCompleted = (phaseText.match(/\[x\]/g) || []).length;
                const phaseTotal = (phaseText.match(/\[[ x]\]/g) || []).length;
                const phaseRate = phaseTotal > 0 ? Math.round((phaseCompleted / phaseTotal) * 100) : 0;
                
                const status = phaseRate === 100 ? '✅' : phaseRate > 0 ? '🚧' : '📋';
                console.log(`   ${status} ${phase}: ${phaseCompleted}/${phaseTotal} (${phaseRate}%)`);
            }
        });
        
        console.log('');
        console.log('💡 QUICK ACTIONS:');
        console.log('   • Update progress: Edit docs/PROGRESS_DASHBOARD.md');
        console.log('   • Weekly report: Edit docs/WEEKLY_REPORTS.md');
        console.log('   • Ask for help: "What should I work on next?"');
        console.log('   • Check again: node check-progress.js');
        
    } catch (error) {
        console.error('❌ Error reading progress files:', error.message);
        console.log('💡 Make sure docs/PROGRESS_DASHBOARD.md exists in the docs directory');
    }
}

// Run the progress check
checkProgress();
