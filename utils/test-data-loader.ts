import { readFileSync } from 'fs';
import { join } from 'path';

export class TestDataLoader {
  private static basePath = join(__dirname, '../test-data');

  static loadAuthData() {
    const authPath = join(this.basePath, 'auth/credentials.json');
    return JSON.parse(readFileSync(authPath, 'utf-8'));
  }

  static loadProfileData() {
    const profilePath = join(this.basePath, 'profile/updates.json');
    return JSON.parse(readFileSync(profilePath, 'utf-8'));
  }

  static loadDemoData() {
    const demoPath = join(this.basePath, 'demo/scenarios.json');
    return JSON.parse(readFileSync(demoPath, 'utf-8'));
  }

  static loadApiConfig() {
    const configPath = join(this.basePath, 'common/api-config.json');
    return JSON.parse(readFileSync(configPath, 'utf-8'));
  }

  static loadAdvancedTestData() {
    const advancedPath = join(this.basePath, 'advanced/test-scenarios.json');
    return JSON.parse(readFileSync(advancedPath, 'utf-8'));
  }

  static loadDataByPath(relativePath: string) {
    const fullPath = join(this.basePath, relativePath);
    return JSON.parse(readFileSync(fullPath, 'utf-8'));
  }
}
