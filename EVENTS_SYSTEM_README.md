# ReWear Events System

## Overview

The Events System allows organizers (orphanages, NGOs, old age homes) to create cloth donation events and donors to participate in them. All data is stored in Firebase with real-time updates.

## Features

### 🎉 Event Creation (Organizers)

- **No validation required** - organizers can create events freely
- **Complete form** with all required fields:
  - Event Name, Organizer Details, Location
  - Start/End Dates, Time, Registration Deadline
  - Event Description
  - Types of Clothes Needed (checkboxes)
  - Poster Upload (optional)
  - Trust Proof Upload (optional)

### 💚 Donor Participation

- **Simple popup form** with auto-filled donor information
- **Required fields**:
  - Number of Clothes
  - Cloth Type and Condition
  - Upload Photo(s) of Clothes
- **Auto-filled from user profile**:
  - Name, Email, Phone, Location, Date of Birth

### 🎨 UI Design

- **Pale Dark Blue Theme** (#202F4A)
- **White cards** with soft borders and shadows
- **Clean pink/red labels** for form fields
- **Responsive design** for mobile devices

## Firebase Structure

### Events Collection

```
events/
  {eventId}/
    {
      eventId: "abc123",
      eventName: "Hope for Winter",
      organizerName: "Hope Orphanage",
      organizerEmail: "hope@gmail.com",
      organizerPhone: "9876543210",
      typeOfOrganizer: "Orphanage",
      location: "Chennai",
      startDate: "2025-08-01",
      endDate: "2025-08-10",
      time: "10:00 AM",
      registrationDeadline: "2025-07-30",
      description: "Winter clothes needed for 40 kids",
      clothTypes: ["Children", "Winter"],
      posterUrl: "url-to-poster.jpg",
      proofImageUrl: "url-to-proof.jpg",
      createdAt: "2024-01-01T00:00:00.000Z",
      createdBy: "user_uid"
    }
```

### Participants Sub-collection

```
events/
  {eventId}/
    participants/
      {donorUid}/
        {
          name: "Karthik",
          email: "karthik@gmail.com",
          phone: "9999999999",
          location: "Salem",
          dob: "2004-12-12",
          numOfClothes: 4,
          clothDetails: "3 jeans, 1 t-shirt – good condition",
          imageUrls: ["cloth1.jpg", "cloth2.jpg"],
          participatedAt: "2024-01-01T00:00:00.000Z"
        }
```

## File Structure

### HTML

- `events.html` - Main events page with form and listing

### CSS

- `css/events.css` - Styling for events page with pale dark blue theme

### JavaScript

- `js/events.js` - Complete Firebase integration for events system
- `js/firebase.js` - Firebase configuration with storage

### Firebase Rules

- `storage.rules` - Storage rules for file uploads

## Usage

### For Organizers

1. Navigate to Events page
2. Fill out the event creation form
3. Upload poster and proof images (optional)
4. Submit event - data is stored in Firebase immediately

### For Donors

1. Browse available events
2. Click "💚 I Want to Participate"
3. Fill out participation form (auto-filled with profile data)
4. Upload photos of clothes (optional)
5. Submit participation

## Technical Implementation

### Authentication

- Uses Firebase Auth for user authentication
- Real-time auth state monitoring
- User data fetched from Firebase users collection

### File Uploads

- Firebase Storage for poster, proof, and cloth images
- Organized folder structure: `events/{eventId}/`
- Participant images: `events/{eventId}/participants/{userId}/`

### Real-time Updates

- Firebase Realtime Database listeners
- Automatic UI updates when events are created/modified
- Real-time participant tracking

### Error Handling

- Comprehensive error handling for all Firebase operations
- User-friendly error messages
- Graceful fallbacks for network issues

## Future Enhancements

- [ ] Participant list view for organizers
- [ ] Event badges and achievements
- [ ] Event notifications
- [ ] Event search and filtering
- [ ] Event analytics and reporting
- [ ] Email notifications for event updates

## Security

- Firebase Security Rules for data access control
- Storage rules for file upload permissions
- User authentication required for all write operations
- Data validation on client and server side
