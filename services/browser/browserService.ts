export class BrowserService {
  async navigateTo(url: string): Promise<void> {
    console.log(`Navigating to ${url}...`);
  }

  async screenshot(): Promise<string> {
    return 'screenshot_placeholder_base64';
  }
}
