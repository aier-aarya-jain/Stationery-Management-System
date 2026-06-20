pipeline {
    agent any

    options {
        timestamps()
    }

    environment {
        COMPOSE_FILE = "docker-compose.yml"
        MAVEN_OPTS = "-Dhttps.protocols=TLSv1.2"
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Pulling latest code from GitHub...'
                checkout scm
            }
        }

        stage('Clean Workspace') {
            steps {
                bat '''
                if exist backend\\config-server\\target rmdir /s /q backend\\config-server\\target
                if exist backend\\eureka-server\\target rmdir /s /q backend\\eureka-server\\target
                if exist backend\\api-gateway\\target rmdir /s /q backend\\api-gateway\\target
                if exist backend\\auth-service\\target rmdir /s /q backend\\auth-service\\target
                if exist backend\\inventory-service\\target rmdir /s /q backend\\inventory-service\\target
                if exist backend\\request-service\\target rmdir /s /q backend\\request-service\\target

                if exist frontend\\node_modules rmdir /s /q frontend\\node_modules
                '''
            }
        }

        stage('Build Backend') {
            steps {
                dir('backend') {
                    bat '''
                    docker run --rm ^
                    -e MAVEN_OPTS="-Dhttps.protocols=TLSv1.2" ^
                    -v "%CD%":/usr/src/app ^
                    -w /usr/src/app ^
                    maven:3.9.9-eclipse-temurin-17 ^
                    mvn clean package -DskipTests
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                dir('backend') {

                    bat '''
                    docker run --rm ^
                    -e MAVEN_OPTS="-Dhttps.protocols=TLSv1.2" ^
                    -v "%CD%":/usr/src/app ^
                    -w /usr/src/app ^
                    maven:3.9.9-eclipse-temurin-17 ^
                    mvn test
                    '''
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    bat 'npm ci'
                    bat 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                bat '''
                docker compose -f %COMPOSE_FILE% build --no-cache
                '''
            }
        }

        stage('Deploy') {
            steps {

                bat '''
                docker compose -f %COMPOSE_FILE% up -d
                '''

            }
        }

        stage('Verify Deployment') {
            steps {

                bat '''
                docker compose -f %COMPOSE_FILE% ps
                '''

            }
        }

    }

    post {

        success {
            echo 'Stationery Management System deployed successfully.'
        }

        failure {
            echo 'Deployment failed. Check Jenkins logs.'
        }

        always {

            bat 'docker images'

            bat 'docker ps -a'

        }

    }

}