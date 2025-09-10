# Publishing to Chrome Web Store

This document provides instructions for publishing the Visual Bookmarks Tree (Local) extension to the Chrome Web Store.

## Prerequisites

1. **Google Developer Account**: You need a [Google Developer Account](https://chrome.google.com/webstore/devconsole/register) to publish extensions to the Chrome Web Store.
2. **One-time registration fee**: There is a one-time $5 registration fee to publish to the Chrome Web Store.
3. **Prepared assets**:
   - Extension ZIP file
   - Store listing images
   - Privacy policy

## Preparing for Submission

### 1. Build the Extension

```bash
# Install dependencies
npm install

# Build the extension
npm run build

# Package the extension
npm run pack
```

This will create a ZIP file in the project root directory.

### 2. Create Required Assets

#### Store Listing Images

1. **Icon**: 128x128 PNG icon (already in the `icons` folder)
2. **Screenshots**: At least one screenshot (1280x800 or 640x400)
3. **Promotional images** (optional):
   - Small: 440x280
   - Large: 920x680
   - Marquee: 1400x560

#### Privacy Policy

Create a privacy policy document that explains:
- What data the extension collects
- How the data is used
- Data retention policies
- User rights regarding their data

## Submission Process

1. **Go to the Chrome Web Store Developer Dashboard**:
   - Visit [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
   - Sign in with your Google account

2. **Create a New Item**:
   - Click "New Item"
   - Upload the ZIP file created by `npm run pack`

3. **Fill in the Store Listing**:
   - **Name**: "Visual Bookmarks Tree (Local)"
   - **Summary**: A brief description (up to 132 characters)
   - **Detailed Description**: Comprehensive description of your extension
   - **Category**: Choose "Productivity"
   - **Language**: Select primary language
   - **Screenshots**: Upload at least one screenshot
   - **Promotional Images**: Upload if available
   - **Additional Fields**: Fill in website, support email, etc.

4. **Privacy Practices**:
   - Declare what permissions your extension uses and why
   - Link to your privacy policy

5. **Submit for Review**:
   - Click "Submit for Review"
   - The review process typically takes a few business days

## After Submission

- **Review Status**: Monitor your developer dashboard for review status
- **Respond to Rejections**: If rejected, address the issues and resubmit
- **Updates**: For future updates, follow the same process but upload a new ZIP with an incremented version number

## Best Practices

1. **Version Numbering**: Always increment the version number in `manifest.json` for each submission
2. **Changelogs**: Maintain clear changelogs for users
3. **Testing**: Thoroughly test before submission to avoid rejections
4. **Permissions**: Only request permissions that are absolutely necessary
5. **Documentation**: Keep user documentation up-to-date

## Troubleshooting Common Issues

- **Manifest Issues**: Ensure manifest.json follows the correct format
- **Permission Rejections**: Be prepared to justify each permission request
- **Content Security Policy**: Ensure your CSP is properly configured
- **User Data Practices**: Be transparent about data collection and usage

## Resources

- [Chrome Web Store Developer Documentation](https://developer.chrome.com/docs/webstore/)
- [Chrome Extension Quality Guidelines](https://developer.chrome.com/docs/webstore/program_policies/)
- [Chrome Web Store Listing Requirements](https://developer.chrome.com/docs/webstore/publish/)