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
    this.clientId = institution.canvasClientId;
    this.clientSecret = institution.canvasClientSecret;
    this.baseUrl = institution.canvasInstanceUrl.endsWith('/') 
      ? institution.canvasInstanceUrl.slice(0, -1) 
      : institution.canvasInstanceUrl;
    this.redirectUri = `${process.env.APP_URL || ''}/api/auth/canvas/callback`;
  }

  getAuthorizationUrl(state: string): string {
    const scopes = [
      'url:GET|/api/v1/courses',
      'url:GET|/api/v1/users/:user_id/profile',
      'url:GET|/api/v1/courses/:course_id/users'
    ].join(' ');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      scope: scopes,
      state: state
    });

    return `${this.baseUrl}/login/oauth2/auth?${params.toString()}`;
  }

  async getTokenFromCode(code: string): Promise<CanvasTokenResponse> {
    const response = await axios.post(`${this.baseUrl}/login/oauth2/token`, {
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      code
    });

    return response.data;
  }

  async getUserProfile(accessToken: string): Promise<CanvasUserProfile> {
    const response = await axios.get(`${this.baseUrl}/api/v1/users/self/profile`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return response.data;
  }
}

// Create a factory function to get institution-specific auth service
export const createCanvasAuthService = (institution: Institution) => {
  return new CanvasAuthService(institution);
};