# Schedule Form Improvements

## Overview
The Add Time Slot form has been completely redesigned to be more intuitive, faster to use, and provide a better user experience for tour guides setting up their availability.

## Key Improvements

### 1. Smart Defaults
- **Default Date**: Automatically sets to tomorrow (or the clicked date from calendar)
- **Default Time**: Starts at 9:00 AM - a reasonable morning time
- **Auto-Duration**: End time automatically calculated based on tour duration
- **Capacity**: Pre-filled with tour's maximum capacity

### 2. Quick Selection Interface

#### Date Selection
- **Next 7 Days Buttons**: Quick buttons for "Tomorrow", next weekdays
- **Visual Feedback**: Selected date highlighted in primary color
- **Standard Input**: Date picker still available for specific dates

#### Time Selection
- **Common Time Slots**: Quick buttons for typical tour times:
  - Morning (9:00)
  - Late Morning (11:00)
  - Afternoon (14:00)
  - Late Afternoon (16:00)
  - Evening (18:00)
- **Auto End Time**: Changing start time automatically updates end time
- **Duration Override**: Quick buttons to set custom durations (30min, 1hr, 2hr, etc.)

### 3. Enhanced Capacity Selection
- **Quick Percentage Buttons**: 
  - 50% capacity
  - 75% capacity
  - Full capacity
- **Visual Slider**: Range input for fine-tuning
- **Number Input**: Direct entry for specific values
- **Live Display**: Shows "X / Y" format

### 4. Live Preview
Shows a formatted preview of what's being created:
```
Date: Friday, December 15, 2023
Time: 9:00 AM - 11:00 AM (2h 0m)
Capacity: 10 spots
```

### 5. Conflict Detection
- **Real-time Check**: Warns if time slot overlaps with existing slots
- **Visual Warning**: Yellow alert box with clear message
- **Submit Prevention**: Disables submit button when conflict detected

### 6. Improved Recurring Options
- **Visual Toggle**: Checkbox in highlighted box
- **Button Pattern Selection**: Daily/Weekly/Monthly as buttons
- **Smart Helper Text**: Dynamic text explaining the recurring behavior
- **Visual Hierarchy**: Indented options with left border

## User Flow Example

1. **Click date on calendar** → Modal opens with that date selected
2. **Click "Morning (9:00)"** → Start time set, end time auto-calculated
3. **Click "75%"** → Capacity set to 75% of tour max
4. **See preview** → Verify everything looks correct
5. **Click submit** → Time slot created instantly

## Benefits

### Speed
- Most slots can be created in 3-4 clicks
- No manual time calculations needed
- Quick buttons for common patterns

### Error Prevention
- Conflict detection prevents double-booking
- Auto-calculation prevents duration errors
- Visual feedback confirms selections

### Flexibility
- All manual inputs still available
- Override options for custom needs
- Works for both simple and complex schedules

### Mobile Friendly
- Large touch targets for buttons
- Responsive layout
- Minimal typing required

## Technical Implementation

### Auto-Duration Calculation
```typescript
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const startDate = new Date();
  startDate.setHours(hours, minutes, 0, 0);
  startDate.setMinutes(startDate.getMinutes() + durationMinutes);
  
  const endHours = startDate.getHours().toString().padStart(2, '0');
  const endMinutes = startDate.getMinutes().toString().padStart(2, '0');
  return `${endHours}:${endMinutes}`;
}
```

### Conflict Detection
```typescript
function hasConflict(): boolean {
  const newStart = new Date(`${newSlotForm.startDate}T${newSlotForm.startTime}`);
  const newEnd = new Date(`${newSlotForm.startDate}T${newSlotForm.endTime}`);
  
  return timeSlots.some(slot => {
    if (isEditMode && slot.id === editingSlotId) return false;
    
    const existingStart = new Date(slot.startTime);
    const existingEnd = new Date(slot.endTime);
    
    if (existingStart.toDateString() !== newStart.toDateString()) return false;
    
    return (newStart < existingEnd && newEnd > existingStart);
  });
}
```

## Future Enhancements

1. **Templates**: Save common slot patterns for reuse
2. **Bulk Creation**: Add multiple slots at once
3. **Season Patterns**: Different schedules for peak/off seasons
4. **Smart Suggestions**: AI-powered optimal scheduling
5. **Break Times**: Automatic gaps between consecutive tours 