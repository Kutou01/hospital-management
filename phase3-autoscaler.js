// ============================================================================
// PHASE 3.4: AUTO-SCALING CONTROLLER
// Hospital Management System - Performance & Scalability
// ============================================================================
// This file implements intelligent auto-scaling for hospital services

const Docker = require('dockerode');
const axios = require('axios');
const EventEmitter = require('events');

// ============================================================================
// 1. HOSPITAL AUTO-SCALER
// ============================================================================

class HospitalAutoScaler extends EventEmitter {
    constructor(config = {}) {
        super();
        
        this.config = {
            prometheusUrl: config.prometheusUrl || 'http://prometheus:9090',
            scaleUpThreshold: config.scaleUpThreshold || 80,
            scaleDownThreshold: config.scaleDownThreshold || 30,
            minReplicas: config.minReplicas || 2,
            maxReplicas: config.maxReplicas || 10,
            checkInterval: config.checkInterval || 60000, // 1 minute
            cooldownPeriod: config.cooldownPeriod || 300000, // 5 minutes
            scaleUpCooldown: config.scaleUpCooldown || 180000, // 3 minutes
            scaleDownCooldown: config.scaleDownCooldown || 600000, // 10 minutes
            ...config
        };

        this.docker = new Docker({ socketPath: '/var/run/docker.sock' });
        this.lastScaleAction = null;
        this.lastScaleTime = 0;
        this.metrics = {
            totalScaleUps: 0,
            totalScaleDowns: 0,
            currentReplicas: 0,
            averageCpuUsage: 0,
            averageMemoryUsage: 0,
            averageResponseTime: 0,
            activeConnections: 0
        };

        this.services = new Map();
        this.setupServices();
        this.startMonitoring();
    }

    setupServices() {
        // Define scalable services
        this.services.set('hospital-app', {
            name: 'hospital-app',
            image: 'hospital-management:latest',
            minReplicas: this.config.minReplicas,
            maxReplicas: this.config.maxReplicas,
            currentReplicas: 0,
            targetReplicas: 0,
            ports: [3000],
            environment: [
                'NODE_ENV=production',
                'REDIS_HOST=redis-cluster',
                'DATABASE_URL=${DATABASE_URL}'
            ],
            networks: ['hospital-network'],
            healthCheck: '/health',
            metrics: {
                cpuThreshold: 80,
                memoryThreshold: 85,
                responseTimeThreshold: 2000,
                connectionThreshold: 1000
            }
        });

        this.services.set('hospital-api-gateway', {
            name: 'hospital-api-gateway',
            image: 'hospital-api-gateway:latest',
            minReplicas: 2,
            maxReplicas: 6,
            currentReplicas: 0,
            targetReplicas: 0,
            ports: [3100],
            environment: [
                'NODE_ENV=production',
                'REDIS_HOST=redis-cluster'
            ],
            networks: ['hospital-network'],
            healthCheck: '/api/health',
            metrics: {
                cpuThreshold: 75,
                memoryThreshold: 80,
                responseTimeThreshold: 1000,
                connectionThreshold: 2000
            }
        });

        this.services.set('hospital-graphql', {
            name: 'hospital-graphql',
            image: 'hospital-graphql:latest',
            minReplicas: 2,
            maxReplicas: 4,
            currentReplicas: 0,
            targetReplicas: 0,
            ports: [3200],
            environment: [
                'NODE_ENV=production',
                'REDIS_HOST=redis-cluster'
            ],
            networks: ['hospital-network'],
            healthCheck: '/graphql/health',
            metrics: {
                cpuThreshold: 70,
                memoryThreshold: 75,
                responseTimeThreshold: 500,
                connectionThreshold: 500
            }
        });
    }

    // ============================================================================
    // 2. MONITORING AND METRICS COLLECTION
    // ============================================================================

    startMonitoring() {
        console.log('🔍 Starting Hospital Auto-Scaler monitoring...');
        
        // Initial service discovery
        this.discoverServices();
        
        // Start monitoring loop
        this.monitoringInterval = setInterval(() => {
            this.checkAndScale();
        }, this.config.checkInterval);

        // Health check interval
        this.healthCheckInterval = setInterval(() => {
            this.performHealthChecks();
        }, 30000); // 30 seconds
    }

    async discoverServices() {
        try {
            const containers = await this.docker.listContainers({ all: false });
            
            for (const [serviceName, serviceConfig] of this.services) {
                const serviceContainers = containers.filter(container => 
                    container.Names.some(name => name.includes(serviceName))
                );
                
                serviceConfig.currentReplicas = serviceContainers.length;
                serviceConfig.containers = serviceContainers;
                
                console.log(`📊 Discovered ${serviceContainers.length} replicas for ${serviceName}`);
            }
        } catch (error) {
            console.error('Service discovery error:', error);
        }
    }

    async checkAndScale() {
        try {
            console.log('🔍 Checking scaling conditions...');
            
            // Collect metrics from Prometheus
            const metrics = await this.collectMetrics();
            
            // Check each service for scaling needs
            for (const [serviceName, serviceConfig] of this.services) {
                const serviceMetrics = metrics[serviceName] || {};
                const scalingDecision = this.makeScalingDecision(serviceConfig, serviceMetrics);
                
                if (scalingDecision.action !== 'none') {
                    await this.executeScaling(serviceName, scalingDecision);
                }
            }
            
        } catch (error) {
            console.error('Auto-scaling check error:', error);
        }
    }

    async collectMetrics() {
        try {
            const metrics = {};
            
            // CPU usage query
            const cpuQuery = 'avg by (service) (rate(container_cpu_usage_seconds_total[5m]) * 100)';
            const cpuResponse = await axios.get(`${this.config.prometheusUrl}/api/v1/query`, {
                params: { query: cpuQuery }
            });

            // Memory usage query
            const memoryQuery = 'avg by (service) (container_memory_usage_bytes / container_spec_memory_limit_bytes * 100)';
            const memoryResponse = await axios.get(`${this.config.prometheusUrl}/api/v1/query`, {
                params: { query: memoryQuery }
            });

            // Response time query
            const responseTimeQuery = 'avg by (service) (http_request_duration_seconds{quantile="0.95"} * 1000)';
            const responseTimeResponse = await axios.get(`${this.config.prometheusUrl}/api/v1/query`, {
                params: { query: responseTimeQuery }
            });

            // Active connections query
            const connectionsQuery = 'sum by (service) (nginx_http_connections_active)';
            const connectionsResponse = await axios.get(`${this.config.prometheusUrl}/api/v1/query`, {
                params: { query: connectionsQuery }
            });

            // Process CPU metrics
            if (cpuResponse.data.status === 'success') {
                cpuResponse.data.data.result.forEach(result => {
                    const service = result.metric.service;
                    if (!metrics[service]) metrics[service] = {};
                    metrics[service].cpu = parseFloat(result.value[1]);
                });
            }

            // Process Memory metrics
            if (memoryResponse.data.status === 'success') {
                memoryResponse.data.data.result.forEach(result => {
                    const service = result.metric.service;
                    if (!metrics[service]) metrics[service] = {};
                    metrics[service].memory = parseFloat(result.value[1]);
                });
            }

            // Process Response Time metrics
            if (responseTimeResponse.data.status === 'success') {
                responseTimeResponse.data.data.result.forEach(result => {
                    const service = result.metric.service;
                    if (!metrics[service]) metrics[service] = {};
                    metrics[service].responseTime = parseFloat(result.value[1]);
                });
            }

            // Process Connections metrics
            if (connectionsResponse.data.status === 'success') {
                connectionsResponse.data.data.result.forEach(result => {
                    const service = result.metric.service;
                    if (!metrics[service]) metrics[service] = {};
                    metrics[service].connections = parseFloat(result.value[1]);
                });
            }

            return metrics;
        } catch (error) {
            console.error('Metrics collection error:', error);
            return {};
        }
    }

    // ============================================================================
    // 3. SCALING DECISION ENGINE
    // ============================================================================

    makeScalingDecision(serviceConfig, metrics) {
        const {
            currentReplicas,
            minReplicas,
            maxReplicas,
            metrics: thresholds
        } = serviceConfig;

        const {
            cpu = 0,
            memory = 0,
            responseTime = 0,
            connections = 0
        } = metrics;

        // Check cooldown period
        const now = Date.now();
        const timeSinceLastScale = now - this.lastScaleTime;

        // Scale up conditions
        const shouldScaleUp = (
            (cpu > thresholds.cpuThreshold ||
             memory > thresholds.memoryThreshold ||
             responseTime > thresholds.responseTimeThreshold ||
             connections > thresholds.connectionThreshold) &&
            currentReplicas < maxReplicas &&
            timeSinceLastScale > this.config.scaleUpCooldown
        );

        // Scale down conditions
        const shouldScaleDown = (
            cpu < this.config.scaleDownThreshold &&
            memory < this.config.scaleDownThreshold &&
            responseTime < (thresholds.responseTimeThreshold * 0.5) &&
            connections < (thresholds.connectionThreshold * 0.5) &&
            currentReplicas > minReplicas &&
            timeSinceLastScale > this.config.scaleDownCooldown
        );

        if (shouldScaleUp) {
            const targetReplicas = Math.min(currentReplicas + 1, maxReplicas);
            return {
                action: 'scale_up',
                currentReplicas,
                targetReplicas,
                reason: `High resource usage - CPU: ${cpu.toFixed(1)}%, Memory: ${memory.toFixed(1)}%, RT: ${responseTime.toFixed(0)}ms`
            };
        }

        if (shouldScaleDown) {
            const targetReplicas = Math.max(currentReplicas - 1, minReplicas);
            return {
                action: 'scale_down',
                currentReplicas,
                targetReplicas,
                reason: `Low resource usage - CPU: ${cpu.toFixed(1)}%, Memory: ${memory.toFixed(1)}%`
            };
        }

        return {
            action: 'none',
            currentReplicas,
            targetReplicas: currentReplicas,
            reason: 'Metrics within normal range'
        };
    }

    // ============================================================================
    // 4. SCALING EXECUTION
    // ============================================================================

    async executeScaling(serviceName, decision) {
        const serviceConfig = this.services.get(serviceName);
        const { action, currentReplicas, targetReplicas, reason } = decision;

        console.log(`🚀 Scaling ${serviceName}: ${action} from ${currentReplicas} to ${targetReplicas} replicas`);
        console.log(`📋 Reason: ${reason}`);

        try {
            if (action === 'scale_up') {
                await this.scaleUp(serviceName, serviceConfig, targetReplicas);
                this.metrics.totalScaleUps++;
            } else if (action === 'scale_down') {
                await this.scaleDown(serviceName, serviceConfig, targetReplicas);
                this.metrics.totalScaleDowns++;
            }

            // Update last scale time and action
            this.lastScaleTime = Date.now();
            this.lastScaleAction = action;

            // Update service config
            serviceConfig.currentReplicas = targetReplicas;
            serviceConfig.targetReplicas = targetReplicas;

            // Emit scaling event
            this.emit('scaling_completed', {
                service: serviceName,
                action,
                currentReplicas: targetReplicas,
                reason,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error(`Scaling execution error for ${serviceName}:`, error);
            
            this.emit('scaling_error', {
                service: serviceName,
                action,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    async scaleUp(serviceName, serviceConfig, targetReplicas) {
        const replicasToAdd = targetReplicas - serviceConfig.currentReplicas;
        
        for (let i = 0; i < replicasToAdd; i++) {
            const containerName = `${serviceName}-${Date.now()}-${i}`;
            
            const containerConfig = {
                Image: serviceConfig.image,
                name: containerName,
                Env: serviceConfig.environment,
                ExposedPorts: {},
                HostConfig: {
                    NetworkMode: serviceConfig.networks[0],
                    RestartPolicy: { Name: 'unless-stopped' },
                    Memory: 1024 * 1024 * 1024, // 1GB
                    CpuShares: 1024
                }
            };

            // Configure exposed ports
            serviceConfig.ports.forEach(port => {
                containerConfig.ExposedPorts[`${port}/tcp`] = {};
            });

            // Create and start container
            const container = await this.docker.createContainer(containerConfig);
            await container.start();

            console.log(`✅ Created new container: ${containerName}`);
        }

        // Wait for containers to be healthy
        await this.waitForHealthy(serviceName, targetReplicas);
    }

    async scaleDown(serviceName, serviceConfig, targetReplicas) {
        const replicasToRemove = serviceConfig.currentReplicas - targetReplicas;
        const containers = await this.getServiceContainers(serviceName);
        
        // Sort containers by creation time (remove newest first)
        containers.sort((a, b) => b.Created - a.Created);
        
        for (let i = 0; i < replicasToRemove && i < containers.length; i++) {
            const container = this.docker.getContainer(containers[i].Id);
            
            try {
                // Graceful shutdown
                await container.stop({ t: 30 }); // 30 second timeout
                await container.remove();
                
                console.log(`🗑️ Removed container: ${containers[i].Names[0]}`);
            } catch (error) {
                console.error(`Error removing container ${containers[i].Names[0]}:`, error);
            }
        }
    }

    async getServiceContainers(serviceName) {
        const containers = await this.docker.listContainers({ all: false });
        return containers.filter(container => 
            container.Names.some(name => name.includes(serviceName))
        );
    }

    async waitForHealthy(serviceName, expectedReplicas, timeout = 120000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const containers = await this.getServiceContainers(serviceName);
            const healthyContainers = await this.checkContainerHealth(containers);
            
            if (healthyContainers >= expectedReplicas) {
                console.log(`✅ All ${expectedReplicas} replicas of ${serviceName} are healthy`);
                return true;
            }
            
            console.log(`⏳ Waiting for ${serviceName} replicas to be healthy: ${healthyContainers}/${expectedReplicas}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        throw new Error(`Timeout waiting for ${serviceName} replicas to be healthy`);
    }

    async checkContainerHealth(containers) {
        let healthyCount = 0;
        
        for (const containerInfo of containers) {
            try {
                const container = this.docker.getContainer(containerInfo.Id);
                const inspect = await container.inspect();
                
                if (inspect.State.Health && inspect.State.Health.Status === 'healthy') {
                    healthyCount++;
                } else if (!inspect.State.Health && inspect.State.Running) {
                    // If no health check defined, consider running containers as healthy
                    healthyCount++;
                }
            } catch (error) {
                console.error(`Health check error for container ${containerInfo.Names[0]}:`, error);
            }
        }
        
        return healthyCount;
    }

    // ============================================================================
    // 5. HEALTH CHECKS AND MONITORING
    // ============================================================================

    async performHealthChecks() {
        for (const [serviceName, serviceConfig] of this.services) {
            try {
                const containers = await this.getServiceContainers(serviceName);
                const healthyContainers = await this.checkContainerHealth(containers);
                
                serviceConfig.currentReplicas = containers.length;
                serviceConfig.healthyReplicas = healthyContainers;
                
                if (healthyContainers < serviceConfig.minReplicas) {
                    console.warn(`⚠️ ${serviceName} has only ${healthyContainers} healthy replicas (min: ${serviceConfig.minReplicas})`);
                    
                    this.emit('health_warning', {
                        service: serviceName,
                        healthyReplicas: healthyContainers,
                        minReplicas: serviceConfig.minReplicas,
                        timestamp: new Date().toISOString()
                    });
                }
            } catch (error) {
                console.error(`Health check error for ${serviceName}:`, error);
            }
        }
    }

    // ============================================================================
    // 6. UTILITY METHODS
    // ============================================================================

    getMetrics() {
        return {
            ...this.metrics,
            services: Object.fromEntries(
                Array.from(this.services.entries()).map(([name, config]) => [
                    name,
                    {
                        currentReplicas: config.currentReplicas,
                        targetReplicas: config.targetReplicas,
                        minReplicas: config.minReplicas,
                        maxReplicas: config.maxReplicas,
                        healthyReplicas: config.healthyReplicas || 0
                    }
                ])
            ),
            lastScaleAction: this.lastScaleAction,
            lastScaleTime: this.lastScaleTime
        };
    }

    async getDetailedStatus() {
        const status = {
            autoscaler: {
                running: true,
                config: this.config,
                metrics: this.getMetrics()
            },
            services: {}
        };

        for (const [serviceName, serviceConfig] of this.services) {
            const containers = await this.getServiceContainers(serviceName);
            const healthyContainers = await this.checkContainerHealth(containers);
            
            status.services[serviceName] = {
                ...serviceConfig,
                containers: containers.map(c => ({
                    id: c.Id.substring(0, 12),
                    name: c.Names[0],
                    status: c.Status,
                    created: new Date(c.Created * 1000).toISOString()
                })),
                healthyReplicas: healthyContainers
            };
        }

        return status;
    }

    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        console.log('🛑 Hospital Auto-Scaler stopped');
    }
}

// ============================================================================
// 7. EXPORT MODULE
// ============================================================================

module.exports = { HospitalAutoScaler };
