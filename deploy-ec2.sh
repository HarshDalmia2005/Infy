#!/bin/bash
set -e

echo "🚀 Starting InfyBoard EC2 Deployment..."

# 1. Update system and install dependencies
echo "📦 Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg git

# 2. Install Docker if not installed
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    sudo systemctl enable docker
    sudo systemctl start docker
    # Add current user to docker group to run without sudo (takes effect next login)
    sudo usermod -aG docker $USER
    echo "✅ Docker installed successfully."
else
    echo "✅ Docker is already installed."
fi

# 3. Setup Environment Variables
if [ ! -f .env ]; then
    echo "🔐 Creating .env file..."
    cp .env.example .env
    
    # Generate a strong, random secret for NextAuth
    SECRET=$(openssl rand -base64 32)
    sed -i "s|NEXTAUTH_SECRET=.*|NEXTAUTH_SECRET=\"$SECRET\"|" .env
    
    # Attempt to automatically fetch the EC2 Public IP to set NEXTAUTH_URL
    echo "🔍 Fetching EC2 Public IP..."
    PUBLIC_IP=$(curl -s --max-time 3 http://169.254.169.254/latest/meta-data/public-ipv4 || echo "localhost")
    
    if [ "$PUBLIC_IP" != "localhost" ] && [ -n "$PUBLIC_IP" ]; then
        sed -i "s|NEXTAUTH_URL=.*|NEXTAUTH_URL=\"http://$PUBLIC_IP:3000\"|" .env
        echo "✅ NEXTAUTH_URL set to http://$PUBLIC_IP:3000"
    else
        echo "⚠️ Could not fetch EC2 IP (are you running this on EC2?). Defaulting to localhost."
    fi
else
    echo "✅ .env file already exists."
fi

# 4. Build and start containers
echo "🏗️ Building and starting Docker containers..."
sudo docker compose up --build -d

# 5. Initialize the database
echo "⏳ Waiting for database to initialize (15 seconds)..."
sleep 15
echo "🗄️ Pushing database schema..."
# -T disables pseudo-TTY allocation so it works in automated scripts
sudo docker compose exec -T app npx prisma db push

echo ""
echo "🎉 Deployment complete! InfyBoard is now running in production."
if [ "$PUBLIC_IP" != "" ] && [ "$PUBLIC_IP" != "localhost" ]; then
    echo "🌍 Access your app at: http://$PUBLIC_IP:3000"
    echo "⚠️  Ensure port 3000 is open in your EC2 Security Group inbound rules!"
else
    echo "🌍 Access your app at: http://localhost:3000"
fi
