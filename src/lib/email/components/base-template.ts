import { getBaseStyles } from '../styles.js';

export interface BaseTemplateProps {
  content: string;
  preheader?: string;
}

export function baseTemplate({ content, preheader = '' }: BaseTemplateProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Zaur - Tour Experiences</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
    <style>
        ${getBaseStyles()}
    </style>
</head>
<body>
    ${preheader ? `<div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>` : ''}
    
    <table role="presentation" class="email-wrapper" cellpadding="0" cellspacing="0" border="0">
        <tr>
            <td align="center" style="padding: 20px 0;">
                <table role="presentation" class="email-container" cellpadding="0" cellspacing="0" border="0">
                    ${content}
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`;
} 