// ============================================================
// Stationery Management System - Declarative Jenkins Pipeline
// ============================================================
// Prerequisites:
//   - Jenkins with Pipeline plugin
//   - Maven, JDK 17+, Docker & Docker Compose on the agent
// ============================================================

pipeline {
    agent any

    // Removed hardcoded environment block to rely on system PATH. 
    // Ensure 'mvn', 'java', and 'docker-compose' are added to your system's Environment Variables PATH.

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timestamps()
        timeout(time: 25, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {

        // 1. Checkout Source Code
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        // 2. Build All Backend Services
        stage('Build Backend') {
            steps {
                dir('backend') {
                    echo 'Building all backend microservices...'
                    bat 'mvn clean package -DskipTests -B'
                }
            }
        }

        // 3. Run Backend Tests
        stage('Run Backend Tests') {
            steps {
                dir('backend') {
                    echo 'Running backend unit tests...'
                    bat 'mvn test -B'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true,
                          testResults: '**/target/surefire-reports/*.xml'
                }
            }
        }

        // 4. Build Docker Images and Deploy
        stage('Docker Deploy') {
            steps {
                echo 'Stopping any existing containers...'
                bat 'docker-compose down --remove-orphans || exit 0'

                echo 'Building images and starting containers...'
                bat 'docker-compose up -d --build'

                echo 'Waiting for services to become healthy...'
                bat 'timeout /t 60 /nobreak > NUL'

                echo 'Verifying deployment...'
                bat 'docker-compose ps'
            }
        }
    }

    post {
        success {
            echo '==========================================='
            echo '  Pipeline SUCCEEDED!'
            echo "  Build #${BUILD_NUMBER} deployed."
            echo '==========================================='
        }
        failure {
            echo '==========================================='
            echo '  Pipeline FAILED!'
            echo "  Check logs for build #${BUILD_NUMBER}."
            echo '==========================================='
        }
    }
}