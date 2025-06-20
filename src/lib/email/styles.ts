// Email style configuration
export const emailStyles = {
  // Brand colors
  colors: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    success: '#059669',
    warning: '#f59e0b',
    danger: '#dc2626',
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      tertiary: '#6b7280',
      light: '#9ca3af'
    },
    background: {
      white: '#ffffff',
      light: '#f9fafb',
      gray: '#f3f4f6',
      blue: '#f0f9ff',
      red: '#fef2f2'
    },
    border: {
      light: '#e5e7eb',
      primary: '#2563eb',
      success: '#059669',
      danger: '#fecaca',
      info: '#0ea5e9'
    }
  },

  // Typography
  fonts: {
    family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, Arial, sans-serif',
    sizes: {
      small: '14px',
      normal: '16px',
      large: '18px',
      h1: '32px',
      h2: '24px',
      h3: '20px'
    },
    weights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    }
  },

  // Spacing
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '40px'
  },

  // Component styles
  components: {
    container: {
      maxWidth: '600px',
      padding: '40px 30px',
      borderRadius: '8px'
    },
    button: {
      padding: '14px 28px',
      borderRadius: '6px',
      fontSize: '16px',
      fontWeight: 600
    },
    infoBox: {
      padding: '20px',
      borderRadius: '8px',
      marginY: '20px'
    },
    qrCode: {
      size: '200px',
      border: '2px solid #2563eb',
      borderRadius: '8px',
      padding: '20px'
    }
  }
};

// Generate base CSS for emails
export function getBaseStyles(): string {
  return `
    /* Reset styles */
    body, table, td, p, a, li, blockquote {
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    table, td {
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    
    img {
      -ms-interpolation-mode: bicubic;
      border: 0;
      outline: none;
      text-decoration: none;
    }
    
    /* Base styles */
    body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      min-width: 100% !important;
      font-family: ${emailStyles.fonts.family};
      line-height: 1.6;
      color: ${emailStyles.colors.text.primary};
      background-color: ${emailStyles.colors.background.light};
    }
    
    /* Container styles */
    .email-wrapper {
      width: 100% !important;
      background-color: ${emailStyles.colors.background.light};
      margin: 0;
      padding: 0;
    }
    
    .email-container {
      max-width: ${emailStyles.components.container.maxWidth} !important;
      width: 100%;
      margin: 0 auto;
      background-color: ${emailStyles.colors.background.white};
      border-radius: ${emailStyles.components.container.borderRadius};
      overflow: hidden;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .email-content {
      padding: ${emailStyles.components.container.padding};
    }
    
    /* Typography */
    h1 {
      font-size: ${emailStyles.fonts.sizes.h1};
      font-weight: ${emailStyles.fonts.weights.bold};
      color: ${emailStyles.colors.text.primary};
      margin: 0 0 ${emailStyles.spacing.lg} 0;
    }
    
    h2 {
      font-size: ${emailStyles.fonts.sizes.h2};
      font-weight: ${emailStyles.fonts.weights.semibold};
      color: ${emailStyles.colors.text.primary};
      margin: 0 0 ${emailStyles.spacing.md} 0;
    }
    
    h3 {
      font-size: ${emailStyles.fonts.sizes.h3};
      font-weight: ${emailStyles.fonts.weights.semibold};
      color: ${emailStyles.colors.text.primary};
      margin: 0 0 ${emailStyles.spacing.sm} 0;
    }
    
    p {
      margin: 0 0 ${emailStyles.spacing.md} 0;
      color: ${emailStyles.colors.text.secondary};
      font-size: ${emailStyles.fonts.sizes.normal};
      line-height: 1.6;
    }
    
    /* Components */
    .button {
      display: inline-block !important;
      background-color: ${emailStyles.colors.primary};
      color: ${emailStyles.colors.background.white} !important;
      padding: ${emailStyles.components.button.padding};
      text-decoration: none !important;
      border-radius: ${emailStyles.components.button.borderRadius};
      font-weight: ${emailStyles.components.button.fontWeight};
      font-size: ${emailStyles.components.button.fontSize};
      margin: ${emailStyles.spacing.lg} 0;
      text-align: center;
    }
    
    .button:hover {
      background-color: ${emailStyles.colors.primaryDark};
    }
    
    .button-success {
      background-color: ${emailStyles.colors.success};
    }
    
    .button-danger {
      background-color: ${emailStyles.colors.danger};
    }
    
    .button-center {
      text-align: center;
      margin: ${emailStyles.spacing.xl} 0;
    }
    
    /* Info boxes */
    .info-box {
      background-color: ${emailStyles.colors.background.gray};
      border: 1px solid ${emailStyles.colors.border.light};
      border-radius: ${emailStyles.components.infoBox.borderRadius};
      padding: ${emailStyles.components.infoBox.padding};
      margin: ${emailStyles.components.infoBox.marginY} 0;
    }
    
    .info-box-success {
      background-color: ${emailStyles.colors.background.blue};
      border-color: ${emailStyles.colors.border.info};
    }
    
    .info-box-warning {
      background-color: ${emailStyles.colors.background.red};
      border-color: ${emailStyles.colors.border.danger};
    }
    
    /* QR Code container */
    .qr-container {
      text-align: center;
      background-color: ${emailStyles.colors.background.gray};
      border: 1px solid ${emailStyles.colors.border.light};
      border-radius: ${emailStyles.components.qrCode.borderRadius};
      padding: ${emailStyles.components.qrCode.padding};
      margin: ${emailStyles.spacing.lg} 0;
    }
    
    .qr-code {
      max-width: ${emailStyles.components.qrCode.size};
      border: ${emailStyles.components.qrCode.border};
      border-radius: ${emailStyles.components.qrCode.borderRadius};
      display: block;
      margin: 0 auto;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      font-size: ${emailStyles.fonts.sizes.small};
      color: ${emailStyles.colors.text.tertiary};
      border-top: 1px solid ${emailStyles.colors.border.light};
      padding: ${emailStyles.spacing.lg} ${emailStyles.spacing.xl};
      margin-top: ${emailStyles.spacing.xl};
      background-color: ${emailStyles.colors.background.light};
    }
    
    .footer p {
      margin: 0 0 ${emailStyles.spacing.sm} 0;
      font-size: ${emailStyles.fonts.sizes.small};
      color: ${emailStyles.colors.text.tertiary};
    }
    
    .footer a {
      color: ${emailStyles.colors.primary};
      text-decoration: none;
    }
    
    /* Mobile responsive */
    @media screen and (max-width: 640px) {
      .email-content {
        padding: 30px 20px !important;
      }
      
      h1 {
        font-size: 28px !important;
      }
      
      h2 {
        font-size: 22px !important;
      }
      
      .button {
        padding: 12px 24px !important;
        font-size: 14px !important;
      }
      
      .footer {
        padding: 20px !important;
      }
    }
  `;
} 