CREATE DATABASE classroombooking;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Faculty',
    priority INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_number VARCHAR(50) UNIQUE NOT NULL,
    is_high_priority BOOLEAN DEFAULT FALSE,
    capacity INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Approved',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_slot CHECK (end_time>start_time)
);

CREATE TABLE reassignments (
    id SERIAL PRIMARY KEY,
    previous_booking_id INT REFERENCES bookings(id) ON DELETE CASCADE,
    new_user_id INT REFERENCES users(id) ON DELETE CASCADE,
    original_room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'Pending',
    new_room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
