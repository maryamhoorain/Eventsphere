# EventSphere 🎫

EventSphere is a full-stack event management platform designed to make it easy for users to discover, explore, and manage events through a modern web application.

The project is being developed using the **MERN stack**, with a separate frontend and backend architecture.

## 🚀 Features

* 🔐 User authentication and authorization
* 📅 Browse and discover events
* 🔎 Search and filter events
* 📝 Create and manage events
* 🎟️ Event registration
* 👤 User profile management
* 📊 Event management dashboard
* 🔔 Event-related notifications
* 📱 Responsive and user-friendly interface

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* React Router

### Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* REST API

### Development Tools

* Git & GitHub
* Visual Studio Code
* MongoDB Atlas
* Postman

## 📁 Project Structure

```text
EventSphere/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── server.mjs
│   └── package.json
│
└── README.md
```

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/EventSphere.git
cd EventSphere
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Start the backend server:

```bash
npm run dev
```

The backend will run on:

```text
http://localhost:5000
```

### 3. Setup Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on the Vite development server.

## 🔗 API

The backend provides RESTful APIs for handling:

* Authentication
* Users
* Events
* Event registrations
* Event management

API endpoints are organized using Express routes and controllers.

## 👥 Team

EventSphere is a collaborative project.

* **Backend:** [Your Name]
* **Frontend:** [Teammate Name]

## 🎯 Project Goals

The main goal of EventSphere is to provide a centralized platform where users can easily discover events and interact with event-related services while providing organizers with tools to manage their events.

## 🔮 Future Improvements

* Online ticket payments
* Event reminders
* Email notifications
* Advanced event analytics
* Organizer verification
* Location and map integration
* Admin dashboard
* Improved event recommendation system

## 📌 Project Status

🚧 **Currently in development**

New features and improvements are being added progressively.

## 📄 License

This project is created for educational and development purposes.
