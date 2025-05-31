// Custom email templates for PocketBase
// This hook intercepts the default email sending and replaces it with custom templates

const APP_NAME = "Zaur"; // Change this to your app name
const APP_URL = process.env.APP_URL || "https://zaur.app"; // Your app URL

// Helper function to get user display name
function getUserDisplayName(user) {
    if (user.name && user.name.trim()) {
        return user.name.trim();
    }
    if (user.username && user.username.trim()) {
        return user.username.trim();
    }
    return user.email.split('@')[0];
}

// Helper function to format date/time
function formatDateTime(date) {
    return new Date(date).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

// Hook into user password reset requests
onRecordAfterRequestPasswordResetRequest((e) => {
    const user = e.record;
    const token = e.meta.token;
    
    // Build reset URL with proper format for SvelteKit
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`;
    
    // Prepare template data
    const templateData = {
        appName: APP_NAME,
        userName: getUserDisplayName(user),
        userEmail: user.email,
        resetUrl: resetUrl,
        requestTime: formatDateTime(new Date())
    };
    
    try {
        // Render custom template
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/reset-password.html`
        ).render(templateData);
        
        // Send custom email
        $mails.send({
            to: [{
                address: user.email,
                name: templateData.userName
            }],
            subject: `Reset Your Password - ${APP_NAME}`,
            html: html,
        });
        
        console.log(`Custom password reset email sent to: ${user.email}`);
    } catch (error) {
        console.error("Failed to send custom password reset email:", error);
        // Don't throw error to prevent breaking the reset flow
        // The default PocketBase email will be sent as fallback
    }
});

// Hook into user verification emails
onRecordAfterRequestVerificationRequest((e) => {
    const user = e.record;
    const token = e.meta.token;
    
    // Build verification URL
    const verificationUrl = `${APP_URL}/auth/verify?token=${token}`;
    
    // Prepare template data
    const templateData = {
        appName: APP_NAME,
        userName: getUserDisplayName(user),
        userEmail: user.email,
        verificationUrl: verificationUrl,
        requestTime: formatDateTime(new Date())
    };
    
    try {
        // Render custom template
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/verification.html`
        ).render(templateData);
        
        // Send custom email
        $mails.send({
            to: [{
                address: user.email,
                name: templateData.userName
            }],
            subject: `Verify Your Email - ${APP_NAME}`,
            html: html,
        });
        
        console.log(`Custom verification email sent to: ${user.email}`);
    } catch (error) {
        console.error("Failed to send custom verification email:", error);
        // Don't throw error to prevent breaking the verification flow
    }
});

// Optional: Hook into user creation to send welcome emails
onRecordAfterCreateRequest((e) => {
    // Only trigger for users collection
    if (e.record.collectionName !== "users") {
        return;
    }
    
    const user = e.record;
    
    // Only send welcome email if user is already verified
    // (verification email will be sent separately if needed)
    if (!user.verified) {
        return;
    }
    
    const templateData = {
        appName: APP_NAME,
        userName: getUserDisplayName(user),
        userEmail: user.email,
        appUrl: APP_URL
    };
    
    try {
        // You can create a welcome.html template for this
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/welcome.html`
        ).render(templateData);
        
        $mails.send({
            to: [{
                address: user.email,
                name: templateData.userName
            }],
            subject: `Welcome to ${APP_NAME}!`,
            html: html,
        });
        
        console.log(`Welcome email sent to: ${user.email}`);
    } catch (error) {
        console.error("Failed to send welcome email:", error);
        // Don't throw error
    }
});

// Custom route for testing email templates (development only)
routerAdd("GET", "/dev/test-email/{type}", (e) => {
    const emailType = e.request.pathValue("type");
    
    // Only allow in development
    if (process.env.NODE_ENV === "production") {
        return e.json(403, {"error": "Not available in production"});
    }
    
    const templateData = {
        appName: APP_NAME,
        userName: "Test User",
        userEmail: "test@example.com",
        resetUrl: `${APP_URL}/auth/reset-password?token=test-token-123`,
        verificationUrl: `${APP_URL}/auth/verify?token=test-token-456`,
        appUrl: APP_URL,
        requestTime: formatDateTime(new Date())
    };
    
    let templateFile;
    switch(emailType) {
        case "reset":
            templateFile = "reset-password.html";
            break;
        case "verification":
            templateFile = "verification.html";
            break;
        case "welcome":
            templateFile = "welcome.html";
            break;
        default:
            return e.json(400, {"error": "Invalid email type. Use 'reset', 'verification', or 'welcome'"});
    }
    
    try {
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/${templateFile}`
        ).render(templateData);
        
        return e.html(200, html);
    } catch (error) {
        return e.json(500, {"error": error.message});
    }
});

console.log("Custom email templates loaded successfully!"); 