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
                    bat 'docker run --rm -v "%CD%":/usr/src/app -w /usr/src/app maven:3.8.5-openjdk-17 mvn clean package -DskipTests -B'
                }
            }
        }

        stage('Stop Existing Containers') {
            steps {
                bat 'docker compose -f docker-compose.yml down --remove-orphans'
            }
        }

        stage('Build Fresh Images') {
            steps {
                bat 'docker compose -f docker-compose.yml build --no-cache'
            }
        }

        stage('Start Containers') {
            steps {
                bat 'docker compose -f docker-compose.yml up -d'
            }
        }

        stage('Verify Deployment') {
            steps {
                bat 'docker compose -f docker-compose.yml ps'
            }
        }
    }

    post {
        success {
            echo 'Stationery Hub deployed successfully'
        }

        failure {
            echo 'Stationery Hub deployment failed'
        }
    }
}