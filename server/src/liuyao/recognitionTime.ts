const stripNoise = (input: string) => {
  return input
    .trim()
    .replace(/[（(][^）)]*[）)]/g, " ")
    .replace(/\s+/g, " ")
    .replace(/：/g, ":");
};

const isValidYmdhm = (y: number, m: number, d: number, h: number, min: number) => {
  if (!Number.isFinite(y) || y < 1900 || y > 2100) return false;
  if (!Number.isFinite(m) || m < 1 || m > 12) return false;
  if (!Number.isFinite(h) || h < 0 || h > 23) return false;
  if (!Number.isFinite(min) || min < 0 || min > 59) return false;
  const maxDay = new Date(y, m, 0).getDate();
  if (!Number.isFinite(d) || d < 1 || d > maxDay) return false;
  return true;
};

const toLocalDateIso = (y: number, m: number, d: number, h: number, min: number) => {
  if (!isValidYmdhm(y, m, d, h, min)) return null;
  const dt = new Date(y, m - 1, d, h, min, 0, 0);

  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== m - 1 ||
    dt.getDate() !== d ||
    dt.getHours() !== h ||
    dt.getMinutes() !== min
  ) {
    return null;
  }

  return dt.toISOString();
};

const parseYmdhmFromText = (raw: string) => {
  const s = stripNoise(raw);

  const zh = s.match(
    /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日[^\d]{0,6}(\d{1,2})\s*(?:[:点时])\s*(\d{1,2})/,
  );
  if (zh) {
    const y = Number(zh[1]);
    const m = Number(zh[2]);
    const d = Number(zh[3]);
    const h = Number(zh[4]);
    const min = Number(zh[5]);
    return isValidYmdhm(y, m, d, h, min) ? { y, m, d, h, min } : null;
  }

  const ymd = s.match(
    /(\d{4})\s*[\/\-.]\s*(\d{1,2})\s*[\/\-.]\s*(\d{1,2})[^\d]{0,6}(\d{1,2})\s*:\s*(\d{1,2})/,
  );
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);
    const h = Number(ymd[4]);
    const min = Number(ymd[5]);
    return isValidYmdhm(y, m, d, h, min) ? { y, m, d, h, min } : null;
  }

  const digits = s.replace(/\D/g, "");
  if (digits.length === 12) {
    const y = Number(digits.slice(0, 4));
    const m = Number(digits.slice(4, 6));
    const d = Number(digits.slice(6, 8));
    const h = Number(digits.slice(8, 10));
    const min = Number(digits.slice(10, 12));
    return isValidYmdhm(y, m, d, h, min) ? { y, m, d, h, min } : null;
  }

  return null;
};

export const parseLiuyaoIsoFromText = (input: string) => {
  const maybe = stripNoise(input);

  const direct = new Date(maybe);
  if (!Number.isNaN(direct.getTime())) return direct.toISOString();

  const ymdhm = parseYmdhmFromText(maybe);
  if (!ymdhm) return null;
  return toLocalDateIso(ymdhm.y, ymdhm.m, ymdhm.d, ymdhm.h, ymdhm.min);
};

