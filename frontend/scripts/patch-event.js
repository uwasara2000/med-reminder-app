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
const topicSubPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'TopicSubscriptionModule.android.js'
);
if (fs.existsSync(topicSubPath)) {
  let content = fs.readFileSync(topicSubPath, 'utf8');
  if (content.includes("requireNativeModule('ExpoTopicSubscriptionModule')")) {
    content = content.replace(
      "import { requireNativeModule } from 'expo-modules-core';",
      "import { requireOptionalNativeModule } from 'expo-modules-core';"
    ).replace(
      "requireNativeModule('ExpoTopicSubscriptionModule')",
      "(requireOptionalNativeModule('ExpoTopicSubscriptionModule') || {})"
    );
    fs.writeFileSync(topicSubPath, content, 'utf8');
    console.log('✅ Patched TopicSubscriptionModule.android.js for Expo Go');
  }
}

const pushTokenPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'PushTokenManager.native.js'
);
if (fs.existsSync(pushTokenPath)) {
  let content = fs.readFileSync(pushTokenPath, 'utf8');
  if (content.includes("requireNativeModule('ExpoPushTokenManager')")) {
    content = content.replace(
      "import { requireNativeModule } from 'expo-modules-core';",
      "import { requireOptionalNativeModule } from 'expo-modules-core';"
    ).replace(
      "requireNativeModule('ExpoPushTokenManager')",
      "(requireOptionalNativeModule('ExpoPushTokenManager') || { addListener: () => ({ remove: () => {} }) })"
    );
    fs.writeFileSync(pushTokenPath, content, 'utf8');
    console.log('✅ Patched PushTokenManager.native.js for Expo Go');
  }
}

const serverRegPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-notifications',
  'build',
  'ServerRegistrationModule.native.js'
);
if (fs.existsSync(serverRegPath)) {
  let content = fs.readFileSync(serverRegPath, 'utf8');
  if (content.includes("requireNativeModule('NotificationsServerRegistrationModule')")) {
    content = content.replace(
      "import { requireNativeModule } from 'expo-modules-core';",
      "import { requireOptionalNativeModule } from 'expo-modules-core';"
    ).replace(
      "requireNativeModule('NotificationsServerRegistrationModule')",
      "(requireOptionalNativeModule('NotificationsServerRegistrationModule') || {})"
    );
    fs.writeFileSync(serverRegPath, content, 'utf8');
    console.log('✅ Patched ServerRegistrationModule.native.js for Expo Go');
  }
}

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
