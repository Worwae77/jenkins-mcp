pipeline {
    agent any
    
    environment {
        DOCKER_IMAGE = 'sample-app'
        DOCKER_TAG = "${BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                script {
                    writeFile file: 'Dockerfile', text: '''FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]'''
                    
                    writeFile file: 'package.json', text: '''{
  "name": "sample-app",
  "version": "1.0.0",
  "description": "Sample Node.js application",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \\"Error: no test specified\\" && exit 1"
  },
  "dependencies": {
    "express": "^4.18.0"
  }
}'''
                    
                    writeFile file: 'index.js', text: '''const express = require("express");
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.send("Hello World from Sample Docker App!");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});'''
                }
            }
        }
        
        stage('Build') {
            steps {
                echo 'Building Docker image...'
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                    sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                }
            }
        }
        
        stage('Test') {
            steps {
                echo 'Running tests...'
                script {
                    sh "docker run --rm ${DOCKER_IMAGE}:${DOCKER_TAG} npm test"
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                echo 'Deploying application...'
                script {
                    sh "docker stop sample-app || true"
                    sh "docker rm sample-app || true"
                    sh "docker run -d --name sample-app -p 3000:3000 ${DOCKER_IMAGE}:${DOCKER_TAG}"
                }
            }
        }
    }
    
    post {
        always {
            echo 'Cleaning up...'
            script {
                sh 'docker image prune -f'
            }
        }
        success {
            echo 'Pipeline completed successfully!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
