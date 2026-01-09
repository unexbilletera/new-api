type TemplateKey = 'userEmailVerification' | 'userForgot' | 'userUnlock';

type Lang = 'pt' | 'es' | string;

interface Copy {
  subject: string;
  message: string;
  action: string;
}

const translations: Record<Lang, Record<TemplateKey, Copy>> = {
  es: {
    userEmailVerification: {
      subject: 'Modificaste tu email en Unex, este es tu código de seguridad',
      message: 'el código de seguridad para validar tu cuenta es:',
      action: 'Ir',
    },
    userForgot: {
      subject: 'Recuperá tu contraseña de Unex',
      message: 'el código de seguridad para modificar tu contraseña es:',
      action: 'Ir',
    },
    userUnlock: {
      subject: 'Iniciaste sesión en Unex, este es tu código de seguridad',
      message: 'el código de seguridad para acceder a tu cuenta es:',
      action: 'Ir',
    },
  },
  pt: {
    userEmailVerification: {
      subject: 'Você modificou seu email na Unex, este é seu código de segurança',
      message: 'o código de segurança para validar sua conta é:',
      action: 'Ir',
    },
    userForgot: {
      subject: 'Recupere sua senha da Unex',
      message: 'o código de segurança para modificar sua senha é:',
      action: 'Ir',
    },
    userUnlock: {
      subject: 'Você iniciou sessão na Unex, este é seu código de segurança',
      message: 'o código de segurança para acessar sua conta é:',
      action: 'Ir',
    },
  },
};

export function getEmailCopy(templateKey: TemplateKey, lang?: string): Copy {
  const safeLang = (lang || '').toLowerCase() as Lang;
  const byLang = translations[safeLang] || translations.es || translations.pt;
  const copy = byLang?.[templateKey];
  return (
    copy || {
      subject: 'Código de verificação',
      message: 'Use o código abaixo para validar sua conta:',
      action: 'Ir',
    }
  );
}
