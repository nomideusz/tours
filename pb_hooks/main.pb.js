// Custom email templates for PocketBase
// This hook intercepts the default email sending and replaces it with custom templates

console.log("=== LOADING EMAIL HOOKS ===");

// Hook into user password reset requests
onMailerRecordPasswordResetSend((e) => {
    console.log("Password reset email requested for:", e.record.get("email"));
    
    try {
        const appName = "Zaur";
        const appUrl = "https://zaur.app";
        const user = e.record;
        const token = e.meta.token;
        
        // Build reset URL
        const resetUrl = appUrl + "/auth/reset-password?token=" + token;
        
        // Get user display name
        let userName = user.get("name") || user.get("username") || user.get("email").split('@')[0];
        
        // Prepare template data
        const templateData = {
            appName: appName,
            userName: userName,
            userEmail: user.get("email"),
            resetUrl: resetUrl,
            requestTime: new Date().toLocaleString()
        };
        
        // Render custom template
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/reset-password.html`
        ).render(templateData);
        
        // Override the email
        e.message.subject = "Reset Your Password - " + appName;
        e.message.html = html;
        
        console.log("Custom password reset email template applied successfully");
        
    } catch (error) {
        console.error("Failed to apply custom password reset template:", error.toString());
        // Continue with default email if custom template fails
    }
    
    return e.next();
});

// Hook into user verification emails
onMailerRecordVerificationSend((e) => {
    console.log("Email verification requested for:", e.record.get("email"));
    
    try {
        const appName = "Zaur";
        const appUrl = "https://zaur.app";
        const user = e.record;
        const token = e.meta.token;
        
        // Build verification URL
        const verificationUrl = appUrl + "/auth/verify?token=" + token;
        
        // Get user display name
        let userName = user.get("name") || user.get("username") || user.get("email").split('@')[0];
        
        // Prepare template data
        const templateData = {
            appName: appName,
            userName: userName,
            userEmail: user.get("email"),
            verificationUrl: verificationUrl,
            requestTime: new Date().toLocaleString()
        };
        
        // Render custom template
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/verification.html`
        ).render(templateData);
        
        // Override the email
        e.message.subject = "Verify Your Email - " + appName;
        e.message.html = html;
        
        console.log("Custom verification email template applied successfully");
        
    } catch (error) {
        console.error("Failed to apply custom verification template:", error.toString());
        // Continue with default email if custom template fails
    }
    
    return e.next();
});

// Hook into authentication alert emails
onMailerRecordAuthAlertSend((e) => {
    console.log("Auth alert email requested for:", e.record.get("email"));
    
    try {
        const appName = "Zaur";
        const appUrl = "https://zaur.app";
        const user = e.record;
        
        // Build security URL
        const securityUrl = appUrl + "/auth/security";
        
        // Get user display name
        let userName = user.get("name") || user.get("username") || user.get("email").split('@')[0];
        
        // Prepare template data
        const templateData = {
            appName: appName,
            userName: userName,
            userEmail: user.get("email"),
            securityUrl: securityUrl,
            requestTime: new Date().toLocaleString()
        };
        
        // Render custom template
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/auth-alert.html`
        ).render(templateData);
        
        // Override the email
        e.message.subject = "Security Alert - " + appName;
        e.message.html = html;
        
        console.log("Custom auth alert email template applied successfully");
        
    } catch (error) {
        console.error("Failed to apply custom auth alert template:", error.toString());
        // Continue with default email if custom template fails
    }
    
    return e.next();
});

// Hook into email change confirmation emails
onMailerRecordEmailChangeSend((e) => {
    console.log("Email change confirmation requested for:", e.record.get("email"));
    
    try {
        const appName = "Zaur";
        const appUrl = "https://zaur.app";
        const user = e.record;
        const token = e.meta.token;
        
        // Build confirmation URL
        const confirmUrl = appUrl + "/auth/confirm-email-change?token=" + token;
        
        // Get user display name
        let userName = user.get("name") || user.get("username") || user.get("email").split('@')[0];
        
        // Get old and new email addresses
        const oldEmail = user.get("email");
        const newEmail = e.meta.newEmail || "your new email";
        
        // Prepare template data
        const templateData = {
            appName: appName,
            userName: userName,
            userEmail: user.get("email"),
            oldEmail: oldEmail,
            newEmail: newEmail,
            confirmUrl: confirmUrl,
            requestTime: new Date().toLocaleString()
        };
        
        // Render custom template
        const html = $template.loadFiles(
            `${__hooks}/views/layout.html`,
            `${__hooks}/views/email-change.html`
        ).render(templateData);
        
        // Override the email
        e.message.subject = "Confirm Email Change - " + appName;
        e.message.html = html;
        
        console.log("Custom email change confirmation template applied successfully");
        
    } catch (error) {
        console.error("Failed to apply custom email change template:", error.toString());
        // Continue with default email if custom template fails
    }
    
    return e.next();
});

// Hook into OTP (One-Time Password) emails
onMailerRecordOTPSend((e) => {
    console.log("OTP email requested for:", e.record.get("email"));
    
    try {
        const appName = "Zaur";
        const user = e.record;
        
        // Get user display name
        let userName = user.get("name") || user.get("username") || user.get("email").split('@')[0];
        
        // The OTP code is in e.meta.password, and expiration time is in e.meta.otpId
        const otpCode = e.meta.password;
        const expirationMinutes = 10; // Default OTP expiration time
        
        // Prepare template data
        const templateData = {
            appName: appName,
            userName: userName,
            userEmail: user.get("email"),
            otpCode: otpCode,
            expirationMinutes: expirationMinutes,
            requestTime: new Date().toLocaleString()
        };
        
        // Render the template
        const html = $template.loadFiles(`${__hooks}/views/layout.html`, `${__hooks}/views/otp.html`).render(templateData);
        
        // Replace the default email with our custom template
        e.message.subject = `${appName} - Your Verification Code`;
        e.message.html = html;
        
        console.log("Custom OTP email template applied successfully");
        
    } catch (error) {
        console.log("Error in OTP email template:", error.message);
        // Fall back to default template on error
    }
    
    e.next();
});

console.log("Custom email templates loaded successfully!"); 