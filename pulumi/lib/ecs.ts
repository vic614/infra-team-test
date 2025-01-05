import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import * as pulumi from "@pulumi/pulumi";
import * as ecr from "./ecr";
import * as vpc from "./vpc";

type EcsProps = {
    vpc: vpc.Vpc
    ecr: ecr.Ecr
}

export class Ecs {

    readonly webAlbDnsName: pulumi.Output<string>;

    constructor(props: EcsProps) {

        const webAlb = new awsx.lb.ApplicationLoadBalancer("webAlb",
            {
                subnetIds: props.vpc.vpc.publicSubnetIds,
                defaultTargetGroup: {
                    "healthCheck": {
                        "path": '/',
                        "port": "5000"
                    },
                    port: 5000
                }
            }
        );
        const apiAlb = new awsx.lb.ApplicationLoadBalancer("apiAlb",
            {
                subnetIds: props.vpc.vpc.privateSubnetIds,
                defaultTargetGroup: {
                    "healthCheck": {
                        "path": '/WeatherForecast',
                        "port": "5000"
                    },
                    port: 5000
                },
                internal: true,
            }
        );

        const webServiceSG = new aws.ec2.SecurityGroup("web-svc-security-group", {
            vpcId: props.vpc.vpc.vpcId,
        })

        new aws.vpc.SecurityGroupIngressRule(`web-ingress`, {
            fromPort: 5000,
            toPort: 5000,
            ipProtocol: "tcp",
            securityGroupId: webServiceSG.id,
            cidrIpv4: props.vpc.vpc.vpc.cidrBlock,
        })

        new aws.vpc.SecurityGroupEgressRule("web-svc-egress", {
            cidrIpv4: "0.0.0.0/0",
            ipProtocol: "-1",
            securityGroupId: webServiceSG.id
        })


        const apiServiceSG = new aws.ec2.SecurityGroup("api-svc-security-group", {
            vpcId: props.vpc.vpc.vpcId
        })

        new aws.vpc.SecurityGroupIngressRule("api-ingress", {
            fromPort: 5000,
            toPort: 5000,
            ipProtocol: "tcp",
            securityGroupId: apiServiceSG.id,
            cidrIpv4: props.vpc.vpc.vpc.cidrBlock,
        })

        new aws.vpc.SecurityGroupEgressRule("api-egress", {
            cidrIpv4: "0.0.0.0/0",
            ipProtocol: "-1",
            securityGroupId: apiServiceSG.id
        })

        new aws.vpc.SecurityGroupIngressRule("endpoint-ingress-api", {
            fromPort: 443,
            toPort: 443,
            ipProtocol: "tcp",
            securityGroupId: props.vpc.vpcEndpointSG.id,
            referencedSecurityGroupId: apiServiceSG.id
        })

        new aws.vpc.SecurityGroupIngressRule("endpoint-ingress-web", {
            fromPort: 443,
            toPort: 443,
            ipProtocol: "tcp",
            securityGroupId: props.vpc.vpcEndpointSG.id,
            referencedSecurityGroupId: webServiceSG.id
        })

        const cluster = new aws.ecs.Cluster("playground-cluster")


        const apiService = new awsx.ecs.FargateService("playground-api-service", {
            cluster: cluster.arn,
            networkConfiguration: {
                subnets: props.vpc.vpc.privateSubnetIds,
                securityGroups: [apiServiceSG.id]
            },
            desiredCount: 2,
            taskDefinitionArgs: {
                container: {
                    name: "api",
                    image: props.ecr.apiImage.imageUri,
                    cpu: 512,
                    memory: 1024,
                    essential: true,
                    portMappings: [
                        {
                            "containerPort": 5000,
                            "targetGroup": apiAlb.defaultTargetGroup
                        }
                    ],
                },
            },
        });

        const webService = new awsx.ecs.FargateService("playground-web-service", {
            cluster: cluster.arn,
            networkConfiguration: {
                subnets: props.vpc.vpc.publicSubnetIds,
                securityGroups: [webServiceSG.id],
            },
            desiredCount: 2,
            taskDefinitionArgs: {
                container: {
                    name: "web",
                    image: props.ecr.webImage.imageUri,
                    cpu: 512,
                    memory: 1024,
                    essential: true,
                    environment: [
                        {
                            name: "ApiAddress",
                            value: pulumi.interpolate`http://${apiAlb.loadBalancer.dnsName}/WeatherForecast`
                        }
                    ],
                    portMappings: [
                        {
                            "targetGroup": webAlb.defaultTargetGroup,
                            "containerPort": 5000
                        }
                    ],
                },
            },
        },
        {
            dependsOn: apiService,
        }
        );
        this.webAlbDnsName = webAlb.loadBalancer.dnsName
    }
}
