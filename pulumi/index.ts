import * as ecr from './lib/ecr';
import * as vpc from './lib/vpc';
import * as ecs from './lib/ecs';
import * as pulumi from "@pulumi/pulumi";

const ecrStack = new ecr.Ecr();
const vpcStack = new vpc.Vpc();
const ecsStack = new ecs.Ecs({vpc: vpcStack, ecr: ecrStack})

export const url = pulumi.interpolate`http://${ecsStack.webAlbDnsName}`