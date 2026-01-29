import { SolarTime } from "tyme4ts";

export const formatGanzhiYearMonth = (date: Date) => {
  const solarTime = SolarTime.fromYmdHms(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds(),
  );

  const eightChar = solarTime.getLunarHour().getEightChar();
  const year = eightChar.getYear();
  const month = eightChar.getMonth();

  const yearText = `${year.getHeavenStem().getName()}${year.getEarthBranch().getName()}年`;
  const monthText = `${month.getHeavenStem().getName()}${month.getEarthBranch().getName()}月`;
  return `${yearText} ${monthText}`;
};

