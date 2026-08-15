// ------------------ JS PARTICLE ENGINE ------------------
        let particles = [];
        const cfgMaxParticles = document.getElementById('cfg-max-particles');
        const cfgParticleSpeed = document.getElementById('cfg-particle-speed');
        const cfgParticleLife = document.getElementById('cfg-particle-life');
        const cfgTrailLength = document.getElementById('cfg-trail-length');
        const cfgParticleTheme = document.getElementById('cfg-particle-theme');

        class Particle {
            constructor() {
                this.x = 0;
                this.y = 0;
                this.vx = 0;
                this.vy = 0;
                this.maxLife = 0;
                this.life = 0;
                this.size = 0;
                this.alpha = 0;
                this.theme = 'celestial';
                this.active = false;
            }

            reset(x, y, theme) {
                this.x = x;
                this.y = y;
                const speedCoeff = parseFloat(cfgParticleSpeed.value);
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 2 * speedCoeff;
                
                if (theme === 'sakura') {
                    this.vy = (Math.random() * 0.8 + 0.3) * speedCoeff;
                    this.vx = (Math.random() * 0.6 - 0.3) * speedCoeff;
                } else if (theme === 'ember') {
                    this.vy = -(Math.random() * 1.5 + 0.5) * speedCoeff;
                    this.vx = Math.cos(angle) * speed;
                } else if (theme === 'quantum') {
                    this.vx = (Math.random() * 0.4 - 0.2) * speedCoeff;
                    this.vy = (Math.random() * 0.4 - 0.2) * speedCoeff;
                } else {
                    this.vx = Math.cos(angle) * speed;
                    this.vy = Math.sin(angle) * speed;
                }

                this.maxLife = parseInt(cfgParticleLife.value);
                this.life = this.maxLife;
                this.size = Math.random() * 3 + 1;
                this.alpha = 1;
                this.theme = theme;
                this.active = true;
            }

            update(dt) {
                if (!this.active) return;
                this.x += this.vx;
                this.y += this.vy;
                
                if (this.theme === 'sakura') {
                    this.x += Math.sin(this.life / 150) * 0.5;
                } else if (this.theme === 'quantum') {
                    this.x += (Math.random() * 0.4 - 0.2);
                    this.y += (Math.random() * 0.4 - 0.2);
                }
                
                this.life -= dt;
                this.alpha = Math.max(0, this.life / this.maxLife);
                if (this.life <= 0) {
                    this.active = false;
                }
            }

            draw(ctx) {
                if (!this.active) return;
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                if (this.theme === 'celestial') {
                    ctx.fillStyle = '#a78bfa';
                    ctx.shadowBlur = 8;
                    ctx.shadowColor = '#8b5cf6';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.theme === 'plasma') {
                    ctx.fillStyle = '#22d3ee';
                    ctx.shadowBlur = 10;
                    ctx.shadowColor = '#06b6d4';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 1.2, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.theme === 'ember') {
                    ctx.fillStyle = '#f59e0b';
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.theme === 'frost') {
                    ctx.fillStyle = '#e2e8f0';
                    ctx.shadowBlur = 4;
                    ctx.shadowColor = '#3b82f6';
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size * 0.8, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.theme === 'sakura') {
                    ctx.fillStyle = '#fbcfe8';
                    ctx.shadowBlur = 6;
                    ctx.shadowColor = '#ec4899';
                    ctx.beginPath();
                    ctx.ellipse(this.x, this.y, this.size * 1.2, this.size * 0.7, Math.PI / 4, 0, Math.PI * 2);
                    ctx.fill();
                } else if (this.theme === 'quantum') {
                    ctx.fillStyle = '#34d399';
                    ctx.shadowBlur = 5;
                    ctx.shadowColor = '#10b981';
                    ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 1.5, this.size * 1.5);
                }
                ctx.restore();
            }
        }

        // Initialize pre-allocated Particle Pool
        const MAX_PARTICLES_BUDGET = 800;
        for (let i = 0; i < MAX_PARTICLES_BUDGET; i++) {
            particles.push(new Particle());
        }

        function createParticlesBurst(x, y, count=10) {
            const theme = cfgParticleTheme.value;
            const maxBudget = Math.min(MAX_PARTICLES_BUDGET, parseInt(cfgMaxParticles.value));
            
            let spawned = 0;
            // 1. Try to find inactive particles to activate
            for (let i = 0; i < particles.length; i++) {
                if (!particles[i].active && i < maxBudget) {
                    particles[i].reset(x, y, theme);
                    spawned++;
                    if (spawned >= count) return;
                }
            }
            // 2. If the active subset of the pool is completely full, we recycle active particles
            for (let i = 0; i < particles.length; i++) {
                if (particles[i].active && spawned < count && i < maxBudget) {
                    particles[i].reset(x, y, theme);
                    spawned++;
                }
            }
        }