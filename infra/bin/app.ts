#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { RouteManagerStack } from "../lib/route-manager-stack";

const app = new cdk.App();

const env = {
  // TODO: Set your target AWS account and region
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? "us-east-1",
};

new RouteManagerStack(app, "RouteManagerStack", {
  env,
  description: "Water Meter Reading Portal - Route Manager infrastructure",

  // Stack-level tags applied to all resources
  tags: {
    Project: "MeterReaderPWA",
    ManagedBy: "CDK",
  },
});

app.synth();
