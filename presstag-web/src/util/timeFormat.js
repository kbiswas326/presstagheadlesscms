const IST_TIME_ZONE = 'Asia/Kolkata';

export const formatDate = (dateString) => {
  if (!dateString) return "No Date";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";

    return new Intl.DateTimeFormat("en-US", {
      timeZone: IST_TIME_ZONE,
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date) + " IST";
  } catch {
    return "Invalid Date";
  }
};

export const formatPublishDateTime = (publishDate, publishTime, fallbackDateString) => {
  try {
    if (publishDate && publishTime) {
      const timeText = String(publishTime || '').trim();
      const match = timeText.match(/^(\d{1,2}):(\d{2})/);
      if (match) {
        const hh = match[1].padStart(2, '0');
        const mm = match[2];
        const dateTimeString = `${publishDate}T${hh}:${mm}:00+05:30`;
        const dateObj = new Date(dateTimeString);
        if (!isNaN(dateObj.getTime())) {
          return new Intl.DateTimeFormat("en-US", {
            timeZone: IST_TIME_ZONE,
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }).format(dateObj) + " IST";
        }
      }
    }
  } catch {}

  return formatDate(fallbackDateString);
};
