#!/usr/bin/env node

/**
 * 🔄 Update to Greymass Jungle4 Endpoint
 * 
 * This script updates all configuration files to use the Greymass endpoint
 * which has better connectivity and might resolve the query issues.
 */

const fs = require('fs');
const path = require('path');

class EndpointUpdater {
    constructor() {
        this.oldEndpoint = 'https://jungle4.cryptolions.io';
        this.newEndpoint = 'https://jungle4.greymass.com';
        this.filesToUpdate = [
            'scripts/deployEosDocker.sh',
            'scripts/verifyEosFinal.cjs',
            'scripts/realEosIntegration.cjs',
            'scripts/freshDeployEos.cjs',
            'scripts/fixEosABI.cjs',
            'scripts/deployEosMainnet.cjs',
            'scripts/verifyEosMainnet.cjs'
        ];
    }

    async updateAllFiles() {
        console.log('🔄 Updating to Greymass Jungle4 Endpoint');
        console.log('=' .repeat(50));
        console.log(`📤 Old: ${this.oldEndpoint}`);
        console.log(`📥 New: ${this.newEndpoint}`);
        console.log(`📁 Files to update: ${this.filesToUpdate.length}\n`);

        let updatedCount = 0;
        let errorCount = 0;

        for (const filePath of this.filesToUpdate) {
            try {
                const fullPath = path.join(__dirname, '..', filePath);
                if (fs.existsSync(fullPath)) {
                    const updated = await this.updateFile(fullPath);
                    if (updated) {
                        updatedCount++;
                        console.log(`   ✅ ${filePath}`);
                    } else {
                        console.log(`   ⚠️  ${filePath} (no changes needed)`);
                    }
                } else {
                    console.log(`   ❌ ${filePath} (file not found)`);
                    errorCount++;
                }
            } catch (error) {
                console.log(`   ❌ ${filePath} (error: ${error.message})`);
                errorCount++;
            }
        }

        console.log('\n📊 Update Summary:');
        console.log(`   ✅ Updated: ${updatedCount} files`);
        console.log(`   ❌ Errors: ${errorCount} files`);
        console.log(`   📁 Total: ${this.filesToUpdate.length} files`);

        if (updatedCount > 0) {
            console.log('\n🎉 Endpoint update completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('   1. Test the new endpoint: npm run test-eos-testnets');
            console.log('   2. Verify deployment: npm run verify-eos-final');
            console.log('   3. Test contract functionality');
        } else {
            console.log('\n⚠️  No files were updated. The endpoint might already be correct.');
        }
    }

    async updateFile(filePath) {
        const content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        let newContent = content;

        // Update different patterns based on file type
        if (filePath.endsWith('.sh')) {
            // Shell script pattern
            if (content.includes(this.oldEndpoint)) {
                newContent = content.replace(new RegExp(this.oldEndpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), this.newEndpoint);
                updated = true;
            }
        } else if (filePath.endsWith('.cjs') || filePath.endsWith('.js')) {
            // JavaScript pattern
            if (content.includes(this.oldEndpoint)) {
                newContent = content.replace(new RegExp(this.oldEndpoint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), this.newEndpoint);
                updated = true;
            }
        }

        if (updated) {
            fs.writeFileSync(filePath, newContent, 'utf8');
        }

        return updated;
    }
}

// Run the endpoint updater
async function main() {
    const updater = new EndpointUpdater();
    
    try {
        await updater.updateAllFiles();
    } catch (error) {
        console.error('❌ Endpoint update failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { EndpointUpdater }; 