# Project AURA - Deployment Guide

## 🚀 Quick Start (Development)

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- 4GB RAM minimum
- Modern web browser

### Installation Steps

1. **Clone or Download the Repository**
   ```bash
   cd project-aura
   ```

2. **Run Comprehensive Setup**
   ```bash
   python scripts/comprehensive_setup.py
   ```
   
   This will:
   - Check Python version
   - Install all dependencies
   - Create directory structure
   - Initialize database
   - Generate demo data
   - Configure the system
   - Run tests
   - Create documentation

3. **Start the Application**
   ```bash
   python start_aura.py
   ```
   
   Or manually:
   ```bash
   streamlit run app.py
   ```

4. **Access the Application**
   - Open browser to: http://localhost:8501
   - Login with: `admin` / `admin123`

---

## 🏥 Production Deployment

### Option 1: Docker Deployment (Recommended)

1. **Create Dockerfile**
   ```dockerfile
   FROM python:3.10-slim
   
   WORKDIR /app
   
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   
   COPY . .
   
   EXPOSE 8501
   
   CMD ["streamlit", "run", "app.py", "--server.port=8501", "--server.address=0.0.0.0"]
   ```

2. **Build and Run**
   ```bash
   docker build -t project-aura .
   docker run -p 8501:8501 -v $(pwd)/data:/app/data project-aura
   ```

### Option 2: Cloud Deployment (Streamlit Cloud)

1. **Push to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Deploy on Streamlit Cloud**
   - Go to https://streamlit.io/cloud
   - Connect your GitHub repository
   - Select `app.py` as the main file
   - Deploy!

### Option 3: AWS Deployment

1. **EC2 Instance Setup**
   ```bash
   # SSH into EC2 instance
   ssh -i your-key.pem ubuntu@your-instance-ip
   
   # Install dependencies
   sudo apt update
   sudo apt install python3-pip
   
   # Clone repository
   git clone <your-repo-url>
   cd project-aura
   
   # Setup
   python3 scripts/comprehensive_setup.py
   
   # Run with nohup
   nohup streamlit run app.py --server.port=8501 &
   ```

2. **Configure Security Group**
   - Allow inbound traffic on port 8501
   - Restrict to specific IPs for security

### Option 4: Heroku Deployment

1. **Create Procfile**
   ```
   web: streamlit run app.py --server.port=$PORT --server.address=0.0.0.0
   ```

2. **Deploy**
   ```bash
   heroku create your-app-name
   git push heroku main
   ```

---

## 🔒 Security Configuration

### Production Security Checklist

- [ ] Change default passwords
- [ ] Enable HTTPS/SSL
- [ ] Configure firewall rules
- [ ] Set up database backups
- [ ] Enable audit logging
- [ ] Configure session timeouts
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts

### Environment Variables

Create `.env` file:
```env
# Database
DATABASE_URL=sqlite:///aura.db

# Security
SECRET_KEY=your-secure-random-key-here
SESSION_TIMEOUT=3600

# Features
ENABLE_DEMO_MODE=False
ENABLE_REGISTRATION=False

# Email (for notifications)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@example.com
SMTP_PASSWORD=your-app-password

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=INFO
```

---

## 📊 Database Configuration

### SQLite (Default - Development)
- File-based database
- No additional setup required
- Located at: `aura.db`

### PostgreSQL (Production Recommended)

1. **Install PostgreSQL**
   ```bash
   sudo apt install postgresql postgresql-contrib
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE aura_db;
   CREATE USER aura_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE aura_db TO aura_user;
   ```

3. **Update Configuration**
   ```python
   # In src/db.py, change connection string:
   DATABASE_URL = "postgresql://aura_user:secure_password@localhost/aura_db"
   ```

### MySQL (Alternative)

1. **Install MySQL**
   ```bash
   sudo apt install mysql-server
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE aura_db;
   CREATE USER 'aura_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON aura_db.* TO 'aura_user'@'localhost';
   ```

3. **Update Configuration**
   ```python
   DATABASE_URL = "mysql://aura_user:secure_password@localhost/aura_db"
   ```

---

## 🔧 System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 10GB
- **OS**: Linux, macOS, or Windows

### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB SSD
- **OS**: Ubuntu 20.04 LTS or newer

### Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📈 Performance Optimization

### Application Optimization

1. **Enable Caching**
   ```python
   # In app.py
   @st.cache_data
   def load_data():
       # Your data loading code
       pass
   ```

2. **Database Indexing**
   ```sql
   CREATE INDEX idx_patient_id ON patients(patient_id);
   CREATE INDEX idx_timestamp ON vitals(timestamp);
   ```

3. **Configure Streamlit**
   ```toml
   # .streamlit/config.toml
   [server]
   maxUploadSize = 200
   enableCORS = false
   enableXsrfProtection = true
   
   [browser]
   gatherUsageStats = false
   
   [runner]
   fastReruns = true
   ```

### Server Optimization

1. **Use Nginx as Reverse Proxy**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:8501;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
       }
   }
   ```

2. **Enable Gzip Compression**
   ```nginx
   gzip on;
   gzip_types text/plain text/css application/json application/javascript;
   ```

---

## 🔍 Monitoring & Logging

### Application Monitoring

1. **Enable Logging**
   ```python
   # In app.py
   import logging
   
   logging.basicConfig(
       filename='logs/app.log',
       level=logging.INFO,
       format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
   )
   ```

2. **Health Check Endpoint**
   ```python
   # Create health_check.py
   def check_health():
       return {
           "status": "healthy",
           "database": check_db_connection(),
           "timestamp": datetime.now().isoformat()
       }
   ```

### System Monitoring

1. **Install Monitoring Tools**
   ```bash
   # Install htop for system monitoring
   sudo apt install htop
   
   # Install monitoring agent (e.g., Datadog, New Relic)
   ```

2. **Set Up Alerts**
   - CPU usage > 80%
   - Memory usage > 90%
   - Disk space < 10%
   - Application errors
   - Database connection failures

---

## 🔄 Backup & Recovery

### Automated Backups

1. **Database Backup Script**
   ```bash
   #!/bin/bash
   # backup.sh
   
   BACKUP_DIR="/backups"
   DATE=$(date +%Y%m%d_%H%M%S)
   
   # Backup database
   cp aura.db "$BACKUP_DIR/aura_db_$DATE.db"
   
   # Backup data directory
   tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" data/
   
   # Keep only last 30 days
   find $BACKUP_DIR -name "*.db" -mtime +30 -delete
   find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete
   ```

2. **Schedule with Cron**
   ```bash
   # Run daily at 2 AM
   0 2 * * * /path/to/backup.sh
   ```

### Recovery Procedure

1. **Restore Database**
   ```bash
   cp /backups/aura_db_YYYYMMDD_HHMMSS.db aura.db
   ```

2. **Restore Data**
   ```bash
   tar -xzf /backups/data_YYYYMMDD_HHMMSS.tar.gz
   ```

---

## 🧪 Testing in Production

### Smoke Tests

```bash
# Run smoke tests
python -m pytest tests/test_smoke.py -v

# Check database connectivity
python scripts/check_db.py

# Verify all pages load
python scripts/verify_pages.py
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load test
locust -f tests/load_test.py --host=http://localhost:8501
```

---

## 📞 Support & Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Find process using port 8501
   lsof -i :8501
   
   # Kill process
   kill -9 <PID>
   ```

2. **Database Locked**
   ```bash
   # Close all connections and restart
   rm aura.db-journal
   python scripts/comprehensive_setup.py
   ```

3. **Module Import Errors**
   ```bash
   # Reinstall dependencies
   pip install -r requirements.txt --force-reinstall
   ```

### Getting Help

- **Documentation**: Check README.md and USER_GUIDE.md
- **Logs**: Review logs in `logs/` directory
- **Diagnostics**: Run `python scripts/diagnose.py`
- **Community**: Open an issue on GitHub

---

## 📋 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Documentation updated

### Deployment
- [ ] Environment variables set
- [ ] Database migrated
- [ ] SSL certificates installed
- [ ] Firewall configured
- [ ] Application deployed
- [ ] Health checks passing

### Post-Deployment
- [ ] Smoke tests completed
- [ ] User acceptance testing
- [ ] Performance monitoring active
- [ ] Backup verification
- [ ] Team training completed
- [ ] Documentation distributed

---

## 🎯 Next Steps

1. **Customize Configuration**
   - Update branding and logos
   - Configure email notifications
   - Set up user roles and permissions

2. **Integrate with Existing Systems**
   - EHR integration
   - Pharmacy systems
   - Billing systems

3. **Train Users**
   - Conduct training sessions
   - Provide user documentation
   - Set up support channels

4. **Monitor and Optimize**
   - Track usage metrics
   - Gather user feedback
   - Implement improvements

---

**Project AURA** - Deployed with care 💙

For questions or support, contact your system administrator.
