import * as awsx from "@pulumi/awsx";

export class Ecr {
    public readonly apiImage: awsx.ecr.Image;
    public readonly webImage: awsx.ecr.Image;
    constructor() {
        const infraApiRepository = new awsx.ecr.Repository("api-repo", {
            name: "infraapi",
            forceDelete: true,
        });
        const infraWebRepository = new awsx.ecr.Repository("web-repo", {
            name: "infraweb",
            forceDelete: true
        });

        this.apiImage = new awsx.ecr.Image("apiImage", {
            repositoryUrl: infraApiRepository.url,
            context: "../",
            dockerfile: "../infra-api/Dockerfile",
            platform: "linux/amd64",
        });

        this.webImage = new awsx.ecr.Image("webImage", {
            repositoryUrl: infraWebRepository.url,
            context: "../",
            dockerfile: "../infra-web/Dockerfile",
            platform: "linux/amd64",
        });
    }
}