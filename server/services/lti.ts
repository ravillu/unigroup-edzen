import { Institution } from "@shared/schema";

interface LTIConfig {
  clientId: string;
  institutionId: number;
  deploymentId: string;
  authEndpoint: string;
  tokenEndpoint: string;
  jwksEndpoint: string;
}

export class LTIService {
  private config: LTIConfig;

  constructor(institution: Institution) {
    this.config = {
      clientId: institution.canvasClientId,
      institutionId: institution.id,
      deploymentId: "1", // This will be provided by Canvas during LTI setup
      authEndpoint: `${institution.canvasInstanceUrl}/api/lti/authorize_redirect`,
      tokenEndpoint: `${institution.canvasInstanceUrl}/login/oauth2/token`,
      jwksEndpoint: `${institution.canvasInstanceUrl}/api/lti/security/jwks`,
    };
  }

  getLTIConfig() {
    return {
      title: "Group Formation Tool",
      description: "AI-powered student group formation tool",
      target_link_uri: `${process.env.APP_URL}/lti/launch`,
      oidc_initiation_url: `${process.env.APP_URL}/lti/login`,
      public_jwk_url: `${process.env.APP_URL}/lti/jwks`,
      custom_fields: {
        canvas_user_id: "$Canvas.user.id",
        canvas_course_id: "$Canvas.course.id",
        canvas_role: "$Canvas.role",
      },
      extensions: [
        {
          platform: "canvas.instructure.com",
          settings: {
            platform: "canvas.instructure.com",
            placements: ["course_navigation"],
          },
        },
      ],
    };
  }

  // More LTI-specific methods will be added here
}

export const createLTIService = (institution: Institution) => {
  return new LTIService(institution);
};
