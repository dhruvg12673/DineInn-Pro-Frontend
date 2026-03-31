pipeline {
    agent any
    environment {
        DOCKER_USER = 'dhruvgothi06'
        IMAGE_NAME = 'dineinnpro-frontend'
        // Hosted URLs for Health Checks
        FRONTEND_PROD_URL = 'https://dine-inn-pro.vercel.app' 
        BACKEND_API_URL = 'https://dineinn-pro-backend.onrender.com'
    }
    stages {
        stage('GitHub Repo Check') {
            steps {
                echo "Verifying Repository Connection..."
                checkout scm
                bat "if not exist package.json (exit 1)"
            }
        }

        stage('Library Check') {
            steps {
                echo "Installing dependencies to verify package integrity..."
                bat "npm install"
            }
        }

        stage('Backend Connectivity Check') {
            steps {
                echo "Verifying if Frontend can fetch data from Backend..."
                /* This checks if the Backend API is responding. 
                   If the backend is down, the frontend deployment will stop here 
                   to prevent 'Connection Refused' errors for users.
                */
                bat "curl -s -o /dev/null -I -w %%{http_code} %BACKEND_API_URL% | findstr 200"
            }
        }

        stage('Build & Push Docker') {
            steps {
                script {
                    echo "Building Frontend Docker Image..."
                    bat "docker build -t %DOCKER_USER%/%IMAGE_NAME%:latest ."
                    
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        bat "echo %PASS%| docker login -u %USER% --password-stdin"
                        bat "docker push %DOCKER_USER%/%IMAGE_NAME%:latest"
                    }
                }
            }
        }

        stage('Frontend Live Health Check') {
            steps {
                echo "Verifying if the currently hosted Frontend is online..."
                bat "curl -s -o /dev/null -I -w %%{http_code} %FRONTEND_PROD_URL% | findstr 200"
            }
        }

        stage('Deploy to Production') {
            steps {
                echo "Redeploying local frontend container..."
                bat """
                    @echo off
                    :: Stop and remove old frontend container
                    docker stop %IMAGE_NAME% >nul 2>&1 || ver >nul
                    docker rm %IMAGE_NAME% >nul 2>&1 || ver >nul
                    
                    :: Run new frontend on port 80
                    docker run -d --name %IMAGE_NAME% -p 3000:80 %DOCKER_USER%/%IMAGE_NAME%:latest
                """
            }
        }
    }
}