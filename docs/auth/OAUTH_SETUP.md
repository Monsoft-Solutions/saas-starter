# OAuth Provider Setup for BetterAuth

This guide provides step-by-step instructions for setting up Google and Facebook OAuth providers for the BetterAuth migration.

## Google OAuth Setup

### 1. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth 2.0 Client IDs"
5. Configure the consent screen if prompted:
   - Choose "External" for testing
   - Fill in required fields (App name, User support email, Developer contact)
6. For OAuth 2.0 Client ID:
   - Application type: "Web application"
   - Name: "SaaS Starter BetterAuth"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

### 2. Environment Variables

Copy the Client ID and Client Secret to your `.env` file:

```env
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
```

## Facebook OAuth Setup

### 1. Facebook Developer Portal Configuration

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "Create App" or select existing app
3. Choose "Consumer" or "Business" app type
4. Fill in app details (App name, Contact email)
5. In the app dashboard:
   - Go to "Add a Product" > "Facebook Login" > "Set Up"
   - Choose "Web"
   - Enter Site URL: `http://localhost:3000` (for development)
6. Configure Facebook Login settings:
   - Go to "Facebook Login" > "Settings"
   - Add Valid OAuth Redirect URIs:
     - `http://localhost:3000/api/auth/callback/facebook` (development)
     - `https://yourdomain.com/api/auth/callback/facebook` (production)

### 2. Environment Variables

Copy the App ID and App Secret to your `.env` file:

```env
FACEBOOK_CLIENT_ID=your_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here
```

## Generate BetterAuth Secret

Generate a secure secret for BetterAuth:

```bash
openssl rand -hex 32
```

Add it to your `.env` file:

```env
BETTER_AUTH_SECRET=your_generated_32_char_secret_here
```

## Testing OAuth Providers

After Phase 3 (Core BetterAuth Configuration) is complete, you can test the OAuth providers:

1. Start the development server: `pnpm dev`
2. Navigate to the sign-in page
3. Click on Google or Facebook login buttons
4. Complete the OAuth flow
5. Verify user creation in the database

## Production Considerations

### Google OAuth

- Update redirect URIs with production domain
- Configure OAuth consent screen for production use
- Consider adding additional scopes if needed

### Facebook OAuth

- Switch to "Live" mode in Facebook App settings
- Update redirect URIs with production domain
- Complete App Review if using advanced permissions

## Troubleshooting

### Common Issues

1. **Invalid redirect URI**: Ensure redirect URIs match exactly in provider settings
2. **Client ID/Secret errors**: Verify environment variables are correctly set
3. **CORS issues**: Ensure BETTER_AUTH_URL matches your application URL

### Debug Mode

Enable debug logging in BetterAuth configuration for development:

```typescript
export const auth = betterAuth({
  // ... other config
  logger: {
    level: 'debug',
  },
});
```
