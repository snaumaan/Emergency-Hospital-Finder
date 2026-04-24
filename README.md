# MediQ

MediQ is a full-stack healthcare appointment and hospital management platform designed for patients and hospitals. It enables smart hospital discovery, appointment booking with token queues, emergency profile management, and hospital-side operational dashboards.

## Features

## Patient Portal

* Secure registration and login
* Search hospitals by name, area, city, or specialization
* Book appointments with token generation
* View appointment history and statuses
* Manage emergency medical profile
* Quick emergency access flow

## Hospital Portal

* Secure hospital registration and login
* Dashboard with daily stats
* Manage appointments and update statuses
* Live token queue view
* Bed availability management
* Department management
* ER open/closed toggle

## Core System Features

* JWT authentication
* Role-based access control
* MongoDB geolocation support
* Queue position and estimated wait time
* Password hashing with bcrypt
* REST API architecture

## Tech Stack

* Frontend: HTML, CSS, JavaScript
* Backend: Node.js, Express.js
* Database: MongoDB + Mongoose
* Auth: JSON Web Tokens (JWT)
* Security: bcryptjs

## Project Structure

```text
MediQ/
├── models/
├── routes/
├── middleware/
├── public/
│   ├── js/
│   ├── css/
│   └── *.html
├── utils/
├── .env
├── server.js
└── README.md
```

## Installation

### 1. Clone Repository

```bash
git clone <your-repo-url>
cd mediq
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the root folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```

### 4. Run Project

``` 
npm seed.js
npm server.js
``` 
  OR 
``` 
node seed.js
node index.js
```

## API Overview

### Patient Auth

* `POST /api/auth/patient/register`
* `POST /api/auth/patient/login`
* `GET /api/auth/patient/me`

### Hospital Auth

* `POST /api/auth/hospital/register`
* `POST /api/auth/hospital/login`
* `GET /api/auth/hospital/me`

### Appointments

* `POST /api/appointments`
* `GET /api/appointments/my`
* `GET /api/appointments/hospital`
* `PATCH /api/appointments/:id/status`
* `GET /api/appointments/queue/:hospitalId`

### Hospitals

* `GET /api/hospitals`
* `GET /api/hospitals/:id`
* `PUT /api/hospitals/beds/update`
* `GET /api/hospitals/dashboard/stats`

## Security Notes

* Never commit `.env`
* Use strong JWT secrets
* Use HTTPS in production
* Restrict CORS in deployment

## Future Enhancements

* Live maps integration
* Email / SMS notifications
* Real-time queue updates with Socket.IO
* Admin panel
* Payment gateway integration
* Doctor scheduling

## Author

Built as an academic / portfolio healthcare management project.

## License

MIT License
