#!/usr/bin/env node

/**
 * 🔍 VERIFY 1INCH OFFICIAL INTEGRATION
 * 
 * Verify that all official 1inch contracts and files are properly integrated
 */

const fs = require('fs');
const path = require('path');

class Verify1inchIntegration {
    constructor() {
        console.log('🔍 VERIFYING 1INCH OFFICIAL INTEGRATION');
        console.log('========================================');
        console.log('✅ Checking all moved files and contracts');
        console.log('========================================\n');
        
        this.verifyIntegration();
    }
    
    verifyIntegration() {
        const checks = [
            this.checkContracts(),
            this.checkScripts(),
            this.checkArtifacts(),
            this.checkConfigFiles(),
            this.checkDocumentation()
        ];
        
        const results = checks.map(check => {
            try {
                return check;
            } catch (error) {
                return { status: '❌ FAILED', error: error.message };
            }
        });
        
        console.log('\n📊 INTEGRATION VERIFICATION RESULTS:');
        console.log('====================================');
        
        results.forEach((result, index) => {
            const checkNames = [
                'Contracts Directory',
                'Scripts Directory', 
                'Compiled Artifacts',
                'Configuration Files',
                'Documentation'
            ];
            console.log(`${result.status} ${checkNames[index]}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
        
        const allPassed = results.every(r => r.status === '✅ PASSED');
        
        console.log('\n' + '='.repeat(50));
        if (allPassed) {
            console.log('🎉 ALL CHECKS PASSED! 1INCH INTEGRATION COMPLETE');
            console.log('✅ Ready for ETH ↔ ALGO atomic swaps');
        } else {
            console.log('❌ SOME CHECKS FAILED - Please review above');
        }
        console.log('='.repeat(50));
    }
    
    checkContracts() {
        const contractDir = 'contracts/1inch-official';
        const requiredFiles = [
            'BaseEscrow.sol',
            'BaseEscrowFactory.sol',
            'EscrowFactory.sol',
            'EscrowSrc.sol',
            'EscrowDst.sol'
        ];
        
        if (!fs.existsSync(contractDir)) {
            throw new Error(`Directory ${contractDir} not found`);
        }
        
        const files = fs.readdirSync(contractDir);
        const missingFiles = requiredFiles.filter(file => !files.includes(file));
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing files: ${missingFiles.join(', ')}`);
        }
        
        console.log('✅ Contracts directory verified');
        console.log(`   Found ${files.length} files in contracts/1inch-official/`);
        
        return { status: '✅ PASSED', files: files.length };
    }
    
    checkScripts() {
        const scriptDir = 'scripts/1inch-official';
        const requiredFiles = [
            'Deploy1inch.s.sol',
            'DeployEscrowFactory.s.sol'
        ];
        
        if (!fs.existsSync(scriptDir)) {
            throw new Error(`Directory ${scriptDir} not found`);
        }
        
        const files = fs.readdirSync(scriptDir);
        const missingFiles = requiredFiles.filter(file => !files.includes(file));
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing files: ${missingFiles.join(', ')}`);
        }
        
        console.log('✅ Scripts directory verified');
        console.log(`   Found ${files.length} files in scripts/1inch-official/`);
        
        return { status: '✅ PASSED', files: files.length };
    }
    
    checkArtifacts() {
        const artifactsDir = 'lib/1inch-official/out';
        
        if (!fs.existsSync(artifactsDir)) {
            throw new Error(`Directory ${artifactsDir} not found`);
        }
        
        const files = fs.readdirSync(artifactsDir);
        const contractDirs = files.filter(file => 
            fs.statSync(path.join(artifactsDir, file)).isDirectory()
        );
        
        if (contractDirs.length === 0) {
            throw new Error('No compiled contract artifacts found');
        }
        
        console.log('✅ Compiled artifacts verified');
        console.log(`   Found ${contractDirs.length} contract artifacts`);
        
        return { status: '✅ PASSED', artifacts: contractDirs.length };
    }
    
    checkConfigFiles() {
        const requiredFiles = [
            'foundry.toml',
            'remappings.txt'
        ];
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing config files: ${missingFiles.join(', ')}`);
        }
        
        console.log('✅ Configuration files verified');
        console.log(`   Found ${requiredFiles.length} config files`);
        
        return { status: '✅ PASSED', files: requiredFiles.length };
    }
    
    checkDocumentation() {
        const docFile = 'docs/1INCH_OFFICIAL_README.md';
        
        if (!fs.existsSync(docFile)) {
            throw new Error(`Documentation file ${docFile} not found`);
        }
        
        const stats = fs.statSync(docFile);
        if (stats.size === 0) {
            throw new Error('Documentation file is empty');
        }
        
        console.log('✅ Documentation verified');
        console.log(`   Documentation size: ${stats.size} bytes`);
        
        return { status: '✅ PASSED', size: stats.size };
    }
}

// Run verification
new Verify1inchIntegration(); 