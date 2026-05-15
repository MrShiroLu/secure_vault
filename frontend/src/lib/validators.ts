export type FieldType =
  | "iban"
  | "kredi_karti"
  | "eposta"
  | "tc_kimlik"
  | "telefon";

export const patterns: Record<FieldType, RegExp> = {
  iban: /^TR[0-9]{24}$/,
  kredi_karti: /^[0-9]{16}$/,
  eposta: /^[\w.-]+@[\w.-]+\.[a-z]{2,}$/i,
  tc_kimlik: /^[1-9][0-9]{10}$/,
  telefon: /^0[5][0-9]{9}$/,
};

export const fieldLabels: Record<FieldType, string> = {
  iban: "IBAN",
  kredi_karti: "Kredi Kartı",
  eposta: "E-posta",
  tc_kimlik: "TC Kimlik No",
  telefon: "Telefon",
};

export function validateField(fieldType: FieldType, value: string) {
  if (fieldType === "kredi_karti") {
    return luhnCheck(value);
  }

  if (fieldType === "tc_kimlik") {
    return validateTcKimlik(value);
  }

  return patterns[fieldType].test(value);
}

export function luhnCheck(card: string) {
  if (!patterns.kredi_karti.test(card)) {
    return false;
  }

  const digits = card.split("").map(Number);

  for (let index = digits.length - 2; index >= 0; index -= 2) {
    digits[index] *= 2;

    if (digits[index] > 9) {
      digits[index] -= 9;
    }
  }

  return digits.reduce((sum, digit) => sum + digit, 0) % 10 === 0;
}

export function validateTcKimlik(tcKimlik: string) {
  if (!patterns.tc_kimlik.test(tcKimlik)) {
    return false;
  }

  const digits = tcKimlik.split("").map(Number);
  const tenthDigit =
    ((digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 -
      (digits[1] + digits[3] + digits[5] + digits[7])) %
    10;
  const eleventhDigit =
    digits.slice(0, 10).reduce((sum, digit) => sum + digit, 0) % 10;

  return tenthDigit === digits[9] && eleventhDigit === digits[10];
}

export function maskCreditCard(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  const visibleDigits = digits.slice(-4);
  const maskedDigits = "*".repeat(Math.max(digits.length - 4, 0));

  return `${maskedDigits}${visibleDigits}`.replace(/(.{4})/g, "$1 ").trim();
}

export function getFieldError(fieldType: FieldType, value: string) {
  if (!value.trim()) {
    return "Bu alan zorunludur.";
  }

  if (validateField(fieldType, value.trim())) {
    return "";
  }

  const messages: Record<FieldType, string> = {
    iban: "IBAN TR ile başlamalı ve toplam 26 karakter olmalıdır.",
    kredi_karti: "Kart numarası 16 hane olmalı ve Luhn kontrolünden geçmelidir.",
    eposta: "Geçerli bir e-posta adresi girin.",
    tc_kimlik: "TC Kimlik No 11 hane olmalı ve matematiksel kontrolden geçmelidir.",
    telefon: "Telefon 05XX ile başlayan 11 haneli formatta olmalıdır.",
  };

  return messages[fieldType];
}
