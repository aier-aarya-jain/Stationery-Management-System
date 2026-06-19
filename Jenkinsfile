pipeline {
    agent any

    options {
        timestamps()
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling latest code from GitHub...'
                checkout scm
            }
        }

        stage('Build Jars') {
            steps {
                dir('backend') {
                    echo '🔨 Building backend jars (reactor mvn package)...'
                    bat 'mvn clean package -DskipTests -B'
                }
            }
        }

        stage('Stop Existing Containers') {
            steps {
                bat 'docker compose -f ci-cd/docker-compose.yml down --remove-orphans'
            }
        }

        stage('Build Fresh Images') {
            steps {
                bat 'docker compose -f ci-cd/docker-compose.yml build --no-cache'
            }
        }

        stage('Start Containers') {
            steps {
                bat 'docker compose -f ci-cd/docker-compose.yml up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                bat 'docker compose -f ci-cd/docker-compose.yml ps'
            }
        }
    }

    post {
        success {
            echo 'SMS deployed successfully'
        }

        failure {
            echo 'SMS deployment failed'
        }
    }
}