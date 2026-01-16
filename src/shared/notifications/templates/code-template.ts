interface CodeTemplateParams {
  code: string;
  message?: string;
  actionText?: string;
  actionUrl?: string;
  title?: string;
  color?: string;
  logoUrl?: string;
}

export function renderCodeEmailTemplate(params: CodeTemplateParams) {
  const {
    code,
    message = `Use o código abaixo para validar seu e-mail: ${code}`,
    actionText = '',
    actionUrl = '',
    title = 'Unex',
    color = '#2E3634',
    logoUrl,
  } = params;

  const safeLogo =
    logoUrl ||
    `${process.env.WALLET_SERVER_URL || ''}/logo.svg`
      .replace(/\/{2,}/g, '/')
      .replace(':/', '://');

  const hasAction = Boolean(actionText && actionUrl);

  const html = `<!doctype html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f5f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="background:#ffffff;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="background:${color};padding:24px;text-align:center;">
                <img src="${safeLogo}" alt="${title}" style="max-height:48px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:24px;color:#1f2933;font-size:16px;line-height:1.6;">
                <p style="margin:0 0 16px 0;font-weight:600;font-size:18px;">${message}</p>
                <p style="margin:0 0 16px 0;font-size:32px;font-weight:700;letter-spacing:2px;color:${color};">${code}</p>
                ${
                  hasAction
                    ? `<div style="margin:24px 0;"><a href="${actionUrl}" style="background:${color};color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;display:inline-block;font-weight:600;">${actionText}</a></div>`
                    : ''
                }
                <p style="margin:16px 0 0 0;color:#6b7280;font-size:14px;">Se você não solicitou este código, ignore este e-mail.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = `${message}\nCódigo: ${code}${hasAction ? `\nAcessar: ${actionUrl}` : ''}`;

  return { html, text };
}
