# Data-Whisperer

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Data-Whisperer is an intelligent data management and analysis platform that leverages the power of Google's Gemini AI to provide natural language interaction with your databases. It enables users to query, analyze, and understand their data through simple conversations, making data analysis accessible to both technical and non-technical users.

## ✨ Features

- **Natural Language to SQL**: Convert plain English questions into SQL queries
- **Data Visualization**: Interactive data exploration and visualization
- **AI-Powered Insights**: Get explanations and insights about your data using Gemini AI
- **Multi-Table Support**: Work with multiple database tables simultaneously
- **Vector Search**: Advanced semantic search capabilities using vector embeddings
- **Real-time Collaboration**: Share and collaborate on data analysis with team members
- **Secure Authentication**: Built-in user authentication and authorization
- **RESTful API**: Comprehensive API for integration with other tools and services

## 🚀 Tech Stack

- **Frontend**: React, TypeScript, Vite
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with pgvector for vector embeddings
- **AI/ML**: Google Gemini AI for natural language processing
- **Authentication**: JWT-based authentication
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite
- **Package Manager**: npm

## 🛠️ Prerequisites

- Node.js 18+ (LTS recommended)
- PostgreSQL 14+
- npm 9+ or yarn
- Google Gemini API key

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/data-whisperer.git
cd data-whisperer
```

### 2. Install Dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DATABASE_URL="postgresql://user:password@localhost:5432/data_whisperer?schema=public"

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 4. Set Up Database

1. Create a new PostgreSQL database
2. Enable the pgvector extension:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run database migrations:
   ```bash
   cd server
   npx prisma migrate dev
   ```

### 5. Start the Application

#### Development Mode

Start the backend and frontend in separate terminals:

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
cd client
npm run dev
```

#### Production Mode

```bash
# Build frontend
cd client
npm run build

# Start production server
cd ../server
npm run build
npm start
```

## 📚 Project Structure

```bash
data-whisperer/
├── client/                 # Frontend React application
│   ├── public/            # Static files
│   └── src/               # Source files
│       ├── components/    # Reusable components
│       ├── pages/         # Page components
│       ├── services/      # API services
│       └── App.tsx        # Main App component
│
├── server/                # Backend server
│   ├── prisma/           # Prisma schema and migrations
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── index.ts          # Server entry point
│
├── .env                  # Environment variables
├── .gitignore           # Git ignore file
└── package.json         # Project configuration
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Node environment | `development` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `GEMINI_API_KEY` | Google Gemini API key | - |
| `JWT_SECRET` | Secret for JWT token signing | - |
| `JWT_EXPIRES_IN` | JWT token expiration time | `7d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🚀 Usage

### Web Interface

1. Open your browser and navigate to `http://localhost:3000`
2. Sign up or log in to your account
3. Connect to your database or upload a CSV file
4. Start asking questions about your data in natural language

### API Endpoints

#### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info

#### Tables

- `GET /api/tables` - List all tables
- `POST /api/tables` - Create a new table
- `GET /api/tables/:id` - Get table details
- `DELETE /api/tables/:id` - Delete a table

#### Data

- `GET /api/data/:table` - Get table data
- `POST /api/data/:table` - Add data to table
- `PUT /api/data/:table/:id` - Update data
- `DELETE /api/data/:table/:id` - Delete data

#### Chat

- `POST /api/chat` - Send a message to the AI assistant

## 🤖 AI Capabilities

### Natural Language to SQL

Convert natural language questions into SQL queries:

> **User:** Show me the top 10 customers by total purchases
>
> **Data-Whisperer:** 
> ```sql
> SELECT customer_name, SUM(amount) as total_purchases
> FROM orders
> GROUP BY customer_name
> ORDER BY total_purchases DESC
> LIMIT 10;
> ```

### Data Visualization

Automatically generate visualizations based on your queries:

> **User:** Show me a bar chart of monthly sales
>
> **Data-Whisperer:** [Generates and displays a bar chart]

### Data Explanation

Get explanations about your data and queries:

> **User:** Why did sales drop in Q3?
>
> **Data-Whisperer:** Based on the data, sales dropped by 15% in Q3 due to a decrease in the Electronics category, which accounts for 60% of total sales. This aligns with the annual product refresh cycle where customers typically delay purchases before new models are released.

## 🔒 Security

- All sensitive data is encrypted at rest and in transit
- Role-based access control (RBAC) for user permissions
- Rate limiting on API endpoints
- Input validation and sanitization
- CORS configuration for frontend-backend communication

## 📈 Performance

- Optimized database queries with proper indexing
- Caching layer for frequently accessed data
- Efficient vector search with pgvector
- Asynchronous processing for long-running tasks

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Google Gemini AI](https://ai.google.dev/) - For the powerful AI models
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js
- [Vite](https://vitejs.dev/) - Next Generation Frontend Tooling
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components

## 📧 Contact

For questions or support, please contact [your-email@example.com](mailto:your-email@example.com)

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/f854a8c2-8b46-4416-8ec3-09272d54f500) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/f854a8c2-8b46-4416-8ec3-09272d54f500) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
