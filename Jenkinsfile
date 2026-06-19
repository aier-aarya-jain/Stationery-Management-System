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

        stage('Clean Workspace') {
            steps {
                bat '''
                if exist backend\\config-server\\target rmdir /s /q backend\\config-server\\target
                if exist backend\\api-gateway\\target rmdir /s /q backend\\api-gateway\\target
                if exist backend\\eureka-server\\target rmdir /s /q backend\\eureka-server\\target
                if exist backend\\auth-service\\target rmdir /s /q backend\\auth-service\\target
                if exist backend\\inventory-service\\target rmdir /s /q backend\\inventory-service\\target
                if exist backend\\request-service\\target rmdir /s /q backend\\request-service\\target
                '''
            }
        }

        stage('Build Jars') {
            steps {
                dir('backend') {

                    bat '''
                    docker run --rm ^
                    -v "%CD%":/usr/src/app ^
                    -w /usr/src/app ^
                    maven:3.8.5-openjdk-17 ^
                    mvn package -DskipTests -Dmaven.clean.failOnError=false
                    '''
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