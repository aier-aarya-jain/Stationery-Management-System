pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    // Compile all Java microservices at once using the parent pom
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Deploy via Docker') {
            steps {
                // This command will automatically build the frontend, 
                // build all backend docker images using the generated JARs, 
                // and start the entire stack.
                sh 'docker-compose down'
                sh 'docker-compose up -d --build'
            }
        }
    }
    
    post {
        success {
            echo 'Deployment Successful!'
        }
        failure {
            echo 'Deployment Failed. Check logs.'
        }
    }
}
