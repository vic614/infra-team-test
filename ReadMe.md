


# Please check `pulumi` directory

# How to Run

install node and npm on your machine: [Install NPM](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)


Install npm packages under `pulumi` directory:
```
npm install
```

Paste AWS Credentials into current bash session
```
export AWS_ACCESS_KEY_ID=xxxx
export AWS_SECRET_ACCESS_KEY=xxxxx
export AWS_SESSION_TOKEN=xxxx
export AWS_DEFAULT_REGION=us-east-1
```

Use pulumi to deploy in to `dev` stack.

```
pulumi up -s dev 
```



# Infrastructure diagram

![Infrastructure](./pulumi/docs/assessment.drawio.png)

# Default Tags for Dev Stack

```
config:
  aws:defaultTags:
    tags:
      environment: dev
      project: assessment
```

---


# How to Run

install docker on your machine: [Install Docker](https://docs.docker.com/engine/install/)


Open terminal and run:
```
docker-compose up
```

Open a web browser and navigate to 
```
http://localhost:3000
```


# Application Details

- Web: ASP.NET Core 5.0 Web APP
  - this application requires an environment variabled called "ApiAddress" which will be the address of the Web Api.
- API: ASP.NET Core 5.0 Web API

