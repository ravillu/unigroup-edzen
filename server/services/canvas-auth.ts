import axios from 'axios';
import { Institution } from "@shared/schema";

interface CanvasTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

interface CanvasUserProfile {
  id: number;
  name: string;
  primary_email: string;
  login_id: string;
}

export class CanvasAuthService {
  private clientId: string;
  private clientSecret: string;
  private baseUrl: string;
  private redirectUri: string;

  constructor(institution: Institution) {
    // Ensure required credentials are present
    if (!institution.canvasClientId || !institution.canvasClientSecret) {
      throw new Error("Canvas client ID and secret are required");
    }

    this.clientId = institution.canvasClientId;
    this.clientSecret = institution.canvasClientSecret;
    this.baseUrl = institution.canvasInstanceUrl.endsWith('/') 
      ? institution.canvasInstanceUrl.slice(0, -1) 
      : institution.canvasInstanceUrl;

    // Add https:// if not present
    if (!this.baseUrl.startsWith('http://') && !this.baseUrl.startsWith('https://')) {
      this.baseUrl = `https://${this.baseUrl}`;
    }

    // Validate the URL
    try {
      new URL(this.baseUrl);
    } catch (error) {
      throw new Error("Invalid Canvas instance URL");
    }

    this.redirectUri = `${process.env.APP_URL || ''}/api/auth/canvas/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const scopes = [
      'url:GET|/api/v1/courses',
      'url:GET|/api/v1/users/:user_id/profile',
      'url:GET|/api/v1/courses/:course_id/users',
      'url:POST|/api/v1/courses/:course_id/group_categories',
      'url:POST|/api/v1/group_categories/:group_category_id/groups',
      'url:POST|/api/v1/groups/:group_id/memberships'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes,
      state: state
    });

    console.log('Canvas Authorization URL:', `${this.baseUrl}/login/oauth2/auth?${params.toString()}`);
    return `${this.baseUrl}/login/oauth2/auth?${params.toString()}`;
  }

  async getTokenFromCode(code: string): Promise<CanvasTokenResponse> {
    console.log('Getting token from code:', { baseUrl: this.baseUrl, redirectUri: this.redirectUri });

    try {
      const response = await axios.post(`${this.baseUrl}/login/oauth2/token`, {
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code
      });

      return response.data;
    } catch (error: any) {
      console.error('Canvas token error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get Canvas token: ${error.response?.data?.error_description || error.message}`);
    }
  }

  async getUserProfile(accessToken: string): Promise<CanvasUserProfile> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/v1/users/self/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;
    } catch (error: any) {
      console.error('Canvas profile error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      throw new Error(`Failed to get Canvas user profile: ${error.response?.data?.error_description || error.message}`);
    }
  }
}

export const createCanvasAuthService = (institution: Institution) => {
  return new CanvasAuthService(institution);
};