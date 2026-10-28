const fs = require('fs');
const path = require('path');

const eventFilePath = path.join(
  __dirname,
  '..',
  'node_modules',
  'react-native',
  'src',
  'private',
  'webapis',
  'dom',
  'events',
  'Event.js'
);

if (fs.existsSync(eventFilePath)) {
  let content = fs.readFileSync(eventFilePath, 'utf8');
  if (!content.includes('writable: true')) {
    content = content.replace(
      /Object\.defineProperty\(Event,\s*'(NONE|CAPTURING_PHASE|AT_TARGET|BUBBLING_PHASE)',\s*\{\s*enumerable:\s*true,\s*value:\s*(\d+),?\s*\}\);/g,
      "Object.defineProperty(Event, '$1', { enumerable: true, writable: true, configurable: true, value: $2 });"
    );
    content = content.replace(
      /Object\.defineProperty\(Event\.prototype,\s*'(NONE|CAPTURING_PHASE|AT_TARGET|BUBBLING_PHASE)',\s*\{\s*enumerable:\s*true,\s*value:\s*(\d+),?\s*\}\);/g,
      "Object.defineProperty(Event.prototype, '$1', { enumerable: true, writable: true, configurable: true, value: $2 });"
    );
    fs.writeFileSync(eventFilePath, content, 'utf8');
    console.log('✅ Patched react-native Event.js with writable/configurable phase properties');
  } else {
    console.log('ℹ️ react-native Event.js is already patched');
  }
}

// 2. Patch expo-notifications warnOfExpoGoPushUsage.js (prevents crash on Android in Expo Go)
const expoNotifWarnPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'warnOfExpoGoPushUsage.js'
);

if (fs.existsSync(expoNotifWarnPath)) {
  let content = fs.readFileSync(expoNotifWarnPath, 'utf8');
  if (content.includes('throw new Error(message);') || content.includes('console.warn(message);')) {
    content = content
      .replace('throw new Error(message);', 'console.log(message);')
      .replace('console.warn(message);', 'console.log(message);');
    fs.writeFileSync(expoNotifWarnPath, content, 'utf8');
    console.log('✅ Patched expo-notifications warnOfExpoGoPushUsage to console.log');
  } else {
    console.log('ℹ️ expo-notifications warnOfExpoGoPushUsage already patched');
  }
}

// 3. Patch expo-notifications modules removed from Expo Go (TopicSubscription, PushTokenManager, ServerRegistration)
function patchOptionalModule(filePath, moduleName, fallback = '{}') {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Ensure import includes requireOptionalNativeModule
  if (!content.includes('requireOptionalNativeModule }') && !content.includes('requireOptionalNativeModule,')) {
    content = content.replace(
      /import\s*\{([^}]+)\}\s*from\s*['"](expo|expo-modules-core)['"];/,
      (match, imports, pkg) => {
        if (!imports.includes('requireOptionalNativeModule')) {
          return `import { ${imports.trim()}, requireOptionalNativeModule } from '${pkg}';`;
        }
        return match;
      }
    );
    changed = true;
  }

  // Wrap native module call with fallback
  if (content.includes(`requireNativeModule('${moduleName}')`)) {
    content = content.replace(
      `requireNativeModule('${moduleName}')`,
      `(requireOptionalNativeModule('${moduleName}') || ${fallback})`
    );
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Patched ${path.basename(filePath)} for Expo Go`);
  } else {
    console.log(`ℹ️ ${path.basename(filePath)} already patched`);
  }
}

patchOptionalModule(
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'TopicSubscriptionModule.android.js'),
  'ExpoTopicSubscriptionModule',
  '{}'
);

patchOptionalModule(
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'PushTokenManager.native.js'),
  'ExpoPushTokenManager',
  '{ addListener: () => ({ remove: () => {} }) }'
);

patchOptionalModule(
  path.join(__dirname, '..', 'node_modules', 'expo-notifications', 'build', 'ServerRegistrationModule.native.js'),
  'NotificationsServerRegistrationModule',
  '{}'
);

// 4. Patch expo-notifications/build/index.js (silence dev client warning in Expo Go)
const expoNotifIndexPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'index.js'
);
if (fs.existsSync(expoNotifIndexPath)) {
  let content = fs.readFileSync(expoNotifIndexPath, 'utf8');
  if (content.includes('console.warn(message);')) {
    content = content.replace('console.warn(message);', 'console.log(message);');
    fs.writeFileSync(expoNotifIndexPath, content, 'utf8');
    console.log('✅ Patched expo-notifications/build/index.js to console.log');
  }
}
