pipeline {
    agent any

    environment {
        ACCOUNT_ID   = '533267129063'
        REGION       = 'us-east-1'
        CLUSTER_NAME = 'nodejs-cluster'
        IMAGE_TAG    = "${BUILD_NUMBER}"
    }

    stages {

        stage('Git Checkout') {
            steps {
                git branch: env.BRANCH_NAME,
                    credentialsId: 'github-credentials',
                    url: 'https://github.com/Anil7749/Sample-Nodejs.git'
            }
        }

        stage('Set Environment Variables') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'dev') {
                        env.IMAGE_NAME     = 'nodejs-dev-repo'
                        env.IMAGE_URI      = "533267129063.dkr.ecr.us-east-1.amazonaws.com/nodejs-dev-repo:${IMAGE_TAG}"
                        env.SERVICE_NAME   = 'nodejs-dev-service'
                        env.TASK_FAMILY    = 'nodejs-dev-td'
                        env.CONTAINER_NAME = 'nodejs-dev-container'
                    } else if (env.BRANCH_NAME == 'stage') {
                        env.IMAGE_NAME     = 'nodejs-stage-repo'
                        env.IMAGE_URI      = "533267129063.dkr.ecr.us-east-1.amazonaws.com/nodejs-stage-repo:${IMAGE_TAG}"
                        env.SERVICE_NAME   = 'nodejs-stage-service'
                        env.TASK_FAMILY    = 'nodejs-stage-td'
                        env.CONTAINER_NAME = 'nodejs-stage-container'
                    } else if (env.BRANCH_NAME == 'prod') {
                        env.IMAGE_NAME     = 'nodejs-prod-repo'
                        env.IMAGE_URI      = "533267129063.dkr.ecr.us-east-1.amazonaws.com/nodejs-prod-repo:${IMAGE_TAG}"
                        env.SERVICE_NAME   = 'nodejs-prod-service'
                        env.TASK_FAMILY    = 'nodejs-prod-td'
                        env.CONTAINER_NAME = 'nodejs-prod-container'
                    }
                }
            }
        }

        stage('Build Image') {
            steps {
                sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG .'
            }
        }

        stage('Scan Image') {
            steps {
                sh 'trivy image --exit-code 0 $IMAGE_NAME:$IMAGE_TAG'
            }
        }

        stage('Login to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh '''
                    aws ecr get-login-password --region $REGION | \
                    docker login --username AWS --password-stdin \
                    $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com
                    '''
                }
            }
        }

        stage('Push Image to ECR') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh '''
                    docker tag $IMAGE_NAME:$IMAGE_TAG $IMAGE_URI
                    docker push $IMAGE_URI

                    docker tag $IMAGE_NAME:$IMAGE_TAG $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$IMAGE_NAME:latest
                    docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$IMAGE_NAME:latest
                    '''
                }
            }
        }

        stage('Approval for Prod') {
            when {
                expression { env.BRANCH_NAME == 'prod' }
            }
            steps {
                input message: 'Deploy to Production? Click Approve to continue.',
                      ok: 'Approve'
            }
        }

        stage('Deploy to ECS') {
            steps {
                withCredentials([[
                    $class: 'AmazonWebServicesCredentialsBinding',
                    credentialsId: 'aws-credentials'
                ]]) {
                    sh '''
                    aws ecs register-task-definition \
                        --family $TASK_FAMILY \
                        --container-definitions "[{\"name\":\"$CONTAINER_NAME\",\"image\":\"$IMAGE_URI\",\"portMappings\":[{\"containerPort\":3000}]}]" \
                        --requires-compatibilities FARGATE \
                        --network-mode awsvpc \
                        --cpu 512 \
                        --memory 1024 \
                        --execution-role-arn arn:aws:iam::$ACCOUNT_ID:role/ecsTaskExecutionRole \
                        --region $REGION

                    TASK_REVISION=$(aws ecs describe-task-definition \
                        --task-definition $TASK_FAMILY \
                        --region $REGION \
                        --query taskDefinition.revision \
                        --output text)

                    aws ecs update-service \
                        --cluster $CLUSTER_NAME \
                        --service $SERVICE_NAME \
                        --task-definition $TASK_FAMILY:$TASK_REVISION \
                        --force-new-deployment \
                        --region $REGION
                    '''
                }
            }
        }
    }
}
