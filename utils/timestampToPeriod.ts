import { Timestamp } from "firebase/firestore";

export const formatFirebaseTimestampRange = (start: Timestamp, end: Timestamp): string => {
  // Helper to format individual date with ordinal suffix
  function formatWithOrdinal(date: Date): string {
    const day = date.getDate();
    const suffix = (day: number): string => {
      if (day > 3 && day < 21) return "th"; // 11th-13th
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    };

    const month = date.toLocaleString("default", { month: "long" });
    const year = date.getFullYear();

    return `${day}${suffix(day)} ${month}`;
  }

  const startDate = start.toDate();
  const endDate = end.toDate();

  const formattedStart = formatWithOrdinal(startDate);
  const formattedEnd = formatWithOrdinal(endDate);
  const year = endDate.getFullYear();

  return `${formattedStart} - ${formattedEnd} ${year}`;
}

export const getMonthKey = (timestamp: Timestamp): string=> {
  const date = timestamp.toDate();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${year}-${month}`;
}