pipeline {
    agent any

    tools {
        jdk 'jdk17'
        maven 'maven3'
    }

    options {
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
        timeout(time: 30, unit: 'MINUTES')
    }

    parameters {
        booleanParam(
            name: 'RUN_SONARQUBE',
            defaultValue: false,
            description: 'Run SonarQube analysis after the Maven build and tests succeed.'
        )
        booleanParam(
            name: 'DEPLOY_APP',
            defaultValue: false,
            description: 'Deploy with Docker Compose after a successful build on main/master.'
        )
    }

    environment {
        SONARQUBE_SERVER = 'sonarqube'
        MAVEN_ARGS = '-B -ntp'
        COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Toolchain') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'java -version'
                        sh 'mvn -version'
                    } else {
                        bat 'java -version'
                        bat 'mvn -version'
                    }
                }
            }
        }

        stage('Backend Build And Test') {
            steps {
                dir('backend') {
                    script {
                        if (isUnix()) {
                            sh "mvn ${env.MAVEN_ARGS} clean verify"
                        } else {
                            bat "mvn ${env.MAVEN_ARGS} clean verify"
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            when {
                expression { params.RUN_SONARQUBE }
            }
            steps {
                withSonarQubeEnv("${env.SONARQUBE_SERVER}") {
                    dir('backend') {
                        script {
                            def sonarCmd =
                                "mvn ${env.MAVEN_ARGS} sonar:sonar " +
                                "-Dsonar.projectKey=stationery-management " +
                                "-Dsonar.projectName=\"Stationery Management System\""

                            if (isUnix()) {
                                sh sonarCmd
                            } else {
                                bat sonarCmd
                            }
                        }
                    }
                }
            }
        }

        stage('Quality Gate') {
            when {
                expression { params.RUN_SONARQUBE }
            }
            steps {
                timeout(time: 10, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Deploy With Docker Compose') {
            when {
                expression {
                    params.DEPLOY_APP &&
                    !env.CHANGE_ID &&
                    (!env.BRANCH_NAME || env.BRANCH_NAME in ['main', 'master'])
                }
            }
            steps {
                script {
                    if (isUnix()) {
                        sh "docker compose -f ${env.COMPOSE_FILE} down --remove-orphans"
                        sh "docker compose -f ${env.COMPOSE_FILE} up -d --build"
                    } else {
                        bat "docker compose -f ${env.COMPOSE_FILE} down --remove-orphans"
                        bat "docker compose -f ${env.COMPOSE_FILE} up -d --build"
                    }
                }
            }
        }
    }

    post {
        always {
            junit(
                allowEmptyResults: true,
                testResults: 'backend/**/target/surefire-reports/*.xml,backend/**/target/failsafe-reports/*.xml'
            )
            archiveArtifacts(
                allowEmptyArchive: true,
                artifacts: 'backend/**/target/*.jar',
                excludes: 'backend/**/target/*.jar.original',
                fingerprint: true
            )
        }
        success {
            echo 'Pipeline completed successfully.'
        }
        failure {
            echo 'Pipeline failed. Check the first failed stage for the root cause.'
        }
    }
}
