export interface TimeSlotFormData {
	date: string;
	startTime: string;
	endTime: string;
	capacity: number;
	availability: 'available' | 'cancelled';
	notes: string;
	recurring: boolean;
	recurringType: 'daily' | 'weekly' | 'monthly';
	recurringEnd: string;
	recurringCount: number;
}

export interface TimeSlotConflict {
	id: string;
	startTime: string;
	endTime: string;
	bookedSpots?: number;
}

export interface RecurringPreview {
	date: string;
	startTime: string;
}

export interface TimeSlotFormProps {
	tourId: string;
	slotId?: string;
	mode?: 'inline' | 'modal' | 'page' | 'drawer';
	onSuccess?: (result?: any) => void;
	onCancel?: () => void;
	onSubmissionStart?: () => void;
	onSubmissionEnd?: () => void;

	class?: string;
	tour?: any;
	preselectedDate?: string;
}

export interface SmartTime {
	startTime: string;
	endTime: string;
	suggestedNewDate: boolean;
} 