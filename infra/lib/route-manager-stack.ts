import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from "aws-cdk-lib/aws-iam";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import * as apigateway from "aws-cdk-lib/aws-apigatewayv2";
import * as logs from "aws-cdk-lib/aws-logs";

// ---------------------------------------------------------------------------
// Route Manager Stack
// ---------------------------------------------------------------------------
// Contains all infrastructure for the Water Meter Reading Portal:
//   - Cognito (auth)
//   - VPC + RDS PostgreSQL (data)
//   - S3 (photo / file storage)
//   - API Gateway HTTP API + Lambda functions (backend)
// ---------------------------------------------------------------------------

export class RouteManagerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // -----------------------------------------------------------------------
    // 1. Cognito User Pool
    // -----------------------------------------------------------------------

    const userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "meter-reader-user-pool",
      selfSignUpEnabled: false, // admins create accounts
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: true, mutable: true },
        familyName: { required: true, mutable: true },
      },
      customAttributes: {
        city_id: new cognito.StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Cognito groups matching application roles
    const groupNames = ["admin", "manager", "reader", "city_contact"];
    for (const name of groupNames) {
      new cognito.CfnUserPoolGroup(this, `Group-${name}`, {
        userPoolId: userPool.userPoolId,
        groupName: name,
        description: `${name.replace("_", " ")} role`,
      });
    }

    // App client for the Next.js frontend (public client -- no secret)
    const userPoolClient = userPool.addClient("FrontendClient", {
      userPoolClientName: "meter-reader-frontend",
      authFlows: {
        userSrp: true,
        userPassword: true, // useful for testing; disable in production
      },
      oAuth: {
        flows: { authorizationCodeGrant: true },
        scopes: [cognito.OAuthScope.OPENID, cognito.OAuthScope.EMAIL, cognito.OAuthScope.PROFILE],
        // TODO: Set production callback URLs
        callbackUrls: ["http://localhost:3000/api/auth/callback"],
        logoutUrls: ["http://localhost:3000/"],
      },
      preventUserExistenceErrors: true,
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
      refreshTokenValidity: cdk.Duration.days(30),
    });

    // -----------------------------------------------------------------------
    // 2. VPC
    // -----------------------------------------------------------------------

    const vpc = new ec2.Vpc(this, "Vpc", {
      vpcName: "meter-reader-vpc",
      maxAzs: 2,
      natGateways: 1, // keep costs low in dev; increase for prod
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "Public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "Private",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: "Isolated",
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // -----------------------------------------------------------------------
    // 3. RDS PostgreSQL (Aurora Serverless v2)
    // -----------------------------------------------------------------------

    const dbSecurityGroup = new ec2.SecurityGroup(this, "DbSecurityGroup", {
      vpc,
      description: "Allow Lambda functions to reach the Aurora cluster",
      allowAllOutbound: false,
    });

    const lambdaSecurityGroup = new ec2.SecurityGroup(this, "LambdaSecurityGroup", {
      vpc,
      description: "Security group for Lambda functions",
      allowAllOutbound: true,
    });

    // Allow inbound PostgreSQL traffic from the Lambda SG
    dbSecurityGroup.addIngressRule(
      lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      "Lambda -> Aurora PostgreSQL"
    );

    const dbCluster = new rds.DatabaseCluster(this, "AuroraCluster", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      defaultDatabaseName: "meter_reader",
      credentials: rds.Credentials.fromGeneratedSecret("meterreader_admin", {
        secretName: "meter-reader/db-credentials",
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2, // TODO: increase for production
      writer: rds.ClusterInstance.serverlessV2("Writer", {
        publiclyAccessible: false,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      storageEncrypted: true,
      backup: {
        retention: cdk.Duration.days(7), // TODO: increase for production
      },
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // Reference to the auto-generated secret
    const dbSecret = dbCluster.secret!;

    // -----------------------------------------------------------------------
    // 4. S3 Bucket (photos & CustFiles)
    // -----------------------------------------------------------------------

    const storageBucket = new s3.Bucket(this, "StorageBucket", {
      bucketName: cdk.PhysicalName.GENERATE_IF_NEEDED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: false,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cors: [
        {
          allowedHeaders: ["*"],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
          ],
          // TODO: Replace with production frontend origin
          allowedOrigins: ["http://localhost:3000", "https://*.amplifyapp.com"],
          exposedHeaders: ["ETag"],
          maxAge: 3600,
        },
      ],
      lifecycleRules: [
        {
          id: "TransitionPhotosToIA",
          prefix: "photos/",
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
        {
          id: "AbortIncompleteMultipartUploads",
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // -----------------------------------------------------------------------
    // 5. Lambda Functions (one per domain)
    // -----------------------------------------------------------------------

    // Shared environment variables for all Lambda functions
    const sharedEnv: Record<string, string> = {
      DB_SECRET_ARN: dbSecret.secretArn,
      S3_BUCKET: storageBucket.bucketName,
      NODE_OPTIONS: "--enable-source-maps",
    };

    // Shared IAM policy statements
    const secretsReadPolicy = new iam.PolicyStatement({
      actions: [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
      ],
      resources: [dbSecret.secretArn],
    });

    const s3ReadWritePolicy = new iam.PolicyStatement({
      actions: [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket",
      ],
      resources: [
        storageBucket.bucketArn,
        `${storageBucket.bucketArn}/*`,
      ],
    });

    // Domain names for which we create a Lambda function
    const domains = [
      "cities",
      "routes",
      "assignments",
      "readers",
      "meters",
      "readings",
      "reports",
      "photos",
      "cycles",
    ] as const;

    const lambdaFunctions: Record<string, lambda.Function> = {};

    for (const domain of domains) {
      const fn = new lambda.Function(this, `Fn-${domain}`, {
        functionName: `meter-reader-${domain}`,
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: "index.handler",
        // TODO: Replace inline placeholder with actual bundled code
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            return {
              statusCode: 200,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ message: "${domain} handler placeholder" }),
            };
          };
        `),
        memorySize: 256,
        timeout: cdk.Duration.seconds(30),
        environment: {
          ...sharedEnv,
          DOMAIN: domain,
        },
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        logGroup: new logs.LogGroup(this, `LogGroup-${domain}`, {
          logGroupName: `/aws/lambda/meter-reader-${domain}`,
          retention: logs.RetentionDays.TWO_WEEKS,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }),
        tracing: lambda.Tracing.ACTIVE,
      });

      fn.addToRolePolicy(secretsReadPolicy);
      fn.addToRolePolicy(s3ReadWritePolicy);

      lambdaFunctions[domain] = fn;
    }

    // -----------------------------------------------------------------------
    // 6. API Gateway (HTTP API) with Cognito JWT Authorizer
    // -----------------------------------------------------------------------

    const httpApi = new apigateway.CfnApi(this, "HttpApi", {
      name: "meter-reader-api",
      protocolType: "HTTP",
      corsConfiguration: {
        // TODO: Replace with production frontend origin
        allowOrigins: ["http://localhost:3000", "https://*.amplifyapp.com"],
        allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowHeaders: [
          "Content-Type",
          "Authorization",
          "X-Amz-Date",
          "X-Api-Key",
        ],
        exposeHeaders: ["X-Total-Count"],
        maxAge: 3600,
        allowCredentials: true,
      },
    });

    // JWT Authorizer using Cognito
    const authorizer = new apigateway.CfnAuthorizer(this, "CognitoAuthorizer", {
      apiId: httpApi.ref,
      authorizerType: "JWT",
      name: "CognitoJwtAuthorizer",
      identitySource: ["$request.header.Authorization"],
      jwtConfiguration: {
        audience: [userPoolClient.userPoolClientId],
        issuer: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
      },
    });

    // Default stage with auto-deploy
    const stage = new apigateway.CfnStage(this, "DefaultStage", {
      apiId: httpApi.ref,
      stageName: "$default",
      autoDeploy: true,
      accessLogSettings: {
        // TODO: Uncomment and configure if you want access logging
        // destinationArn: ...,
        // format: ...,
      },
    });

    // Helper to wire up a Lambda integration + route
    const addRoute = (
      method: string,
      path: string,
      fn: lambda.Function,
      requireAuth: boolean = true
    ) => {
      const integrationId = `${method}${path}`.replace(/[^a-zA-Z0-9]/g, "");

      const integration = new apigateway.CfnIntegration(
        this,
        `Integration-${integrationId}`,
        {
          apiId: httpApi.ref,
          integrationType: "AWS_PROXY",
          integrationUri: fn.functionArn,
          payloadFormatVersion: "2.0",
        }
      );

      const routeProps: apigateway.CfnRouteProps = {
        apiId: httpApi.ref,
        routeKey: `${method} ${path}`,
        target: `integrations/${integration.ref}`,
        ...(requireAuth
          ? {
              authorizationType: "JWT",
              authorizerId: authorizer.ref,
            }
          : {}),
      };

      new apigateway.CfnRoute(this, `Route-${integrationId}`, routeProps);

      // Grant API Gateway permission to invoke the Lambda
      fn.addPermission(`ApiGw-${integrationId}`, {
        principal: new iam.ServicePrincipal("apigateway.amazonaws.com"),
        sourceArn: `arn:aws:execute-api:${this.region}:${this.account}:${httpApi.ref}/*/*`,
      });
    };

    // --- Cities ---
    addRoute("GET", "/api/cities", lambdaFunctions["cities"]);
    addRoute("POST", "/api/cities", lambdaFunctions["cities"]);
    addRoute("GET", "/api/cities/{cityId}", lambdaFunctions["cities"]);
    addRoute("PUT", "/api/cities/{cityId}", lambdaFunctions["cities"]);

    // --- Routes ---
    addRoute("GET", "/api/routes", lambdaFunctions["routes"]);
    addRoute("POST", "/api/routes", lambdaFunctions["routes"]);
    addRoute("GET", "/api/routes/{routeId}", lambdaFunctions["routes"]);
    addRoute("PUT", "/api/routes/{routeId}", lambdaFunctions["routes"]);

    // --- Assignments ---
    addRoute("GET", "/api/assignments", lambdaFunctions["assignments"]);
    addRoute("POST", "/api/assignments", lambdaFunctions["assignments"]);
    addRoute("PUT", "/api/assignments/{assignmentId}", lambdaFunctions["assignments"]);
    addRoute("DELETE", "/api/assignments/{assignmentId}", lambdaFunctions["assignments"]);

    // --- Readers ---
    addRoute("GET", "/api/readers", lambdaFunctions["readers"]);
    addRoute("POST", "/api/readers", lambdaFunctions["readers"]);
    addRoute("GET", "/api/readers/{readerId}", lambdaFunctions["readers"]);
    addRoute("PUT", "/api/readers/{readerId}", lambdaFunctions["readers"]);

    // --- Meters ---
    addRoute("GET", "/api/meters", lambdaFunctions["meters"]);
    addRoute("POST", "/api/meters", lambdaFunctions["meters"]);
    addRoute("GET", "/api/meters/{meterId}", lambdaFunctions["meters"]);
    addRoute("PUT", "/api/meters/{meterId}", lambdaFunctions["meters"]);

    // --- Readings ---
    addRoute("GET", "/api/readings", lambdaFunctions["readings"]);
    addRoute("POST", "/api/readings", lambdaFunctions["readings"]);
    addRoute("GET", "/api/readings/{readingId}", lambdaFunctions["readings"]);
    addRoute("PUT", "/api/readings/{readingId}", lambdaFunctions["readings"]);

    // --- Reports ---
    addRoute("GET", "/api/reports", lambdaFunctions["reports"]);
    addRoute("GET", "/api/reports/{reportType}", lambdaFunctions["reports"]);

    // --- Photos ---
    addRoute("POST", "/api/photos/presign", lambdaFunctions["photos"]);
    addRoute("GET", "/api/photos/{photoId}", lambdaFunctions["photos"]);
    addRoute("DELETE", "/api/photos/{photoId}", lambdaFunctions["photos"]);

    // --- Cycles ---
    addRoute("GET", "/api/cycles", lambdaFunctions["cycles"]);
    addRoute("POST", "/api/cycles", lambdaFunctions["cycles"]);
    addRoute("GET", "/api/cycles/{cycleId}", lambdaFunctions["cycles"]);
    addRoute("PUT", "/api/cycles/{cycleId}", lambdaFunctions["cycles"]);

    // -----------------------------------------------------------------------
    // 7. Amplify Hosting (commented out -- uncomment when ready)
    // -----------------------------------------------------------------------

    // TODO: Uncomment and configure when ready to deploy the frontend via Amplify.
    //
    // import * as amplify from "aws-cdk-lib/aws-amplify";
    //
    // const amplifyApp = new amplify.CfnApp(this, "AmplifyApp", {
    //   name: "meter-reader-pwa",
    //   // TODO: Replace with your GitHub repository URL
    //   repository: "https://github.com/YOUR_ORG/meter-reader-pwa",
    //   // TODO: Create a GitHub personal access token and store it in Secrets Manager
    //   oauthToken: "{{resolve:secretsmanager:github-token:SecretString:token}}",
    //   environmentVariables: [
    //     { name: "NEXT_PUBLIC_API_URL", value: `https://${httpApi.ref}.execute-api.${this.region}.amazonaws.com` },
    //     { name: "NEXT_PUBLIC_COGNITO_USER_POOL_ID", value: userPool.userPoolId },
    //     { name: "NEXT_PUBLIC_COGNITO_CLIENT_ID", value: userPoolClient.userPoolClientId },
    //   ],
    //   buildSpec: JSON.stringify({
    //     version: 1,
    //     applications: [
    //       {
    //         appRoot: "frontend",
    //         frontend: {
    //           phases: {
    //             preBuild: { commands: ["npm ci"] },
    //             build: { commands: ["npm run build"] },
    //           },
    //           artifacts: {
    //             baseDirectory: ".next",
    //             files: ["**/*"],
    //           },
    //           cache: { paths: ["node_modules/**/*", ".next/cache/**/*"] },
    //         },
    //       },
    //     ],
    //   }),
    //   platform: "WEB_COMPUTE", // SSR support for Next.js
    // });
    //
    // // Main branch auto-deploy
    // new amplify.CfnBranch(this, "MainBranch", {
    //   appId: amplifyApp.attrAppId,
    //   branchName: "main",
    //   enableAutoBuild: true,
    //   framework: "Next.js - SSR",
    //   stage: "PRODUCTION",
    // });
    //
    // // TODO: Add custom domain
    // // new amplify.CfnDomain(this, "AmplifyDomain", {
    // //   appId: amplifyApp.attrAppId,
    // //   domainName: "meter-reader.example.com",
    // //   subDomainSettings: [
    // //     { branchName: "main", prefix: "" },
    // //   ],
    // // });

    // -----------------------------------------------------------------------
    // 8. Stack Outputs
    // -----------------------------------------------------------------------

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
      description: "Cognito User Pool ID",
      exportName: "MeterReader-UserPoolId",
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
      description: "Cognito App Client ID (frontend)",
      exportName: "MeterReader-UserPoolClientId",
    });

    new cdk.CfnOutput(this, "DbClusterEndpoint", {
      value: dbCluster.clusterEndpoint.hostname,
      description: "Aurora PostgreSQL writer endpoint",
      exportName: "MeterReader-DbEndpoint",
    });

    new cdk.CfnOutput(this, "DbSecretArn", {
      value: dbSecret.secretArn,
      description: "Secrets Manager ARN for DB credentials",
      exportName: "MeterReader-DbSecretArn",
    });

    new cdk.CfnOutput(this, "StorageBucketName", {
      value: storageBucket.bucketName,
      description: "S3 bucket for photos and CustFiles",
      exportName: "MeterReader-StorageBucket",
    });

    new cdk.CfnOutput(this, "ApiUrl", {
      value: `https://${httpApi.ref}.execute-api.${this.region}.amazonaws.com`,
      description: "HTTP API Gateway URL",
      exportName: "MeterReader-ApiUrl",
    });
  }
}
