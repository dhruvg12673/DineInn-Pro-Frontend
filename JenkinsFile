pipeline {
    agent any
    environment {
        DOCKER_USER = 'dhruvgothi06'
        IMAGE_NAME = 'dineinnpro-frontend'
        // The Public IP of your server where the backend is running
        BACKEND_API_URL = 'https://dineinn-pro-backend.onrender.com'
    }
    stages {
        stage('Build & Push') {
            steps {
                script {
                    // Injecting the API URL during build so React knows where the backend is
                    sh "docker build --build-arg REACT_APP_API_URL=${BACKEND_API_URL} -t ${DOCKER_USER}/${IMAGE_NAME}:latest ."
                    withCredentials([usernamePassword(credentialsId: 'docker-hub-creds', passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo $PASS | docker login -u $USER --password-stdin"
                        sh "docker push ${DOCKER_USER}/${IMAGE_NAME}:latest"
                    }
                }
            }
        }
        stage('Deploy') {
            steps {
                sh """
                    docker pull ${DOCKER_USER}/${IMAGE_NAME}:latest
                    docker stop ${IMAGE_NAME} || true
                    docker rm ${IMAGE_NAME} || true
                    docker run -d --name ${IMAGE_NAME} -p 80:80 ${DOCKER_USER}/${IMAGE_NAME}:latest
                """
            }
        }
    }
}