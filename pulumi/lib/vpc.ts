import * as awsx from "@pulumi/awsx";
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export class Vpc {
    readonly vpc: awsx.ec2.Vpc
    readonly vpcEndpointSG: aws.ec2.SecurityGroup
    constructor() {
        this.vpc = new awsx.ec2.Vpc("playground-vpc", {
            cidrBlock: "10.0.0.0/16",
            availabilityZoneNames: ["us-east-1a", "us-east-1b"],
            natGateways: {
                "strategy": "None"
            },
            enableDnsHostnames: true,
            enableDnsSupport: true,
            subnetSpecs: [
                {
                    type: awsx.ec2.SubnetType.Public,
                    cidrBlocks: ["10.0.101.0/24", "10.0.102.0/24"],
                },
                {
                    type: awsx.ec2.SubnetType.Private,
                    cidrBlocks: ["10.0.1.0/24", "10.0.2.0/24"]
                },
            ],
        });

        this.vpcEndpointSG = new aws.ec2.SecurityGroup("vpc-endpoint-sg", {
            vpcId: this.vpc.vpcId})
        
        const currentRegion = aws.getRegion().then(region => region.name);

        new aws.ec2.VpcEndpoint("ecr-dkr", {
            vpcId: this.vpc.vpcId,
            serviceName: pulumi.interpolate`com.amazonaws.${currentRegion}.ecr.dkr`,
            vpcEndpointType: "Interface",
            privateDnsEnabled: true,
            securityGroupIds: [this.vpcEndpointSG.id],
            subnetIds: this.vpc.privateSubnetIds
        })
        new aws.ec2.VpcEndpoint("ecr-api", {
            vpcId: this.vpc.vpcId,
            serviceName: pulumi.interpolate`com.amazonaws.${currentRegion}.ecr.api`,
            vpcEndpointType: "Interface",
            privateDnsEnabled: true,
            securityGroupIds: [this.vpcEndpointSG.id],
            subnetIds: this.vpc.privateSubnetIds
        })
        new aws.ec2.VpcEndpoint("cloudwatch", {
            vpcId: this.vpc.vpcId,
            serviceName: pulumi.interpolate`com.amazonaws.${currentRegion}.logs`,
            vpcEndpointType: "Interface",
            privateDnsEnabled: true,
            securityGroupIds: [this.vpcEndpointSG.id],
            subnetIds: this.vpc.privateSubnetIds
        })
        new aws.ec2.VpcEndpoint("s3", {
            vpcId: this.vpc.vpcId,
            serviceName: pulumi.interpolate`com.amazonaws.${currentRegion}.s3`,
            vpcEndpointType: "Gateway",
            routeTableIds: this.vpc.routeTables.apply(v=>v.map(x=>x.id))
        })
    }
}