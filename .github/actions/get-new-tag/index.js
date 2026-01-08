const core = require('@actions/core');

/**
 * Normalize version tag to v<major>.<minor>.<patch> format
 * @param {string} tag - Input tag (e.g., "4.2", "v4", "v1.2.3")
 * @returns {string} Normalized tag (e.g., "v4.2.0", "v4.0.0", "v1.2.3")
 */
function normalizeTag(tag) {
  // Remove 'v' prefix if present
  let version = tag.startsWith('v') ? tag.substring(1) : tag;
  
  const parts = version.split('.');
  
  // Ensure we have exactly 3 parts (major.minor.patch)
  while (parts.length < 3) {
    parts.push('0');
  }
  
  // Validate parts are numbers
  if (!parts.every(part => /^\d+$/.test(part))) {
    throw new Error(`Invalid version format: ${tag}`);
  }
  
  return `v${parts[0]}.${parts[1]}.${parts[2]}`;
}

/**
 * Parse version string to components
 * @param {string} tag - Normalized version tag (e.g., "v1.2.3")
 * @returns {{major: number, minor: number, patch: number}}
 */
function parseVersion(tag) {
  const version = tag.startsWith('v') ? tag.substring(1) : tag;
  const [major, minor, patch] = version.split('.').map(Number);
  
  return { major, minor, patch };
}

/**
 * Parse PR title to extract type
 * Expected format: <type>:<name>:<title>:<story>
 * @param {string} title - PR title
 * @returns {string} Type extracted from title
 */
function parseType(title) {
  const parts = title.split(':');
  
  if (parts.length < 4) {
    throw new Error(
      `Invalid PR title format. Expected: <type>:<name>:<title>:<story>\nReceived: ${title}`
    );
  }
  
  const type = parts[0].trim().toLowerCase();
  
  if (!type) {
    throw new Error(`Type is empty in PR title: ${title}`);
  }
  
  return type;
}

/**
 * Calculate new version based on type
 * @param {{major: number, minor: number, patch: number}} version - Current version
 * @param {string} type - Change type
 * @returns {{major: number, minor: number, patch: number}}
 */
function incrementVersion(version, type) {
  let { major, minor, patch } = version;
  
  if (type === 'breaking-change') {
    // Increment major, reset minor and patch to 0
    major += 1;
    minor = 0;
    patch = 0;
  } else if (type === 'feat') {
    // Keep major, increment minor, reset patch to 0
    minor += 1;
    patch = 0;
  } else if (type === 'fix') {
    // Keep major and minor, increment patch
    patch += 1;
  } else {
    // Keep major and minor, increment patch
    // This handles chore, docs, style, refactor, etc.
    patch += 1;
  }
  
  return { major, minor, patch };
}

/**
 * Main execution function
 */
async function run() {
  try {
    // Get inputs
    const currentTag = core.getInput('current-tag', { required: true });
    const prTitle = core.getInput('pr-title', { required: true });
    
    core.info(`Current tag: ${currentTag}`);
    core.info(`PR title: ${prTitle}`);
    
    // Normalize current tag
    const normalizedTag = normalizeTag(currentTag);
    core.info(`Normalized tag: ${normalizedTag}`);
    
    // Parse version
    const currentVersion = parseVersion(normalizedTag);
    core.info(`Current version: v${currentVersion.major}.${currentVersion.minor}.${currentVersion.patch}`);
    
    // Parse PR title to get type
    const type = parseType(prTitle);
    core.info(`Detected type: ${type}`);
    
    // Calculate new version
    const newVersion = incrementVersion(currentVersion, type);
    const newTag = `v${newVersion.major}.${newVersion.minor}.${newVersion.patch}`;
    
    core.info(`New tag: ${newTag}`);
    
    // Set output
    core.setOutput('new-tag', newTag);
    
    // Summary
    core.summary
      .addHeading('Version Update Summary')
      .addTable([
        [{ data: 'Field', header: true }, { data: 'Value', header: true }],
        ['Current Tag', currentTag],
        ['Normalized Current Tag', normalizedTag],
        ['PR Title', prTitle],
        ['Change Type', type],
        ['New Tag', newTag]
      ])
      .write();
    
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
