
/**
 * Phase 9 Ecosystem Tests
 * Comprehensive test suite for all ecosystem components
 * 
 * @author Ada Lovelace's Unified Team
 * @date September 30, 2025
 */

const {
    EcosystemManager,
    CommunityEngagement,
    PluginMarketplace,
    DocumentationPortal,
    TutorialSystem,
    ExampleGallery,
    PackageRegistry,
    CICDIntegration,
    DeploymentAutomation
} = require('../src/phase9_ecosystem');

/**
 * Test runner
 */
class Phase9TestRunner {
    constructor() {
        this.tests = [];
        this.results = {
            passed: 0,
            failed: 0,
            total: 0
        };
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    async run() {
        console.log('🧪 Running Phase 9 Ecosystem Tests...\n');

        for (const test of this.tests) {
            this.results.total++;
            try {
                await test.fn();
                this.results.passed++;
                console.log(`✅ ${test.name}`);
            } catch (error) {
                this.results.failed++;
                console.log(`❌ ${test.name}`);
                console.log(`   Error: ${error.message}`);
            }
        }

        this.printSummary();
    }

    printSummary() {
        console.log('\n' + '='.repeat(60));
        console.log('📊 Test Summary');
        console.log('='.repeat(60));
        console.log(`Total Tests: ${this.results.total}`);
        console.log(`Passed: ${this.results.passed} ✅`);
        console.log(`Failed: ${this.results.failed} ❌`);
        console.log(`Success Rate: ${(this.results.passed / this.results.total * 100).toFixed(1)}%`);
        console.log('='.repeat(60));

        if (this.results.failed === 0) {
            console.log('\n🎉 All tests passed! Phase 9 at 100%!');
        }
    }
}

// Helper function
function assert(condition, message) {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

// Create test runner
const runner = new Phase9TestRunner();

// ============================================================================
// Component 1: Community Engagement Tests
// ============================================================================

runner.test('Community Engagement - Initialization', async () => {
    const community = new CommunityEngagement();
    await community.initialize();
    const status = community.getStatus();
    assert(status.ready, 'Community should be ready');
    assert(status.features.forum.enabled, 'Forum should be enabled');
    assert(status.features.chat.enabled, 'Chat should be enabled');
});

runner.test('Community Engagement - Create Forum Post', async () => {
    const community = new CommunityEngagement();
    await community.initialize();
    const post = community.createForumPost('Test Post', 'Content', 'user1', 'General');
    assert(post.id, 'Post should have an ID');
    assert(post.title === 'Test Post', 'Post title should match');
});

runner.test('Community Engagement - Schedule Event', async () => {
    const community = new CommunityEngagement();
    await community.initialize();
    const event = community.scheduleEvent('Webinar', 'webinar', '2025-10-15', 'Test webinar');
    assert(event.id, 'Event should have an ID');
    assert(event.status === 'scheduled', 'Event should be scheduled');
});

runner.test('Community Engagement - Validation', async () => {
    const community = new CommunityEngagement();
    await community.initialize();
    const validation = community.validate();
    assert(validation.passed, 'Community validation should pass');
});

// ============================================================================
// Component 2: Plugin Marketplace Tests
// ============================================================================

runner.test('Plugin Marketplace - Initialization', async () => {
    const marketplace = new PluginMarketplace();
    await marketplace.initialize();
    const status = marketplace.getStatus();
    assert(status.ready, 'Marketplace should be ready');
    assert(status.pluginCount >= 3, 'Should have sample plugins');
});

runner.test('Plugin Marketplace - Search Plugins', async () => {
    const marketplace = new PluginMarketplace();
    await marketplace.initialize();
    const results = marketplace.searchPlugins('prettier');
    assert(results.length > 0, 'Should find prettier plugin');
});

runner.test('Plugin Marketplace - Install Plugin', async () => {
    const marketplace = new PluginMarketplace();
    await marketplace.initialize();
    const plugins = Array.from(marketplace.plugins.values());
    const result = marketplace.installPlugin(plugins[0].id);
    assert(result.success, 'Installation should succeed');
    assert(plugins[0].downloads === 1, 'Download count should increase');
});

runner.test('Plugin Marketplace - Publish Plugin', async () => {
    const marketplace = new PluginMarketplace();
    await marketplace.initialize();
    const plugin = marketplace.publishPlugin({
        name: 'test-plugin',
        version: '1.0.0',
        description: 'Test plugin',
        category: 'Tools',
        author: 'test'
    });
    assert(plugin.id, 'Plugin should have an ID');
    assert(plugin.verified === false, 'Non-official plugins should not be verified');
});

runner.test('Plugin Marketplace - Validation', async () => {
    const marketplace = new PluginMarketplace();
    await marketplace.initialize();
    const validation = marketplace.validate();
    assert(validation.passed, 'Marketplace validation should pass');
});

// ============================================================================
// Component 3: Documentation Portal Tests
// ============================================================================

runner.test('Documentation Portal - Initialization', async () => {
    const docs = new DocumentationPortal();
    await docs.initialize();
    const status = docs.getStatus();
    assert(status.ready, 'Documentation should be ready');
    assert(status.totalDocs >= 15, 'Should have documentation pages');
});

runner.test('Documentation Portal - Search Docs', async () => {
    const docs = new DocumentationPortal();
    await docs.initialize();
    const results = docs.searchDocs('installation');
    assert(results.length > 0, 'Should find installation docs');
});

runner.test('Documentation Portal - Get Doc', async () => {
    const docs = new DocumentationPortal();
    await docs.initialize();
    const doc = docs.getDoc('Getting Started/installation');
    assert(doc, 'Should retrieve documentation');
    assert(doc.views === 1, 'View count should increase');
});

runner.test('Documentation Portal - Validation', async () => {
    const docs = new DocumentationPortal();
    await docs.initialize();
    const validation = docs.validate();
    assert(validation.passed, 'Documentation validation should pass');
});

// ============================================================================
// Component 4: Tutorial System Tests
// ============================================================================

runner.test('Tutorial System - Initialization', async () => {
    const tutorials = new TutorialSystem();
    await tutorials.initialize();
    const status = tutorials.getStatus();
    assert(status.ready, 'Tutorials should be ready');
    assert(status.totalTutorials >= 3, 'Should have tutorials');
});

runner.test('Tutorial System - Enroll in Tutorial', async () => {
    const tutorials = new TutorialSystem();
    await tutorials.initialize();
    const tutorialId = Array.from(tutorials.tutorials.keys())[0];
    const progress = tutorials.enrollInTutorial(tutorialId, 'user1');
    assert(progress.userId === 'user1', 'Progress should track user');
    assert(progress.progress === 0, 'Initial progress should be 0');
});

runner.test('Tutorial System - Complete Lesson', async () => {
    const tutorials = new TutorialSystem();
    await tutorials.initialize();
    const tutorialId = Array.from(tutorials.tutorials.keys())[0];
    tutorials.enrollInTutorial(tutorialId, 'user1');
    const progress = tutorials.completeLesson(tutorialId, 'user1', 0);
    assert(progress.currentLesson === 1, 'Should advance to next lesson');
    assert(progress.progress > 0, 'Progress should increase');
});

runner.test('Tutorial System - Get Tutorials by Level', async () => {
    const tutorials = new TutorialSystem();
    await tutorials.initialize();
    const beginner = tutorials.getTutorialsByLevel('Beginner');
    assert(beginner.length > 0, 'Should have beginner tutorials');
});

runner.test('Tutorial System - Validation', async () => {
    const tutorials = new TutorialSystem();
    await tutorials.initialize();
    const validation = tutorials.validate();
    assert(validation.passed, 'Tutorial validation should pass');
});

// ============================================================================
// Component 5: Example Gallery Tests
// ============================================================================

runner.test('Example Gallery - Initialization', async () => {
    const gallery = new ExampleGallery();
    await gallery.initialize();
    const status = gallery.getStatus();
    assert(status.ready, 'Gallery should be ready');
    assert(status.totalExamples >= 5, 'Should have examples');
});

runner.test('Example Gallery - Search Examples', async () => {
    const gallery = new ExampleGallery();
    await gallery.initialize();
    const results = gallery.searchExamples('fibonacci');
    assert(results.length > 0, 'Should find fibonacci example');
});

runner.test('Example Gallery - Get Example', async () => {
    const gallery = new ExampleGallery();
    await gallery.initialize();
    const exampleId = Array.from(gallery.examples.keys())[0];
    const example = gallery.getExample(exampleId);
    assert(example, 'Should retrieve example');
    assert(example.views === 1, 'View count should increase');
});

runner.test('Example Gallery - Like Example', async () => {
    const gallery = new ExampleGallery();
    await gallery.initialize();
    const exampleId = Array.from(gallery.examples.keys())[0];
    const example = gallery.likeExample(exampleId);
    assert(example.likes === 1, 'Like count should increase');
});

runner.test('Example Gallery - Fork Example', async () => {
    const gallery = new ExampleGallery();
    await gallery.initialize();
    const exampleId = Array.from(gallery.examples.keys())[0];
    const fork = gallery.forkExample(exampleId, 'user1');
    assert(fork.forkedFrom === exampleId, 'Fork should reference original');
    assert(fork.forkedBy === 'user1', 'Fork should track user');
});

runner.test('Example Gallery - Validation', async () => {
    const gallery = new ExampleGallery();
    await gallery.initialize();
    const validation = gallery.validate();
    assert(validation.passed, 'Gallery validation should pass');
});

// ============================================================================
// Component 6: Package Registry Tests
// ============================================================================

runner.test('Package Registry - Initialization', async () => {
    const registry = new PackageRegistry();
    await registry.initialize();
    const status = registry.getStatus();
    assert(status.ready, 'Registry should be ready');
    assert(status.totalPackages >= 3, 'Should have packages');
});

runner.test('Package Registry - Search Packages', async () => {
    const registry = new PackageRegistry();
    await registry.initialize();
    const results = registry.searchPackages('core');
    assert(results.length > 0, 'Should find core package');
});

runner.test('Package Registry - Install Package', async () => {
    const registry = new PackageRegistry();
    await registry.initialize();
    const result = registry.installPackage('@luascript/core');
    assert(result.success, 'Installation should succeed');
    assert(result.package === '@luascript/core', 'Should install correct package');
});

runner.test('Package Registry - Resolve Dependencies', async () => {
    const registry = new PackageRegistry();
    await registry.initialize();
    const deps = registry.resolveDependencies('@luascript/utils', '1.0.0');
    assert(Object.keys(deps).length > 0, 'Should resolve dependencies');
});

runner.test('Package Registry - Validation', async () => {
    const registry = new PackageRegistry();
    await registry.initialize();
    const validation = registry.validate();
    assert(validation.passed, 'Registry validation should pass');
});

// ============================================================================
// Component 7: CI/CD Integration Tests
// ============================================================================

runner.test('CI/CD Integration - Initialization', async () => {
    const cicd = new CICDIntegration();
    await cicd.initialize();
    const status = cicd.getStatus();
    assert(status.ready, 'CI/CD should be ready');
    assert(status.pipelineCount >= 2, 'Should have pipeline templates');
});

runner.test('CI/CD Integration - Get Pipeline Templates', async () => {
    const cicd = new CICDIntegration();
    await cicd.initialize();
    const templates = cicd.getPipelineTemplates();
    assert(templates.length >= 2, 'Should have templates');
});

runner.test('CI/CD Integration - Create Build', async () => {
    const cicd = new CICDIntegration();
    await cicd.initialize();
    const pipelineId = Array.from(cicd.pipelines.keys())[0];
    const build = cicd.createBuild(pipelineId, 'main', 'abc123');
    assert(build.id, 'Build should have an ID');
    assert(build.status === 'pending', 'Build should start as pending');
});

runner.test('CI/CD Integration - Validation', async () => {
    const cicd = new CICDIntegration();
    await cicd.initialize();
    const validation = cicd.validate();
    assert(validation.passed, 'CI/CD validation should pass');
});

// ============================================================================
// Component 8: Deployment Automation Tests
// ============================================================================

runner.test('Deployment Automation - Initialization', async () => {
    const deployment = new DeploymentAutomation();
    await deployment.initialize();
    const status = deployment.getStatus();
    assert(status.ready, 'Deployment should be ready');
    assert(status.configCount >= 3, 'Should have deployment configs');
});

runner.test('Deployment Automation - Deploy', async () => {
    const deployment = new DeploymentAutomation();
    await deployment.initialize();
    const configId = Array.from(deployment.deployments.keys())[0];
    const result = deployment.deploy(configId, '1.0.0');
    assert(result.id, 'Deployment should have an ID');
    assert(result.status === 'success', 'Deployment should succeed');
});

runner.test('Deployment Automation - Rollback', async () => {
    const deployment = new DeploymentAutomation();
    await deployment.initialize();
    const configId = Array.from(deployment.deployments.keys())[0];
    deployment.deploy(configId, '1.0.0');
    const rollback = deployment.rollback(configId);
    assert(rollback.type === 'rollback', 'Should be a rollback');
    assert(rollback.status === 'success', 'Rollback should succeed');
});

runner.test('Deployment Automation - Get Deployment History', async () => {
    const deployment = new DeploymentAutomation();
    await deployment.initialize();
    const configId = Array.from(deployment.deployments.keys())[0];
    deployment.deploy(configId, '1.0.0');
    const history = deployment.getDeploymentHistory(configId);
    assert(history, 'Should retrieve history');
    assert(history.totalDeployments === 1, 'Should track deployments');
});

runner.test('Deployment Automation - Validation', async () => {
    const deployment = new DeploymentAutomation();
    await deployment.initialize();
    const validation = deployment.validate();
    assert(validation.passed, 'Deployment validation should pass');
});

// ============================================================================
// Integration Tests
// ============================================================================

runner.test('Ecosystem Manager - Full Initialization', async () => {
    const manager = new EcosystemManager();
    const status = await manager.initialize();
    assert(status.ready, 'Ecosystem should be fully initialized');
    assert(status.completion === 100, 'Should be at 100% completion');
});

runner.test('Ecosystem Manager - Get Status', async () => {
    const manager = new EcosystemManager();
    await manager.initialize();
    const status = manager.getStatus();
    assert(status.phase === 9, 'Should be Phase 9');
    assert(status.components.length === 8, 'Should have 8 components');
});

runner.test('Ecosystem Manager - Validation', async () => {
    const manager = new EcosystemManager();
    await manager.initialize();
    const validation = manager.validate();
    assert(validation.passed, 'All components should validate');
    assert(validation.score === 100, 'Should score 100%');
});

// Run all tests
runner.run().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
});
